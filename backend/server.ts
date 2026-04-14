import express, { Request, Response } from "express";
import cors from "cors";
import generateSchedule from "./scheduler";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

type Task = {
  title: string;
  hours: number;
  deadline: string;
};

type Slot = {
  dailyHours: number;
  startDate: string;
};

let tasks: Task[] = [];
let slots: Slot[] = [];

// Helper: Validate date format (YYYY-MM-DD)
const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

// POST /tasks - store task
app.post("/tasks", (req: Request, res: Response) => {
  try {
    const { title, hours, deadline } = req.body;
    
    // Validation
    if (!title || typeof title !== "string" || title.trim() === "") {
      console.log("[ERROR] Task title is required");
      return res.status(400).json({ error: "Task title is required and must be a non-empty string" });
    }
    
    if (!hours || typeof hours !== "number" || hours <= 0) {
      console.log("[ERROR] Invalid hours value:", hours);
      return res.status(400).json({ error: "Hours must be a positive number" });
    }
    
    if (!deadline || !isValidDate(deadline)) {
      console.log("[ERROR] Invalid deadline:", deadline);
      return res.status(400).json({ error: "Deadline must be a valid date in YYYY-MM-DD format" });
    }
    
    const task: Task = { title: title.trim(), hours, deadline };
    tasks.push(task);
    console.log("[SUCCESS] Task added:", task);
    res.status(201).json({ message: "Task added successfully", data: task });
  } catch (error) {
    console.error("[ERROR] Failed to add task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /tasks - return tasks
app.get("/tasks", (req: Request, res: Response) => {
  try {
    console.log(`[INFO] Fetching tasks. Total: ${tasks.length}`);
    if (tasks.length === 0) {
      return res.json({ message: "No tasks found", data: [] });
    }
    res.json({ message: "Tasks retrieved successfully", data: tasks });
  } catch (error) {
    console.error("[ERROR] Failed to fetch tasks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /slots - store study slots
app.post("/slots", (req: Request, res: Response) => {
  try {
    const { dailyHours, startDate } = req.body;
    
    // Validation
    if (!dailyHours || typeof dailyHours !== "number" || dailyHours <= 0) {
      console.log("[ERROR] Invalid dailyHours:", dailyHours);
      return res.status(400).json({ error: "Daily hours must be a positive number" });
    }
    
    if (!startDate || !isValidDate(startDate)) {
      console.log("[ERROR] Invalid startDate:", startDate);
      return res.status(400).json({ error: "Start date must be a valid date in YYYY-MM-DD format" });
    }
    
    const slot: Slot = { dailyHours, startDate };
    slots.push(slot);
    console.log("[SUCCESS] Slot added:", slot);
    res.status(201).json({ message: "Slot added successfully", data: slot });
  } catch (error) {
    console.error("[ERROR] Failed to add slot:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /slots - return slots
app.get("/slots", (req: Request, res: Response) => {
  try {
    console.log(`[INFO] Fetching slots. Total: ${slots.length}`);
    if (slots.length === 0) {
      return res.json({ message: "No slots found", data: [] });
    }
    res.json({ message: "Slots retrieved successfully", data: slots });
  } catch (error) {
    console.error("[ERROR] Failed to fetch slots:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /schedule - call scheduler function and return result
app.get("/schedule", (req: Request, res: Response) => {
  try {
    console.log("[INFO] Generating schedule...");
    
    if (tasks.length === 0) {
      console.log("[ERROR] No tasks available for scheduling");
      return res.status(400).json({ error: "No tasks available. Please add tasks first using POST /tasks" });
    }
    
    if (slots.length === 0) {
      console.log("[ERROR] No slots configured");
      return res.status(400).json({ error: "No slots configured. Please add a slot using POST /slots" });
    }
    
    const latestSlot = slots[slots.length - 1];
    console.log("[INFO] Using slot:", latestSlot);
    console.log("[INFO] Processing tasks:", tasks.length);
    
    const result = generateSchedule(tasks, latestSlot.dailyHours, latestSlot.startDate);
    
    // Check if scheduler returned an error
    if (result && typeof result === "object" && "error" in result) {
      console.log("[ERROR] Scheduler error:", result.error);
      return res.status(400).json({ error: result.error });
    }
    
    console.log("[SUCCESS] Schedule generated successfully");
    res.json({ message: "Schedule generated successfully", data: result });
  } catch (error) {
    console.error("[ERROR] Failed to generate schedule:", error);
    res.status(500).json({ error: "Internal server error while generating schedule" });
  }
});

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`========================================\n`);
});
