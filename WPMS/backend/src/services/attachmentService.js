import {mkdir, readFile, unlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {randomUUID} from "node:crypto";
import AppError from "../core/errors/AppError.js";

const MAX_FILE_BYTES = 750 * 1024;

function positiveInteger(value, fieldName) {
    if (!/^\d+$/.test(String(value)) || BigInt(value) <= 0n) {
        throw new AppError(`${fieldName} must be a positive integer.`, 400);
    }
}

function safeFileName(value) {
    if (typeof value !== "string") {
        throw new AppError("file_name is required.", 422);
    }

    const normalized = path.basename(value).trim();
    if (!normalized || normalized.length > 255) {
        throw new AppError("file_name must be 1–255 characters.", 422);
    }

    return normalized.replace(/[^a-zA-Z0-9._ -]/g, "_");
}

function normalizeBase64(value) {
    if (typeof value !== "string" || value.trim() === "") {
        throw new AppError("file_data_base64 is required.", 422);
    }

    const raw = value.trim().replace(/^data:[^;]+;base64,/, "");

    if (!/^[A-Za-z0-9+/\r\n]+={0,2}$/.test(raw)) {
        throw new AppError("file_data_base64 must contain valid base64 data.", 422);
    }

    const buffer = Buffer.from(raw, "base64");
    if (buffer.length === 0) {
        throw new AppError("Attachment cannot be empty.", 422);
    }

    if (buffer.length > MAX_FILE_BYTES) {
        throw new AppError("Attachment must be 750 KB or smaller.", 413);
    }

    return buffer;
}

function normalizeFileType(value) {
    if (value === undefined || value === null || value === "") {
        return "application/octet-stream";
    }

    if (typeof value !== "string" || value.length > 100) {
        throw new AppError("file_type must be at most 100 characters.", 422);
    }

    return value.trim() || "application/octet-stream";
}

export default function createAttachmentService(repository, options = {}) {
    const storageRoot = path.resolve(
        options.storageRoot ?? process.env.UPLOAD_DIR ?? "./uploads"
    );

    function storagePath(relativePath) {
        const absolute = path.resolve(storageRoot, relativePath);
        if (absolute !== storageRoot && !absolute.startsWith(`${storageRoot}${path.sep}`)) {
            throw new AppError("Invalid attachment path.", 500);
        }
        return absolute;
    }

    async function listAttachments(taskId) {
        positiveInteger(taskId, "Task ID");
        return repository.listAttachments(taskId);
    }

    async function createAttachment(taskId, userId, input) {
        positiveInteger(taskId, "Task ID");
        positiveInteger(userId, "User ID");

        if (!input || typeof input !== "object" || Array.isArray(input)) {
            throw new AppError("JSON object required.", 400);
        }

        const fileName = safeFileName(input.file_name);
        const fileType = normalizeFileType(input.file_type);
        const buffer = normalizeBase64(input.file_data_base64);
        const directory = path.join("tasks", String(taskId));
        const relativePath = path.join(directory, `${randomUUID()}-${fileName}`);
        const absolutePath = storagePath(relativePath);

        await mkdir(path.dirname(absolutePath), {recursive: true});
        await writeFile(absolutePath, buffer, {flag: "wx"});

        try {
            return await repository.createAttachment(taskId, userId, {
                fileName,
                filePath: relativePath,
                fileType,
                fileSize: buffer.length
            });
        } catch (error) {
            await unlink(absolutePath).catch(() => {});
            throw error;
        }
    }

    async function getAttachment(attachmentId) {
        positiveInteger(attachmentId, "Attachment ID");
        const attachment = await repository.findAttachment(attachmentId);
        if (!attachment) {
            throw new AppError("Attachment not found.", 404);
        }
        return attachment;
    }

    async function readAttachment(attachmentId) {
        const attachment = await getAttachment(attachmentId);
        try {
            const buffer = await readFile(storagePath(attachment.file_path));
            return {attachment, buffer};
        } catch (error) {
            if (error?.code === "ENOENT") {
                throw new AppError("Attachment file is no longer available.", 404);
            }
            throw error;
        }
    }

    async function deleteAttachment(attachmentId) {
        const attachment = await getAttachment(attachmentId);
        await repository.removeAttachment(attachmentId);
        await unlink(storagePath(attachment.file_path)).catch(() => {});
    }

    return {
        listAttachments,
        createAttachment,
        getAttachment,
        readAttachment,
        deleteAttachment
    };
}
