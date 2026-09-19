// ============================================================================
// File: EnergyYieldCalculator3D.jsx
// Author: IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Interactive solar energy yield estimator and financial return calculator simulation.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
import React, { useState } from 'react';
import Card3D from './Card3D';

const EnergyYieldCalculator3D = () => {
  const [solarKw, setSolarKw] = useState(10); // kW
  const [batteryKwh, setBatteryKwh] = useState(15); // kWh
  const [sunHours, setSunHours] = useState(5.5); // Sri Lanka average peak sun hours

  // Ceylon Electricity Board / Microgrid tariff estimation: Rs. 37.00 per exported kWh
  const TARIFF_PER_KWH_LKR = 37.0;

  // Computations
  const dailyGenKwh = Number((solarKw * sunHours * 0.82).toFixed(1)); // 82% performance ratio
  const monthlyGenKwh = Math.round(dailyGenKwh * 30);
  const monthlyRevenueLkr = Math.round(monthlyGenKwh * TARIFF_PER_KWH_LKR);
  const annualCo2Tons = Number(((monthlyGenKwh * 12 * 0.7) / 1000).toFixed(2));
  const batteryCyclesPercent = Math.min(100, Math.round((dailyGenKwh / batteryKwh) * 100));

  return (
    <div className="container my-5">
      <div className="text-center mb-4">
        <h2 className="fw-bold text-white">Microgrid Yield &amp; Revenue Simulator</h2>
        <p className="text-secondary mx-auto" style={{ maxWidth: '680px' }}>
          Simulate your rooftop solar PV and battery storage performance under real Sri Lankan climate irradiance. 
        </p>
      </div>

      <div className="row g-4 align-items-center">
        {/* Left: Interactive Controls */}
        <div className="col-lg-6">
          <div className="card glass-panel p-4 text-white">
            <h4 className="fw-bold text-info mb-4 d-flex align-items-center gap-2">
              <i className="bi bi-sliders2"></i> System Configuration
            </h4>

            {/* Solar PV Capacity Slider */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="fw-semibold small text-uppercase text-secondary">
                  Solar Array Capacity
                </label>
                <span className="badge bg-primary fs-6 px-3 py-1">
                  {solarKw} kW Peak
                </span>
              </div>
              <input
                type="range"
                className="form-range"
                min="3"
                max="50"
                step="1"
                value={solarKw}
                onChange={(e) => setSolarKw(Number(e.target.value))}
              />
              <div className="d-flex justify-content-between smaller text-secondary" style={{ fontSize: '0.75rem' }}>
                <span>Residential (3 kW)</span>
                <span>Commercial (25 kW)</span>
                <span>Industrial Hub (50 kW)</span>
              </div>
            </div>

            {/* Battery Storage Slider */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="fw-semibold small text-uppercase text-secondary">
                  BESS Battery Capacity
                </label>
                <span className="badge bg-success fs-6 px-3 py-1">
                  {batteryKwh} kWh LiFePO4
                </span>
              </div>
              <input
                type="range"
                className="form-range"
                min="5"
                max="100"
                step="5"
                value={batteryKwh}
                onChange={(e) => setBatteryKwh(Number(e.target.value))}
              />
              <div className="d-flex justify-content-between smaller text-secondary" style={{ fontSize: '0.75rem' }}>
                <span>5 kWh</span>
                <span>50 kWh</span>
                <span>100 kWh Substation</span>
              </div>
            </div>

            {/* Peak Sun Hours Slider */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="fw-semibold small text-uppercase text-secondary">
                  Average Sunlight Hours (Sri Lanka)
                </label>
                <span className="badge bg-warning text-dark fs-6 px-3 py-1">
                  {sunHours} hrs/day
                </span>
              </div>
              <input
                type="range"
                className="form-range"
                min="4.0"
                max="7.0"
                step="0.1"
                value={sunHours}
                onChange={(e) => setSunHours(Number(e.target.value))}
              />
              <div className="d-flex justify-content-between smaller text-secondary" style={{ fontSize: '0.75rem' }}>
                <span>Hill Country (4.0h)</span>
                <span>Colombo/Western (5.5h)</span>
                <span>Hambantota/Jaffna (7.0h)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Result Cards */}
        <div className="col-lg-6">
          <div className="row g-3">
            {/* Monthly Revenue Card with Tilt */}
            <div className="col-12">
              <Card3D maxTilt={14} className="glass-panel-glow p-4 text-white border-warning">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="text-secondary small fw-semibold text-uppercase">
                      Estimated Monthly Trading Revenue
                    </span>
                    <h2 className="display-6 fw-bold text-warning mb-0 mt-1">
                      Rs. {monthlyRevenueLkr.toLocaleString()} <span className="fs-6 text-light fw-normal">/mo</span>
                    </h2>
                    <p className="text-secondary small mb-0 mt-2">
                      Based on dynamic CEB net-metering standard @ Rs. {TARIFF_PER_KWH_LKR.toFixed(2)} / kWh
                    </p>
                  </div>
                </div>
              </Card3D>
            </div>

            {/* Daily Generation */}
            <div className="col-sm-6">
              <Card3D maxTilt={12} className="glass-panel p-3 text-white border-primary">
                <div className="text-secondary small fw-semibold text-uppercase">Daily Energy Yield</div>
                <div className="fs-3 fw-bold text-primary mt-1">{dailyGenKwh} kWh</div>
                <div className="text-secondary smaller mt-1">
                  <i className="bi bi-arrow-up-right text-success me-1"></i>
                  {monthlyGenKwh.toLocaleString()} kWh monthly
                </div>
              </Card3D>
            </div>

            {/* Carbon Offset */}
            <div className="col-sm-6">
              <Card3D maxTilt={12} className="glass-panel p-3 text-white border-success">
                <div className="text-secondary small fw-semibold text-uppercase">Clean Carbon Offset</div>
                <div className="fs-3 fw-bold text-success mt-1">{annualCo2Tons} Tons</div>
                <div className="text-secondary smaller mt-1">
                  <i className="bi bi-tree-fill text-success me-1"></i>
                  Avoided greenhouse emissions / yr
                </div>
              </Card3D>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnergyYieldCalculator3D;
