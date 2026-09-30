function registerTaskRoutes(
    router,
    taskController,
    requireAuth,
    guards
) {
    router.post(
        "/api/projects/:projectId/tasks",
        requireAuth(
            guards.projectTaskManage(taskController.createTask)
        )
    );

    router.get(
        "/api/tasks/:taskId",
        requireAuth(
            guards.task(taskController.getTask)
        )
    );

    router.patch(
        "/api/tasks/:taskId",
        requireAuth(
            guards.taskManage(taskController.updateTask)
        )
    );

    router.patch(
        "/api/tasks/:taskId/assignee",
        requireAuth(
            guards.taskManage(taskController.assignTask)
        )
    );

    router.patch(
        "/api/tasks/:taskId/status",
        requireAuth(
            guards.taskStatus(taskController.updateStatus)
        )
    );

    router.delete(
        "/api/tasks/:taskId",
        requireAuth(
            guards.taskManage(taskController.deleteTask)
        )
    );
}

export default registerTaskRoutes;
