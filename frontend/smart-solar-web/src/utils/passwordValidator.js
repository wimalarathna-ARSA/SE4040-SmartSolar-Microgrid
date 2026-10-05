// ============================================================================
// File: passwordValidator.js
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Client-side strong password strength evaluator utility (5 criteria).
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
// ============================================================================
// Client-side strong password validation utility.
// Checks 5 industry-standard criteria:
// 1. Min 8 characters
// 2. Uppercase letter (A-Z)
// 3. Lowercase letter (a-z)
// 4. Number (0-9)
// 5. Special character (!@#$%^&* etc.)
// ============================================================================

export const evaluatePassword = (password = '') => {
  const criteria = [
    { id: 'length', label: 'At least 8 characters', met: password.length >= 8 },
    { id: 'upper', label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { id: 'lower', label: 'One lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { id: 'number', label: 'One number (0-9)', met: /[0-9]/.test(password) },
    { id: 'special', label: 'One special symbol (!@#$%...)', met: /[^A-Za-z0-9]/.test(password) },
  ];

  const metCount = criteria.filter((c) => c.met).length;
  const isStrong = metCount === 5;

  let strengthLabel = '';
  let color = '#94a3b8';
  let percent = 0;

  if (password.length > 0) {
    if (metCount === 5) {
      strengthLabel = 'Strong';
      color = '#10b981'; // emerald green
      percent = 100;
    } else if (metCount >= 3) {
      strengthLabel = 'Medium';
      color = '#f59e0b'; // amber
      percent = 60;
    } else {
      strengthLabel = 'Weak';
      color = '#ef4444'; // red
      percent = 25;
    }
  }

  return {
    criteria,
    metCount,
    isStrong,
    strengthLabel,
    color,
    percent,
  };
};
