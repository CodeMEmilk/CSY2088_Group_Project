
const projects = [
    {
        project_id: 1,
        name_title: "Website Redesign",
        description: "Redesign the company website",
        start_date: "2026-09-01",
        deadline: "2026-11-30",
        created_by: 1
    },
    {
        project_id: 2,
        name_title: "Inventory Management System",
        description: "Develop an inventory tracking application",
        start_date: "2026-09-10",
        deadline: "2026-12-15",
        created_by: 2
    }
];

async function findById(projectId) {
    return projects.find(
        project => project.project_id === projectId
    ) ?? null;
}

export {
    findById
};
