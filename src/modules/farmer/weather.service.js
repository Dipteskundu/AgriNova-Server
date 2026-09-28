const WeatherAlert = require("../../database/models/WeatherAlert");
const { dateOnly } = require("../../utils/dates");

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CONDITIONS = [
  { condition: "Partly Cloudy", icon: "cloud-sun" },
  { condition: "Sunny", icon: "sun" },
  { condition: "Light Rain", icon: "cloud-rain" },
  { condition: "Humid & Overcast", icon: "cloud" },
  { condition: "Thunderstorm", icon: "cloud-lightning" },
];

const ADVISORIES = [
  "Ideal window for irrigation and fertilizer application.",
  "Delay foliar spray - rain wash-off risk is elevated.",
  "Good day for land preparation and weeding operations.",
  "Monitor field humidity - fungal pressure rising.",
  "Secure harvested produce; sudden squalls possible.",
];

/** Deterministic pseudo-random in [0, 1) derived from a seed string. */
const seeded = (seed) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }
  return (hash % 1000) / 1000;
};

/**
 * Builds WeatherData from an algorithmic model (no external API key) plus the
 * DB-backed microclimate alerts broadcast by administrators.
 */
async function buildWeatherData() {
  const now = new Date();
  const hour = now.getHours();
  const seasonalBase = 26 + 6 * Math.sin(((now.getMonth() + 1) / 12) * Math.PI * 2);
  const dailySwing = seeded(dateOnly(now));

  const current = {
    tempCelsius: Math.round((seasonalBase + (hour > 11 && hour < 16 ? 4 : 0) + dailySwing * 3) * 10) / 10,
    feelsLike: Math.round((seasonalBase + 3 + dailySwing * 2) * 10) / 10,
    condition: CONDITIONS[Math.floor(dailySwing * CONDITIONS.length)].condition,
    icon: CONDITIONS[Math.floor(dailySwing * CONDITIONS.length)].icon,
    humidityPercent: Math.round(62 + dailySwing * 25),
    windSpeedKmh: Math.round(6 + dailySwing * 16),
    precipitationProbability: Math.round(dailySwing * 70),
    uvIndex: Math.round(3 + dailySwing * 7),
    solarRadiationWsqm: Math.round(280 + dailySwing * 500),
    soilTempCelsius: Math.round((seasonalBase - 1 + dailySwing) * 10) / 10,
  };

  const dailyForecast = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const variance = seeded(dateOnly(day));
    const pick = CONDITIONS[Math.floor(variance * CONDITIONS.length)];
    return {
      date: dateOnly(day),
      dayName: i === 0 ? "Today" : DAY_NAMES[day.getDay()],
      tempMin: Math.round(seasonalBase - 4 - variance * 3),
      tempMax: Math.round(seasonalBase + 4 + variance * 4),
      condition: pick.condition,
      icon: pick.icon,
      rainProbability: Math.round(variance * 80),
      farmingAdvisory: ADVISORIES[Math.floor(variance * ADVISORIES.length)],
    };
  });

  const alerts = await WeatherAlert.find().sort({ createdAt: -1, _id: -1 }).limit(10).lean();
  const microclimateAlerts = alerts.map((a) => ({
    id: String(a._id),
    severity: a.severity || "warning",
    title: a.title || "",
    message: a.message || "",
    validUntil: a.validUntil || "",
    actionRequired: a.actionRequired || "",
  }));

  return { current, dailyForecast, microclimateAlerts };
}

module.exports = { buildWeatherData };
