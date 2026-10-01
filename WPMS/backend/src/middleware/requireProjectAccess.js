import AppError from "../core/errors/AppError.js";
import {
    canViewRoadmap,
    canManageMembers,
    canViewTask,
    canManageTask,
    canUpdateTaskStatus,
    canManageChecklist,
    canUpdateChecklist,
    canEditOwnComment,
    canManageDependency,
    canCreateAttachment,
    canDeleteAttachment
} from "../policies/projectPolicy.js";

export function createProjectGuards(memberships, tasks) {
    async function membership(projectId, userId) {
        const m = await memberships.findByProjectAndUser(projectId, userId);

        if (!m || m.status !== "active") {
            throw new AppError("Project access denied", 403);
        }

        return m;
    }

    async function taskContext(taskId, userId) {
        const task = await tasks.findById(taskId);

        if (!task) {
            throw new AppError("Task not found", 404);
        }

        const m = await membership(task.project_id, userId);

        return {task, membership: m};
    }

    return {
        roadmap: handler => async (req, res, ctx) => {
            const m = await membership(ctx.params.projectId, ctx.userId);

            if (!canViewRoadmap(m)) {
                throw new AppError("Project access denied", 403);
            }

            return handler(req, res, {...ctx, membership: m});
        },

        manageMembers: handler => async (req, res, ctx) => {
            const m = await membership(ctx.params.projectId, ctx.userId);

            if (!canManageMembers(m)) {
                throw new AppError("Project access denied", 403);
            }

            return handler(req, res, {...ctx, membership: m});
        },

        task: handler => async (req, res, ctx) => {
            const {task, membership: m} = await taskContext(
                ctx.params.taskId,
                ctx.userId
            );

            if (!canViewTask(m, task, ctx.userId)) {
                throw new AppError("Task access denied", 403);
            }

            return handler(req, res, {
                ...ctx,
                task,
                membership: m
            });
        },

        taskManage: handler => async (req, res, ctx) => {
            const {task, membership: m} = await taskContext(
                ctx.params.taskId,
                ctx.userId
            );

            if (!canManageTask(m)) {
                throw new AppError("Task management access denied", 403);
            }

            return handler(req, res, {
                ...ctx,
                task,
                membership: m
            });
        },

        taskStatus: handler => async (req, res, ctx) => {
            const {task, membership: m} = await taskContext(
                ctx.params.taskId,
                ctx.userId
            );

            if (!canUpdateTaskStatus(m, task, ctx.userId)) {
                throw new AppError("Task status access denied", 403);
            }

            return handler(req, res, {
                ...ctx,
                task,
                membership: m
            });
        },

        projectTaskManage: handler => async (req, res, ctx) => {
            const m = await membership(ctx.params.projectId, ctx.userId);

            if (!canManageTask(m)) {
                throw new AppError("Task management access denied", 403);
            }

            return handler(req, res, {...ctx, membership: m});
        },

        taskChecklistManage: handler => async (req, res, ctx) => {
            const {task, membership: m} = await taskContext(
                ctx.params.taskId,
                ctx.userId
            );

            if (ctx.params.criterionId !== undefined) {
                const criterion = await tasks.findChecklistItem(ctx.params.criterionId);
                if (!criterion || String(criterion.task_id) !== String(task.task_id)) {
                    throw new AppError("Checklist item not found", 404);
                }
            }

            if (!canManageChecklist(m)) {
                throw new AppError("Checklist management access denied", 403);
            }

            return handler(req, res, {
                ...ctx,
                task,
                membership: m
            });
        },

        taskChecklistUpdate: handler => async (req, res, ctx) => {
            const {task, membership: m} = await taskContext(
                ctx.params.taskId,
                ctx.userId
            );

            const criterion = await tasks.findChecklistItem(ctx.params.criterionId);
            if (!criterion || String(criterion.task_id) !== String(task.task_id)) {
                throw new AppError("Checklist item not found", 404);
            }

            if (!canUpdateChecklist(m, task, ctx.userId)) {
                throw new AppError("Checklist access denied", 403);
            }

            return handler(req, res, {
                ...ctx,
                task,
                membership: m
            });
        },

        taskCommentEdit: handler => async (req, res, ctx) => {
            const {task, membership: m} = await taskContext(
                ctx.params.taskId,
                ctx.userId
            );

            const comment = await tasks.findComment(ctx.params.commentId);
            if (!comment || String(comment.task_id) !== String(task.task_id)) {
                throw new AppError("Comment not found", 404);
            }

            if (!canEditOwnComment(m, comment, ctx.userId) && !canManageTask(m)) {
                throw new AppError("Comment edit access denied", 403);
            }

            return handler(req, res, {
                ...ctx,
                task,
                comment,
                membership: m
            });
        },

        taskAttachmentCreate: handler => async (req, res, ctx) => {
            const {task, membership: m} = await taskContext(
                ctx.params.taskId,
                ctx.userId
            );

            if (!canCreateAttachment(m, task, ctx.userId)) {
                throw new AppError("Attachment access denied", 403);
            }

            return handler(req, res, {
                ...ctx,
                task,
                membership: m
            });
        },

        taskAttachment: handler => async (req, res, ctx) => {
            const {task, membership: m} = await taskContext(
                ctx.params.taskId,
                ctx.userId
            );

            const attachment = await tasks.findAttachment(ctx.params.attachmentId);
            if (!attachment || String(attachment.task_id) !== String(task.task_id)) {
                throw new AppError("Attachment not found", 404);
            }

            if (!canViewTask(m, task, ctx.userId)) {
                throw new AppError("Attachment access denied", 403);
            }

            return handler(req, res, {
                ...ctx,
                task,
                membership: m,
                attachment
            });
        },

        taskAttachmentDelete: handler => async (req, res, ctx) => {
            const {task, membership: m} = await taskContext(
                ctx.params.taskId,
                ctx.userId
            );

            const attachment = await tasks.findAttachment(ctx.params.attachmentId);
            if (!attachment || String(attachment.task_id) !== String(task.task_id)) {
                throw new AppError("Attachment not found", 404);
            }

            if (!canDeleteAttachment(m, attachment, ctx.userId)) {
                throw new AppError("Attachment delete access denied", 403);
            }

            return handler(req, res, {
                ...ctx,
                task,
                membership: m,
                attachment
            });
        },

        taskDependencyManage: handler => async (req, res, ctx) => {
            const {task, membership: m} = await taskContext(
                ctx.params.taskId,
                ctx.userId
            );

            if (!canManageDependency(m)) {
                throw new AppError("Dependency management access denied", 403);
            }

            if (ctx.params.dependencyId !== undefined) {
                const dependency = await tasks.findDependency(ctx.params.dependencyId);
                if (!dependency || String(dependency.blocking_task_id) !== String(task.task_id) && String(dependency.blocked_task_id) !== String(task.task_id)) {
                    throw new AppError("Dependency not found", 404);
                }
            }

            return handler(req, res, {
                ...ctx,
                task,
                membership: m
            });
        },

        taskCommentDelete: handler => async (req, res, ctx) => {
            const {task, membership: m} = await taskContext(
                ctx.params.taskId,
                ctx.userId
            );

            const comment = await tasks.findComment(ctx.params.commentId);
            if (!comment || String(comment.task_id) !== String(task.task_id)) {
                throw new AppError("Comment not found", 404);
            }

            if (!canEditOwnComment(m, comment, ctx.userId) && !canManageTask(m)) {
                throw new AppError("Comment delete access denied", 403);
            }

            return handler(req, res, {
                ...ctx,
                task,
                comment,
                membership: m
            });
        }
    };
}
