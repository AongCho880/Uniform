import test from "node:test";
import assert from "node:assert/strict";

import unitController from "../controllers/unitController.js";
import prisma from "../DB/db.config.js";

test("listUnits normalizes invalid pagination params", async (t) => {
  const originalAdminFindUnique = prisma.admin.findUnique;
  const originalUnitFindMany = prisma.unit.findMany;
  const originalUnitCount = prisma.unit.count;

  t.after(() => {
    prisma.admin.findUnique = originalAdminFindUnique;
    prisma.unit.findMany = originalUnitFindMany;
    prisma.unit.count = originalUnitCount;
  });

  prisma.admin.findUnique = async () => ({
    adminId: "admin",
    institutionId: "institution",
  });

  let capturedFindManyArgs;
  prisma.unit.findMany = async (args) => {
    capturedFindManyArgs = args;
    return [{ unitId: "unit" }];
  };

  prisma.unit.count = async () => 12;

  const req = {
    query: { page: "-1", limit: "0" },
    admin: { adminId: "admin" },
  };

  const responses = [];
  const res = {
    status(code) {
      responses.push({ type: "status", code });
      return this;
    },
    json(payload) {
      responses.push({ type: "json", payload });
      return this;
    },
  };

  await unitController.listUnits(req, res);

  assert.ok(capturedFindManyArgs, "findMany should be called");
  assert.equal(capturedFindManyArgs.take, 5, "limit should default to 5");
  assert.equal(capturedFindManyArgs.skip, 0, "skip should match page 1 with limit 5");

  const jsonResponse = responses.find((item) => item.type === "json");
  assert.ok(jsonResponse, "Should return a JSON response");
  assert.equal(jsonResponse.payload.status, 200, "Should respond with status 200");
  assert.equal(jsonResponse.payload.metadata.currentPage, 1);
  assert.equal(jsonResponse.payload.metadata.currentLimit, 5);
  assert.equal(jsonResponse.payload.metadata.totalPages, Math.ceil(12 / 5));
});

test("listUnits keeps valid pagination params", async (t) => {
  const originalAdminFindUnique = prisma.admin.findUnique;
  const originalUnitFindMany = prisma.unit.findMany;
  const originalUnitCount = prisma.unit.count;

  t.after(() => {
    prisma.admin.findUnique = originalAdminFindUnique;
    prisma.unit.findMany = originalUnitFindMany;
    prisma.unit.count = originalUnitCount;
  });

  prisma.admin.findUnique = async () => ({
    adminId: "admin",
    institutionId: "institution",
  });

  let capturedFindManyArgs;
  prisma.unit.findMany = async (args) => {
    capturedFindManyArgs = args;
    return [{ unitId: "unit" }];
  };

  prisma.unit.count = async () => 34;

  const req = {
    query: { page: "2", limit: "10" },
    admin: { adminId: "admin" },
  };

  const responses = [];
  const res = {
    status(code) {
      responses.push({ type: "status", code });
      return this;
    },
    json(payload) {
      responses.push({ type: "json", payload });
      return this;
    },
  };

  await unitController.listUnits(req, res);

  assert.ok(capturedFindManyArgs, "findMany should be called");
  assert.equal(capturedFindManyArgs.take, 10, "limit should remain 10");
  assert.equal(capturedFindManyArgs.skip, 10, "skip should be (page-1)*limit");

  const jsonResponse = responses.find((item) => item.type === "json");
  assert.ok(jsonResponse, "Should return a JSON response");
  assert.equal(jsonResponse.payload.status, 200, "Should respond with status 200");
  assert.equal(jsonResponse.payload.metadata.currentPage, 2);
  assert.equal(jsonResponse.payload.metadata.currentLimit, 10);
  assert.equal(jsonResponse.payload.metadata.totalPages, Math.ceil(34 / 10));
});
