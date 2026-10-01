export function createMembershipRepository(pool) {
 return {
  async findByProjectAndUser(projectId,userId) {
   const [rows] = await pool.execute("SELECT project_id,user_id,role,status FROM Project_Member WHERE project_id = ? AND user_id = ? LIMIT 1",[projectId,userId]);
   return rows[0] ?? null;
  },
  async add(projectId,userId,role) {
   await pool.execute("CALL AddProjectMember(?,?,?)",[projectId,userId,role]);
  },
  async findActiveByProjectAndUser(projectId,userId) {
   const [rows] = await pool.execute(
    "SELECT project_id,user_id,role,status FROM Project_Member WHERE project_id = ? AND user_id = ? AND status = 'active' LIMIT 1",
    [projectId,userId]
   );
   return rows[0] ?? null;
  }
 };
}
