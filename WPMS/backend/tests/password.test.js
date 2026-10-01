import test from "node:test";
import assert from "node:assert/strict";
import {hashPassword,verifyPassword} from "../src/utils/password.js";
test("hash and verify",async()=>{const hash=await hashPassword("ExamplePassword123!");assert.equal(await verifyPassword("ExamplePassword123!",hash),true);assert.equal(await verifyPassword("wrong",hash),false);});
