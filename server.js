// server.js
import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static("public")); // serves your front-end files

// Database setup
const dbPromise = open({
  filename: path.join(process.cwd(), "clients.db"),
  driver: sqlite3.Database,
});

// Initialize table if not exists
(async () => {
  const db = await dbPromise;
  await db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      balance REAL DEFAULT 0,
      workplace TEXT
    )
  `);
})();

// CRUD Routes
app.get("/api/clients", async (req, res) => {
  const db = await dbPromise;
  const clients = await db.all("SELECT * FROM clients ORDER BY id DESC");
  res.json(clients);
});

app.post("/api/clients", async (req, res) => {
  const { name, phone, balance, workplace } = req.body;
  const db = await dbPromise;
  await db.run(
    "INSERT INTO clients (name, phone, balance, workplace) VALUES (?, ?, ?, ?)",
    [name, phone, balance, workplace]
  );
  res.status(201).json({ message: "Client added" });
});

app.put("/api/clients/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phone, balance, workplace } = req.body;
  const db = await dbPromise;
  await db.run(
    "UPDATE clients SET name = ?, phone = ?, balance = ?, workplace = ? WHERE id = ?",
    [name, phone, balance, workplace, id]
  );
  res.json({ message: "Client updated" });
});

app.delete("/api/clients/:id", async (req, res) => {
  const { id } = req.params;
  const db = await dbPromise;
  await db.run("DELETE FROM clients WHERE id = ?", [id]);
  res.json({ message: "Client deleted" });
});

app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${port}`)
);
