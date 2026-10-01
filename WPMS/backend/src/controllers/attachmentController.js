import {getJsonBody} from "../core/http/request.js";
import {sendCreated, sendNoContent, sendSuccess} from "../core/http/response.js";

function createAttachmentController(service) {
    async function listAttachments(request, response, context) {
        const attachments = await service.listAttachments(context.params.taskId);
        sendSuccess(response, {attachments});
    }

    async function createAttachment(request, response, context) {
        const attachment = await service.createAttachment(
            context.params.taskId,
            context.userId,
            await getJsonBody(request)
        );
        sendCreated(response, {attachment});
    }

    async function downloadAttachment(request, response, context) {
        const {attachment, buffer} = await service.readAttachment(context.params.attachmentId);

        response.writeHead(200, {
            "Content-Type": attachment.file_type || "application/octet-stream",
            "Content-Length": buffer.length,
            "Content-Disposition": `attachment; filename="${attachment.file_name.replace(/"/g, "")}"`
        });
        response.end(buffer);
    }

    async function deleteAttachment(request, response, context) {
        await service.deleteAttachment(context.params.attachmentId);
        sendNoContent(response);
    }

    return {
        listAttachments,
        createAttachment,
        downloadAttachment,
        deleteAttachment
    };
}

export default createAttachmentController;
