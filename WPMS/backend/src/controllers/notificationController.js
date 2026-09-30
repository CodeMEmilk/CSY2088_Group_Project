import {getQuery} from "../core/http/request.js";
import {sendSuccess} from "../core/http/response.js";

function createNotificationController(notificationService) {
    async function listNotifications(request, response, context) {
        const query = getQuery(request);
        const unreadOnly = query.unread === "true";
        const notifications = await notificationService.listForUser(
            context.userId,
            unreadOnly
        );
        sendSuccess(response, {notifications});
    }

    async function markRead(request, response, context) {
        const notification = await notificationService.markRead(
            context.params.notificationId,
            context.userId
        );
        sendSuccess(response, {notification});
    }

    return {listNotifications, markRead};
}

export default createNotificationController;
