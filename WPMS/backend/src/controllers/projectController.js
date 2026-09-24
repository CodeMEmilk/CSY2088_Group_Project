
import AppError from "../core/errors/AppError.js";
import { sendSuccess } from "../core/http/response.js";

function createProjectController(projectService) {
    async function getProject(request, response, context) {
        const rawId = context.params.projectId;

        if (!/^[1-9]\d*$/.test(rawId)) {
            throw new AppError(
                "Project ID must be a positive integer.",
                400
            );
        }

        const projectId = Number(rawId);

        if (!Number.isSafeInteger(projectId)) {
            throw new AppError(
                "Project ID is outside the supported range.",
                400
            );
        }

        const project = await projectService.getProjectById(
            projectId
        );

        sendSuccess(response, {
            project
        });
    }

    return {
        getProject
    };
}

export default createProjectController;
