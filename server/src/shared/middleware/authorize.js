import ResponseFormatter from "../utils/ResponseFormatter.js";

const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    // every authenticated person have permission
    if (allowedRoles.length === 0) {
      next();
    }

    // user don't have permission
    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .res(ResponseFormatter.error("Insufficient permission", 403));
    }
    next();
  };
};

export default authorize;
