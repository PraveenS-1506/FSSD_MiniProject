type Task = {
  title: string;
  hours: number;
  deadline: string; // YYYY-MM-DD
};

type ScheduleItem = {
  date: string;
  task: string;
  hours: number;
};

type ScheduleResult = { schedule: ScheduleItem[]; skipped: string[] };

function generateSchedule(
  tasks: Task[],
  dailyHours: number,
  startDate: string
): ScheduleResult {
  let schedule: ScheduleItem[] = [];
  let skipped: string[] = [];
  let currentDate = new Date(startDate);
  let hoursLeftToday = dailyHours;

  tasks.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  for (let task of tasks) {
    let remaining = task.hours;
    const savedDate = new Date(currentDate);
    const savedHoursLeft = hoursLeftToday;
    const savedScheduleLen = schedule.length;

    let fits = true;
    while (remaining > 0) {
      if (currentDate >= new Date(task.deadline)) {
        fits = false;
        break;
      }

      const hoursToday = Math.min(hoursLeftToday, remaining);
      schedule.push({ date: currentDate.toDateString(), task: task.title, hours: hoursToday });
      remaining -= hoursToday;
      hoursLeftToday -= hoursToday;

      if (hoursLeftToday === 0) {
        currentDate.setDate(currentDate.getDate() + 1);
        hoursLeftToday = dailyHours;
      }
    }

    if (!fits) {
      schedule = schedule.slice(0, savedScheduleLen);
      currentDate = savedDate;
      hoursLeftToday = savedHoursLeft;
      skipped.push(task.title);
    }
  }

  return { schedule, skipped };
}

export default generateSchedule;