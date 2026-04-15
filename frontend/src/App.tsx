import React, { useState, useEffect } from "react";
import "./App.css";
import Calendar from "./Calendar";

type ScheduleItem = { date: string; task: string; hours: number };

function App() {
  const [page, setPage] = useState<"home" | "calendar">("home");

  // Task form
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState("");
  const [deadline, setDeadline] = useState("");

  // Slot settings
  const [dailyHours, setDailyHours] = useState("");
  const [startDate, setStartDate] = useState("");
  const [slotSaved, setSlotSaved] = useState(false);

  useEffect(() => {
    fetch("/slots")
      .then(r => r.json())
      .then(data => {
        if (data.data?.length) {
          const latest = data.data[data.data.length - 1];
          setDailyHours(String(latest.daily_hours));
          setStartDate(latest.start_date.split("T")[0]);
          setSlotSaved(true);
        }
      });
  }, []);

  const [message, setMessage] = useState("");
  const [skipped, setSkipped] = useState<string[]>([]);

  const notify = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const addTask = async () => {
    if (!slotSaved || !dailyHours || !startDate) {
      notify("❌ Please save a daily slot before adding tasks");
      return;
    }

    const start = new Date(startDate);
    const due = new Date(deadline);
    const availableDays = Math.floor((due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const availableHours = availableDays * Number(dailyHours);

    if (availableHours < Number(hours)) {
      notify(`❌ Not enough time — only ${availableHours}h available before deadline but task needs ${hours}h`);
      return;
    }

    const res = await fetch("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, hours: Number(hours), deadline }),
    });
    const data = await res.json();
    if (res.ok) {
      const schedRes = await fetch("/schedule");
      const schedData = await schedRes.json();
      if (schedData.skipped?.includes(title.trim())) {
        setSkipped(schedData.skipped);
      } else {
        setTitle(""); setHours(""); setDeadline("");
        notify(`✅ ${data.message}`);
        setSkipped(schedData.skipped ?? []);
      }
    } else {
      notify(`❌ ${data.error}`);
    }
  };

  const saveSlot = async () => {
    const res = await fetch("/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dailyHours: Number(dailyHours), startDate }),
    });
    const data = await res.json();
    if (res.ok) { setSlotSaved(true); notify("✅ Slot saved"); }
    else notify(`❌ ${data.error}`);
  };

  return (
    <div className="container">
      <nav>
        <span className="nav-title">Task Scheduler</span>
        <div className="nav-links">
          <button className={page === "home" ? "nav-btn active" : "nav-btn"} onClick={() => setPage("home")}>Home</button>
          <button className={page === "calendar" ? "nav-btn active" : "nav-btn"} onClick={() => setPage("calendar")}>📅 Calendar</button>
        </div>
      </nav>

      {message && <div className="toast">{message}</div>}
      {skipped.length > 0 && (
        <div className="toast warning">⚠️ Skipped (not enough time): {skipped.join(", ")}</div>
      )}

      {page === "calendar" ? <Calendar /> : (
        <>
          <div className="card">
            <h2>⚙️ Daily Study Slot</h2>
            <p className="hint">Set how many hours per day you can study and when to start. This applies to all tasks.</p>
            <div className="row">
              <input placeholder="Hours per day" type="number" value={dailyHours} onChange={e => { setDailyHours(e.target.value); setSlotSaved(false); }} />
              <input placeholder="Start date" type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setSlotSaved(false); }} />
              <button onClick={saveSlot}>{slotSaved ? "✅ Saved" : "Save"}</button>
            </div>
          </div>

          <div className="card">
            <h2>➕ Add Task</h2>
            <input placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)} />
            <input placeholder="Hours needed" type="number" value={hours} onChange={e => setHours(e.target.value)} />
            <input placeholder="Deadline" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
            <button onClick={addTask}>Add Task</button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
