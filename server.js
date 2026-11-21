const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const root = __dirname;
const dbDirectory = path.join(root, "Database");
const dbPath = path.join(dbDirectory, "school.sqlite");
fs.mkdirSync(dbDirectory, { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS admission_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_name TEXT NOT NULL,
    parent_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    class_applied TEXT NOT NULL,
    message TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function parseBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function clean(value, maxLength = 300) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const server = http.createServer(async (request, response) => {
  let pathname;
  try {
    const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    return response.end("Bad request");
  }

  if (request.method === "POST" && pathname === "/api/contact") {
    try {
      const data = await parseBody(request);
      const name = clean(data.name, 100);
      const email = clean(data.email, 150);
      const phone = clean(data.phone, 30);
      const subject = clean(data.subject, 150);
      const message = clean(data.message, 2000);
      if (!name || !isEmail(email) || message.length < 10) {
        return sendJson(response, 400, { success: false, message: "Please provide a name, valid email, and message." });
      }
      db.prepare(
        "INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)"
      ).run(name, email, phone, subject, message);
      return sendJson(response, 201, { success: true, message: "Thank you! Your message has been received." });
    } catch (error) {
      return sendJson(response, 400, { success: false, message: error.message || "Unable to process your message." });
    }
  }

  if (request.method === "POST" && pathname === "/api/admission") {
    try {
      const data = await parseBody(request);
      const studentName = clean(data.studentName, 100);
      const parentName = clean(data.parentName, 100);
      const email = clean(data.email, 150);
      const phone = clean(data.phone, 30);
      const classApplied = clean(data.classApplied, 50);
      const message = clean(data.message, 1000);
      if (!studentName || !parentName || !isEmail(email) || !phone || !classApplied) {
        return sendJson(response, 400, { success: false, message: "Please complete all required admission fields." });
      }
      db.prepare(
        "INSERT INTO admission_requests (student_name, parent_name, email, phone, class_applied, message) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(studentName, parentName, email, phone, classApplied, message);
      return sendJson(response, 201, { success: true, message: "Admission enquiry submitted successfully." });
    } catch (error) {
      return sendJson(response, 400, { success: false, message: error.message || "Unable to submit your enquiry." });
    }
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return sendJson(response, 405, { success: false, message: "Method not allowed" });
  }

  let relativePath = pathname === "/" ? "/Html/Index.html" : pathname;
  if (relativePath.endsWith("/")) relativePath += "Index.html";

  const filePath = path.normalize(path.join(root, relativePath.replace(/^[/\\]+/, "")));
  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    response.writeHead(403);
    return response.end("Forbidden");
  }

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      return response.end("<h1>404 - Page not found</h1>");
    }
    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream",
      "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=86400"
    });
    if (request.method === "HEAD") return response.end();
    fs.createReadStream(filePath).pipe(response);
  });
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, () => {
  console.log(`Rana Pratap School is running at http://localhost:${port}`);
});
