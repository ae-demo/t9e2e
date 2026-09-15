// Mock handlers for t9e2e-api, against specs/design/components/t9e2e-api/openapi.yaml
// — the same contract src/generated/t9e2e-api.ts came from. State lives in
// this module's scope, so a create/complete carries forward across in-app
// navigation and resets on any full page load (react-webapp/mock-mode.md).
//
// Seed rows match wireframes.dsl's TaskBoard table exactly (seed.mjs), so the
// walk's screen agrees with the wireframe by construction.
import { http, HttpResponse } from "msw";
import type { components } from "../src/generated/t9e2e-api";
import { rolesFromToken } from "./auth";

type Task = components["schemas"]["Task"];

let tasks: Task[] = [
  {
    id: "1",
    title: "Draft the launch plan",
    completed: false,
    createdBy: "admin",
    createdAt: "2026-09-01T09:00:00Z",
    completedAt: null,
  },
  {
    id: "2",
    title: "Set up the database",
    completed: true,
    createdBy: "admin",
    createdAt: "2026-09-02T09:00:00Z",
    completedAt: "2026-09-03T09:00:00Z",
  },
  {
    id: "3",
    title: "Review pull requests",
    completed: false,
    createdBy: "admin",
    createdAt: "2026-09-03T09:00:00Z",
    completedAt: null,
  },
];

function isAdmin(request: Request): boolean {
  const roles = rolesFromToken(request.headers.get("authorization"));
  return roles.some((role) => role.toLowerCase().includes("admin"));
}

function forbidden() {
  return HttpResponse.json(
    { code: 403, message: "Forbidden", description: "caller is not an Admin" },
    { status: 403 },
  );
}

export const handlers = [
  http.get("/api/tasks", () => {
    return HttpResponse.json({ count: tasks.length, next: null, previous: null, data: tasks });
  }),

  http.post("/api/tasks", async ({ request }) => {
    if (!isAdmin(request)) return forbidden();
    const input = (await request.json()) as { title?: string };
    if (!input?.title) {
      return HttpResponse.json({ code: 400, message: "title is required" }, { status: 400 });
    }
    const created: Task = {
      id: String(tasks.length + 1),
      title: input.title,
      completed: false,
      createdBy: "mock-admin",
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    tasks = [...tasks, created];
    return HttpResponse.json(created, { status: 201 });
  }),

  http.post("/api/tasks/:taskId/complete", ({ request, params }) => {
    if (!isAdmin(request)) return forbidden();
    const task = tasks.find((t) => t.id === params.taskId);
    if (!task) {
      return HttpResponse.json({ code: 404, message: "task not found" }, { status: 404 });
    }
    const completed: Task = { ...task, completed: true, completedAt: new Date().toISOString() };
    tasks = tasks.map((t) => (t.id === completed.id ? completed : t));
    return HttpResponse.json(completed, { status: 200 });
  }),
];
