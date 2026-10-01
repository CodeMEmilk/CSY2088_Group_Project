function registerAttachmentRoutes(router, controller, requireAuth, guards) {
    router.get(
        "/api/tasks/:taskId/attachments",
        requireAuth(guards.task(controller.listAttachments))
    );

    router.post(
        "/api/tasks/:taskId/attachments",
        requireAuth(guards.taskAttachmentCreate(controller.createAttachment))
    );

    router.get(
        "/api/tasks/:taskId/attachments/:attachmentId/download",
        requireAuth(guards.taskAttachment(controller.downloadAttachment))
    );

    router.delete(
        "/api/tasks/:taskId/attachments/:attachmentId",
        requireAuth(guards.taskAttachmentDelete(controller.deleteAttachment))
    );
}

export default registerAttachmentRoutes;
