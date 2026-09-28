const today = () => new Date().toISOString().slice(0, 10);

const pad = (n) => String(n).padStart(2, "0");

const nowStamp = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const toDateOnly = (value) => {
  if (!value) return today();
  const raw = String(value);
  return raw.length >= 10 ? raw.slice(0, 10) : today();
};

const dateOnly = (value) => {
  if (!value) return today();
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return today();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

module.exports = { today, nowStamp, toDateOnly, dateOnly };
