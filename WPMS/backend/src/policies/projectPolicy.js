export const ROLES = Object.freeze({
    LEAD: "LEAD",
    ENGINEER: "ENGINEER",
    CONTRACTOR: "CONTRACTOR"
});

export function isActive(m) {
    return m?.status === "active";
}

export function canViewRoadmap(m) {
    return isActive(m) && [ROLES.LEAD, ROLES.ENGINEER].includes(m.role);
}

export function canManageMembers(m) {
    return isActive(m) && m.role === ROLES.LEAD;
}

export function canViewTask(m, task, userId) {
    if (!isActive(m) || String(m.project_id) !== String(task.project_id)) {
        return false;
    }

    return canViewRoadmap(m)
        || (
            m.role === ROLES.CONTRACTOR
            && task.assigned_to != null
            && String(task.assigned_to) === String(userId)
        );
}

// Task creation, editing, assignment and deletion are project-management
// operations. Contractors are intentionally excluded from these operations.
export function canManageTask(m) {
    return isActive(m) && [ROLES.LEAD, ROLES.ENGINEER].includes(m.role);
}

// Any active user who can see the task may work on an assigned task.
// Project managers may update task status regardless of assignment.
export function canUpdateTaskStatus(m, task, userId) {
    if (!isActive(m) || String(m.project_id) !== String(task.project_id)) {
        return false;
    }

    return canManageTask(m)
        || (
            task.assigned_to != null
            && String(task.assigned_to) === String(userId)
            && [ROLES.ENGINEER, ROLES.CONTRACTOR].includes(m.role)
        );
}

// Final approval belongs to project managers. This prevents an assigned
// contractor from approving their own work.
export function canApproveTask(m) {
    return canManageTask(m);
}


export function canManageChecklist(m) {
    return isActive(m) && [ROLES.LEAD, ROLES.ENGINEER].includes(m.role);
}

export function canUpdateChecklist(m, task, userId) {
    if (!isActive(m) || String(m.project_id) !== String(task.project_id)) {
        return false;
    }

    return canManageChecklist(m)
        || (
            task.assigned_to != null
            && String(task.assigned_to) === String(userId)
            && [ROLES.ENGINEER, ROLES.CONTRACTOR].includes(m.role)
        );
}

export function canEditOwnComment(m, comment, userId) {
    return isActive(m) && String(comment.user_id) === String(userId);
}

export function canCreateAttachment(m, task, userId) {
    if (!isActive(m) || String(m.project_id) !== String(task.project_id)) {
        return false;
    }

    return canManageTask(m)
        || (
            task.assigned_to != null
            && String(task.assigned_to) === String(userId)
            && [ROLES.ENGINEER, ROLES.CONTRACTOR].includes(m.role)
        );
}

export function canDeleteAttachment(m, attachment, userId) {
    return isActive(m)
        && (
            canManageTask(m)
            || String(attachment.uploaded_by) === String(userId)
        );
}

export function canManageDependency(m) {
    return isActive(m) && [ROLES.LEAD, ROLES.ENGINEER].includes(m.role);
}
