/**
 * Calculates whether a Combo Package is active, expiring soon, or expired/inactive.
 * 
 * Criteria:
 * - If pkg.is_active is explicitly false -> Inactive (Manual)
 * - Expiry Date calculation:
 *   - If pkg.valid_until is specified (YYYY-MM-DD), expiryDate = valid_until (end of day).
 *   - Else if pkg.created_at and pkg.validity_days are present, expiryDate = created_at + (validity_days * 24h).
 * - If current date > expiryDate -> Expired & Inactive
 */
export const getPackageExpirationStatus = (pkg) => {
  if (!pkg) {
    return { isExpired: true, isInactive: true, label: 'Inactive', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
  }

  if (pkg.is_active === false) {
    return { isExpired: false, isInactive: true, label: 'Inactive (Manual)', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
  }

  let expiryDate = null;

  // 1. Explicit valid_until date
  if (pkg.valid_until) {
    const parsedDate = new Date(pkg.valid_until);
    if (!isNaN(parsedDate.getTime())) {
      expiryDate = new Date(parsedDate);
      expiryDate.setHours(23, 59, 59, 999);
    }
  }

  // 2. Fallback to created_at + validity_days (default 30 days if not set)
  if (!expiryDate && pkg.validity_days) {
    const createdDate = pkg.created_at ? new Date(pkg.created_at) : new Date();
    if (!isNaN(createdDate.getTime())) {
      expiryDate = new Date(createdDate.getTime() + (parseInt(pkg.validity_days || 30) * 24 * 60 * 60 * 1000));
    }
  }

  if (expiryDate && !isNaN(expiryDate.getTime())) {
    const now = new Date();
    if (now > expiryDate) {
      return { 
        isExpired: true, 
        isInactive: true, 
        label: 'Expired & Inactive', 
        color: '#ef4444', 
        bg: 'rgba(239, 68, 68, 0.18)',
        expiryDate 
      };
    }
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) {
      return { 
        isExpired: false, 
        isInactive: false, 
        label: `Expiring soon (${diffDays}d left)`, 
        color: '#f59e0b', 
        bg: 'rgba(245, 158, 11, 0.18)',
        remainingDays: diffDays,
        expiryDate
      };
    }
    return { 
      isExpired: false, 
      isInactive: false, 
      label: `Active (${diffDays}d valid)`, 
      color: '#3b82f6', 
      bg: 'rgba(37, 99, 235, 0.15)',
      remainingDays: diffDays,
      expiryDate
    };
  }

  return { isExpired: false, isInactive: false, label: 'Active', color: '#3b82f6', bg: 'rgba(37, 99, 235, 0.15)' };
};
