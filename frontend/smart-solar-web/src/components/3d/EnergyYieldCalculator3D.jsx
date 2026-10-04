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


    </div>
  );
};

export default EnergyYieldCalculator3D;
