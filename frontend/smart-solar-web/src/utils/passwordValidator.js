// ============================================================================
// File: passwordValidator.js
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Initial client-side password validation utility.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

export const evaluatePassword = (password = '') => {
  const criteria = [
    {
      id: 'length',
      label: 'At least 8 characters',
      met: password.length >= 8,
    },
  ];

  const metCount = criteria.filter((c) => c.met).length;

  return {
    criteria,
    metCount,
    isStrong: metCount === criteria.length,
  };
};