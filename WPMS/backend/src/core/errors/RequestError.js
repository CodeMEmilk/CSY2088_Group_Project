import AppError from "./AppError.js";

class RequestError extends AppError {
    constructor(message, statusCode = 400, details = null) {
        super(message, statusCode, details);
        this.name = "RequestError";
    }
}

export default RequestError;