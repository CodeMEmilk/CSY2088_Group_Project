
import AppError from "./AppError.js";

class RequestError extends AppError {
    constructor(message, details = null) {
        super(message, 400, details);

        this.name = "RequestError";
    }
}

export default RequestError;
