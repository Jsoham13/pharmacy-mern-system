import React, { useState, useEffect } from 'react';
import {
  Pill,
  Search,
  Plus,
  Filter,
  Edit2,
  Check,
  X,
  AlertCircle,
  ShieldCheck,
  Snowflake,
} from 'lucide-react';
import { medicineService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    brand: '',
    category: 'General',
    dosageForm: 'Tablet',
    strength: '',
    manufacturer: '',
    hsnCode: '30049099',
    barcode: '',
    rackLocation: 'Rack A-1',
    purchasePrice: 0,
    sellingPrice: 0,
    mrp: 0,
    gstRate: 12,
    reorderLevel: 15,
    isPrescriptionRequired: false,
    isScheduleH: false,
    isColdChain: false,
  });

  const { hasRole } = useAuth();
  const canEdit = hasRole('OWNER_ADMIN', 'PHARMACIST');

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (scheduleFilter === 'scheduleH') params.scheduleH = 'true';
      if (scheduleFilter === 'prescription') params.prescriptionRequired = 'true';

      const res = await medicineService.getMedicines(params);
      setMedicines(res.data.medicines || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [scheduleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMedicines();
  };

  const openAddModal = () => {
    setEditingMed(null);
    setFormData({
      name: '',
      genericName: '',
      brand: '',
      category: 'General',
      dosageForm: 'Tablet',
      strength: '',
      manufacturer: '',
      hsnCode: '30049099',
      barcode: '',
      rackLocation: 'Rack A-1',
      purchasePrice: 0,
      sellingPrice: 0,
      mrp: 0,
      gstRate: 12,
      reorderLevel: 15,
      isPrescriptionRequired: false,
      isScheduleH: false,
      isColdChain: false,
    });
    setShowModal(true);
  };

  const openEditModal = (med) => {
    setEditingMed(med);
    setFormData({
      name: med.name,
      genericName: med.genericName || '',
      brand: med.brand || '',
      category: med.category || 'General',
      dosageForm: med.dosageForm || 'Tablet',
      strength: med.strength || '',
      manufacturer: med.manufacturer || '',
      hsnCode: med.hsnCode || '30049099',
      barcode: med.barcode || '',
      rackLocation: med.rackLocation || 'Rack A-1',
      purchasePrice: med.purchasePrice || 0,
      sellingPrice: med.sellingPrice || 0,
      mrp: med.mrp || 0,
      gstRate: med.gstRate || 12,
      reorderLevel: med.reorderLevel || 15,
      isPrescriptionRequired: med.isPrescriptionRequired || false,
      isScheduleH: med.isScheduleH || false,
      isColdChain: med.isColdChain || false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMed) {
        await medicineService.updateMedicine(editingMed._id, formData);
      } else {
        await medicineService.createMedicine(formData);
      }
      setShowModal(false);
      fetchMedicines();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Pill className="w-5 h-5 text-blue-600" />
            <span>Medicine Master Catalogue</span>
          </h1>
          <p className="text-xs text-slate-500">
            Formulations, Active Ingredients, HSN Codes, Drug Schedules & Rack Layout
          </p>
        </div>

        {canEdit && (
          <button
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Medicine</span>
          </button>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by brand name, generic formulation, manufacturer, or barcode..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="flex items-center space-x-2 w-full md:w-auto text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={scheduleFilter}
            onChange={(e) => setScheduleFilter(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:bg-white"
          >
            <option value="">All Drug Classifications</option>
            <option value="scheduleH">Schedule H Only (Rx Required)</option>
            <option value="prescription">Prescription Required</option>
          </select>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px]">
              <tr>
                <th className="p-3">Medicine & Generic</th>
                <th className="p-3">Manufacturer</th>
                <th className="p-3">Rack</th>
                <th className="p-3">Classification</th>
                <th className="p-3 text-right">MRP / Selling</th>
                <th className="p-3 text-center">Live Stock</th>
                {canEdit && <th className="p-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    Loading medicine directory...
                  </td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    No medicines found matching criteria.
                  </td>
                </tr>
              ) : (
                medicines.map((med) => (
                  <tr key={med._id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{med.name}</div>
                      <div className="text-[11px] text-slate-500">{med.genericName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        HSN: {med.hsnCode} | GST: {med.gstRate}%
                      </div>
                    </td>
                    <td className="p-3 text-slate-700 font-medium">
                      {med.manufacturer}
                      <div className="text-[10px] text-slate-400">{med.category}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                        {med.rackLocation || 'A-1'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {med.isScheduleH && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[9px] flex items-center">
                            <ShieldCheck className="w-2.5 h-2.5 mr-0.5" /> Schedule H
                          </span>
                        )}
                        {med.isColdChain && (
                          <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 font-bold text-[9px] flex items-center">
                            <Snowflake className="w-2.5 h-2.5 mr-0.5" /> 2-8°C
                          </span>
                        )}
                        {!med.isScheduleH && !med.isColdChain && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px]">
                            OTC / General
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="font-bold text-slate-900">₹{med.sellingPrice.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400 line-through">MRP: ₹{med.mrp.toFixed(2)}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                          (med.totalStock || 0) <= (med.reorderLevel || 10)
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {med.totalStock || 0} units
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {med.batchesCount || 0} batches
                      </div>
                    </td>
                    {canEdit && (
                      <td className="p-3 text-right">
                        <button
                          onClick={() => openEditModal(med)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Medicine Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                {editingMed ? 'Edit Medicine Record' : 'Add New Medicine Formulation'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Brand Name / Commercial Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dolo 650 Tablet"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Generic Active Ingredient *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="e.g. Paracetamol 650mg"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Manufacturer *</label>
                  <input
                    type="text"
                    required
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g. Micro Labs Ltd"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dosage Form</label>
                  <select
                    value={formData.dosageForm}
                    onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Drops">Drops</option>
                    <option value="Inhaler">Inhaler</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rack / Storage Bin</label>
                  <input
                    type="text"
                    value={formData.rackLocation}
                    onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                    placeholder="e.g. Rack B-2"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Maximum MRP (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GST Rate (%)</label>
                  <select
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: parseInt(e.target.value, 10) })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  >
                    <option value={12}>12% (Standard)</option>
                    <option value={5}>5% (Life saving)</option>
                    <option value={18}>18% (Cosmetics)</option>
                    <option value={0}>0% (Exempt)</option>
                  </select>
                </div>
              </div>

              {/* Statutory & Cold Chain Checkboxes */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-700 block">FDA Maharashtra Regulatory Classifications:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isScheduleH}
                      onChange={(e) => setFormData({ ...formData, isScheduleH: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-800">Schedule H (Rx Mandate)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPrescriptionRequired}
                      onChange={(e) => setFormData({ ...formData, isPrescriptionRequired: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-800">Prescription Required</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isColdChain}
                      onChange={(e) => setFormData({ ...formData, isColdChain: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-800">Cold Chain (2°C - 8°C)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md"
                >
                  {editingMed ? 'Save Changes' : 'Create Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
