
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

    return {
        findById
    };
}

export default createMySQLProjectRepository;
