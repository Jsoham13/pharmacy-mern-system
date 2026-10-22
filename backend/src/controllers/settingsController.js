import StoreSettings from '../models/StoreSettings.js';
import AuditLog from '../models/AuditLog.js';

export const getSettings = async (req, res) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = await StoreSettings.create({});
    }
    return res.json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = new StoreSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();

    await AuditLog.create({
      action: 'SETTINGS_UPDATED',
      performedBy: req.user._id,
      entityType: 'StoreSettings',
      entityId: settings._id,
      details: req.body,
    });

    return res.json({ success: true, settings });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
