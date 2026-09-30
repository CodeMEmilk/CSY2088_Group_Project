export function createUserRepository(pool) {
 return {
  async findByEmail(email) {
   const [rows] = await pool.execute("SELECT * FROM `User` WHERE email = ? LIMIT 1", [email]);
   return rows[0] ?? null;
  },
  async findById(id) {
   const [rows] = await pool.execute("SELECT * FROM `User` WHERE user_id = ? LIMIT 1", [id]);
   return rows[0] ?? null;
  },
  async createUser({name,email,password_hash}) {
   const [result] = await pool.execute("INSERT INTO `User` (name,email,password_hash) VALUES (?,?,?)", [name,email,password_hash]);
   const [rows] = await pool.execute("SELECT * FROM `User` WHERE user_id = ?", [result.insertId]);
   return rows[0];
  }
 };
}
