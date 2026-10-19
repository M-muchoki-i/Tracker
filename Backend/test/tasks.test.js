// Tests for the main API routes. Each test file gets its own in-memory
// database, so tests never touch the real data file.
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createDb } from "../src/db.js";
import { createApp } from "../src/app.js";

let app;
let token;

beforeEach(async () => {
  app = createApp(createDb(":memory:"));
  const auth = await request(app).post("/api/auth/signup").send({
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  });
  token = auth.body.token;
});

function authenticatedRequest(method, path) {
  return request(app)[method](path).set("Authorization", `Bearer ${token}`);
}

describe("Authentication required for task features", () => {
  it("requires sign-in to list, create, edit, delete, or email tasks", async () => {
    const created = await authenticatedRequest("post", "/api/tasks")
      .send({ title: "Private task" });
    const list = await request(app).get("/api/tasks");
    const create = await request(app)
      .post("/api/tasks")
      .send({ title: "Private task" });
    const email = await request(app)
      .post("/api/tasks/send-email")
      .send({ to: "user@example.com" });
    const singleTaskEmail = await request(app)
      .post(`/api/tasks/${created.body.id}/send-email`)
      .send({ to: "user@example.com" });
    const edit = await request(app)
      .patch(`/api/tasks/${created.body.id}`)
      .send({ title: "Changed" });
    const remove = await request(app).delete(`/api/tasks/${created.body.id}`);

    expect(list.status).toBe(401);
    expect(create.status).toBe(401);
    expect(email.status).toBe(401);
    expect(singleTaskEmail.status).toBe(401);
    expect(edit.status).toBe(401);
    expect(remove.status).toBe(401);
  });
});

describe("GET /api/tasks", () => {
  it("returns an empty list at first", async () => {
    const res = await authenticatedRequest("get", "/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns created tasks", async () => {
    await authenticatedRequest("post", "/api/tasks").send({ title: "Buy milk" });
    const res = await authenticatedRequest("get", "/api/tasks");
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      title: "Buy milk",
      description: "",
      completed: false,
    });
    expect(res.body[0].id).toBeTypeOf("number");
    expect(res.body[0].createdAt).toBeTypeOf("string");
  });
});

describe("POST /api/tasks", () => {
  it("creates a task with title and description", async () => {
    const res = await authenticatedRequest("post", "/api/tasks")
      .send({ title: "Read", description: "Chapter 4" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: "Read",
      description: "Chapter 4",
      completed: false,
    });
  });

  it("rejects a missing title with 400", async () => {
    const res = await authenticatedRequest("post", "/api/tasks")
      .send({ description: "no title" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/i);
  });

  it("rejects a blank title with 400", async () => {
    const res = await authenticatedRequest("post", "/api/tasks").send({ title: "   " });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/tasks/:id", () => {
  it("toggles completed", async () => {
    const created = (
      await authenticatedRequest("post", "/api/tasks").send({ title: "Run" })
    ).body;
    const res = await authenticatedRequest("patch", `/api/tasks/${created.id}`)
      .send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  it("edits title and description", async () => {
    const created = (
      await authenticatedRequest("post", "/api/tasks").send({ title: "Old" })
    ).body;
    const res = await authenticatedRequest("patch", `/api/tasks/${created.id}`)
      .send({ title: "New", description: "updated" });
    expect(res.body.title).toBe("New");
    expect(res.body.description).toBe("updated");
  });

  it("returns 404 for a missing task", async () => {
    const res = await authenticatedRequest("patch", "/api/tasks/999")
      .send({ completed: true });
    expect(res.status).toBe(404);
  });

  it("rejects an empty title with 400", async () => {
    const created = (
      await authenticatedRequest("post", "/api/tasks").send({ title: "Keep" })
    ).body;
    const res = await authenticatedRequest("patch", `/api/tasks/${created.id}`)
      .send({ title: "" });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/tasks/:id", () => {
  it("deletes an existing task", async () => {
    const created = (
      await authenticatedRequest("post", "/api/tasks").send({ title: "Temp" })
    ).body;
    const res = await authenticatedRequest("delete", `/api/tasks/${created.id}`);
    expect(res.status).toBe(204);

    const list = await authenticatedRequest("get", "/api/tasks");
    expect(list.body).toHaveLength(0);
  });

  it("returns 404 for a missing task", async () => {
    const res = await authenticatedRequest("delete", "/api/tasks/999");
    expect(res.status).toBe(404);
  });
});

describe("Scheduled Tasks & Calendar integration", () => {
  it("creates a task with a scheduled date", async () => {
    const res = await authenticatedRequest("post", "/api/tasks")
      .send({
        title: "Schedule doctor appointment",
        description: "Annual checkup",
        scheduledDate: "2026-10-25T10:00",
      });
    expect(res.status).toBe(201);
    expect(res.body.scheduledDate).toBe("2026-10-25T10:00");
  });

  it("updates a task scheduled date via PATCH", async () => {
    const created = (
      await authenticatedRequest("post", "/api/tasks").send({ title: "Pay bills" })
    ).body;
    expect(created.scheduledDate).toBeNull();

    const updated = await authenticatedRequest("patch", `/api/tasks/${created.id}`)
      .send({ scheduledDate: "2026-10-28" });
    expect(updated.status).toBe(200);
    expect(updated.body.scheduledDate).toBe("2026-10-28");
  });
});

describe("POST /api/tasks/send-email", () => {
  it("rejects request without valid email address", async () => {
    const res = await authenticatedRequest("post", "/api/tasks/send-email")
      .send({ to: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/valid recipient/i);
  });

  it("generates email summary and Gmail compose link for tasks", async () => {
    await authenticatedRequest("post", "/api/tasks")
      .send({ title: "Finish presentation", scheduledDate: "2026-10-22" });

    const res = await authenticatedRequest("post", "/api/tasks/send-email")
      .send({ to: "user@example.com", subject: "My Agenda" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.gmailUrl).toContain("mail.google.com");
    expect(res.body.gmailUrl).toContain("user%40example.com");
  });
});

describe("Authentication API", () => {
  it("signs up a new user and returns token", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        name: "Alice Doe",
        email: "alice@example.com",
        password: "securepassword123",
      });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      name: "Alice Doe",
      email: "alice@example.com",
    });
    expect(res.body.token).toBeTypeOf("string");
  });

  it("rejects duplicate email registration", async () => {
    await request(app).post("/api/auth/signup").send({
      name: "Bob",
      email: "bob@example.com",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/signup").send({
      name: "Bob 2",
      email: "bob@example.com",
      password: "password456",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it("logs in with valid credentials", async () => {
    await request(app).post("/api/auth/signup").send({
      name: "Charlie",
      email: "charlie@example.com",
      password: "mypassword",
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "charlie@example.com",
      password: "mypassword",
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTypeOf("string");
    expect(loginRes.body.user.email).toBe("charlie@example.com");
  });

  it("rejects login with invalid password", async () => {
    await request(app).post("/api/auth/signup").send({
      name: "David",
      email: "david@example.com",
      password: "mypassword",
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "david@example.com",
      password: "wrongpassword",
    });
    expect(loginRes.status).toBe(401);
    expect(loginRes.body.error).toMatch(/invalid email or password/i);
  });

  it("fetches authenticated profile via /api/auth/me", async () => {
    const signup = await request(app).post("/api/auth/signup").send({
      name: "Eve",
      email: "eve@example.com",
      password: "mypassword",
    });

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${signup.body.token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe("eve@example.com");
  });
});
