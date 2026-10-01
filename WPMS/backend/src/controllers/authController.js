import {getJsonBody} from "../core/http/request.js";
import {sendCreated,sendSuccess,sendNoContent} from "../core/http/response.js";
export function createAuthController(auth,sessions) {
 const secure=process.env.NODE_ENV==="production";
 return {
  async register(req,res) { sendCreated(res,{user:await auth.register(await getJsonBody(req))}); },
  async login(req,res) {
   const result=await auth.login(await getJsonBody(req));
   res.setHeader("Set-Cookie",sessions.cookie(result.token,secure));
   res.setHeader("Cache-Control","no-store");
   sendSuccess(res,{user:result.user});
  },
  async me(req,res,ctx) { res.setHeader("Cache-Control","no-store"); sendSuccess(res,{user:await auth.me(ctx.userId)}); },
  async logout(req,res,ctx) {
   await sessions.destroy(ctx.sessionToken);
   res.setHeader("Set-Cookie",sessions.clearCookie(secure));
   sendNoContent(res);
  }
 };
}
