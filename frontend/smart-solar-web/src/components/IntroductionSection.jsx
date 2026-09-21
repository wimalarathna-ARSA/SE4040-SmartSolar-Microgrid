import React from 'react';

const IntroductionSection = () => {
  return (
    <section id="introduction" className="position-relative py-5 px-3">
      <div className="container-fluid px-lg-5 px-3">
        <div className="mx-auto text-dark position-relative">
          {/* Top Half: Eyebrow, Main Headline & Narrative */}
          <div className="row g-4 align-items-start mb-4 pb-2">
            <div className="col-lg-6 col-md-12">
              <div className="text-uppercase fw-bold mb-3">
                INTRODUCTION
              </div>
              <h2 className="fw-bold mb-0">
                Orchestrate complex setups of distributed energy resources <span>with ease.</span>
              </h2>
            </div>

            <div className="col-lg-6 col-md-12 ps-lg-4">
              <p>
                Managing DERs like rooftop photovoltaic arrays, high-capacity BESS battery storage, EV charging slots, and prosumer nodes is key for the future of energy.
              </p>
              <p className="fw-bold">
                We enable you to run these challenging setups.
              </p>
              <p>
                These island microgrids can be operated by AI-accelerated dispatch engines and our enterprise platform whilst connected to provincial energy markets for risk diversification, significant tariff savings, and maximum grid stability.
              </p>
              <a href="#digital-twin" className="d-inline-flex align-items-center gap-1 fw-semibold text-decoration-none">
                Explore 3D digital twin below to find out more <span>↓</span>
              </a>
            </div>
          </div>

          {/* Bottom Half: 3 Columns - Manage, Store, Trade */}
          <div className="row g-4 pt-3 border-top">
            <div className="col-lg-4 col-md-12">
              <h3 className="fw-bold mb-0 fs-5">Manage</h3>
              <div className="fw-bold mb-2">Actively manage and customize local energy systems.</div>
              <p>Implement decentralized energy resources that utilize real-time data analysis and intelligent algorithms for optimized energy efficiency and savings.</p>
              <p>Enhance energy resilience through local power generation and distributed grid node orchestration across Sri Lankan provinces.</p>
            </div>

            <div className="col-lg-4 col-md-12">
              <h3 className="fw-bold mb-0 fs-5">Store</h3>
              <div className="fw-bold mb-2">Capture and store excess energy to maximize the utilization of renewable power sources.</div>
              <p>Leverage dynamic BESS container storage to reduce dependence on expensive peak-hour grid consumption and peak tariff surcharges.</p>
              <p>Take advantage of storage capacities to schedule prosumer battery slots during low-price windows while avoiding sell-offs at low prices.</p>
            </div>

            <div className="col-lg-4 col-md-12">
              <h3 className="fw-bold mb-0 fs-5">Trade</h3>
              <div className="fw-bold mb-2">Connect microgrids to various energy markets.</div>
              <p>Enable power trading, balancing energy for grid stability, and offering demand response capabilities via cryptographically verified QR tokens.</p>
              <p>Foresee and dynamically respond to price changes, weather conditions, and prosumer demand spikes in real-time.</p>
              <p>Foster more efficient and flexible energy procurement strategies for both prosumers and grid operators.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntroductionSection;