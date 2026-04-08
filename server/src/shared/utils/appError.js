class AppError extends Error {
  constructor(message, statusCode, error = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // mark as operational error
    Error.captureStackTrace(this, this.constructor);
  }
}
export default AppError;
