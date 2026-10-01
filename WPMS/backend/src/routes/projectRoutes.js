function registerProjectRoutes(
    router,
    projectController,
    requireAuth,
    guards
) {
    router.get(
        "/api/projects/:projectId",
        requireAuth(
            guards.roadmap(projectController.getProject)
        )
    );

    router.get(
        "/api/my-projects",
        requireAuth(
            projectController.getMyProjects
        )
    );
}

export default registerProjectRoutes;