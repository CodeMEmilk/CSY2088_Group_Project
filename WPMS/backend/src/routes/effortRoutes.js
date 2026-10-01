function registerEffortRoutes(router, controller, requireAuth, guards) {
    router.get(
        "/api/tasks/:taskId/effort",
        requireAuth(guards.task(controller.getTaskEffort))
    );
}

export default registerEffortRoutes;
