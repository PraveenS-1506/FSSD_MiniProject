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

type ScheduleResult = ScheduleItem[] | { error: string };

function generateSchedule(
  tasks: Task[],
  dailyHours: number,
  startDate: string
): ScheduleResult {
  let schedule: ScheduleItem[] = [];
  let currentDate = new Date(startDate);

  // sort tasks by deadline
  tasks.sort(
    (a, b) =>
      new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  for (let task of tasks) {
    let remaining = task.hours;

    while (remaining > 0) {
      // deadline check
      if (currentDate > new Date(task.deadline)) {
        return { error: `Not enough time for ${task.title}` };
      }

      const hoursToday = Math.min(dailyHours, remaining);

      schedule.push({
        date: currentDate.toDateString(),
        task: task.title,
        hours: hoursToday,
      });

      remaining -= hoursToday;

      // move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return schedule;
}

export default generateSchedule;