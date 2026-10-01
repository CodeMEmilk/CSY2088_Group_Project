function registerMyTasksRoutes(router, controller, requireAuth) {
    router.get(
        "/api/my-tasks",
        requireAuth(controller.list)
    );
}

export default registerMyTasksRoutes;
