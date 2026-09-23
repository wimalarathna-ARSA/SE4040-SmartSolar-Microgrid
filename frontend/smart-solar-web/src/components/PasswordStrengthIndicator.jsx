// ============================================================================
// File: PasswordStrengthIndicator.jsx
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Reusable live password strength indicator component.
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
    </div>
  );
};

export default PasswordStrengthIndicator;