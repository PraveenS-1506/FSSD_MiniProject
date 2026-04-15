import express, { Request, Response } from "express";
import cors from "cors";
import generateSchedule from "./scheduler";
import pool, { initDB } from "./db";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const isValidDate = (d: string) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(d)) return false;
  return !isNaN(new Date(d).getTime());
};

app.post("/tasks", async (req: Request, res: Response) => {
  try {
    const { title, hours, deadline } = req.body;
    if (!title || typeof title !== "string" || title.trim() === "")
      return res.status(400).json({ error: "Task title is required and must be a non-empty string" });
    if (!hours || typeof hours !== "number" || hours <= 0)
      return res.status(400).json({ error: "Hours must be a positive number" });
    if (!deadline || !isValidDate(deadline))
      return res.status(400).json({ error: "Deadline must be a valid date in YYYY-MM-DD format" });

    const result = await pool.query(
      "INSERT INTO tasks (title, hours, deadline) VALUES ($1, $2, $3) RETURNING *",
      [title.trim(), hours, deadline]
    );
    res.status(201).json({ message: "Task added successfully", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/tasks", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM tasks ORDER BY id");
    res.json({ message: "Tasks retrieved successfully", data: result.rows });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/tasks/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM tasks WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Task not found" });
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/slots", async (req: Request, res: Response) => {
  try {
    const { dailyHours, startDate } = req.body;
    if (!dailyHours || typeof dailyHours !== "number" || dailyHours <= 0)
      return res.status(400).json({ error: "Daily hours must be a positive number" });
    if (!startDate || !isValidDate(startDate))
      return res.status(400).json({ error: "Start date must be a valid date in YYYY-MM-DD format" });

    const result = await pool.query(
      "INSERT INTO slots (daily_hours, start_date) VALUES ($1, $2) RETURNING *",
      [dailyHours, startDate]
    );
    res.status(201).json({ message: "Slot added successfully", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/slots", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM slots ORDER BY id");
    res.json({ message: "Slots retrieved successfully", data: result.rows });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/schedule", async (req: Request, res: Response) => {
  try {
    const tasksResult = await pool.query("SELECT * FROM tasks ORDER BY id");
    const slotsResult = await pool.query("SELECT * FROM slots ORDER BY id DESC LIMIT 1");

    if (tasksResult.rows.length === 0)
      return res.status(400).json({ error: "No tasks available. Please add tasks first." });
    if (slotsResult.rows.length === 0)
      return res.status(400).json({ error: "No slots configured. Please add a slot first." });

    const tasks = tasksResult.rows.map(r => ({
      title: r.title,
      hours: Number(r.hours),
      deadline: r.deadline.toISOString().split("T")[0],
    }));

    const latestSlot = slotsResult.rows[0];
    const { schedule, skipped } = generateSchedule(
      tasks,
      Number(latestSlot.daily_hours),
      latestSlot.start_date.toISOString().split("T")[0]
    );

    res.json({ message: "Schedule generated successfully", data: schedule, skipped });
  } catch (error) {
    res.status(500).json({ error: "Internal server error while generating schedule" });
  }
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`========================================\n`);
  });
});
