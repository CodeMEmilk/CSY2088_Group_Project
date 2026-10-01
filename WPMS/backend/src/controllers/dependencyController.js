import AppError from "../core/errors/AppError.js";
import {getJsonBody} from "../core/http/request.js";
import {sendCreated, sendNoContent, sendSuccess} from "../core/http/response.js";

function createDependencyController(dependencyService) {
    async function listDependencies(request, response, context) {
        const dependencies = await dependencyService.listDependencies(context.params.taskId);
        sendSuccess(response, {dependencies});
    }

    async function createDependency(request, response, context) {
        const body = await getJsonBody(request);

        if (body.blocked_task_id === undefined) {
            throw new AppError("blocked_task_id is required.", 400);
        }

        const dependency = await dependencyService.createDependency(
            context.params.taskId,
            body.blocked_task_id
        );

        sendCreated(response, {dependency});
    }

    async function deleteDependency(request, response, context) {
        await dependencyService.deleteDependency(context.params.dependencyId);
        sendNoContent(response);
    }

    return {listDependencies, createDependency, deleteDependency};
}

export default createDependencyController;
