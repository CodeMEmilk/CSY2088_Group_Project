import AppError from "../core/errors/AppError.js";
import {getJsonBody} from "../core/http/request.js";
import {sendCreated} from "../core/http/response.js";
export function createMembershipController(users,memberships) {
 return {
  async add(req,res,ctx) {
   const {email,role}=await getJsonBody(req);
   if (typeof email!=="string" || !["LEAD","ENGINEER","CONTRACTOR"].includes(role)) throw new AppError("Valid email and role required",422);
   const user=await users.findByEmail(email.trim().toLowerCase());
   if (!user || user.account_status!=="active") throw new AppError("Eligible user not found",404);
   try { await memberships.add(ctx.params.projectId,user.user_id,role); }
   catch(e) { if (e.code==="ER_DUP_ENTRY" || e.sqlState==="45000") throw new AppError("User already belongs to this project",409); throw e; }
   sendCreated(res,{project_id:ctx.params.projectId,user_id:String(user.user_id),role});
  }
 };
}
