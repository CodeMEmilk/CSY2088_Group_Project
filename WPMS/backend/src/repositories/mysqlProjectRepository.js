function createMySQLProjectRepository(pool) {
    async function findById(projectId) {
        const [rows] = await pool.execute(
            `
            SELECT
                project_id,
                name_title,
                description,
                start_date,
                deadline,
                created_by,
                created_at
            FROM Project
            WHERE project_id = ?
            LIMIT 1
            `,
            [projectId]
        );

        return rows[0] ?? null;
    }

    async function findActiveByUser(userId) {
        const [rows] = await pool.execute(
            `
            SELECT
                p.project_id,
                p.name_title,
                p.description,
                p.start_date,
                p.deadline,
                pm.role
            FROM Project p
            INNER JOIN Project_Member pm
                ON pm.project_id = p.project_id
            WHERE pm.user_id = ?
              AND pm.status = 'active'
            ORDER BY p.name_title ASC, p.project_id ASC
            `,
            [userId]
        );

        return rows;
    }

    return {
        findById,
        findActiveByUser
    };
}

export default createMySQLProjectRepository;