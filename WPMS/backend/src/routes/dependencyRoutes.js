function registerDependencyRoutes(router, controller, requireAuth, guards) {
    router.get(
        "/api/tasks/:taskId/dependencies",
        requireAuth(guards.task(controller.listDependencies))
    );

    router.post(
        "/api/tasks/:taskId/dependencies",
        requireAuth(guards.taskDependencyManage(controller.createDependency))
    );

    router.delete(
        "/api/tasks/:taskId/dependencies/:dependencyId",
        requireAuth(guards.taskDependencyManage(controller.deleteDependency))
    );
}

export default registerDependencyRoutes;
