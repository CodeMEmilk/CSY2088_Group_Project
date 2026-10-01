import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp, readFile, rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import createAttachmentService from "../src/services/attachmentService.js";

function repositoryMock() {
    const rows = new Map();
    let nextId = 1;
    return {
        async listAttachments(taskId) {
            return [...rows.values()].filter(x => String(x.task_id) === String(taskId));
        },
        async createAttachment(taskId, userId, input) {
            const row = {
                attachment_id: nextId++,
                task_id: taskId,
                uploaded_by: userId,
                file_name: input.fileName,
                file_path: input.filePath,
                file_type: input.fileType,
                file_size: input.fileSize
            };
            rows.set(row.attachment_id, row);
            return row;
        },
        async findAttachment(id) {
            return rows.get(Number(id)) ?? null;
        },
        async removeAttachment(id) {
            return rows.delete(Number(id));
        }
    };
}

test("attachment service stores, reads, and deletes a task attachment", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "wpms-attachments-"));
    const repo = repositoryMock();
    const service = createAttachmentService(repo, {storageRoot: root});

    try {
        const created = await service.createAttachment(10, 7, {
            file_name: "spec.txt",
            file_type: "text/plain",
            file_data_base64: Buffer.from("hello WPMS").toString("base64")
        });

        assert.equal(created.file_name, "spec.txt");
        assert.equal(created.file_size, 10);

        const result = await service.readAttachment(created.attachment_id);
        assert.equal(result.buffer.toString(), "hello WPMS");

        await service.deleteAttachment(created.attachment_id);
        await assert.rejects(() => readFile(path.join(root, created.file_path)));
    } finally {
        await rm(root, {recursive: true, force: true});
    }
});

test("attachment service rejects files over the MVP size limit", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "wpms-attachments-"));
    const repo = repositoryMock();
    const service = createAttachmentService(repo, {storageRoot: root});

    try {
        const oversized = Buffer.alloc(750 * 1024 + 1).toString("base64");
        await assert.rejects(
            () => service.createAttachment(10, 7, {
                file_name: "large.bin",
                file_data_base64: oversized
            }),
            /750 KB or smaller/
        );
    } finally {
        await rm(root, {recursive: true, force: true});
    }
});
