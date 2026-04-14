import generateSchedule from "./scheduler";

const tasks = [
  {
    title: "React Project",
    hours: 5,
    deadline: "2026-03-15",
  },
];

const dailyHours = 3;
const startDate = "2026-03-13";

const result = generateSchedule(tasks, dailyHours, startDate);

console.log(result);