import AppError from "../core/errors/AppError.js";
import {getJsonBody} from "../core/http/request.js";
import {sendCreated, sendNoContent, sendSuccess} from "../core/http/response.js";
import {canApproveTask} from "../policies/projectPolicy.js";

function createTaskController(taskService) {
    async function getTask(request, response, context) {
        const task = context.task ?? await taskService.getTaskById(context.params.taskId);
        sendSuccess(response, {task});
    }

    async function createTask(request, response, context) {
        const task = await taskService.createTask(
            context.params.projectId,
            await getJsonBody(request)
        );

        sendCreated(response, {task});
    }

    async function updateTask(request, response, context) {
        const task = await taskService.updateTask(
            context.params.taskId,
            await getJsonBody(request)
        );

        sendSuccess(response, {task});
    }

    async function assignTask(request, response, context) {
        const body = await getJsonBody(request);

        if (!Object.prototype.hasOwnProperty.call(body, "assigned_to")) {
            throw new AppError("assigned_to is required.", 400);
        }

        const task = await taskService.assignTask(
            context.params.taskId,
            body.assigned_to
        );

        sendSuccess(response, {task});
    }

    async function updateStatus(request, response, context) {
        const body = await getJsonBody(request);

        if (typeof body.status !== "string") {
            throw new AppError("status is required.", 400);
        }

        if (
            context.task?.status === "waiting_approval"
            && body.status === "done"
            && !canApproveTask(context.membership)
        ) {
            throw new AppError("Only project managers can approve a task.", 403);
        }

        const task = await taskService.transitionTask(
            context.params.taskId,
            body.status
        );

        sendSuccess(response, {task});
    }

    async function deleteTask(request, response, context) {
        await taskService.deleteTask(context.params.taskId);
        sendNoContent(response);
    }

    return {
        getTask,
        createTask,
        updateTask,
        assignTask,
        updateStatus,
        deleteTask
    };
}

export default createTaskController;
