function registerNotificationRoutes(router, controller, requireAuth) {
    router.get(
        "/api/notifications",
        requireAuth(controller.listNotifications)
    );

    router.patch(
        "/api/notifications/:notificationId/read",
        requireAuth(controller.markRead)
    );
}

export default registerNotificationRoutes;
