import {randomBytes,createHash} from "node:crypto";
const COOKIE = "wpms_session";
const TTL_SECONDS = 60*60*8;
const hashToken = token => createHash("sha256").update(token).digest("hex");
export function createSessionManager(repository) {
 return {
  async create(userId) {
   const token = randomBytes(32).toString("hex");
   const expiry = new Date(Date.now()+TTL_SECONDS*1000).toISOString().slice(0,19).replace("T"," ");
   await repository.create(hashToken(token),userId,expiry);
   return token;
  },
  async lookup(token) {
   if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return null;
   return repository.find(hashToken(token));
  },
  async destroy(token) {
   if (typeof token === "string" && /^[a-f0-9]{64}$/.test(token)) await repository.remove(hashToken(token));
  },
  readCookie(request) {
   const cookie = request.headers.cookie ?? "";
   const match = cookie.split(";").map(x=>x.trim()).find(x=>x.startsWith(COOKIE+"="));
   return match?.slice(COOKIE.length+1) ?? null;
  },
  cookie(token,secure) { return `${COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${TTL_SECONDS}${secure?"; Secure":""}`; },
  clearCookie(secure) { return `${COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure?"; Secure":""}`; }
 };
}
