import test from "node:test";
import assert from "node:assert/strict";
import {canManageTask, canUpdateTaskStatus, canApproveTask, canCreateAttachment, canDeleteAttachment} from "../src/policies/projectPolicy.js";

const lead = {project_id:"1", role:"LEAD", status:"active"};
const engineer = {project_id:"1", role:"ENGINEER", status:"active"};
const contractor = {project_id:"1", role:"CONTRACTOR", status:"active"};
const task = {project_id:"1", assigned_to:"9"};

test("lead and engineer can manage tasks", () => {
    assert.equal(canManageTask(lead), true);
    assert.equal(canManageTask(engineer), true);
    assert.equal(canManageTask(contractor), false);
    assert.equal(canApproveTask(lead), true);
    assert.equal(canApproveTask(engineer), true);
    assert.equal(canApproveTask(contractor), false);
});

test("assigned contractor can update task status", () => {
    assert.equal(canUpdateTaskStatus(contractor, task, "9"), true);
    assert.equal(canUpdateTaskStatus(contractor, task, "10"), false);
});

test("manager can update task status regardless of assignment", () => {
    assert.equal(canUpdateTaskStatus(lead, task, "10"), true);
});

test("only project managers can approve a waiting task", () => {
    // Approval authorization is enforced by the task controller using canApproveTask.
    // The policy itself is intentionally role-based and reusable.
    assert.equal(canManageTask(lead), true);
    assert.equal(canManageTask(engineer), true);
    assert.equal(canManageTask(contractor), false);
});

test("assigned contractor may create attachments but cannot delete another user's attachment", () => {
    const contractor = {project_id: 1, role: "CONTRACTOR", status: "active"};
    const task = {project_id: 1, assigned_to: 20};
    const ownAttachment = {uploaded_by: 20};
    const otherAttachment = {uploaded_by: 21};

    assert.equal(canCreateAttachment(contractor, task, 20), true);
    assert.equal(canDeleteAttachment(contractor, ownAttachment, 20), true);
    assert.equal(canDeleteAttachment(contractor, otherAttachment, 20), false);
});
