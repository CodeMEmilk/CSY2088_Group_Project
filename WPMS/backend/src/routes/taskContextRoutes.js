function registerTaskContextRoutes(
    router,
    controller,
    requireAuth,
    guards
) {
    router.get(
        "/api/tasks/:taskId/context",
        requireAuth(guards.task(controller.getContext))
    );

    router.get(
        "/api/tasks/:taskId/checklist",
        requireAuth(guards.task(controller.listChecklist))
    );

    router.post(
        "/api/tasks/:taskId/checklist",
        requireAuth(guards.taskChecklistManage(controller.createChecklistItem))
    );

    router.patch(
        "/api/tasks/:taskId/checklist/:criterionId",
        requireAuth(guards.taskChecklistUpdate(controller.updateChecklistItem))
    );

    router.delete(
        "/api/tasks/:taskId/checklist/:criterionId",
        requireAuth(guards.taskChecklistManage(controller.deleteChecklistItem))
    );

    router.get(
        "/api/tasks/:taskId/comments",
        requireAuth(guards.task(controller.listComments))
    );

    router.post(
        "/api/tasks/:taskId/comments",
        requireAuth(guards.task(controller.createComment))
    );

    router.patch(
        "/api/tasks/:taskId/comments/:commentId",
        requireAuth(guards.taskCommentEdit(controller.updateComment))
    );

    router.delete(
        "/api/tasks/:taskId/comments/:commentId",
        requireAuth(guards.taskCommentDelete(controller.deleteComment))
    );
}

export default registerTaskContextRoutes;
