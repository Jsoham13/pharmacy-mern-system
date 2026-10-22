import Sale from '../models/Sale.js';
import Batch from '../models/Batch.js';
import Medicine from '../models/Medicine.js';

export const getDashboardMetrics = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Today's sales & profit aggregation
    const todaySalesAgg = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart, $lte: todayEnd },
          paymentStatus: { $in: ['PAID', 'PENDING'] },
        },
      },
      {
        $unwind: '$items',
      },
      {
        $lookup: {
          from: 'batches',
          localField: 'items.batch',
          foreignField: '_id',
          as: 'batchInfo',
        },
      },
      {
        $unwind: { path: '$batchInfo', preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          invoiceNumber: 1,
          grandTotal: 1,
          itemTotal: '$items.totalAmount',
          itemQty: '$items.quantity',
          itemCost: {
            $multiply: [
              '$items.quantity',
              { $ifNull: ['$batchInfo.purchaseCost', { $multiply: ['$items.unitPrice', 0.7] }] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$itemTotal' },
          totalCost: { $sum: '$itemCost' },
          invoices: { $addToSet: '$invoiceNumber' },
        },
      },
    ]);

    const todaySales = todaySalesAgg[0]?.totalSales || 0;
    const todayCost = todaySalesAgg[0]?.totalCost || 0;
    const todayProfit = Math.max(0, todaySales - todayCost);
    const todayInvoicesCount = todaySalesAgg[0]?.invoices?.length || 0;

    // 2. Medicine Catalogue & Inventory Counts
    const totalMedicines = await Medicine.countDocuments({ isActive: true });

    // Low stock items: where availableQuantity <= medicine.reorderLevel
    const lowStockAgg = await Batch.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $lookup: {
          from: 'medicines',
          localField: 'medicine',
          foreignField: '_id',
          as: 'med',
        },
      },
      { $unwind: '$med' },
      {
        $group: {
          _id: '$medicine',
          medicineName: { $first: '$med.name' },
          reorderLevel: { $first: { $ifNull: ['$med.reorderLevel', 10] } },
          totalAvailable: { $sum: '$availableQuantity' },
        },
      },
      {
        $match: {
          $expr: { $lte: ['$totalAvailable', '$reorderLevel'] },
        },
      },
    ]);
    const lowStockCount = lowStockAgg.length;

    // Near expiry in next 60 days
    const nearExpiryDate = new Date();
    nearExpiryDate.setDate(nearExpiryDate.getDate() + 60);

    const nearExpiryCount = await Batch.countDocuments({
      status: 'ACTIVE',
      availableQuantity: { $gt: 0 },
      expiryDate: { $gte: new Date(), $lte: nearExpiryDate },
    });

    // Expired stock
    const expiredStockCount = await Batch.countDocuments({
      $or: [
        { status: 'EXPIRED' },
        { expiryDate: { $lt: new Date() }, availableQuantity: { $gt: 0 } },
      ],
    });

    // 3. 7-Day Sales vs Profit Trend (for Recharts)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyTrendAgg = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          paymentStatus: { $in: ['PAID', 'PENDING'] },
        },
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'batches',
          localField: 'items.batch',
          foreignField: '_id',
          as: 'batchInfo',
        },
      },
      { $unwind: { path: '$batchInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          itemTotal: '$items.totalAmount',
          itemCost: {
            $multiply: [
              '$items.quantity',
              { $ifNull: ['$batchInfo.purchaseCost', { $multiply: ['$items.unitPrice', 0.7] }] },
            ],
          },
        },
      },
      {
        $group: {
          _id: '$date',
          sales: { $sum: '$itemTotal' },
          cost: { $sum: '$itemCost' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing days if any
    const trendMap = new Map();
    dailyTrendAgg.forEach((d) =>
      trendMap.set(d._id, {
        date: d._id,
        sales: Math.round(d.sales),
        profit: Math.round(Math.max(0, d.sales - d.cost)),
      })
    );

    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      trend.push(
        trendMap.get(ds) || {
          date: ds,
          sales: 0,
          profit: 0,
        }
      );
    }

    // 4. Payment Method Breakdown (for Pie chart)
    const paymentBreakdown = await Sale.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          amount: { $sum: '$grandTotal' },
        },
      },
    ]);

    // 5. Recent 6 Sales
    const recentSales = await Sale.find()
      .populate('billedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(6);

    return res.json({
      success: true,
      metrics: {
        todaySales: Math.round(todaySales),
        todayProfit: Math.round(todayProfit),
        todayInvoicesCount,
        totalMedicines,
        lowStockCount,
        nearExpiryCount,
        expiredStockCount,
      },
      trend,
      paymentBreakdown,
      recentSales,
      lowStockList: lowStockAgg.slice(0, 5),
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTopSellingMedicines = async (req, res) => {
  try {
    const topMedicines = await Sale.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.medicineName',
          totalUnitsSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalAmount' },
        },
      },
      { $sort: { totalUnitsSold: -1 } },
      { $limit: 10 },
    ]);

    return res.json({ success: true, topMedicines });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
