import AppError from "../core/errors/AppError.js";
import {hashPassword,verifyPassword} from "../utils/password.js";
const publicUser = u => ({user_id:String(u.user_id),name:u.name,email:u.email,account_status:u.account_status,created_at:u.created_at});
export function createAuthService(users,sessions) {
 return {
  async register(input) {
   if (!input || typeof input !== "object" || Array.isArray(input)) throw new AppError("JSON object required",400);
   const {name,email,password} = input;
   if ([name,email,password].some(x=>typeof x!=="string")) throw new AppError("Name, email and password are required",400);
   const cleanName=name.trim(), cleanEmail=email.trim().toLowerCase();
   if (cleanName.length<2 || cleanName.length>150) throw new AppError("Name must be 2–150 characters",422);
   if (cleanEmail.length>255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new AppError("Invalid email",422);
   if (password.length<8 || password.length>128) throw new AppError("Password must be 8–128 characters",422);
   if (await users.findByEmail(cleanEmail)) throw new AppError("Email already registered",409);
   try { return publicUser(await users.createUser({name:cleanName,email:cleanEmail,password_hash:await hashPassword(password)})); }
   catch(e) { if (e.code==="ER_DUP_ENTRY") throw new AppError("Email already registered",409); throw e; }
  },
  async login(input) {
   const {email,password} = input && typeof input==="object" && !Array.isArray(input) ? input : {};
   if (typeof email!=="string" || typeof password!=="string") throw new AppError("Email and password required",400);
   const user=await users.findByEmail(email.trim().toLowerCase());
   if (!user || !(await verifyPassword(password,user.password_hash))) throw new AppError("Invalid credentials",401);
   if (user.account_status!=="active") throw new AppError("Account unavailable",403);
   return {user:publicUser(user),token:await sessions.create(user.user_id)};
  },
  async me(userId) {
   const user=await users.findById(userId);
   if (!user || user.account_status!=="active") throw new AppError("Unauthorized",401);
   return publicUser(user);
  }
 };
}
