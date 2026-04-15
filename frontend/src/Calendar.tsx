import React, { useEffect, useState, useCallback } from "react";

type ScheduleItem = { date: string; task: string; hours: number };
type Task = { id: number; title: string; hours: number; deadline: string };

function Calendar() {
  const [grouped, setGrouped] = useState<Record<string, ScheduleItem[]>>({});
  const [skipped, setSkipped] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");

  const loadSchedule = useCallback(() => {
    fetch("/schedule")
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setGrouped({}); return; }
        setError("");
        if (data.skipped?.length) setSkipped(data.skipped); else setSkipped([]);
        const map: Record<string, ScheduleItem[]> = {};
        (data.data as ScheduleItem[]).forEach(item => {
          if (!map[item.date]) map[item.date] = [];
          map[item.date].push(item);
        });
        setGrouped(map);
      })
      .catch(() => setError("Could not load schedule. Make sure the backend is running."));
  }, []);

  const loadTasks = useCallback(() => {
    fetch("/tasks")
      .then(r => r.json())
      .then(data => setTasks(data.data ?? []));
  }, []);

  useEffect(() => { loadSchedule(); loadTasks(); }, [loadSchedule, loadTasks]);

  const deleteTask = async (id: number) => {
    await fetch(`/tasks/${id}`, { method: "DELETE" });
    loadTasks();
    loadSchedule();
  };

  return (
    <div className="container">
      <h1>📅 Schedule Calendar</h1>

      {error && <div className="toast">❌ {error}</div>}
      {skipped.length > 0 && (
        <div className="toast warning">⚠️ Skipped (not enough time): {skipped.join(", ")}</div>
      )}

      <div className="card">
        <h2>📋 Current Tasks</h2>
        {tasks.length === 0
          ? <p style={{ color: "#888", fontSize: "0.9rem" }}>No tasks added yet.</p>
          : <table>
              <thead><tr><th>Task</th><th>Hours</th><th>Due Date</th><th></th></tr></thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id}>
                    <td>{t.title}</td>
                    <td>{t.hours}h</td>
                    <td>{new Date(t.deadline).toDateString()}</td>
                    <td>
                      <button className="delete-btn" onClick={() => deleteTask(t.id)}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>

      {Object.keys(grouped).length === 0 && !error && (
        <div className="card"><p style={{ color: "#888" }}>No schedule yet. Add tasks and a slot on the home page first.</p></div>
      )}

      {Object.entries(grouped).map(([date, items]) => (
        <div className="card" key={date}>
          <h2>{date}</h2>
          <table>
            <thead><tr><th>Task</th><th>Hours</th></tr></thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td>{item.task}</td>
                  <td>{item.hours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="day-total">Total: {items.reduce((s, i) => s + i.hours, 0)}h</div>
        </div>
      ))}
    </div>
  );
}

export default Calendar;
