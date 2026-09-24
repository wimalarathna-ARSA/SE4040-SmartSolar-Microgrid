// ============================================================================
// File: PasswordStrengthIndicator.jsx
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Live password strength meter with progress bar and checklist.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React from 'react';
import { evaluatePassword } from '../utils/passwordValidator';

const PasswordStrengthIndicator = ({
  password = '',
  isDark = false
}) => {
  if (!password) return null;

  const { criteria, strengthLabel, color, percent } =
    evaluatePassword(password);

  const textColor = isDark ? '#e2e8f0' : '#334155';
  const mutedText = isDark ? '#94a3b8' : '#64748b';
  const boxBg = isDark
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(241, 245, 249, 0.85)';
  const boxBorder = isDark
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(226, 232, 240, 0.9)';

  return (
    <div
      style={{
        marginTop: '8px',
        marginBottom: '14px',
        padding: '12px 14px',
        borderRadius: '10px',
        background: boxBg,
        border: `1px solid ${boxBorder}`,
        fontSize: '0.82rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
        }}
      >
        <span style={{ fontWeight: 600, color: textColor }}>
          Strength:{' '}
          <span style={{ color: color, fontWeight: 800 }}>
            {strengthLabel}
          </span>
        </span>

        <span style={{ fontSize: '0.75rem', color: mutedText }}>
          {percent}%
        </span>
      </div>

      <div
        style={{
          width: '100%',
          height: '6px',
          background: isDark
            ? 'rgba(255,255,255,0.1)'
            : '#e2e8f0',
          borderRadius: '999px',
          overflow: 'hidden',
          marginBottom: '10px',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            background: color,
            transition: 'width 0.3s ease, background 0.3s ease',
          }}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '4px',
        }}
      >
        {criteria.map((c) => (
          <div
            key={c.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.74rem',
              color: c.met ? '#10b981' : mutedText,
              fontWeight: c.met ? 600 : 400,
              transition: 'color 0.2s ease',
            }}
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