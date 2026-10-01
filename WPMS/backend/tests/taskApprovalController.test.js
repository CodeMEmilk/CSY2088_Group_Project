import test from "node:test";
import assert from "node:assert/strict";
import {EventEmitter} from "node:events";
import createTaskController from "../src/controllers/taskController.js";

function requestWithBody(body) {
    const request = new EventEmitter();
    request.headers = {"content-type": "application/json"};
    process.nextTick(() => {
        request.emit("data", Buffer.from(JSON.stringify(body)));
        request.emit("end");
    });
    return request;
}

function responseCapture() {
    return {
        headersSent: false,
        writableEnded: false,
        writeHead(statusCode) {
            this.statusCode = statusCode;
        },
        end(body) {
            this.body = body ? JSON.parse(body) : null;
            this.writableEnded = true;
        }
    };
}

test("contractor cannot approve a waiting task", async () => {
    let called = false;
    const controller = createTaskController({
        transitionTask: async () => {
            called = true;
            return {};
        }
    });

    await assert.rejects(
        controller.updateStatus(
            requestWithBody({status: "done"}),
            responseCapture(),
            {
                params: {taskId: "1"},
                task: {status: "waiting_approval"},
                membership: {role: "CONTRACTOR", status: "active", project_id: "1"}
            }
        ),
        error => error.statusCode === 403
    );

    assert.equal(called, false);
});

test("project manager can approve a waiting task", async () => {
    let called = false;
    const controller = createTaskController({
        transitionTask: async () => {
            called = true;
            return {task_id: "1", status: "done"};
        }
    });

    const response = responseCapture();

    await controller.updateStatus(
        requestWithBody({status: "done"}),
        response,
        {
            params: {taskId: "1"},
            task: {status: "waiting_approval"},
            membership: {role: "LEAD", status: "active", project_id: "1"}
        }
    );

    assert.equal(called, true);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.task.status, "done");
});
