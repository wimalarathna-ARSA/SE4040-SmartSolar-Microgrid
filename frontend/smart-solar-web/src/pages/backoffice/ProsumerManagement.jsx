// ============================================================================
// File: ProsumerManagement.jsx
// Author: IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Backoffice prosumer registration, activation, deactivation and email change management.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import ConstellationMeshSVG from '../../components/ConstellationMeshSVG';
import LocationPickerModal from '../../components/LocationPickerModal';
import BackofficePageHero from '../../components/BackofficePageHero';
import PasswordStrengthIndicator from '../../components/PasswordStrengthIndicator';
import { evaluatePassword } from '../../utils/passwordValidator';

const ProsumerManagement = () => {
  const [prosumers, setProsumers] = useState([]);
  const [pendingProsumers, setPendingProsumers] = useState([]);
  const [emailRequests, setEmailRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // ── Notification State ────────────────────────────────────────────────────
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [highlightedNic, setHighlightedNic] = useState(null);
  const dropdownRef = useRef(null);

  // ── Register New Prosumer Modal State ─────────────────────────────────────
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    nic: '', fullName: '', email: '', password: '', phoneNumber: '', address: '',
  });
  const [registerInstallLat, setRegisterInstallLat] = useState(null);
  const [registerInstallLng, setRegisterInstallLng] = useState(null);
  const [registerInstallAddr, setRegisterInstallAddr] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerMsg, setRegisterMsg] = useState({ type: '', text: '' });


  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allRes, pendingRes, emailReqRes] = await Promise.all([
        api.get('/users?role=Prosumer'),
        api.get('/users/pending-prosumers'),
        api.get('/users/email-update-requests'),
      ]);
      setProsumers(allRes.data);
      setPendingProsumers(pendingRes.data);
      setEmailRequests(emailReqRes.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'danger', text: 'Error fetching prosumer profiles.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter prosumers with pending deactivation requests
  const deactivationRequests = prosumers.filter(p => p.deactivationRequested);
  const totalNotifications = deactivationRequests.length + emailRequests.length;

  const handleSelectEmailNotification = () => {
    setActiveTab('email-requests');
    setShowNotificationDropdown(false);
  };

  // ── Jump to row when notification item clicked ───────────────────────────
  const handleSelectNotification = (p) => {
    // 1. Switch to 'All Prosumers Registry' tab
    setActiveTab('all');

    // 2. Clear search filter if it would hide this prosumer
    if (
      searchTerm &&
      !p.nic.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !p.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      setSearchTerm('');
    }

    // 3. Close the notification dropdown
    setShowNotificationDropdown(false);

    // 4. Mark this prosumer's NIC as highlighted
    setHighlightedNic(p.nic);

    // 5. Scroll smoothly to the related row in the table
    setTimeout(() => {
      const el = document.getElementById(`prosumer-row-${p.nic}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    // 6. Automatically clear highlight after 5 seconds
    setTimeout(() => {
      setHighlightedNic((curr) => (curr === p.nic ? null : curr));
    }, 5000);
  };

  const handleActivate = async (nic) => {
    try {
      const res = await api.put(`/users/${nic}/activate`);
      setMessage({ type: 'success', text: res.data.message || `Prosumer ${nic} activated successfully.` });
      fetchData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to activate account.' });
    }
  };

  const handleDeactivate = async (nic) => {
    if (!window.confirm(`Are you sure you want to deactivate prosumer ${nic}? Only a Backoffice officer can reactivate it.`)) {
      return;
    }
    try {
      const res = await api.put(`/users/${nic}/deactivate`, { note: 'Deactivated via Backoffice Portal' });
      setMessage({ type: 'warning', text: res.data.message || `Prosumer ${nic} has been deactivated.` });
      fetchData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to deactivate account.' });
    }
  };

  const handleReactivate = async (nic) => {
    try {
      const res = await api.put(`/users/${nic}/reactivate`);
      setMessage({ type: 'success', text: res.data.message || `Prosumer ${nic} reactivated successfully.` });
      fetchData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to reactivate account.' });
    }
  };

  const handleReviewEmailRequest = async (nic, action) => {
    const isAccept = action === 'Accept';
    const confirmText = isAccept
      ? `Are you sure you want to ACCEPT the request and grant email update access to prosumer ${nic}?`
      : `Are you sure you want to DENY the email update request for prosumer ${nic}?`;

    if (!window.confirm(confirmText)) {
      return;
    }

    const note = prompt(`Enter review note / comment (optional):`, isAccept ? 'Approved by Backoffice' : 'Denied by Backoffice') || '';

    try {
      const res = await api.put(`/users/${nic}/email-update-requests/review`, { action, note });
      setMessage({
        type: isAccept ? 'success' : 'warning',
        text: res.data.message || `Email update request ${action.toLowerCase()}ed successfully.`
      });
      fetchData();
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || `Failed to review email update request.`
      });
    }
  };

  const handleDirectEmailAccess = async (nic, grant) => {
    const actionLabel = grant ? 'GRANT email change access' : 'REVOKE email change access';
    if (!window.confirm(`Are you sure you want to ${actionLabel} for prosumer ${nic}?`)) {
      return;
    }

    try {
      const res = await api.put(`/users/${nic}/email-update-access`, {
        status: grant ? 'Active' : 'Deactivated',
        note: grant ? 'Access directly granted by Backoffice' : 'Access revoked by Backoffice'
      });
      setMessage({ type: 'success', text: res.data.message });
      fetchData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to modify email access.' });
    }
  };

  // ── Register New Prosumer (Backoffice-initiated) ───────────────────────────
  const handleRegisterProsumer = async (e) => {
    e.preventDefault();
    setRegisterMsg({ type: '', text: '' });

    const pwEval = evaluatePassword(registerForm.password);
    if (!pwEval.isStrong) {
      setRegisterMsg({
        type: 'danger',
        text: 'Password is too weak. It must be at least 8 characters long and contain uppercase, lowercase, numbers, and special symbols.',
      });
      return;
    }

    setRegisterLoading(true);
    try {
      const payload = {
        ...registerForm,
        // Include GPS if selected from map picker
        ...(registerInstallLat != null && registerInstallLng != null
          ? { installationLatitude: registerInstallLat, installationLongitude: registerInstallLng }
          : {}),
      };
      const res = await api.post('/auth/register', payload);
      setRegisterMsg({ type: 'success', text: res.data.message || 'Prosumer registered successfully. Activate from the Pending tab.' });
      setRegisterForm({ nic: '', fullName: '', email: '', password: '', phoneNumber: '', address: '' });
      setRegisterInstallLat(null);
      setRegisterInstallLng(null);
      setRegisterInstallAddr('');
      fetchData();
    } catch (err) {
      setRegisterMsg({ type: 'danger', text: err.response?.data?.message || 'Registration failed.' });
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleApplyMapLocation = ({ location, latitude, longitude }) => {
    setRegisterInstallLat(latitude);
    setRegisterInstallLng(longitude);
    setRegisterInstallAddr(location);
    // Auto-fill address field with selected location string
    setRegisterForm(f => ({ ...f, address: location || f.address }));
    setShowMapModal(false);
  };

  const filteredProsumers = prosumers.filter(p => 
    p.nic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.address && p.address.toLowerCase().includes(searchTerm.toLowerCase()))
  



); 
};

export default ProsumerManagement;