function registerAnalyticsRoutes(
    router,
    analyticsController
) {
    router.get(
        "/api/analytics/me",
        analyticsController.getMyQuarter
    );

    router.get(
        "/api/analytics/me/quarterly",
        analyticsController.getMyQuarter
    );

    router.get(
        "/api/projects/:projectId/analytics/quarterly",
        analyticsController.getProjectQuarter
    );
}

export default registerAnalyticsRoutes;