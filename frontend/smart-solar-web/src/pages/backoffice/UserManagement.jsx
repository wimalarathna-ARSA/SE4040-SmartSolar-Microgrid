// ============================================================================
// File: UserManagement.jsx
// Author: IT22207418, IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Backoffice staff user creation and management with RBAC.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import BackofficePageHero from '../../components/BackofficePageHero';
import { ENTER_UP } from '../../utils/enterAnimations';
import PasswordStrengthIndicator from '../../components/PasswordStrengthIndicator';
import { evaluatePassword } from '../../utils/passwordValidator';

const thClass = 'text-uppercase text-[0.72rem] fw-bold text-[#F8F8F8] bg-[#063127] px-4 py-3';
const inputClass = 'form-control rounded-[10px] bg-white/80 text-[0.9rem]';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    nic: '',
    fullName: '',
    email: '',
    password: '',
    role: 'GridOperator',
    phoneNumber: '',
    address: '',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      const staffOnly = response.data.filter(u => u.role === 'Backoffice' || u.role === 'GridOperator');
      setUsers(staffOnly);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'danger', text: 'Failed to load staff users.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const pwEval = evaluatePassword(formData.password);
    if (!pwEval.isStrong) {
      setMessage({
        type: 'danger',
        text: 'Password is too weak. It must be at least 8 characters long and contain uppercase, lowercase, numbers, and special symbols.',
      });
      return;
    }

    try {
      const res = await api.post('/users/staff', formData);
      setMessage({ type: 'success', text: res.data.message || 'Staff member created successfully!' });
      setShowModal(false);
      setFormData({
        nic: '',
        fullName: '',
        email: '',
        password: '',
        role: 'GridOperator',
        phoneNumber: '',
        address: '',
      });
      fetchUsers();
    } catch (err) {
      const errText = err.response?.data?.message || 'Error creating staff user.';
      setMessage({ type: 'danger', text: errText });
    }
  };

  return (
    <div className="min-h-screen position-relative overflow-hidden text-[#063127] bg-[#F8F8F8]">

      <div className="container-fluid max-w-[1440px] mx-auto position-relative z-[1] px-6 md:px-10 pt-9 pb-[60px]">
        <BackofficePageHero
          imageSrc="/images/Solar_5.jpg"
          eyebrow="SOLARX • Staff Access"
          title="Staff User Management"
          subtitle="Backoffice and Grid Operator accounts with role-based access control."
          breadcrumb={['Staff']}
        />

        {/* TOOLBAR: actions only */}
        <div className="d-flex justify-content-end align-items-center mb-4 flex-wrap gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="btn rounded-pill px-4 py-2 text-[0.9rem] fw-semibold d-flex align-items-center gap-2 text-white bg-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <i className="bi bi-person-plus text-[1.05rem]"></i>
            <span>Create Staff User</span>
          </button>
        </div>

        {/* Status Message */}
        {message.text && (
          <div className={'alert d-flex align-items-center justify-content-between rounded-[16px] shadow-sm mb-4 backdrop-blur-xl border ' + (message.type === 'danger' ? 'alert-danger bg-danger-subtle' : 'bg-[#063127]/10 border-[#063127]/20 text-[#063127]')}>
            <div className="d-flex align-items-center gap-2 fw-semibold text-[0.9rem]">
              <i className={'bi ' + (message.type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill')}></i>
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage({ type: '', text: '' })} className="btn-close" aria-label="Close"></button>
          </div>
        )}

        {/* FROSTED GLASS CARD: ACTIVE STAFF ACCOUNTS TABLE */}
        <div className={`card border-0 rounded-[28px] bg-white/85 shadow-sm overflow-hidden backdrop-blur-xl ${ENTER_UP} motion-reduce:animate-none`}>
          <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center px-4 md:px-[32px] pt-4 pb-3 flex-wrap gap-2">
            <h2 className="text-[1.18rem] fw-bold text-[#063127] m-0 tracking-tight">Active Staff Accounts</h2>
            <span className="badge rounded-pill text-[0.78rem] fw-bold px-3 py-2 text-white bg-[#063127] shadow-sm">
              {users.length} Registered Staff
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th className={thClass}>NIC (PRIMARY KEY)</th>
                  <th className={thClass}>FULL NAME</th>
                  <th className={thClass}>EMAIL</th>
                  <th className={thClass}>ASSIGNED ROLE</th>
                  <th className={thClass}>PHONE</th>
                  <th className={thClass}>STATUS</th>
                  <th className={thClass}>CREATED DATE</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center px-4 py-5 text-[#686053] bg-white">
                      <div className="spinner-border spinner-border-sm me-2 text-[#063127]" role="status"></div>
                      Loading staff records...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center px-4 py-5 text-[#686053] bg-white">
                      No staff users registered.
                    </td>
                  </tr>
                ) : (
                  users.map((u, idx) => (
                    <tr key={u.id || idx} className="transition">
                      <td className="px-4 py-3">
                        <span className="text-[#063127] fw-bold text-[0.9rem] tracking-wide d-inline-block">{u.nic}</span>
                      </td>
                      <td className="px-4 py-3 text-[#063127] fw-bold text-[0.92rem]">{u.fullName}</td>
                      <td className="px-4 py-3 text-[#686053] text-[0.88rem]">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={'badge rounded-pill text-[0.75rem] fw-bold px-3 py-1 shadow-sm ' + (u.role === 'Backoffice' ? 'bg-[#063127]' : 'bg-[#686053]')}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[0.88rem]">
                        <span className="d-inline-flex align-items-center gap-2">
                          <i className="bi bi-telephone text-[#686053] text-[0.85rem]"></i>
                          <span>{u.phoneNumber || '+94 77 123 4567'}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge rounded-pill bg-[#063127] text-white text-[0.75rem] fw-bold px-3 py-1 shadow-sm">{u.status || 'Active'}</span>
                      </td>
                      <td className="px-4 py-3 text-[0.88rem]">
                        <span className="d-inline-flex align-items-center gap-2">
                          <i className="bi bi-calendar3 text-[#686053] text-[0.85rem]"></i>
                          <span>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '9/17/2026'}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM BACK LINK */}
        <div className="mt-4">
          <Link to="/backoffice" className="d-inline-flex align-items-center gap-2 fw-semibold text-[0.9rem] text-decoration-none text-[#063127] transition">
            <i className="bi bi-arrow-left"></i>
            <span>Back to Administration Console</span>
          </Link>
        </div>

      </div>

      {/* CREATE STAFF MODAL */}
      {showModal && (
        <div className="modal d-block position-fixed top-0 start-0 w-100 h-100 overflow-y-auto backdrop-blur-sm bg-black/60 p-3 z-[1050]" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg modal-dialog-scrollable mx-auto my-4">
            <div className="modal-content rounded-[24px] border-0 shadow-lg bg-white/95 backdrop-blur-xl overflow-hidden">
              <div className="modal-header border-bottom px-4 py-3">
                <h3 className="modal-title text-[1.25rem] fw-extrabold text-[#063127]">Create New Staff User</h3>
                <button type="button" onClick={() => setShowModal(false)} className="btn-close" aria-label="Close"></button>
              </div>

              <form onSubmit={handleCreateStaff}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase tracking-wide">National Identity Card (NIC) *</label>
                    <input type="text" name="nic" placeholder="e.g. 199212345678" value={formData.nic} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase tracking-wide">Full Name *</label>
                    <input type="text" name="fullName" placeholder="e.g. John Doe" value={formData.fullName} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase tracking-wide">Official Email *</label>
                      <input type="email" name="email" placeholder="john@smartsolar.com" value={formData.email} onChange={handleChange} required className={inputClass} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase tracking-wide">Password *</label>
                      <input type="password" name="password" placeholder="Min 8 characters (Strong)" value={formData.password} onChange={handleChange} required className={inputClass} />
                    </div>
                  </div>
                  <PasswordStrengthIndicator password={formData.password} />
                  <div className="mb-3">
                    <label className="form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase tracking-wide">System Role *</label>
                    <select name="role" value={formData.role} onChange={handleChange} required className="form-select rounded-[10px] bg-white/80 text-[0.9rem]">
                      <option value="GridOperator">Grid Operator (Operational Tools & QR Scanner)</option>
                      <option value="Backoffice">Backoffice (Full System Administration)</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase tracking-wide">Phone Number</label>
                    <input type="text" name="phoneNumber" placeholder="+94771234567" value={formData.phoneNumber} onChange={handleChange} className={inputClass} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase tracking-wide">Address / Office Location</label>
                    <input type="text" name="address" placeholder="e.g. Operations Center, Colombo" value={formData.address} onChange={handleChange} className={inputClass} />
                  </div>
                </div>

                <div className="modal-footer border-top d-flex justify-content-end gap-2 px-4 py-3">
                  <button type="button" onClick={() => setShowModal(false)} className="btn bg-white text-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-4 fw-semibold text-[0.88rem]">Cancel</button>
                  <button type="submit" className="btn rounded-pill px-4 fw-semibold text-[0.88rem] text-white bg-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">Create Staff Member</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;
