import {createUserRepository} from "./repositories/mysqlUserRepository.js";
import {createSessionRepository} from "./repositories/mysqlSessionRepository.js";
import {createMembershipRepository} from "./repositories/mysqlMembershipRepository.js";
import {createTaskRepository} from "./repositories/mysqlTaskRepository.js";
import {createSessionManager} from "./sessions/sessionManager.js";
import {createAuthService} from "./services/authService.js";
import {createAuthController} from "./controllers/authController.js";
import {createMembershipController} from "./controllers/membershipController.js";
import {createRequireAuth} from "./middleware/requireAuth.js";
import {createProjectGuards} from "./middleware/requireProjectAccess.js";
import {registerDomain1Routes} from "./routes/registerDomain1Routes.js";
export function setupDomain1(router, {pool} = {}) {
 if (!pool) throw new Error("Database pool is required.");
 const users=createUserRepository(pool);
 const sessions=createSessionManager(createSessionRepository(pool));
 const memberships=createMembershipRepository(pool);
 const tasks=createTaskRepository(pool);
 const auth=createAuthService(users,sessions);
 const authController=createAuthController(auth,sessions);
 const membershipController=createMembershipController(users,memberships);
 const requireAuth=createRequireAuth(sessions,users);
 const guards=createProjectGuards(memberships,tasks);
 registerDomain1Routes(router,{authController,membershipController,requireAuth,guards});
 return {requireAuth,guards,memberships};
}
