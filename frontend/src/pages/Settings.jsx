import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, ShieldCheck, Users, Plus, Check, X } from 'lucide-react';
import { settingsService, authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const [settings, setSettings] = useState({
    storeName: '',
    address: '',
    phone: '',
    email: '',
    gstin: '',
    drugLicense20B: '',
    drugLicense21B: '',
    pharmacistName: '',
    lowStockThresholdDefault: 15,
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // New User Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('STAFF_CASHIER');
  const [newUserPhone, setNewUserPhone] = useState('');

  const { user: currentUser, hasRole } = useAuth();
  const isAdmin = hasRole('OWNER_ADMIN');

  const loadData = async () => {
    setLoading(true);
    try {
      const sRes = await settingsService.getSettings();
      if (sRes.data.settings) {
        setSettings(sRes.data.settings);
      }

      if (isAdmin) {
        const uRes = await authService.getUsers();
        setUsers(uRes.data.users || []);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      await settingsService.updateSettings(settings);
      setSuccessMsg('Store settings updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await authService.createUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        phone: newUserPhone,
      });

      setShowUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create user');
    }
  };

  const toggleUser = async (userId) => {
    try {
      await authService.toggleUserStatus(userId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to toggle status');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <SettingsIcon className="w-5 h-5 text-blue-600" />
          <span>Store Settings & Legal Licensing</span>
        </h1>
        <p className="text-xs text-slate-500">
          Configure Maharashtra FDA Drug Licenses (20B/21B), GSTIN & Staff Permissions
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Store Information Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
          Shop Legal Identity & FDA Form 20B / 21B
        </h2>

        <form onSubmit={handleSettingsSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Store Legal Name *</label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">GSTIN Number (MH - 27) *</label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={settings.gstin}
                onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white uppercase font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Shop Address *</label>
            <input
              type="text"
              required
              disabled={!isAdmin}
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                FDA Drug License 20B (Allopathic) *
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={settings.drugLicense20B}
                onChange={(e) => setSettings({ ...settings, drugLicense20B: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                FDA Drug License 21B (Specified) *
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={settings.drugLicense21B}
                onChange={(e) => setSettings({ ...settings, drugLicense21B: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Registered Pharmacist Name & Reg No *
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={settings.pharmacistName}
                onChange={(e) => setSettings({ ...settings, pharmacistName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Store Contact Phone</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                disabled={!isAdmin}
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Staff & Access Control (Owner/Admin only) */}
      {isAdmin && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Pharmacy Staff & Roles (RBAC)
              </h2>
              <p className="text-slate-400 text-[11px]">
                Owner/Admin, Registered Pharmacist, Cashier & Delivery Partner permissions
              </p>
            </div>
            <button
              onClick={() => setShowUserModal(true)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Staff Account</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Staff Member</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Role</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{u.name}</td>
                    <td className="p-3 text-slate-600 font-mono">{u.email}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          u.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {u._id !== currentUser?.id && (
                        <button
                          onClick={() => toggleUser(u._id)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold border ${
                            u.isActive
                              ? 'border-rose-300 text-rose-600 hover:bg-rose-50'
                              : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Account Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Add New Staff Account</h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Ramesh More"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="ramesh@ganeshpharmacy.com"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Staff Role *</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                >
                  <option value="STAFF_CASHIER">Staff / Cashier</option>
                  <option value="PHARMACIST">Registered Pharmacist</option>
                  <option value="DELIVERY_PARTNER">Delivery Partner</option>
                  <option value="OWNER_ADMIN">Owner / Admin</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
