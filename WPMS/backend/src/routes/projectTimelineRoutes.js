function registerProjectTimelineRoutes(router, controller, requireAuth, guards) {
    router.get(
        "/api/projects/:projectId/timeline",
        requireAuth(
            guards.roadmap(controller.getTimeline)
        )
    );
}

export default registerProjectTimelineRoutes;
