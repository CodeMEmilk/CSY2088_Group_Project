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

    async function getProjectsForUser(userId) {
        if (!userId) {
            throw new AppError(
                "Authentication required.",
                401
            );
        }

        return projectRepository.findActiveByUser(userId);
    }

    return {
        getProjectById,
        getProjectsForUser
    };
}

export default createProjectService;