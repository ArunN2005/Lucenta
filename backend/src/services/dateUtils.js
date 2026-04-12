function startOfDay(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getCurrentWeekBounds(refDate = new Date()) {
  const today = startOfDay(refDate);
  const day = today.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - diffToMonday);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return { weekStart, weekEnd };
}

function getNextWeekBounds(refDate = new Date()) {
  const { weekStart } = getCurrentWeekBounds(refDate);
  const nextStart = new Date(weekStart);
  nextStart.setDate(weekStart.getDate() + 7);
  const nextEnd = new Date(nextStart);
  nextEnd.setDate(nextStart.getDate() + 6);
  return { weekStart: nextStart, weekEnd: nextEnd };
}

function toDateOnly(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getIsoWeekNumber(date = new Date()) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstDayNr = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNr + 3);
  const weekNo = 1 + Math.round((target - firstThursday) / 604800000);
  return Math.max(1, Math.min(52, weekNo));
}

function daysRemaining(weekEnd) {
  const end = startOfDay(new Date(weekEnd));
  const today = startOfDay(new Date());
  const diff = Math.ceil((end - today) / 86400000);
  return Math.max(0, diff + 1);
}

module.exports = {
  getCurrentWeekBounds,
  getNextWeekBounds,
  toDateOnly,
  getIsoWeekNumber,
  daysRemaining,
};
