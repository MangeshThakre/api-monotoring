import ResponseFormatter from "../utils/ResponseFormatter.js";

const validate = (schema) => {
  return (req, res, next) => {
    if (!schema) {
      return next();
    }

    const errorsArr = [];
    const body = req.body;

    Object.entries(schema).forEach(([field, rule]) => {
      const value = body[field];

      // if required field is not present in the request body
      if (
        rule.required &&
        (value === undefined, value === "", value === null)
      ) {
        return errorsArr.push(`${field} is required`);
      }

      // validate min-length // eg: password  min-length should be 6
      if (
        rule.minLength &&
        typeof value === "string" &&
        value.length < rule.minLength
      ) {
        return errorsArr.push(
          `${field} min-length should be ${rule.minLength}`
        );
      }
    });
    // if error present in errors[] send error message will arr errors
    if (errorsArr.length > 0) {
      return res
        .status(400)
        .res(ResponseFormatter.error("validation failed", 400, errorsArr));
    }
    next();
  };
};

export default validate;
