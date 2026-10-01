import {sendSuccess} from "../core/http/response.js";

function createProjectTimelineController(service) {
    async function getTimeline(request, response, context) {
        const timeline = await service.getTimeline(context.params.projectId);
        sendSuccess(response, timeline);
    }

    return {getTimeline};
}

export default createProjectTimelineController;
