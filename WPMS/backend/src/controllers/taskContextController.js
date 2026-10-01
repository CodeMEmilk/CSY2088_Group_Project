import {getJsonBody} from "../core/http/request.js";
import {sendCreated, sendNoContent, sendSuccess} from "../core/http/response.js";

function createTaskContextController(taskContextService) {
    async function getContext(request, response, context) {
        const taskContext = await taskContextService.getContext(context.params.taskId);
        sendSuccess(response, taskContext);
    }

    async function listChecklist(request, response, context) {
        const checklist = await taskContextService.listChecklist(context.params.taskId);
        sendSuccess(response, {checklist});
    }

    async function createChecklistItem(request, response, context) {
        const criterion = await taskContextService.createChecklistItem(
            context.params.taskId,
            await getJsonBody(request)
        );

        sendCreated(response, {criterion});
    }

    async function updateChecklistItem(request, response, context) {
        const criterion = await taskContextService.updateChecklistItem(
            context.params.criterionId,
            await getJsonBody(request)
        );

        sendSuccess(response, {criterion});
    }

    async function deleteChecklistItem(request, response, context) {
        await taskContextService.deleteChecklistItem(context.params.criterionId);
        sendNoContent(response);
    }

    async function listComments(request, response, context) {
        const comments = await taskContextService.listComments(context.params.taskId);
        sendSuccess(response, {comments});
    }

    async function createComment(request, response, context) {
        const comment = await taskContextService.createComment(
            context.params.taskId,
            context.userId,
            await getJsonBody(request)
        );

        sendCreated(response, {comment});
    }

    async function updateComment(request, response, context) {
        const comment = await taskContextService.updateComment(
            context.params.commentId,
            await getJsonBody(request)
        );

        sendSuccess(response, {comment});
    }

    async function deleteComment(request, response, context) {
        await taskContextService.deleteComment(context.params.commentId);
        sendNoContent(response);
    }

    return {
        getContext,
        listChecklist,
        createChecklistItem,
        updateChecklistItem,
        deleteChecklistItem,
        listComments,
        createComment,
        updateComment,
        deleteComment
    };
}

export default createTaskContextController;
