
import AppError from "../core/errors/AppError.js";

function createProjectService(projectRepository) {
    async function getProjectById(projectId) {
        const project = await projectRepository.findById(
            projectId
        );

        if (!project) {
            throw new AppError("Project not found.", 404);
        }

        return project;
    }

    return {
        getProjectById
    };
}

export default createProjectService;
