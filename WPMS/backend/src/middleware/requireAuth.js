import AppError from "../core/errors/AppError.js";
export function createRequireAuth(sessions,users) {
 return handler => async (request,response,context) => {
  const token=sessions.readCookie(request);
  const session=await sessions.lookup(token);
  if (!session) throw new AppError("Authentication required",401);
  const user=await users.findById(session.user_id);
  if (!user || user.account_status!=="active") throw new AppError("Authentication required",401);
  return handler(request,response,{...context,userId:String(user.user_id),sessionToken:token});
 };
}
