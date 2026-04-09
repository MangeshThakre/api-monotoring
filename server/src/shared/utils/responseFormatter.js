class ResponseFormatter {
  static success(data, message = "success", statusCode = 200) {
    return {
      success: true,
      message,
      data,
      statusCode,
      TimeStamp: new Date().toISOString()
    };
  }

  static error(message = "success", statusCode = 500, error = null) {
    return {
      success: false,
      message,
      error,
      statusCode,
      TimeStamp: new Date().toISOString()
    };
  }

  static validationError(error = null) {
    return {
      success: false,
      message: "validation error",
      error,
      statusCode: 400,
      TimeStamp: new Date().toISOString()
    };
  }
  static paginated(data = null, page = null, limit = null, total = null) {
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: limit ? Math.ceil(total / limit) : null
      },
      TimeStamp: new Date().toISOString()
    };
  }
}

export default ResponseFormatter;
