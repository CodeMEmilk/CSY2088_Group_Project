import AppError from "../core/errors/AppError.js";

function positiveInteger(value, fieldName) {
    if (!/^\d+$/.test(String(value)) || BigInt(value) <= 0n) {
        throw new AppError(`${fieldName} must be a positive integer.`, 400);
    }
}

function createNotificationService(notificationRepository) {
    async function listForUser(userId, unreadOnly = false) {
        positiveInteger(userId, "User ID");
        return notificationRepository.listByUser(userId, unreadOnly);
    }

    async function markRead(notificationId, userId) {
        positiveInteger(notificationId, "Notification ID");
        positiveInteger(userId, "User ID");

        const notification = await notificationRepository.markRead(
            notificationId,
            userId
        );

        if (!notification) {
            throw new AppError("Notification not found.", 404);
        }

        return notification;
    }

    return {
        listForUser,
        markRead
    };
}

export default createNotificationService;
