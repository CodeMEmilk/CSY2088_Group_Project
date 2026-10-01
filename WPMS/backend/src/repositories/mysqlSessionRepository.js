export function createSessionRepository(pool) {
 return {
  async create(hash,userId,expiresAt) {
   await pool.execute("INSERT INTO User_Session(session_hash,user_id,expires_at) VALUES (?,?,?)",[hash,userId,expiresAt]);
  },
  async find(hash) {
   const [rows] = await pool.execute("SELECT user_id, expires_at FROM User_Session WHERE session_hash = ? AND expires_at > UTC_TIMESTAMP() LIMIT 1",[hash]);
   return rows[0] ?? null;
  },
  async remove(hash) { await pool.execute("DELETE FROM User_Session WHERE session_hash = ?",[hash]); }
 };
}
