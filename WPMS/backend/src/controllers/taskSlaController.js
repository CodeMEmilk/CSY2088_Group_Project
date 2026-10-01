import {sendSuccess} from "../core/http/response.js";

function createTaskSlaController(service) {
    async function getTaskSla(request, response, context) {
        sendSuccess(response, {
            sla: await service.getTaskSla(context.params.taskId)
        });
    }

    return {getTaskSla};
}

export default createTaskSlaController;
