function registerTimeLogRoutes(router, controller, requireAuth, guards) {
    router.get(
        "/api/tasks/:taskId/time-logs",
        requireAuth(guards.task(controller.list))
    );

    router.post(
        "/api/tasks/:taskId/time-logs/start",
        requireAuth(guards.task(controller.start))
    );

    router.post(
        "/api/tasks/:taskId/time-logs/manual",
        requireAuth(guards.task(controller.manual))
    );

    router.post(
        "/api/tasks/:taskId/time-logs/stop",
        requireAuth(guards.task(controller.stop))
    );
}

export default registerTimeLogRoutes;
