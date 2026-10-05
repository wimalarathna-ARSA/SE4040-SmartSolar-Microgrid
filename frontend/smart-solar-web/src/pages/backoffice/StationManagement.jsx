// ============================================================================
// File: StationManagement.jsx
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Backoffice solar station CRUD: create, configure, activate and deactivate microgrid hubs.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LocationPickerModal from '../../components/LocationPickerModal';
import BackofficePageHero from '../../components/BackofficePageHero';
import { ENTER_UP } from '../../utils/enterAnimations';

const thClass = 'text-uppercase text-[0.72rem] fw-bold text-[#F8F8F8] bg-[#063127] px-4 py-3';
const inputClass = 'form-control rounded-[10px] text-[0.9rem] bg-white';
const labelClass = 'form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase tracking-wide';

const StationManagement = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [showMapModal, setShowMapModal] = useState(false);
  const [mapModalTarget, setMapModalTarget] = useState('create');
  const [appliedMapBadge, setAppliedMapBadge] = useState(false);

  const [formData, setFormData] = useState({
    stationCode: '',
    name: '',
    location: '',
    latitude: 6.9271,
    longitude: 79.8612,
    capacityKWh: 200.0,
    totalBatterySlots: 20,
    availableBatterySlots: 15,
    operationalSchedule: 'Mon-Sun 06:00-22:00',
  });

  const fetchStations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/stations');
      setStations(response.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'danger', text: 'Failed to fetch microgrid stations.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'latitude' || name === 'longitude' || name === 'capacityKWh'
        ? parseFloat(value)
        : name === 'totalBatterySlots' || name === 'availableBatterySlots'
        ? parseInt(value, 10)
        : value
    });
  };

  const handleOpenMapPicker = (target = 'create') => {
    setMapModalTarget(target);
    setShowMapModal(true);
  };

  const handleApplyMapLocation = ({ location, latitude, longitude }) => {
    if (mapModalTarget === 'create') {
      setFormData((prev) => ({
        ...prev,
        location,
        latitude,
        longitude,
      }));
      setAppliedMapBadge(true);
    } else if (mapModalTarget === 'edit' && editingStation) {
      setEditingStation((prev) => ({
        ...prev,
        location,
        latitude,
        longitude,
      }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    try {
      const res = await api.post('/stations', formData);
      setMessage({ type: 'success', text: res.data.message || 'Solar microgrid station hub created successfully!' });
      setShowCreateModal(false);
      setAppliedMapBadge(false);
      setFormData({
        stationCode: '',
        name: '',
        location: '',
        latitude: 6.9271,
        longitude: 79.8612,
        capacityKWh: 200.0,
        totalBatterySlots: 20,
        availableBatterySlots: 15,
        operationalSchedule: 'Mon-Sun 06:00-22:00',
      });
      fetchStations();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Error creating solar station.' });
    }
  };

  const handleEditOpen = (station) => {
    setEditingStation({
      ...station,
      stationCode: station.stationCode || '',
      name: station.name || '',
      location: station.location || '',
      latitude: station.latitude ?? 6.9271,
      longitude: station.longitude ?? 79.8612,
      capacityKWh: station.capacityKWh ?? 200.0,
      totalBatterySlots: station.totalBatterySlots ?? 20,
      availableBatterySlots: station.availableBatterySlots ?? 15,
      operationalSchedule: station.operationalSchedule || 'Mon-Sun 06:00-22:00',
      status: station.status || 'Active',
      activeReservationsCount: station.activeReservationsCount ?? 0,
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const isTargetingInactive = editingStation.status === 'Inactive' || editingStation.status === 'Deactivated';
    if (isTargetingInactive && editingStation.activeReservationsCount > 0) {
      setMessage({
        type: 'danger',
        text: `Cannot deactivate node "${editingStation.name}": There are ${editingStation.activeReservationsCount} active energy reservation(s) on this station. All active reservations must be completed or cancelled before deactivation.`
      });
      return;
    }
    const avail = parseInt(editingStation.availableBatterySlots, 10);
    const total = parseInt(editingStation.totalBatterySlots, 10);
    if (avail > total) {
      setMessage({
        type: 'danger',
        text: `Available battery slots (${avail}) cannot exceed total battery slots (${total}).`
      });
      return;
    }
    try {
      const res = await api.put(`/stations/${editingStation.id}`, {
        stationCode: editingStation.stationCode?.trim().toUpperCase(),
        name: editingStation.name?.trim(),
        location: editingStation.location?.trim(),
        latitude: parseFloat(editingStation.latitude),
        longitude: parseFloat(editingStation.longitude),
        capacityKWh: parseFloat(editingStation.capacityKWh),
        totalBatterySlots: total,
        availableBatterySlots: avail,
        operationalSchedule: editingStation.operationalSchedule?.trim(),
        status: editingStation.status,
      });
      setMessage({ type: 'success', text: res.data.message || 'Station updated successfully!' });
      setEditingStation(null);
      fetchStations();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to update station.' });
    }
  };

  const handleDeactivate = async (station) => {
    if (station.activeReservationsCount > 0) {
      setMessage({
        type: 'danger',
        text: `Cannot deactivate node "${station.name}": There are ${station.activeReservationsCount} active energy reservation(s) on this station. Complete or cancel all active bookings before deactivating this node.`
      });
      return;
    }
    if (!window.confirm(`Are you sure you want to deactivate hub ${station.name}?`)) {
      return;
    }
    setMessage({ type: '', text: '' });
    try {
      const res = await api.delete(`/stations/${station.id}`);
      setMessage({ type: 'warning', text: res.data.message || `Station ${station.name} deactivated.` });
      fetchStations();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to deactivate station.';
      setMessage({ type: 'danger', text: errorMsg });
    }
  };

  return (
    <div className="min-h-screen position-relative overflow-hidden text-[#063127] bg-[#F8F8F8]">

      <div className="container-fluid max-w-[1440px] mx-auto position-relative z-[1] px-6 md:px-10 pt-9 pb-[60px]">
        <BackofficePageHero
          imageSrc="/images/Solar_2.jpg"
          eyebrow="SOLARX • Microgrid Hubs"
          title="Solar Station Hubs"
          subtitle="Capacity, battery slots and operational schedules for every grid node."
          breadcrumb={['Stations']}
        />

        {/* TOOLBAR: actions only */}
        <div className="d-flex justify-content-end align-items-center mb-4 flex-wrap gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn rounded-pill px-4 py-2 text-[0.9rem] fw-semibold d-flex align-items-center gap-2 shadow-sm transition hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] hover:-translate-y-0.5 hover:shadow-lg text-white bg-[#063127] border border-[#063127]"
          >
            <i className="bi bi-plus-circle text-[1.05rem]"></i>
            <span>Register New Solar Hub</span>
          </button>
        </div>

        {/* Status Message */}
        {message.text && (
          <div className={'alert d-flex align-items-center justify-content-between rounded-[16px] shadow-sm mb-4 border ' + (message.type === 'danger' ? 'alert-danger' : message.type === 'warning' ? 'alert-warning' : 'bg-[#063127]/10 border-[#063127]/20 text-[#063127]')}>
            <div className="d-flex align-items-center gap-2 fw-semibold text-[0.9rem]">
              <i className={'bi ' + (message.type === 'danger' ? 'bi-exclamation-triangle-fill' : message.type === 'warning' ? 'bi-exclamation-circle-fill' : 'bi-check-circle-fill')}></i>
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage({ type: '', text: '' })} className="btn-close" aria-label="Close"></button>
          </div>
        )}

        {/* CONFIGURED SOLAR MICROGRID HUBS TABLE */}
        <div className={`card border-0 rounded-[28px] bg-white/85 shadow-sm overflow-hidden backdrop-blur-xl ${ENTER_UP} motion-reduce:animate-none`}>
          <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center px-4 py-3 flex-wrap gap-2">
            <h2 className="text-[1.18rem] fw-bold text-[#063127] m-0 tracking-tight">Configured Solar Microgrid Hubs</h2>
            <span className="badge rounded-pill text-white text-[0.78rem] fw-bold px-3 py-2 shadow-sm bg-[#063127]">{stations.length} Total Stations</span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th className={thClass}>HUB CODE</th>
                  <th className={thClass}>STATION NAME & LOCATION</th>
                  <th className={thClass}>GPS COORDINATES</th>
                  <th className={thClass}>CAPACITY</th>
                  <th className={thClass}>BATTERY SLOTS</th>
                  <th className={thClass}>SCHEDULE</th>
                  <th className={thClass}>BOOKINGS</th>
                  <th className={thClass}>STATUS</th>
                  <th className={thClass + ' text-center'}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9" className="text-center px-4 py-5 text-[#686053] bg-white"><div className="spinner-border spinner-border-sm me-2 text-[#063127]"></div>Loading solar hubs...</td></tr>
                ) : stations.length === 0 ? (
                  <tr><td colSpan="9" className="text-center px-4 py-5 text-[#686053] bg-white">No solar stations found. Click &quot;Register New Solar Hub&quot; to create one.</td></tr>
                ) : (
                  stations.map((s, idx) => (
                    <tr key={s.id || idx} className="transition">
                      <td className="px-4 py-3"><span className="text-[#063127] fw-bold text-[0.88rem] tracking-wide d-inline-block">{s.stationCode}</span></td>
                      <td className="px-4 py-3">
                        <div className="text-[#063127] fw-bold text-[0.92rem]">{s.name}</div>
                        <div className="text-[#686053] text-[0.8rem] d-flex align-items-center gap-1 mt-[2px]">
                          <i className="bi bi-geo-alt text-danger"></i>
                          <span>{s.location}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#686053] text-[0.85rem] font-monospace">{s.latitude?.toFixed(4)}, {s.longitude?.toFixed(4)}</td>
                      <td className="px-4 py-3 text-[#063127] fw-bold text-[0.88rem]">{s.capacityKWh} kW/h</td>
                      <td className="px-4 py-3">
                        <span className="badge rounded-pill bg-[#063127]/10 text-[#063127] border border-[#063127]/20 text-[0.76rem] fw-bold px-2 py-1 d-inline-block">{s.availableBatterySlots} / {s.totalBatterySlots} Free</span>
                      </td>
                      <td className="px-4 py-3 text-[#686053] text-[0.82rem]">{s.operationalSchedule}</td>
                      <td className="px-4 py-3">
                        {s.activeReservationsCount > 0 ? (
                          <span className="badge rounded-pill bg-danger text-[0.74rem] fw-bold px-2 py-1 d-inline-block" title="Active bookings block deactivation">{s.activeReservationsCount} Active</span>
                        ) : (<span className="text-[#686053] text-[0.82rem]">0 Active</span>)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={'badge rounded-pill text-[0.75rem] fw-bold px-2 py-1 d-inline-block ' + (s.status === 'Active' ? 'bg-[#063127] text-white' : 'bg-[#686053] text-white')}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="d-inline-flex gap-2">
                          <button onClick={() => handleEditOpen(s)} title="Edit Hub" className="btn btn-sm bg-white text-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-circle p-0 w-[32px] h-[32px] d-inline-flex align-items-center justify-content-center transition hover:-translate-y-0.5 hover:shadow-lg">
                            <i className="bi bi-pencil text-[0.85rem]"></i>
                          </button>
                          {s.status === 'Active' && (
                            s.activeReservationsCount > 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setMessage({
                                    type: 'danger',
                                    text: `Deactivation Blocked: Node "${s.name}" currently has ${s.activeReservationsCount} active energy reservation(s). Complete or cancel all active bookings before deactivating this node.`,
                                  });
                                }}
                                title={`Deactivation strictly blocked: ${s.activeReservationsCount} active energy reservation(s) exist`}
                                className="btn btn-sm bg-white text-danger border border-danger hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-circle p-0 w-[32px] h-[32px] d-inline-flex align-items-center justify-content-center border-dashed cursor-not-allowed opacity-75"
                              >
                                <i className="bi bi-shield-lock-fill text-[0.85rem]"></i>
                              </button>
                            ) : (
                              <button type="button" onClick={() => handleDeactivate(s)} title="Deactivate Hub" className="btn btn-sm bg-white text-danger border border-danger hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-circle p-0 w-[32px] h-[32px] d-inline-flex align-items-center justify-content-center transition hover:-translate-y-0.5 hover:shadow-lg">
                                <i className="bi bi-power text-[0.85rem]"></i>
                              </button>
                            )
                          )}
                        </div>
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

      {/* CREATE STATION MODAL */}
      {showCreateModal && (
        <div className="modal d-block position-fixed top-0 start-0 w-100 h-100 overflow-y-auto bg-black/60 backdrop-blur-sm p-3 z-[1050]" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg modal-dialog-scrollable mx-auto my-4">
            <div className="modal-content rounded-[24px] border-0 shadow-lg bg-white/95 backdrop-blur-xl overflow-hidden">
              <div className="modal-header px-4 py-3">
                <h3 className="modal-title text-[1.25rem] fw-extrabold text-[#063127] d-flex align-items-center gap-2">
                  <i className="bi bi-broadcast-pin text-[#063127]"></i>
                  <span>Register New Solar Microgrid Hub</span>
                </h3>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-close" aria-label="Close"></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className={labelClass}>Station Code *</label>
                      <input type="text" name="stationCode" placeholder="e.g. HUB-NEGOMBO-05" value={formData.stationCode} onChange={handleChange} required className={inputClass} />
                    </div>
                    <div className="col-md-6">
                      <label className={labelClass}>Station Name *</label>
                      <input type="text" name="name" placeholder="e.g. Negombo Coastal Microgrid" value={formData.name} onChange={handleChange} required className={inputClass} />
                    </div>
                    <div className="col-12">
                      <div className="card bg-[#063127]/10 border border-[#063127]/20 rounded-[16px] p-3 d-flex flex-row align-items-center justify-content-between gap-2 flex-wrap">
                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded-[12px] w-[40px] h-[40px] d-flex align-items-center justify-content-center text-white text-[1.25rem] shrink-0 bg-[#063127] shadow-sm">
                            <i className="bi bi-map-fill"></i>
                          </div>
                          <div>
                            <div className="fw-bold text-[0.88rem] text-[#063127]">Interactive Map &amp; Place Search</div>
                            <div className="text-[0.78rem] text-[#686053]">Search places, pinpoint solar hub site, and auto-apply address &amp; GPS coordinates.</div>
                          </div>
                        </div>
                        <button type="button" onClick={() => handleOpenMapPicker('create')} className="btn rounded-pill px-4 py-2 text-[0.84rem] fw-semibold text-white bg-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg d-inline-flex align-items-center gap-2">
                          <i className="bi bi-geo-alt-fill"></i><span>Select Location on Map</span>
                        </button>
                      </div>
                      {appliedMapBadge && (
                        <div className="alert bg-[#063127]/10 border border-[#063127]/20 text-[#063127] rounded-[10px] text-[0.8rem] fw-semibold d-flex align-items-center justify-content-between gap-2 mt-2 py-2 px-3 mb-0">
                          <div className="d-flex align-items-center gap-2"><i className="bi bi-check-circle-fill"></i><span>Location &amp; GPS coordinates applied from interactive map!</span></div>
                          <span className="font-monospace small">({formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)})</span>
                        </div>
                      )}
                    </div>
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className={labelClass + ' m-0'}>Location / Address *</label>
                        <button type="button" onClick={() => handleOpenMapPicker('create')} className="btn btn-link btn-sm p-0 text-[0.78rem] fw-semibold text-decoration-none d-inline-flex align-items-center gap-1 hover:bg-[#F8F8F8] hover:text-[#063127]">
                          <i className="bi bi-search"></i><span>Search on Map</span>
                        </button>
                      </div>
                      <input type="text" name="location" placeholder="e.g. Main Beach Road, Negombo" value={formData.location} onChange={handleChange} required className={inputClass} />
                    </div>
                    <div className="col-md-6">
                      <label className={labelClass}>GPS Latitude *</label>
                      <input type="number" step="0.0001" name="latitude" value={formData.latitude} onChange={handleChange} required className={inputClass} />
                    </div>
                    <div className="col-md-6">
                      <label className={labelClass}>GPS Longitude *</label>
                      <input type="number" step="0.0001" name="longitude" value={formData.longitude} onChange={handleChange} required className={inputClass} />
                    </div>
                    <div className="col-md-4">
                      <label className={labelClass}>Capacity (kW/h) *</label>
                      <input type="number" step="0.1" name="capacityKWh" value={formData.capacityKWh} onChange={handleChange} required className={inputClass} />
                    </div>
                    <div className="col-md-4">
                      <label className={labelClass}>Total Battery Slots *</label>
                      <input type="number" name="totalBatterySlots" value={formData.totalBatterySlots} onChange={handleChange} required className={inputClass} />
                    </div>
                    <div className="col-md-4">
                      <label className={labelClass}>Available Slots *</label>
                      <input type="number" name="availableBatterySlots" value={formData.availableBatterySlots} onChange={handleChange} required className={inputClass} />
                    </div>
                    <div className="col-12">
                      <label className={labelClass}>Operational Schedule</label>
                      <input type="text" name="operationalSchedule" value={formData.operationalSchedule} onChange={handleChange} className={inputClass} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer d-flex justify-content-end gap-2 px-4 py-3">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn bg-white text-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-4 fw-semibold">Cancel</button>
                  <button type="submit" className="btn bg-[#063127] text-white border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-4 fw-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">Create Solar Hub</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STATION MODAL */}
      {editingStation && (
        <div className="modal d-block position-fixed top-0 start-0 w-100 h-100 overflow-y-auto bg-black/60 backdrop-blur-sm p-3 z-[1050]" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg modal-dialog-scrollable mx-auto my-4">
            <div className="modal-content rounded-[24px] border-0 shadow-lg bg-white/95 backdrop-blur-xl overflow-hidden">
              <div className="modal-header px-4 py-3">
                <h3 className="modal-title text-[1.25rem] fw-extrabold text-[#063127]">Edit Microgrid Station: {editingStation.stationCode}</h3>
                <button type="button" onClick={() => setEditingStation(null)} className="btn-close" aria-label="Close"></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-5">
                      <label className={labelClass}>Hub Code *</label>
                      <input type="text" value={editingStation.stationCode} onChange={(e) => setEditingStation({ ...editingStation, stationCode: e.target.value })} required placeholder="e.g. HUB-COL-001" className={inputClass + ' font-monospace'} />
                    </div>
                    <div className="col-md-7">
                      <label className={labelClass}>Station Name *</label>
                      <input type="text" value={editingStation.name} onChange={(e) => setEditingStation({ ...editingStation, name: e.target.value })} required className={inputClass} />
                    </div>
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className={labelClass + ' m-0'}>Physical Location *</label>
                        <button type="button" onClick={() => handleOpenMapPicker('edit')} className="btn btn-link btn-sm p-0 text-[0.78rem] fw-semibold text-decoration-none d-inline-flex align-items-center gap-1 hover:bg-[#F8F8F8] hover:text-[#063127]">
                          <i className="bi bi-geo-alt-fill"></i><span>Select on Map</span>
                        </button>
                      </div>
                      <input type="text" value={editingStation.location} onChange={(e) => setEditingStation({ ...editingStation, location: e.target.value })} required className={inputClass} />
                    </div>
                    <div className="col-md-6">
                      <label className={labelClass}>GPS Latitude</label>
                      <input type="number" step="0.0001" value={editingStation.latitude || 6.9271} onChange={(e) => setEditingStation({ ...editingStation, latitude: parseFloat(e.target.value) })} required className={inputClass} />
                    </div>
                    <div className="col-md-6">
                      <label className={labelClass}>GPS Longitude</label>
                      <input type="number" step="0.0001" value={editingStation.longitude || 79.8612} onChange={(e) => setEditingStation({ ...editingStation, longitude: parseFloat(e.target.value) })} required className={inputClass} />
                    </div>
                    <div className="col-md-4">
                      <label className={labelClass}>Capacity (kWh)</label>
                      <input type="number" step="0.1" min="0" value={editingStation.capacityKWh ?? ''} onChange={(e) => setEditingStation({ ...editingStation, capacityKWh: parseFloat(e.target.value) })} placeholder="e.g. 50" className={inputClass} />
                    </div>
                    <div className="col-md-4">
                      <label className={labelClass}>Total Battery Slots</label>
                      <input type="number" min="0" value={editingStation.totalBatterySlots ?? ''} onChange={(e) => setEditingStation({ ...editingStation, totalBatterySlots: parseInt(e.target.value, 10) })} placeholder="e.g. 10" className={inputClass} />
                    </div>
                    <div className="col-md-4">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className={labelClass + ' m-0'}>Available Slots</label>
                        <span className="text-[0.7rem] text-[#686053] fw-semibold d-inline-flex align-items-center gap-1"><i className="bi bi-lock-fill"></i> Readonly</span>
                      </div>
                      <input
                        type="number"
                        readOnly
                        value={editingStation.availableBatterySlots ?? ''}
                        title="Available slots are managed exclusively in real-time by Grid Operators upon physical battery swap verification."
                        className="form-control rounded-[10px] bg-white text-[#686053] fw-bold"
                      />
                      <div className="text-[0.7rem] text-[#686053] mt-1 leading-[1.3]">Managed live by Grid Operators upon physical battery bay connection.</div>
                    </div>
                    <div className="col-12">
                      <label className={labelClass}>Operational Schedule</label>
                      <input type="text" value={editingStation.operationalSchedule ?? ''} onChange={(e) => setEditingStation({ ...editingStation, operationalSchedule: e.target.value })} placeholder="e.g. 06:00 – 22:00 daily" className={inputClass} />
                    </div>
                    <div className="col-12">
                      <label className={labelClass}>Status</label>
                      <select value={editingStation.status === 'Active' ? 'Active' : 'Inactive'} onChange={(e) => setEditingStation({ ...editingStation, status: e.target.value })} className="form-select rounded-[10px] bg-white">
                        <option value="Active">Active</option>
                        <option value="Inactive" disabled={editingStation.activeReservationsCount > 0}>
                          {editingStation.activeReservationsCount > 0
                            ? `Inactive (Blocked: ${editingStation.activeReservationsCount} active reservations)`
                            : 'Inactive (Deactivated)'}
                        </option>
                      </select>
                      {editingStation.activeReservationsCount > 0 && (
                        <div className="text-[0.74rem] text-danger fw-semibold mt-1 d-flex align-items-center gap-1">
                          <i className="bi bi-shield-lock-fill"></i>
                          <span>Deactivation is blocked: {editingStation.activeReservationsCount} active energy reservation(s) exist.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer d-flex justify-content-end gap-2 px-4 py-3">
                  <button type="button" onClick={() => setEditingStation(null)} className="btn bg-white text-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-4 fw-semibold">Cancel</button>
                  <button type="submit" className="btn rounded-pill px-4 fw-semibold text-white bg-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <LocationPickerModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        initialLocation={
          mapModalTarget === 'create'
            ? {
                address: formData.location,
                latitude: formData.latitude,
                longitude: formData.longitude,
              }
            : {
                address: editingStation?.location || '',
                latitude: editingStation?.latitude || 6.9271,
                longitude: editingStation?.longitude || 79.8612,
              }
        }
        onApply={handleApplyMapLocation}
      />

    </div>
  );
};

export default StationManagement;
