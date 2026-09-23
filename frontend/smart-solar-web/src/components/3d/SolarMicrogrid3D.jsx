import React, { useEffect, useState } from 'react';

const SolarMicrogrid3D = () => {
  const [timeOfDay, setTimeOfDay] = useState('noon');
  const [telemetry, setTelemetry] = useState({
    solarYieldKw: 48.6,
    irradiance: 940,
    batterySoc: 86,
    gridStatus: 'Exporting to Microgrid',
    co2SavedKg: 142.5,
  });

  useEffect(() => {
    if (timeOfDay === 'dawn') {
      setTelemetry({ solarYieldKw: 16.4, irradiance: 320, batterySoc: 45, gridStatus: 'Solar Ramping Up', co2SavedKg: 85.2 });
    } else if (timeOfDay === 'noon') {
      setTelemetry({ solarYieldKw: 48.6, irradiance: 940, batterySoc: 86, gridStatus: 'Peak Exporting to Grid', co2SavedKg: 142.5 });
    } else if (timeOfDay === 'dusk') {
      setTelemetry({ solarYieldKw: 12.1, irradiance: 210, batterySoc: 94, gridStatus: 'BESS Discharging to Grid', co2SavedKg: 138.0 });
    } else if (timeOfDay === 'night') {
      setTelemetry({ solarYieldKw: 0.0, irradiance: 0, batterySoc: 78, gridStatus: 'BESS Baseload Mode', co2SavedKg: 135.2 });
    }
  }, [timeOfDay]);

  return (
    <div className="position-relative w-100 rounded-4 overflow-hidden shadow-2xl border border-secondary border-opacity-25" style={{ height: '560px' }}>
      <div className="position-absolute bottom-0 end-0 p-3 pointer-events-none">
        <div className="glass-panel p-2 px-3 rounded-3 pointer-events-auto d-flex gap-4 align-items-center text-white">
          <div>
            <div className="text-secondary smaller text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Instant Generation</div>
            <div className="fs-5 fw-bold text-warning">{telemetry.solarYieldKw} <span className="small fs-6 fw-normal">kW</span></div>
          </div>
          <div className="border-start border-secondary border-opacity-50 ps-3">
            <div className="text-secondary smaller text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Solar Irradiance</div>
            <div className="fs-5 fw-bold text-info">{telemetry.irradiance} <span className="small fs-6 fw-normal">W/m²</span></div>
          </div>
          <div className="border-start border-secondary border-opacity-50 ps-3">
            <div className="text-secondary smaller text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>BESS Capacity</div>
            <div className="fs-5 fw-bold text-success">{telemetry.batterySoc}% <span className="small fs-6 fw-normal">SoC</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

