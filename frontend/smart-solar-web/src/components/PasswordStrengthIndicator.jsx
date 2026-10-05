// ============================================================================
// File: PasswordStrengthIndicator.jsx
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// File: PasswordStrengthIndicator.jsx
// Description: Live visual password strength meter with checklist. (All business logic centralized in API)
// ============================================================================

import React from 'react';
import { evaluatePassword } from '../utils/passwordValidator';

const PasswordStrengthIndicator = ({ password = '', isDark = false }) => {
  if (!password) return null;

  const { criteria, strengthLabel, color, percent } = evaluatePassword(password);

  const strengthText = color === '#10b981' ? 'text-[#10b981]' : color === '#f59e0b' ? 'text-[#f59e0b]' : color === '#ef4444' ? 'text-danger' : 'text-secondary';
  const barBg = color === '#10b981' ? 'bg-[#10b981]' : color === '#f59e0b' ? 'bg-[#f59e0b]' : color === '#ef4444' ? 'bg-danger' : 'bg-secondary';
  const barWidth = percent >= 100 ? 'w-100' : percent >= 60 ? 'w-[60%]' : 'w-[25%]';

  const boxClasses = isDark
    ? 'bg-white/5 border-white/10 text-[0.82rem]'
    : 'bg-slate-100/85 border-slate-200 text-[0.82rem]';
  const labelClasses = isDark ? 'text-[#e2e8f0]' : 'text-slate-700';
  const mutedClasses = isDark ? 'text-[#94a3b8]' : 'text-slate-500';
  const trackClasses = isDark ? 'bg-white/10' : 'bg-slate-200';

  return (
    <div className={`mt-[8px] mb-[14px] px-[14px] py-[12px] rounded-[10px] border ${boxClasses}`}>
      {/* Strength Bar & Label */}
      <div className="d-flex justify-content-between align-items-center mb-[6px]">
        <span className={`fw-semibold ${labelClasses}`}>
          Strength: <span className={`fw-extrabold ${strengthText}`}>{strengthLabel}</span>
        </span>
        <span className={`text-[0.75rem] ${mutedClasses}`}>{percent}%</span>
      </div>

      <div className={`progress w-100 h-[6px] rounded-full overflow-hidden mb-[10px] ${trackClasses}`} role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100">
        <div
          className={`progress-bar transition-all duration-300 h-100 ${barBg} ${barWidth}`}
        />
      </div>

      {/* Criteria Checklist */}
      <div className="grid grid-cols-2 gap-[4px] sm:grid-cols-2">
        {criteria.map((c) => (
          <div
            key={c.id}
            className={`d-flex align-items-center gap-[6px] text-[0.74rem] transition ${c.met ? 'text-[#10b981] fw-semibold' : mutedClasses + ' fw-normal'}`}
          >
            <span>{c.met ? '✓' : '○'}</span>
            <span>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
