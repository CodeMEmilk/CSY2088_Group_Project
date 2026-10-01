function registerAuthRoutes(router, authController) {
    router.post(
        "/api/auth/register",
        authController.register
    );
}

export default registerAuthRoutes;