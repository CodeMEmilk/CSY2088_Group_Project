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
}

export default registerProjectRoutes;