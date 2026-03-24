// response utility: shared helper functions used by controllers/routes.
const TECHNICAL_ERROR_PATTERNS = [
  /SQLITE_/i,
  /constraint failed/i,
  /database is locked/i,
  /joi/i
];

const normalizeErrorDetail = (statusCode, error) => {
  if (!error) return null;
  const detail = String(error);

  if (statusCode >= 500) {
    if (/database is locked|SQLITE_BUSY/i.test(detail)) {
      return 'The system is busy right now. Please try again.';
    }

    if (TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(detail))) {
      return 'An internal error occurred while processing the request.';
    }
  }

  return detail;
};

export const sendSuccess = (res, statusCode, message, data = null) =>
  res.status(statusCode).json({
    success: true,
    message,
    data
  });

export const sendError = (res, statusCode, message, error = null) =>
  res.status(statusCode).json({
    success: false,
    message,
    error: normalizeErrorDetail(statusCode, error)
  });
