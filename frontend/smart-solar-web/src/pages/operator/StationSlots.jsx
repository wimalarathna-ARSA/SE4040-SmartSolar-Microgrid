// ============================================================================
// File: StationSlots.jsx
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Grid Operator battery slot live monitoring and availability view per station.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import OperatorPageHero from '../../components/OperatorPageHero';
import { ENTER_UP } from '../../utils/enterAnimations';

const StationSlots = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterStationId = searchParams.get('stationId');
  const [searchQuery, setSearchQuery] = useState('');
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingSlots, setEditingSlots] = useState({});
  const [selectedSlotModal, setSelectedSlotModal] = useState(null);
  const [prosumers, setProsumers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [modalTab, setModalTab] = useState('busy');
  const [actionLoading, setActionLoading] = useState(false);
  const [bookForm, setBookForm] = useState({
    prosumerNic: '',
    energyAmountKWh: 10,
    durationHours: 1,
    reservationType: 'DropOff',
    scheduledDateTime: '',
  });

  const fetchAuxData = async () => {
    try {
      const [resUsers, resRes] = await Promise.all([
        api.get('/users', { params: { role: 'Prosumer', status: 'Active' } }),
        api.get('/reservations'),
      ]);
      setProsumers(resUsers.data || []);
      setReservations(resRes.data || []);
    } catch (err) {
      console.error('Failed to load auxiliary prosumer or reservation data', err);
    }
  };

  const fetchStations = async () => {
    // [IT22106292] - Loads all stations and initialises editable battery slot count map
    setLoading(true);
    try {
      const res = await api.get('/stations');
      setStations(res.data);
      // Initialize editing slots map
      const initialMap = {};
      res.data.forEach(s => {
        initialMap[s.id] = s.availableBatterySlots;
      });
      setEditingSlots(initialMap);
      await fetchAuxData();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'danger', text: 'Failed to load station slot information.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();

    // Auto-refresh slot telemetry every 5 seconds so bookings/releases appear automatically
    const interval = setInterval(() => {
      api.get('/stations')
        .then(res => {
          setStations(res.data);
          setEditingSlots(prev => {
            const next = { ...prev };
            res.data.forEach(st => {
              next[st.id] = st.availableBatterySlots;
            });
            return next;
          });
        })
        .catch(() => {});
      api.get('/reservations')
        .then(res => setReservations(res.data || []))
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSlotChange = (stationId, delta) => {
    // [IT22106292] - Increments or decrements available battery slots within valid bounds
    setEditingSlots(prev => {
      const station = stations.find(s => s.id === stationId);
      const current = prev[stationId] ?? 0;
      const next = current + delta;
      if (next < 0 || (station && next > station.totalBatterySlots)) return prev;
      return { ...prev, [stationId]: next };
    });
  };

  const handleSaveSlot = async (station) => {
    // [IT22106292] - Persists updated battery slot count for a station to the API
    const newSlots = editingSlots[station.id];
    setMessage({ type: '', text: '' });

    try {
      const res = await api.put(`/stations/${station.id}/battery-slots`, {
        availableBatterySlots: parseInt(newSlots, 10),
      });
      setMessage({ type: 'success', text: res.data.message || `Updated battery slots for ${station.name}.` });
      fetchStations();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to update battery slots.' });
    }
  };

  const handleOpenSlotModal = (station, slotNumber, isBusy, isOccupied) => {
    const matchRes = reservations.find(r => 
      (r.stationId === station.id || r.stationName === station.name) &&
      r.slotNumber === slotNumber &&
      (r.status === 'Approved' || r.status === 'Pending')
    );

    const defaultTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const localIso = new Date(defaultTime.getTime() - defaultTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    setSelectedSlotModal({
      station,
      slotNumber,
      isBusy,
      isBooked: isOccupied,
      reservation: matchRes || null,
    });
    setModalTab('busy');
    setBookForm({
      prosumerNic: prosumers.length > 0 ? prosumers[0].nic : '',
      energyAmountKWh: 10,
      durationHours: 1,
      reservationType: 'DropOff',
      scheduledDateTime: localIso,
    });
  };

  const handleToggleSlotBusy = async (makeBusy) => {
    if (!selectedSlotModal) return;
    setActionLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.post(`/stations/${selectedSlotModal.station.id}/slots/${selectedSlotModal.slotNumber}/busy`, {
        isBusy: makeBusy,
      });
      setMessage({ type: 'success', text: res.data.message || (makeBusy ? `Slot #${selectedSlotModal.slotNumber} is now marked Busy.` : `Slot #${selectedSlotModal.slotNumber} released.`) });
      setSelectedSlotModal(null);
      await fetchStations();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to update slot status.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseSlot = async () => {
    if (!selectedSlotModal) return;
    setActionLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.post(`/stations/${selectedSlotModal.station.id}/slots/${selectedSlotModal.slotNumber}/release`);
      setMessage({ type: 'success', text: res.data.message || `Slot #${selectedSlotModal.slotNumber} has been released.` });
      setSelectedSlotModal(null);
      await fetchStations();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to release slot.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOperatorBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlotModal) return;
    if (!bookForm.prosumerNic) {
      setMessage({ type: 'danger', text: 'Please select an existing prosumer.' });
      return;
    }
    if (!bookForm.scheduledDateTime) {
      setMessage({ type: 'danger', text: 'Please select a scheduled date and time.' });
      return;
    }
    setActionLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = {
        prosumerNic: bookForm.prosumerNic,
        stationId: selectedSlotModal.station.id,
        slotNumber: selectedSlotModal.slotNumber,
        scheduledDateTime: new Date(bookForm.scheduledDateTime).toISOString(),
        durationHours: parseInt(bookForm.durationHours, 10) || 1,
        energyAmountKWh: parseFloat(bookForm.energyAmountKWh) || 10,
        reservationType: bookForm.reservationType,
      };
      const res = await api.post('/reservations/backoffice-create', payload);
      setMessage({ type: 'success', text: res.data.message || `Booking created for Slot #${selectedSlotModal.slotNumber}.` });
      setSelectedSlotModal(null);
      await fetchStations();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to create booking for prosumer.' });
    } finally {
      setActionLoading(false);
    }
  };

  const displayedStations = stations.filter((s) => {
    // If targeted stationId filter is active, only show that station
    if (filterStationId && s.id !== filterStationId) {
      return false;
    }
    // If search query is entered, match stationCode, name, or location
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.stationCode && s.stationCode.toLowerCase().includes(q)) ||
        (s.location && s.location.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen position-relative overflow-hidden text-[#063127] bg-[#F8F8F8] font-[Inter,sans-serif]">

      <div className="container-fluid max-w-[1440px] mx-auto position-relative z-[1] px-6 md:px-10 pt-9 pb-[60px]">
        <OperatorPageHero
          imageSrc="/images/Solar_2.jpg"
          eyebrow="SOLARX • Battery Slots"
          title="Station Slot Management"
          subtitle="Real-time available battery slots. To make a slot booked or busy, click on the slot number."
          breadcrumb={['Slots']}
        />

        <div className="alert bg-[#063127]/10 border border-[#063127]/20 text-[#063127] d-flex align-items-center gap-3 rounded-[16px] mb-4">
          <div className="rounded-circle bg-[#063127] text-white d-flex align-items-center justify-content-center w-[36px] h-[36px] flex-shrink-0">
            <i className="bi bi-info-circle-fill"></i>
          </div>
          <div className="small fw-semibold">
            To make a slot booked or mark it busy, click on the slot number.
          </div>
        </div>

        <div className="d-flex justify-content-end align-items-center mb-4 flex-wrap gap-3">
          <button onClick={fetchStations} className="btn rounded-pill px-4 py-2 text-[0.85rem] fw-bold d-inline-flex align-items-center gap-2 bg-white border text-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg" title="Refresh telemetry">
            <i className="bi bi-arrow-clockwise"></i>Refresh
          </button>
          <Link to="/operator" className="btn rounded-pill px-4 py-2 text-[0.85rem] fw-bold d-inline-flex align-items-center gap-2 bg-white border text-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg text-decoration-none">
            <i className="bi bi-arrow-left"></i>Back to Console
          </Link>
        </div>

        <div className={`card border-0 rounded-[24px] bg-white/85 shadow-sm backdrop-blur-xl mb-4 overflow-hidden ${ENTER_UP} motion-reduce:animate-none`}>
          <div className="card-body p-4 d-flex align-items-center gap-2 flex-wrap">
            <div className="input-group flex-1 min-w-[240px] flex-grow-1">
              <span className="input-group-text bg-[#063127] text-[#BFD5D0] border-[#063127]"><i className="bi bi-search"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search hub by code, station name, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="button" className="btn bg-white text-[#063127] border hover:bg-[#F8F8F8] hover:text-[#063127]" onClick={() => setSearchQuery('')}>
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              )}
            </div>
            <button type="button" className="btn bg-[#063127] text-white border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill fw-bold text-nowrap">
              <i className="bi bi-search me-1"></i>Search Hub
            </button>
            {(filterStationId || searchQuery) && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSearchParams({}); }}
                className="btn bg-white text-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill fw-semibold"
              >
                <i className="bi bi-grid-3x3-gap-fill me-1"></i>Show All Hubs
              </button>
            )}
            <span className="small text-[#063127] fw-semibold text-nowrap">
              {displayedStations.length === stations.length
                ? `${stations.length} Hubs`
                : `${displayedStations.length} of ${stations.length} Hubs`}
            </span>
          </div>
        </div>

        {filterStationId && displayedStations.length > 0 && (
          <div className="alert bg-[#063127]/10 border border-[#063127]/20 text-[#063127] d-flex align-items-center justify-content-between flex-wrap gap-2 rounded-[16px]" role="alert">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-3 bg-[#063127] text-white d-flex align-items-center justify-content-center fs-5 w-[36px] h-[36px] flex-shrink-0">
                <i className="bi bi-battery-charging"></i>
              </div>
              <div>
                <div className="fw-bold small text-[#063127]">
                  Showing Battery Slot Card for: <strong>{displayedStations[0]?.name}</strong>
                </div>
                <div className="small text-[#063127] fw-medium">
                  <span className="font-monospace">{displayedStations[0]?.stationCode}</span>
                  {' · '}
                  <i className="bi bi-geo-alt-fill text-danger"></i> {displayedStations[0]?.location}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSearchParams({}); }}
              className="btn btn-sm bg-[#063127] text-white border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill fw-bold"
            >
              <i className="bi bi-grid-3x3-gap-fill me-1"></i>Show All Hubs
            </button>
          </div>
        )}

        {message.text && (
          <div className={`alert border d-flex align-items-center gap-2 ${message.type === 'danger' ? 'alert-danger' : 'bg-[#063127]/10 border-[#063127]/20 text-[#063127]'} alert-dismissible rounded-[16px]`} role="alert">
            <i className={`bi ${message.type === 'danger' ? 'bi-exclamation-octagon-fill' : 'bi-check-circle-fill'} fs-5`}></i>
            <span className="fw-semibold small flex-grow-1">{message.text}</span>
            <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })} aria-label="Close"></button>
          </div>
        )}

        <div className="row g-4">
          {loading ? (
            <div className="col-12 text-center py-5">
              <div className="spinner-border text-[#063127] me-2" role="status"></div>
              <span className="text-[#063127] fw-semibold">Loading battery storage telemetry...</span>
            </div>
          ) : displayedStations.length === 0 ? (
            <div className="col-12 text-center py-5">
              <i className="bi bi-search d-block mb-2 text-[#686053] fs-1"></i>
              <div className="fw-bold text-[#063127] mb-2">
                {searchQuery ? `No hubs found matching "${searchQuery}"` : 'No microgrid stations available.'}
              </div>
              {(filterStationId || searchQuery) && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSearchParams({}); }}
                  className="btn btn-sm bg-white text-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-4 mt-2"
                >
                  Show All Hubs
                </button>
              )}
            </div>
          ) : (
            displayedStations.map((s) => {
              const currentSlots = editingSlots[s.id] ?? s.availableBatterySlots;
              return (
                <div key={s.id} className={filterStationId ? 'col-md-8 col-lg-6 mx-auto' : 'col-md-6 col-lg-6'}>
                  <div className="card h-100 border-0 rounded-[24px] bg-white/85 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-lg overflow-hidden">
                    <div className="card-body p-4 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="badge bg-[#063127] text-[#F8F8F8] font-monospace rounded-pill">{s.stationCode}</span>
                          <span className={`badge rounded-pill ${s.status === 'Active' ? 'bg-[#063127] text-white' : 'bg-[#686053] text-white'}`}>{s.status}</span>
                        </div>

                        <h3 className="h5 fw-extrabold text-[#063127] mb-1">{s.name}</h3>
                        <div className="d-flex align-items-center gap-1 text-[#686053] small mb-3">
                          <i className="bi bi-geo-alt text-[#063127]"></i>
                          <span>{s.location}</span>
                        </div>

                        <div className="bg-white border border-[#063127]/20 rounded-[16px] p-3 mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-1">
                            <span className="small fw-bold text-[#063127] text-uppercase">Battery Slots Occupancy</span>
                            <span className="fw-extrabold small text-[#063127]">
                              {currentSlots} Available <span className="text-[#686053] fw-normal small">/ {s.totalBatterySlots} Total</span>
                            </span>
                          </div>
                          <div className="progress rounded-pill bg-[#BFD5D0]/50" style={{ height: '10px' }} role="progressbar" aria-valuenow={currentSlots} aria-valuemin={0} aria-valuemax={s.totalBatterySlots || 100} aria-label="Battery slot occupancy">
                            <div className="progress-bar rounded-pill bg-[#2E695A]" style={{ width: `${s.totalBatterySlots > 0 ? Math.min(Math.max((currentSlots / s.totalBatterySlots) * 100, 0), 100) : 0}%` }} />
                          </div>
                          <div className="d-flex justify-content-between mt-2 small text-[#686053]">
                            <span>Capacity: {s.capacityKWh} kW/h</span>
                            <span>Schedule: {s.operationalSchedule || '24/7 Grid'}</span>
                          </div>

                          <div className="mt-3 pt-2 border-top border-dashed">
                            <div className="small fw-bold text-[#063127] text-uppercase mb-2 d-flex justify-content-between align-items-center flex-wrap gap-1">
                              <span><i className="bi bi-grid-3x3-gap-fill me-1"></i>Live Slot Bay Telemetry</span>
                              <span className="badge bg-[#063127]/10 text-[#063127] rounded-pill">
                                <span className="badge bg-[#063127] rounded-circle p-1 me-1"></span>Live Sync
                              </span>
                            </div>

                            {/* Legend */}
                            <div className="d-flex align-items-center gap-3 mb-2.5 flex-wrap text-[0.72rem] text-[#686053]">
                              <span className="d-inline-flex align-items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Free
                              </span>
                              <span className="d-inline-flex align-items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Busy (Operator)
                              </span>
                              <span className="d-inline-flex align-items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Booked (Prosumer)
                              </span>
                              <span className="ms-auto text-[#063127] fw-semibold">Click slot to manage</span>
                            </div>

                            <div className="d-flex flex-wrap gap-1.5">
                              {Array.from({ length: s.totalBatterySlots || 10 }, (_, idx) => {
                                const slotNum = idx + 1;
                                const isOccupied = (s.occupiedSlotNumbers || []).includes(slotNum);
                                const isBusy = (s.busySlotNumbers || []).includes(slotNum);

                                let chipClass = 'bg-white text-[#063127] border-[#063127]/25 hover:border-[#063127] hover:bg-emerald-50';
                                let label = 'Free';
                                if (isBusy) {
                                  chipClass = 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200';
                                  label = 'Busy';
                                } else if (isOccupied) {
                                  chipClass = 'bg-danger-subtle text-danger-emphasis border-danger-subtle hover:bg-rose-100';
                                  label = 'Booked';
                                }

                                return (
                                  <button
                                    key={slotNum}
                                    type="button"
                                    onClick={() => handleOpenSlotModal(s, slotNum, isBusy, isOccupied)}
                                    title={`Battery Bay #${slotNum}: ${isBusy ? 'Busy (Operator Blocked)' : isOccupied ? 'Booked (Prosumer)' : 'Free (Available)'} — Click to manage`}
                                    className={`btn btn-sm rounded-2 fw-bold text-[0.75rem] py-1 px-2.5 border shadow-none transition ${chipClass}`}
                                  >
                                    #{slotNum} {label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Operator Slot Bay Manager Modal */}
        {selectedSlotModal && (
          <div className="modal show d-block bg-black/50 backdrop-blur-sm position-fixed top-0 start-0 w-100 h-100 z-[1050] overflow-y-auto p-3" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered max-w-[560px]">
              <div className="modal-content rounded-[24px] border-0 shadow-2xl bg-white overflow-hidden text-[#063127]">
                <div className="modal-header border-b border-[#063127]/10 px-5 py-4 bg-[#F8F8F8]">
                  <div className="d-flex align-items-center gap-3">
                    <div className={`w-10 h-10 rounded-full d-flex align-items-center justify-content-center text-white fw-bold ${selectedSlotModal.isBusy ? 'bg-amber-500' : selectedSlotModal.isBooked ? 'bg-rose-500' : 'bg-[#063127]'}`}>
                      #{selectedSlotModal.slotNumber}
                    </div>
                    <div>
                      <h4 className="modal-title h6 fw-extrabold text-[#063127] mb-0">
                        Battery Bay Slot #{selectedSlotModal.slotNumber}
                      </h4>
                      <p className="text-[0.8rem] text-[#686053] mb-0">
                        {selectedSlotModal.station.name} ({selectedSlotModal.station.stationCode})
                      </p>
                    </div>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setSelectedSlotModal(null)} aria-label="Close"></button>
                </div>

                <div className="modal-body p-5">
                  {/* Current Status Box */}
                  <div className={`p-3 rounded-[16px] mb-4 border d-flex align-items-center gap-3 ${
                    selectedSlotModal.isBusy
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : selectedSlotModal.isBooked
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}>
                    <i className={`fs-4 bi ${
                      selectedSlotModal.isBusy ? 'bi-exclamation-triangle-fill text-amber-600' : selectedSlotModal.isBooked ? 'bi-lock-fill text-rose-600' : 'bi-check-circle-fill text-emerald-600'
                    }`}></i>
                    <div className="flex-grow-1 text-[0.85rem]">
                      <div className="fw-bold">
                        {selectedSlotModal.isBusy && 'Slot is currently marked BUSY by Grid Operator'}
                        {selectedSlotModal.isBooked && 'Slot is BOOKED by an active prosumer reservation'}
                        {!selectedSlotModal.isBusy && !selectedSlotModal.isBooked && 'Slot is FREE and AVAILABLE for trading'}
                      </div>
                      <div className="small opacity-85">
                        {selectedSlotModal.isBusy && 'Prosumers cannot reserve or trade on this slot bay.'}
                        {selectedSlotModal.isBooked && 'Reserved for energy drop-off / charging.'}
                        {!selectedSlotModal.isBusy && !selectedSlotModal.isBooked && 'Open to prosumer self-service or operator manual reservation.'}
                      </div>
                    </div>
                  </div>

                  {/* If Busy: Option to Release Slot */}
                  {selectedSlotModal.isBusy && (
                    <div className="bg-[#F8F8F8] border border-[#063127]/10 rounded-[18px] p-4 text-center">
                      <p className="small text-[#686053] mb-3">
                        Releasing this slot will reset its status to <strong>Available</strong>, allowing prosumers to book it again immediately.
                      </p>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={handleReleaseSlot}
                        className="btn bg-[#063127] text-white border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill px-4 py-2.5 fw-bold d-inline-flex align-items-center gap-2 shadow-sm"
                      >
                        {actionLoading ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-unlock-fill"></i>}
                        Cancel Busy & Release Slot
                      </button>
                    </div>
                  )}

                  {/* If Booked: View reservation info and option to Cancel & Release */}
                  {selectedSlotModal.isBooked && (
                    <div className="bg-[#F8F8F8] border border-[#063127]/10 rounded-[18px] p-4">
                      <h5 className="text-[0.88rem] fw-bold text-[#063127] mb-2">Active Booking Details</h5>
                      {selectedSlotModal.reservation ? (
                        <div className="text-[0.82rem] text-[#686053] mb-3 space-y-1">
                          <div><strong>Code:</strong> <span className="font-monospace text-[#063127]">{selectedSlotModal.reservation.reservationCode}</span></div>
                          <div><strong>Prosumer:</strong> {selectedSlotModal.reservation.prosumerName} (NIC: {selectedSlotModal.reservation.prosumerNic})</div>
                          <div><strong>Energy:</strong> {selectedSlotModal.reservation.energyAmountKWh} kWh ({selectedSlotModal.reservation.reservationType})</div>
                          <div><strong>Scheduled:</strong> {new Date(selectedSlotModal.reservation.scheduledDateTime).toLocaleString()}</div>
                          <div><strong>Status:</strong> <span className="badge bg-[#063127] text-white">{selectedSlotModal.reservation.status}</span></div>
                        </div>
                      ) : (
                        <p className="text-[0.82rem] text-[#686053] mb-3">
                          A prosumer booking is assigned to this bay.
                        </p>
                      )}
                      <div className="text-center pt-2 border-t border-[#063127]/10">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={handleReleaseSlot}
                          className="btn btn-outline-danger rounded-pill px-4 py-2.5 fw-bold d-inline-flex align-items-center gap-2 shadow-sm"
                        >
                          {actionLoading ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-x-circle-fill"></i>}
                          Cancel Booking & Release Slot
                        </button>
                      </div>
                    </div>
                  )}

                  {/* If Free: Two tabs: Mark as Busy OR Book for Existing Prosumer */}
                  {!selectedSlotModal.isBusy && !selectedSlotModal.isBooked && (
                    <div>
                      <div className="d-flex rounded-pill bg-[#F8F8F8] p-1 border border-[#063127]/10 mb-4">
                        <button
                          type="button"
                          className={`btn btn-sm rounded-pill flex-1 fw-bold py-2 ${modalTab === 'busy' ? 'bg-[#063127] text-white shadow-sm' : 'text-[#686053]'}`}
                          onClick={() => setModalTab('busy')}
                        >
                          <i className="bi bi-slash-circle me-1.5"></i>Mark Slot Busy
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm rounded-pill flex-1 fw-bold py-2 ${modalTab === 'book' ? 'bg-[#063127] text-white shadow-sm' : 'text-[#686053]'}`}
                          onClick={() => setModalTab('book')}
                        >
                          <i className="bi bi-person-plus me-1.5"></i>Book for Prosumer
                        </button>
                      </div>

                      {modalTab === 'busy' && (
                        <div className="text-center py-2">
                          <p className="text-[0.85rem] text-[#686053] mb-4">
                            Marking <strong>Slot #{selectedSlotModal.slotNumber}</strong> as Busy will lock this bay. No prosumer will be able to select or reserve this slot until released.
                          </p>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleToggleSlotBusy(true)}
                            className="btn bg-amber-500 hover:bg-amber-600 text-white rounded-pill px-5 py-2.5 fw-bold d-inline-flex align-items-center gap-2 shadow-sm"
                          >
                            {actionLoading ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-lock-fill"></i>}
                            Mark Slot #{selectedSlotModal.slotNumber} Busy
                          </button>
                        </div>
                      )}

                      {modalTab === 'book' && (
                        <form onSubmit={handleOperatorBooking}>
                          <div className="mb-3">
                            <label className="form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase">Select Existing Prosumer *</label>
                            <select
                              required
                              className="form-select rounded-[10px] text-[0.88rem] bg-white"
                              value={bookForm.prosumerNic}
                              onChange={(e) => setBookForm({ ...bookForm, prosumerNic: e.target.value })}
                            >
                              <option value="">— Choose registered prosumer —</option>
                              {prosumers.map(p => (
                                <option key={p.nic} value={p.nic}>{p.fullName} (NIC: {p.nic})</option>
                              ))}
                            </select>
                          </div>

                          <div className="row g-2 mb-3">
                            <div className="col-6">
                              <label className="form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase">Trade Type</label>
                              <select
                                className="form-select rounded-[10px] text-[0.88rem] bg-white"
                                value={bookForm.reservationType}
                                onChange={(e) => setBookForm({ ...bookForm, reservationType: e.target.value })}
                              >
                                <option value="DropOff">Drop-Off (Sell)</option>
                                <option value="Charging">Charging (Buy)</option>
                              </select>
                            </div>
                            <div className="col-6">
                              <label className="form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase">Energy (kWh) *</label>
                              <input
                                type="number"
                                step="0.5"
                                min="1"
                                max="500"
                                required
                                className="form-control rounded-[10px] text-[0.88rem] bg-white"
                                value={bookForm.energyAmountKWh}
                                onChange={(e) => setBookForm({ ...bookForm, energyAmountKWh: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase">Scheduled Date & Time *</label>
                            <input
                              type="datetime-local"
                              required
                              className="form-control rounded-[10px] text-[0.88rem] bg-white"
                              value={bookForm.scheduledDateTime}
                              onChange={(e) => setBookForm({ ...bookForm, scheduledDateTime: e.target.value })}
                            />
                            <div className="small text-[#686053] mt-1">Must be within the 7-day operational window.</div>
                          </div>

                          <button
                            type="submit"
                            disabled={actionLoading}
                            className="btn bg-[#063127] text-white border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill w-100 py-2.5 fw-bold d-inline-flex align-items-center justify-content-center gap-2 shadow-sm"
                          >
                            {actionLoading ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-calendar-check-fill"></i>}
                            Create Booking on Slot #{selectedSlotModal.slotNumber}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>

                <div className="modal-footer border-t border-[#063127]/10 px-5 py-3 bg-[#F8F8F8]">
                  <button type="button" className="btn btn-sm rounded-pill px-4 btn-light border" onClick={() => setSelectedSlotModal(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 text-center">
          <Link to="/operator" className="d-inline-flex align-items-center gap-2 text-[#063127] text-decoration-none fw-bold text-[0.9rem] bg-white px-4 py-2 rounded-pill border shadow-sm transition hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] hover:-translate-y-0.5 hover:shadow-lg">
            <i className="bi bi-arrow-left"></i>Back to Operational Console
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StationSlots;
