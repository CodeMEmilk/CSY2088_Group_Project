import AppError from "../core/errors/AppError.js";
import {getJsonBody} from "../core/http/request.js";
import {sendCreated, sendSuccess} from "../core/http/response.js";

function createTimeLogController(service) {
    async function list(request, response, context) {
        sendSuccess(response, {time_logs: await service.list(context.params.taskId)});
    }

    async function start(request, response, context) {
        const timeLog = await service.start(context.params.taskId, context.userId);
        sendCreated(response, {time_log: timeLog});
    }

    async function stop(request, response, context) {
        const body = await getJsonBody(request);
        if (!Object.prototype.hasOwnProperty.call(body, "time_log_id")) {
            throw new AppError("time_log_id is required.", 400);
        }
        const timeLog = await service.stop(context.params.taskId, body.time_log_id, context.userId);
        sendSuccess(response, {time_log: timeLog});
    }

    async function manual(request, response, context) {
        const timeLog = await service.createManual(
            context.params.taskId,
            context.userId,
            await getJsonBody(request)
        );
        sendCreated(response, {time_log: timeLog});
    }

    return {list, start, stop, manual};
}

export default createTimeLogController;
