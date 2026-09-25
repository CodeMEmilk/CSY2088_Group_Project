
function registerProjectRoutes(router, projectController) {
    router.get(
        "/api/projects/:projectId",
        projectController.getProject
    );
}

export default registerProjectRoutes;
