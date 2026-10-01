import {sendSuccess} from "../core/http/response.js";

function createMyTasksController(service) {
    async function list(request, response, context) {
        const tasks = await service.list(context.userId);
        sendSuccess(response, {tasks});
    }

    return {list};
}

export default createMyTasksController;
