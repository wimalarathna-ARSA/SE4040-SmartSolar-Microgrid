// ============================================================================
// File: EnergyTransferHistory.jsx
// Author: IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Grid Operator completed energy transfer history with search and filter.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import OperatorPageHero from '../../components/OperatorPageHero';
import { ENTER_UP } from '../../utils/enterAnimations';

const EnergyTransferHistory = () => {
  const [transfers, setTransfers] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // newest first

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { status: 'Completed' };
      if (stationFilter) params.stationId = stationFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const [resTransfers, resStations] = await Promise.all([
        api.get('/reservations', { params }),
        api.get('/stations'),
      ]);

      setTransfers(resTransfers.data);
      setStations(resStations.data);
    } catch (err) {
      console.error('Failed to load energy transfer history', err);
    } finally {
      setLoading(false);
    }
  }, [stationFilter]);

  useEffect(() => {
    loadData();
  }, [stationFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  // Client-side filtering for type and date range
  const filtered = transfers.filter((t) => {
    if (typeFilter && t.reservationType !== typeFilter) return false;
    if (dateFrom) {
      const completed = t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt);
      if (completed < new Date(dateFrom)) return false;
    }
    if (dateTo) {
      const completed = t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (completed > toDate) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const da = new Date(a.completedAt || a.updatedAt);
    const db = new Date(b.completedAt || b.updatedAt);
    return sortOrder === 'desc' ? db - da : da - db;
  });

  // Summary stats from filtered set
  const totalKWh = filtered.reduce((s, t) => s + (t.energyAmountKWh || 0), 0);
  const totalAmount = filtered.reduce((s, t) => s + (t.totalCost || 0), 0);
  const dropOffs = filtered.filter((t) => t.reservationType === 'DropOff').length;
  const chargings = filtered.filter((t) => t.reservationType === 'Charging').length;

  const typeBadge = (type) => {
    if (type === 'DropOff') return (
      <span className="badge bg-[#063127] text-white rounded-pill">
        <i className="bi bi-arrow-down-left me-1"></i>Drop-Off (Sell)
      </span>
    );
    return (
      <span className="badge bg-[#65998B] text-white rounded-pill">
        <i className="bi bi-lightning-charge me-1"></i>Charging (Buy)
      </span>
    );
  };

  const formatDateTime = (dt) => {
    if (!dt) return { date: '—', time: '' };
    const d = new Date(dt);
    return {
      date: d.toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: '2-digit' }),
      time: d.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <div className="min-h-screen position-relative overflow-hidden text-[#063127] bg-[#F8F8F8] font-[Inter,sans-serif]">

      <div className="container-fluid max-w-[1440px] mx-auto position-relative z-[1] px-6 md:px-10 pt-9 pb-[60px]">

        <OperatorPageHero
          imageSrc="/images/house_5.png"
          eyebrow="SOLARX • Audit Trail"
          title="Energy Transfer History"
          subtitle="Completed trades with full verification and audit logs."
          breadcrumb={['History']}
        />

        <div className="d-flex justify-content-end align-items-center mb-4 flex-wrap gap-3">
          <button onClick={loadData} className="btn rounded-pill px-4 py-2 text-[0.85rem] fw-bold d-inline-flex align-items-center gap-2 bg-white border text-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <i className="bi bi-arrow-clockwise"></i>Refresh
          </button>
          <Link to="/operator" className="btn rounded-pill px-4 py-2 text-[0.85rem] fw-bold d-inline-flex align-items-center gap-2 bg-white border text-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg text-decoration-none">
            <i className="bi bi-arrow-left"></i>Back to Console
          </Link>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-4 col-6 col-lg">
            <div className={`card border-0 rounded-[24px] bg-white/85 shadow-sm backdrop-blur-xl h-100 ${ENTER_UP} motion-reduce:animate-none`}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <i className="bi bi-check2-circle text-[#063127] fs-5"></i>
                  <span className="small fw-bold text-uppercase text-[#686053]">Total Transfers</span>
                </div>
                <div className="fs-4 fw-extrabold text-[#063127]">{filtered.length}</div>
              </div>
            </div>
          </div>
          <div className="col-md-4 col-6 col-lg">
            <div className={`card border-0 rounded-[24px] bg-white/85 shadow-sm backdrop-blur-xl h-100 ${ENTER_UP} motion-reduce:animate-none`}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <i className="bi bi-lightning-fill text-[#063127] fs-5"></i>
                  <span className="small fw-bold text-uppercase text-[#686053]">Total Energy (kWh)</span>
                </div>
                <div className="fs-4 fw-extrabold text-[#063127]">{totalKWh.toFixed(2)}</div>
              </div>
            </div>
          </div>
          <div className="col-md-4 col-6 col-lg">
            <div className={`card border-0 rounded-[24px] bg-white/85 shadow-sm backdrop-blur-xl h-100 ${ENTER_UP} motion-reduce:animate-none`}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <i className="bi bi-currency-dollar text-[#063127] fs-5"></i>
                  <span className="small fw-bold text-uppercase text-[#686053]">Total Value (Rs.)</span>
                </div>
                <div className="fs-5 fw-extrabold text-[#063127] text-[1.4rem]">Rs. {totalAmount.toFixed(2)}</div>
              </div>
            </div>
          </div>
          <div className="col-md-4 col-6 col-lg">
            <div className={`card border-0 rounded-[24px] bg-white/85 shadow-sm backdrop-blur-xl h-100 ${ENTER_UP} motion-reduce:animate-none`}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <i className="bi bi-arrow-down-left text-[#063127] fs-5"></i>
                  <span className="small fw-bold text-uppercase text-[#686053]">Drop-Off (Sell)</span>
                </div>
                <div className="fs-4 fw-extrabold text-[#063127]">{dropOffs}</div>
              </div>
            </div>
          </div>
          <div className="col-md-4 col-6 col-lg">
            <div className={`card border-0 rounded-[24px] bg-white/85 shadow-sm backdrop-blur-xl h-100 ${ENTER_UP} motion-reduce:animate-none`}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <i className="bi bi-lightning-charge text-[#063127] fs-5"></i>
                  <span className="small fw-bold text-uppercase text-[#686053]">Charging (Buy)</span>
                </div>
                <div className="fs-4 fw-extrabold text-[#063127]">{chargings}</div>
              </div>
            </div>
          </div>
        </div>

        <div className={`card border-0 rounded-[24px] bg-white/85 shadow-sm backdrop-blur-xl mb-4 overflow-hidden ${ENTER_UP} motion-reduce:animate-none`}>
          <div className="card-body p-4">
            <form onSubmit={handleSearch}>
              <div className="row g-3 align-items-end">
                <div className="col-md-4">
                  <label htmlFor="eth-search" className="form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase tracking-wide">Search</label>
                  <div className="input-group">
                    <span className="input-group-text bg-[#063127] text-[#BFD5D0] border-[#063127]"><i className="bi bi-search"></i></span>
                    <input
                      id="eth-search"
                      type="text"
                      className="form-control rounded-[10px] text-[0.9rem] bg-white"
                      placeholder="Code, prosumer name, NIC..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <label htmlFor="eth-station" className="form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase tracking-wide">Hub / Station</label>
                  <select id="eth-station" className="form-select rounded-[10px] text-[0.9rem] bg-white" value={stationFilter} onChange={(e) => setStationFilter(e.target.value)}>
                    <option value="">All Stations</option>
                    {stations.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.stationCode})</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <label htmlFor="eth-type" className="form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase tracking-wide">Transfer Type</label>
                  <select id="eth-type" className="form-select rounded-[10px] text-[0.9rem] bg-white" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="">All Types</option>
                    <option value="DropOff">Drop-Off (Sell)</option>
                    <option value="Charging">Charging (Buy)</option>
                  </select>
                </div>
                <div className="col-md-1">
                  <label htmlFor="eth-sort" className="form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase tracking-wide">Sort</label>
                  <select id="eth-sort" className="form-select rounded-[10px] text-[0.9rem] bg-white px-2" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                    <option value="desc">Newest</option>
                    <option value="asc">Oldest</option>
                  </select>
                </div>
                <div className="col-md-2 d-flex gap-2">
                  <button type="submit" className="btn bg-[#063127] text-white border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill fw-bold flex-fill">
                    <i className="bi bi-search me-1"></i>Search
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSearchTerm(''); setStationFilter(''); setTypeFilter(''); setDateFrom(''); setDateTo(''); setSortOrder('desc'); loadData(); }}
                    className="btn bg-white text-[#063127] border border-[#063127] hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] rounded-pill fw-semibold"
                    title="Reset all filters"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
            </form>

            <div className="row g-3 mt-1">
              <div className="col-md-3">
                <label htmlFor="eth-from" className="form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase tracking-wide">Completed From</label>
                <input id="eth-from" type="date" className="form-control rounded-[10px] text-[0.9rem] bg-white" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="col-md-3">
                <label htmlFor="eth-to" className="form-label text-[0.78rem] fw-bold text-[#686053] text-uppercase tracking-wide">Completed To</label>
                <input id="eth-to" type="date" className="form-control rounded-[10px] text-[0.9rem] bg-white" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <div className="col-md-6 d-flex align-items-end">
                <span className="small text-[#063127] fw-semibold">
                  Showing <strong>{sorted.length}</strong> of <strong>{transfers.length}</strong> completed energy transfers
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={`card border-0 rounded-[28px] bg-white/85 shadow-sm backdrop-blur-xl overflow-hidden ${ENTER_UP} motion-reduce:animate-none`}>
          <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between flex-wrap gap-2 px-4 py-3">
            <div>
              <h2 className="h6 fw-extrabold text-[#063127] mb-0">
                <i className="bi bi-lightning-fill me-2 text-[#063127]"></i>
                Completed Energy Transfer Records
              </h2>
              <div className="small text-[#686053]">Physical energy handoffs verified by Grid Operator QR scan</div>
            </div>
            <span className="badge bg-[#063127] text-white rounded-pill fw-bold">{sorted.length} Records</span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="[&_th]:bg-[#063127] [&_th]:text-[#F8F8F8] [&_th]:text-uppercase [&_th]:text-[0.72rem] [&_th]:fw-bold [&_th]:px-4 [&_th]:py-3">
                <tr>
                  <th>BOOKING CODE</th>
                  <th>PROSUMER</th>
                  <th>HUB / STATION</th>
                  <th>SCHEDULED SLOT</th>
                  <th>TYPE</th>
                  <th>ENERGY (kWh)</th>
                  <th>VALUE</th>
                  <th>COMPLETED AT</th>
                  <th>OPERATOR</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody className="text-[0.85rem]">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="text-center py-5 text-[#686053]">
                      <div className="spinner-border spinner-border-sm me-2 text-[#063127]" role="status"></div>
                      Loading energy transfer history...
                    </td>
                  </tr>
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-5">
                      <i className="bi bi-lightning d-block mb-2 text-[#686053] fs-1"></i>
                      <div className="fw-bold text-[#063127]">No completed energy transfers found</div>
                      <div className="small text-[#686053]">
                        {transfers.length === 0
                          ? 'No reservations have been completed yet via QR verification.'
                          : 'No results match the current filters. Try adjusting your search.'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  sorted.map((t, idx) => {
                    const completedDT = formatDateTime(t.completedAt || t.updatedAt);
                    const scheduledDT = formatDateTime(t.scheduledDateTime);
                    return (
                      <tr key={t.id || idx}>
                        <td><span className="font-monospace fw-bold text-[#063127] small">{t.reservationCode}</span></td>
                        <td>
                          <div className="fw-bold small text-[#063127]">{t.prosumerName}</div>
                          <div className="small text-danger fw-semibold">NIC: {t.prosumerNic}</div>
                        </td>
                        <td>
                          <span className="fw-semibold small text-[#063127]"><i className="bi bi-broadcast text-[#063127] me-1"></i>{t.stationName}</span>
                        </td>
                        <td>
                          <div className="fw-semibold small">{scheduledDT.date}</div>
                          <div className="small text-[#686053]">{scheduledDT.time} · {t.durationHours}h</div>
                        </td>
                        <td>{typeBadge(t.reservationType)}</td>
                        <td><span className="fw-extrabold text-[#063127]">{t.energyAmountKWh}</span><span className="small text-[#686053] ms-1">kWh</span></td>
                        <td><span className="fw-extrabold text-[#063127]">{t.totalCost ? `Rs. ${Number(t.totalCost).toFixed(2)}` : '—'}</span></td>
                        <td>
                          <div className="fw-semibold small">{completedDT.date}</div>
                          <div className="small text-[#686053]">{completedDT.time}</div>
                        </td>
                        <td>
                          {t.operatorNic ? (
                            <div>
                              <div className="font-monospace fw-bold small text-[#063127]">{t.operatorNic}</div>
                              {t.operatorNotes && (
                                <div className="small text-[#686053] text-truncate max-w-[160px]" title={t.operatorNotes}>
                                  <i className="bi bi-chat-left-text me-1"></i>{t.operatorNotes}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#686053] small">—</span>
                          )}
                        </td>
                        <td><span className="badge bg-[#063127] text-white">{t.status}</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link to="/operator" className="d-inline-flex align-items-center gap-2 text-[#063127] text-decoration-none fw-bold text-[0.9rem] bg-white px-4 py-2 rounded-pill border shadow-sm transition hover:bg-[#F8F8F8] hover:text-[#063127] hover:border-[#063127] hover:-translate-y-0.5 hover:shadow-lg">
            <i className="bi bi-arrow-left"></i>Back to Operational Console
          </Link>
        </div>

      </div>
    </div>
  );
};

export default EnergyTransferHistory;
