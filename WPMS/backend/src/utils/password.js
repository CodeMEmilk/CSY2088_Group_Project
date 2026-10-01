import { randomBytes, scrypt as callback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(callback);
export async function hashPassword(password) {
 const salt = randomBytes(16).toString("hex");
 const hash = await scrypt(password, salt, 64);
 return `scrypt:${salt}:${hash.toString("hex")}`;
}
export async function verifyPassword(password, encoded) {
 if (typeof encoded !== "string") return false;
 const parts = encoded.split(":");
 if (parts.length !== 3 || parts[0] !== "scrypt" || !/^[a-f0-9]{32}$/.test(parts[1]) || !/^[a-f0-9]{128}$/.test(parts[2])) return false;
 const actual = Buffer.from(parts[2], "hex");
 const candidate = await scrypt(password, parts[1], actual.length);
 return timingSafeEqual(actual, candidate);
}
