import {sendSuccess} from "../core/http/response.js";

function createWorkloadController(service) {
    async function getMyWorkload(request, response, context) {
        sendSuccess(response, {
            workload: await service.getMyWorkload(
                context.userId,
                context.query?.capacity_hours
            )
        });
    }

    return {getMyWorkload};
}

export default createWorkloadController;
