const mongoose = require('mongoose');

/**
 * Middleware to validate that a route parameter is a valid MongoDB ObjectId.
 * Prevents CastError exceptions that leak stack traces.
 * Usage: router.get('/:id', validateObjectId('id'), ...)
 */
function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!value || !mongoose.Types.ObjectId.isValid(value)) {
      return res.status(400).json({ error: { message: `Invalid ${paramName}` } });
    }
    next();
  };
}

module.exports = { validateObjectId };
