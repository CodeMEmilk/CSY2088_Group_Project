function registerTaskSlaRoutes(router, controller, requireAuth, guards) {
    router.get(
        "/api/tasks/:taskId/sla",
        requireAuth(guards.task(controller.getTaskSla))
    );
}

export default registerTaskSlaRoutes;
