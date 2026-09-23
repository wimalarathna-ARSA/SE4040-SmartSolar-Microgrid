// ============================================================================
// File: PasswordStrengthIndicator.jsx
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Live visual password strength meter with progress bar.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

import React from 'react';
import { evaluatePassword } from '../utils/passwordValidator';

const PasswordStrengthIndicator = ({ password = '' }) => {
  if (!password) return null;

  const { strengthLabel, color, percent } = evaluatePassword(password);

  return (
    <div
      style={{
        marginTop: '8px',
        marginBottom: '14px',
        padding: '12px 14px',
        borderRadius: '10px',
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
        <span style={{ fontWeight: 600 }}>
          Strength:{' '}
          <span style={{ color: color, fontWeight: 800 }}>
            {strengthLabel}
          </span>
        </span>

        <span style={{ fontSize: '0.75rem' }}>
          {percent}%
        </span>
      </div>

      <div
        style={{
          width: '100%',
          height: '6px',
          background: '#e2e8f0',
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
    </div>
  );
};

export default PasswordStrengthIndicator;