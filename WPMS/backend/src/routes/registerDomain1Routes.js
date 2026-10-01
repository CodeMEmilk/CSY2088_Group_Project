export function registerDomain1Routes(router,{authController,membershipController,requireAuth,guards}) {
 router.post("/api/auth/register",authController.register);
 router.post("/api/auth/login",authController.login);
 router.get("/api/auth/me",requireAuth(authController.me));
 router.post("/api/auth/logout",requireAuth(authController.logout));
 router.post("/api/projects/:projectId/members",requireAuth(guards.manageMembers(membershipController.add)));
 // Protect your existing GET /api/projects/:projectId with:
 // router.get("/api/projects/:projectId",requireAuth(guards.roadmap(projectController.getProject)));
 // Protect a future GET /api/tasks/:taskId with:
 // router.get("/api/tasks/:taskId",requireAuth(guards.task(taskController.getTask)));
}
