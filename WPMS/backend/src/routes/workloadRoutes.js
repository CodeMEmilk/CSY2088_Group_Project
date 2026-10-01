function registerWorkloadRoutes(router, controller, requireAuth) {
    router.get(
        "/api/my-workload",
        requireAuth(controller.getMyWorkload)
    );
}

export default registerWorkloadRoutes;
