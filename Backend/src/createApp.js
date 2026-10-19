// Express app: defines the REST API. This file builds the app around a
// given database, so tests can pass in a fresh in-memory database.
import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";
import { toTask, toUser } from "./db.js";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  optionalAuth,
  requireAuth,
} from "./auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Validate a task title. Returns an error message, or null if valid.
 * The title is the only required field.
 */
function validateTitle(title) {
  if (typeof title !== "string" || title.trim().length === 0) {
    return "Title is required.";
  }
  if (title.trim().length > 200) {
    return "Title must be 200 characters or fewer.";
  }
  return null;
}

/**
 * Validate optional scheduledDate.
 */
function validateScheduledDate(dateStr) {
  if (dateStr === null || dateStr === undefined || dateStr === "") {
    return null;
  }
  if (typeof dateStr !== "string") {
    return "Scheduled date must be a valid string.";
  }
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    return "Scheduled date is invalid.";
  }
  return null;
}

function validateEmail(email) {
  if (
    typeof email !== "string" ||
    !email.trim().includes("@") ||
    !email.trim().includes(".")
  ) {
    return "Please provide a valid email address.";
  }
  return null;
}

function validatePassword(password) {
  if (typeof password !== "string" || password.length < 6) {
    return "Password must be at least 6 characters.";
  }
  return null;
}

function validateName(name) {
  if (typeof name !== "string" || name.trim().length === 0) {
    return "Name is required.";
  }
  return null;
}

/**
 * Helper to build elegant HTML & plain-text representations of tasks for emails.
 */
function formatTaskEmail(tasks, customTitle) {
  const title = customTitle || "Task Tracker Schedule & Agenda";
  const dateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const plainText = [
    `=== ${title} ===`,
    `Date: ${dateFormatted}`,
    `Total Tasks: ${tasks.length}`,
    "",
    ...tasks.map((t, idx) => {
      const status = t.completed ? "[COMPLETED]" : "[PENDING]";
      const sched = t.scheduledDate ? `Scheduled: ${t.scheduledDate}` : "No scheduled date";
      const desc = t.description ? `\n   Notes: ${t.description}` : "";
      return `${idx + 1}. ${status} ${t.title}\n   ${sched}${desc}\n`;
    }),
    "--------------------------------------------------",
    "Organized with Task Tracker",
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 24px; margin: 0; }
    .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%); color: #ffffff; padding: 28px 24px; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0; font-size: 13px; color: #c7d2fe; }
    .content { padding: 24px; }
    .task-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px; background: #ffffff; border-left: 4px solid #4f46e5; }
    .task-card.completed { border-left-color: #10b981; background: #fafafa; }
    .task-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
    .task-title { font-size: 15px; font-weight: 600; color: #0f172a; margin: 0; }
    .badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.04em; }
    .badge-done { background: #dcfce7; color: #15803d; }
    .badge-pending { background: #e0e7ff; color: #4338ca; }
    .task-meta { font-size: 12px; color: #64748b; margin-top: 4px; display: flex; align-items: center; gap: 4px; }
    .task-desc { font-size: 13px; color: #475569; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #f1f5f9; white-space: pre-wrap; line-height: 1.5; }
    .footer { padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; background: #fafafa; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
      <p>${dateFormatted} • ${tasks.length} task${tasks.length === 1 ? "" : "s"}</p>
    </div>
    <div class="content">
      ${tasks
        .map(
          (t) => `
        <div class="task-card ${t.completed ? "completed" : ""}">
          <div class="task-header">
            <span class="task-title">${t.title}</span>
            <span class="badge ${t.completed ? "badge-done" : "badge-pending"}">
              ${t.completed ? "Completed" : "Pending"}
            </span>
          </div>
          <div class="task-meta">
            ${
              t.scheduledDate
                ? `📅 Scheduled: <strong>${t.scheduledDate}</strong>`
                : "📅 No specific schedule"
            }
          </div>
          ${t.description ? `<div class="task-desc">${t.description}</div>` : ""}
        </div>
      `,
        )
        .join("")}
    </div>
    <div class="footer">
      Sent with ❤️ from your Task Tracker
    </div>
  </div>
</body>
</html>
  `;

  return { plainText, html };
}

export function createApp(db) {
  const app = express();

  app.use(cors()); // lets the Vite dev server (port 5173) call this API
  app.use(express.json()); // parses JSON request bodies
  app.use(optionalAuth); // parses JWT bearer token if present

  const getUserByEmail = db.prepare(
    "SELECT * FROM users WHERE email = ? COLLATE NOCASE",
  );
  const getUserById = db.prepare("SELECT * FROM users WHERE id = ?");
  const insertUser = db.prepare(
    "INSERT INTO users (name, email, passwordHash, salt, createdAt) VALUES (?, ?, ?, ?, ?)",
  );

  const getAll = db.prepare(
    "SELECT * FROM tasks ORDER BY createdAt DESC, id DESC",
  );
  const getAllByUser = db.prepare(
    "SELECT * FROM tasks WHERE userId = ? OR userId IS NULL ORDER BY createdAt DESC, id DESC",
  );
  const getById = db.prepare("SELECT * FROM tasks WHERE id = ?");
  const insert = db.prepare(
    "INSERT INTO tasks (title, description, completed, scheduledDate, userId, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
  );
  const update = db.prepare(
    "UPDATE tasks SET title = ?, description = ?, completed = ?, scheduledDate = ? WHERE id = ?",
  );
  const remove = db.prepare("DELETE FROM tasks WHERE id = ?");

  // GET /api/health — simple liveness check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // POST /api/auth/signup (or /register)
  app.post(["/api/auth/signup", "/api/auth/register"], (req, res) => {
    const { name, email, password } = req.body ?? {};

    const nameErr = validateName(name);
    if (nameErr) return res.status(400).json({ error: nameErr });

    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ error: emailErr });

    const passErr = validatePassword(password);
    if (passErr) return res.status(400).json({ error: passErr });

    const existing = getUserByEmail.get(email.trim().toLowerCase());
    if (existing) {
      return res
        .status(400)
        .json({ error: "An account with this email already exists." });
    }

    const { hash, salt } = hashPassword(password);
    const info = insertUser.run(
      name.trim(),
      email.trim().toLowerCase(),
      hash,
      salt,
      new Date().toISOString(),
    );

    const newUser = getUserById.get(info.lastInsertRowid);
    const safeUser = toUser(newUser);
    const token = generateToken({
      userId: safeUser.id,
      email: safeUser.email,
      name: safeUser.name,
    });

    res.status(201).json({ user: safeUser, token });
  });

  // POST /api/auth/login (or /signin)
  app.post(["/api/auth/login", "/api/auth/signin"], (req, res) => {
    const { email, password } = req.body ?? {};

    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ error: emailErr });

    if (!password) {
      return res.status(400).json({ error: "Password is required." });
    }

    const user = getUserByEmail.get(email.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const valid = verifyPassword(password, user.passwordHash, user.salt);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const safeUser = toUser(user);
    const token = generateToken({
      userId: safeUser.id,
      email: safeUser.email,
      name: safeUser.name,
    });

    res.json({ user: safeUser, token });
  });

  // GET /api/auth/me — returns current authenticated user
  app.get("/api/auth/me", requireAuth, (req, res) => {
    const user = getUserById.get(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json({ user: toUser(user) });
  });

  // GET /api/tasks — list all tasks, newest first
  app.get("/api/tasks", requireAuth, (req, res) => {
    const list = getAllByUser.all(req.user.userId);
    res.json(list.map(toTask));
  });

  // POST /api/tasks — create a task. Body: { title, description?, scheduledDate? }
  app.post("/api/tasks", requireAuth, (req, res) => {
    const { title, description = "", scheduledDate = null } = req.body ?? {};

    const error = validateTitle(title);
    if (error) return res.status(400).json({ error });
    if (typeof description !== "string") {
      return res.status(400).json({ error: "Description must be a string." });
    }
    const dateError = validateScheduledDate(scheduledDate);
    if (dateError) return res.status(400).json({ error: dateError });

    const cleanDate =
      typeof scheduledDate === "string" && scheduledDate.trim() !== ""
        ? scheduledDate.trim()
        : null;

    const userId = req.user.userId;

    const info = insert.run(
      title.trim(),
      description.trim(),
      0,
      cleanDate,
      userId,
      new Date().toISOString(),
    );
    res.status(201).json(toTask(getById.get(info.lastInsertRowid)));
  });

  // PATCH /api/tasks/:id — edit a task or toggle completion.
  // Body may include any of: { title, description, completed, scheduledDate }
  app.patch("/api/tasks/:id", requireAuth, (req, res) => {
    const existing = getById.get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Task not found." });

    const title =
      req.body.title !== undefined ? req.body.title : existing.title;
    const description =
      req.body.description !== undefined
        ? req.body.description
        : existing.description;
    const completed =
      req.body.completed !== undefined
        ? req.body.completed
        : existing.completed === 1;

    let scheduledDate = existing.scheduledDate;
    if (req.body.scheduledDate !== undefined) {
      const dateError = validateScheduledDate(req.body.scheduledDate);
      if (dateError) return res.status(400).json({ error: dateError });
      scheduledDate =
        typeof req.body.scheduledDate === "string" &&
        req.body.scheduledDate.trim() !== ""
          ? req.body.scheduledDate.trim()
          : null;
    }

    const error = validateTitle(title);
    if (error) return res.status(400).json({ error });
    if (typeof description !== "string") {
      return res.status(400).json({ error: "Description must be a string." });
    }
    if (typeof completed !== "boolean") {
      return res.status(400).json({ error: "Completed must be a boolean." });
    }

    update.run(
      title.trim(),
      description.trim(),
      completed ? 1 : 0,
      scheduledDate,
      existing.id,
    );
    res.json(toTask(getById.get(existing.id)));
  });

  // DELETE /api/tasks/:id — remove a task
  app.delete("/api/tasks/:id", requireAuth, (req, res) => {
    const existing = getById.get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Task not found." });

    remove.run(existing.id);
    res.status(204).end();
  });

  // POST /api/tasks/send-email — send scheduled tasks agenda to Gmail / email
  // Body: { to, subject?, taskId?, taskIds?, sendAllScheduled? }
  app.post("/api/tasks/send-email", requireAuth, async (req, res) => {
    try {
      const { to, subject, taskId, taskIds, sendAllScheduled } = req.body ?? {};

      if (!to || typeof to !== "string" || !to.includes("@")) {
        return res
          .status(400)
          .json({ error: "A valid recipient email address is required." });
      }

      let targetTasks = [];
      if (taskId) {
        const found = getById.get(taskId);
        if (found) targetTasks = [toTask(found)];
      } else if (Array.isArray(taskIds) && taskIds.length > 0) {
        targetTasks = taskIds
          .map((id) => getById.get(id))
          .filter(Boolean)
          .map(toTask);
      } else if (sendAllScheduled) {
        targetTasks = getAll
          .all()
          .map(toTask)
          .filter((t) => Boolean(t.scheduledDate));
      } else {
        targetTasks = getAll.all().map(toTask);
      }

      if (targetTasks.length === 0) {
        return res.status(400).json({
          error: "No matching tasks found to send.",
        });
      }

      const emailSubject =
        subject && typeof subject === "string" && subject.trim()
          ? subject.trim()
          : targetTasks.length === 1
            ? `Task: ${targetTasks[0].title}`
            : `Task Tracker Agenda (${targetTasks.length} tasks)`;

      const { plainText, html } = formatTaskEmail(targetTasks, emailSubject);

      const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
      const gmailPass =
        process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

      // Direct compose URL for 1-click web Gmail fallback / access
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        to,
      )}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(
        plainText,
      )}`;

      if (gmailUser && gmailPass) {
        try {
          const transporter = nodemailer.createTransport({
            service: process.env.SMTP_SERVICE || "gmail",
            auth: {
              user: gmailUser,
              pass: gmailPass,
            },
          });

          const info = await transporter.sendMail({
            from: `"Task Tracker" <${gmailUser}>`,
            to,
            subject: emailSubject,
            text: plainText,
            html,
          });

          return res.json({
            success: true,
            sent: true,
            messageId: info.messageId,
            message: `Email successfully sent to ${to}!`,
            taskCount: targetTasks.length,
            gmailUrl,
          });
        } catch (mailErr) {
          console.error("Nodemailer dispatch error:", mailErr);
          // Return simulated success with compose link so user is never blocked
          return res.json({
            success: true,
            sent: false,
            simulated: true,
            warning:
              "SMTP delivery encountered an issue. You can send directly using the Gmail Compose link.",
            errorDetails: mailErr.message,
            message: `Email prepared for ${to}.`,
            taskCount: targetTasks.length,
            gmailUrl,
          });
        }
      }

      // SMTP not configured: provide direct Gmail link and preview
      return res.json({
        success: true,
        sent: false,
        simulated: true,
        message:
          "Email prepared! Click 'Open in Gmail' to send via your browser, or configure GMAIL_USER and GMAIL_APP_PASSWORD in Backend/.env for background SMTP delivery.",
        taskCount: targetTasks.length,
        gmailUrl,
        preview: {
          to,
          subject: emailSubject,
          bodySnippet: plainText.slice(0, 300),
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to prepare or send email." });
    }
  });

  // POST /api/tasks/:id/send-email — convenience endpoint to email a single task
  app.post("/api/tasks/:id/send-email", requireAuth, (req, res, next) => {
    req.body = { ...req.body, taskId: req.params.id };
    app._router.handle(
      Object.assign(req, { url: "/api/tasks/send-email", method: "POST" }),
      res,
      next,
    );
  });

  // 404 for any other /api route, with a JSON body
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found." });
  });

  // In production (npm start) the backend also serves the
  // frontend build, so the whole app runs from one server.
  // We check case-insensitive / variations to ensure it works across environments.
  const candidateDirs = [
    path.join(__dirname, "../../Frontend/dist"),
    path.join(__dirname, "../../frontend/dist"),
    path.join(__dirname, "../frontend/dist"),
    path.join(__dirname, "../Frontend/dist"),
  ];
  const distDir = candidateDirs.find((dir) => fs.existsSync(dir));

  if (distDir) {
    app.use(express.static(distDir));
    app.get("*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));
  }

  // Central error handler — any thrown error becomes a clean JSON 500
  // instead of an HTML stack trace.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Something went wrong on the server." });
  });

  return app;
}
