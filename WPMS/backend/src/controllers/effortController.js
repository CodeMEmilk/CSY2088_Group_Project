import {sendSuccess} from "../core/http/response.js";

function createEffortController(service) {
    async function getTaskEffort(request, response, context) {
        sendSuccess(response, {
            effort: await service.getTaskEffort(context.params.taskId)
        });
    }

    return {getTaskEffort};
}

export default createEffortController;
