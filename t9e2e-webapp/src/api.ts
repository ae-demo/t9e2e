// Same-origin client for the t9e2e-api sibling — nginx proxies /api to the
// API gateway (nginx/default.conf + 15-aep-api-proxy.sh), never a direct URL
// from the browser. Every call carries the caller's bearer token; the gateway
// validates it and re-derives X-User-Id/X-User-Groups from the token's
// claims, so the X-User-Id the contract types as a required header is a
// value the gateway overwrites, never one the SPA can assert — nginx also
// strips any inbound X-User-* from the client before proxying.
import createClient from "openapi-fetch";
import type { components, paths } from "./generated/t9e2e-api";
import { getAccessToken, signIn } from "./auth";

type Task = components["schemas"]["Task"];

const client = createClient<paths>({ baseUrl: "/api" });

client.use({
  async onRequest({ request }) {
    const token = await getAccessToken();
    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`);
    }
    return request;
  },
  async onResponse({ response }) {
    if (response.status === 401) {
      await signIn();
    }
    return response;
  },
});

// Required by the generated types (documents what the gateway injects on the
// way to the backend); the placeholder never reaches the backend as-is.
const identityHeader = { "X-User-Id": "browser" } as const;

export async function listTasks(): Promise<Task[]> {
  const { data, error } = await client.GET("/tasks", {
    params: { header: identityHeader, query: { limit: 100 } },
  });
  if (error) throw new Error(error.message || "Failed to load tasks");
  return data.data;
}

export async function createTask(title: string): Promise<Task> {
  const { data, error } = await client.POST("/tasks", {
    params: { header: identityHeader },
    body: { title },
  });
  if (error) throw new Error(error.message || "Failed to create task");
  return data;
}

export async function completeTask(taskId: string): Promise<Task> {
  const { data, error } = await client.POST("/tasks/{taskId}/complete", {
    params: { header: identityHeader, path: { taskId } },
  });
  if (error) throw new Error(error.message || "Failed to complete task");
  return data;
}
