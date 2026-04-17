/**
 * Role-Based Access Control Middleware
 */

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Admins only' });
};

const isAdminOrManager = (req, res, next) => {
  if (req.user && ['Admin', 'Manager'].includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Managers or Admins only' });
};

const isStaff = (req, res, next) => {
  if (req.user && ['Admin', 'Manager', 'Staff'].includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied' });
};

/**
 * Store-scoped data access: Manager sees only their store's data.
 * Admin sees all. Attaches storeFilter to req.
 */
const storeScope = (req, res, next) => {
  if (req.user.role === 'Manager' && req.user.storeId) {
    req.storeFilter = { storeId: req.user.storeId };
  } else if (req.user.role === 'Staff' && req.user.storeId) {
    req.storeFilter = { storeId: req.user.storeId };
  } else {
    req.storeFilter = {}; // Admin: no filter
  }
  next();
};

module.exports = { isAdmin, isAdminOrManager, isStaff, storeScope };
