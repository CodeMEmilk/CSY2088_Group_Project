import test from "node:test";
import assert from "node:assert/strict";
import {
    canManageChecklist,
    canUpdateChecklist,
    canEditOwnComment
} from "../src/policies/projectPolicy.js";

test("only lead and engineer can manage definition-of-done criteria", () => {
    assert.equal(canManageChecklist({role: "LEAD", status: "active"}), true);
    assert.equal(canManageChecklist({role: "ENGINEER", status: "active"}), true);
    assert.equal(canManageChecklist({role: "CONTRACTOR", status: "active"}), false);
});

test("assigned contractor may mark a checklist item complete", () => {
    const membership = {project_id: "1", role: "CONTRACTOR", status: "active"};
    const task = {project_id: "1", assigned_to: "7"};

    assert.equal(canUpdateChecklist(membership, task, "7"), true);
    assert.equal(canUpdateChecklist(membership, task, "8"), false);
});

test("users may edit their own comments", () => {
    const membership = {role: "CONTRACTOR", status: "active"};
    const comment = {user_id: "7"};

    assert.equal(canEditOwnComment(membership, comment, "7"), true);
    assert.equal(canEditOwnComment(membership, comment, "8"), false);
});
