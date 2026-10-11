const WeatherAlert = require("../../database/models/WeatherAlert");

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || "http://localhost:8000";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getCondition(weatherCode) {
  const code = Number(weatherCode);

  if (code === 0) return { condition: "Sunny", icon: "sun" };
  if ([1, 2].includes(code))
    return { condition: "Partly Cloudy", icon: "cloud-sun" };
  if (code === 3)
    return { condition: "Overcast", icon: "cloud" };
  if ([45, 48].includes(code))
    return { condition: "Foggy", icon: "cloud" };
  if ([51, 53, 55, 56, 57].includes(code))
    return { condition: "Drizzle", icon: "cloud-rain" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return { condition: "Rain", icon: "cloud-rain" };
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return { condition: "Snow", icon: "cloud-snow" };
  if ([95, 96, 99].includes(code))
    return { condition: "Thunderstorm", icon: "cloud-lightning" };

  return { condition: "Unknown", icon: "cloud" };
}

function getAdvisory(rainProbability, rainMm, windKmh) {
  if (rainMm >= 20 || rainProbability >= 80) {
    return "Heavy rain risk: check field drainage and postpone unnecessary spraying.";
  }

  if (windKmh >= 35) {
    return "Strong winds expected: secure crops and avoid spraying during windy periods.";
  }

  if (rainProbability >= 50) {
    return "Rain is possible: check the forecast before irrigation or fertilizer application.";
  }

  if (rainProbability <= 20 && rainMm < 2) {
    return "Low rainfall probability: check soil moisture before irrigating.";
  }

  return "Monitor local soil moisture and weather conditions before field operations.";
}

async function buildWeatherData(location = {}) {
  const district =
    typeof location.district === "string" ? location.district.trim() : "";

  const latitude = Number(location.lat);
  const longitude = Number(location.lng);

  const hasCoordinates =
    location.lat !== undefined &&
    location.lng !== undefined &&
    location.lat !== null &&
    location.lng !== null &&
    location.lat !== "" &&
    location.lng !== "" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    (latitude !== 0 || longitude !== 0);

  const hasDistrict = district.length > 0;

  let weather = null;
  let weatherError = null;

  if (hasCoordinates || hasDistrict) {
    const place = encodeURIComponent(district || "Registered location");
    const query = new URLSearchParams();

    if (hasCoordinates) {
      query.set("latitude", String(latitude));
      query.set("longitude", String(longitude));
    }

    const url =
      `${AI_SERVICE_URL.replace(/\/+$/, "")}/weather/${place}` +
      (query.size ? `?${query.toString()}` : "");

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`AI weather service returned HTTP ${response.status}`);
      }

      weather = await response.json();

      if (!weather.current || !weather.forecast_7_day) {
        throw new Error("AI weather service returned an invalid forecast.");
      }
    } catch (error) {
      weatherError = error;
      console.error("Live weather retrieval failed:", error.message);
    }
  }

  const alertsPromise = WeatherAlert.find()
    .sort({ createdAt: -1, _id: -1 })
    .limit(10)
    .lean();

  const alerts = await alertsPromise;

  const microclimateAlerts = alerts.map((alert) => ({
    id: String(alert._id),
    severity: alert.severity || "warning",
    title: alert.title || "",
    message: alert.message || "",
    validUntil: alert.validUntil || "",
    actionRequired: alert.actionRequired || "",
  }));

  if (!weather) {
    return {
      current: {
        tempCelsius: 0,
        feelsLike: 0,
        condition: "Weather unavailable",
        icon: "cloud-off",
        humidityPercent: 0,
        windSpeedKmh: 0,
        precipitationProbability: 0,
        uvIndex: 0,
        solarRadiationWsqm: 0,
        soilTempCelsius: 0,
      },
      dailyForecast: [],
      microclimateAlerts,
      location: {
        district,
        latitude: hasCoordinates ? latitude : null,
        longitude: hasCoordinates ? longitude : null,
      },
      source: "unavailable",
      retrievedAt: weather?.retrieved_at || null,
      error: weatherError
        ? "Live weather is temporarily unavailable. Please try again later."
        : "Register a district or valid GPS coordinates to see local weather.",
    };
  }

  const currentWeather = weather.current;
  const forecast = weather.forecast_7_day;
  const currentCondition = getCondition(currentWeather.weather_code);

  const current = {
    tempCelsius: Number(currentWeather.temperature_c ?? 0),
    feelsLike: Number(currentWeather.temperature_c ?? 0),
    condition: currentCondition.condition,
    icon: currentCondition.icon,
    humidityPercent: Number(currentWeather.relative_humidity_pct ?? 0),
    windSpeedKmh: Number(currentWeather.wind_speed_kmh ?? 0),
    precipitationProbability: Number(
      forecast.precipitation_prob_pct?.[0] ?? 0
    ),
    uvIndex: 0,
    solarRadiationWsqm: 0,
    soilTempCelsius: Number(currentWeather.temperature_c ?? 0),
  };

  const dailyForecast = (forecast.dates || []).map((date, index) => {
    const tempMin = Number(forecast.temp_min_c?.[index] ?? 0);
    const tempMax = Number(forecast.temp_max_c?.[index] ?? 0);
    const rainProbability = Number(
      forecast.precipitation_prob_pct?.[index] ?? 0
    );
    const rainMm = Number(forecast.precipitation_sum_mm?.[index] ?? 0);
    const windKmh = Number(forecast.wind_speed_max_kmh?.[index] ?? 0);

    // Open-Meteo's current weather code is not a daily weather code.
    // Use precipitation and temperature data for a conservative display.
    const conditionData =
      rainProbability >= 60 || rainMm >= 5
        ? { condition: "Rain likely", icon: "cloud-rain" }
        : { condition: "Forecast", icon: "cloud-sun" };

    const parsedDate = new Date(`${date}T12:00:00+06:00`);

    return {
      date,
      dayName:
        index === 0
          ? "Today"
          : DAY_NAMES[parsedDate.getDay()],
      tempMin,
      tempMax,
      condition: conditionData.condition,
      icon: conditionData.icon,
      rainProbability,
      farmingAdvisory: getAdvisory(rainProbability, rainMm, windKmh),
    };
  });

  return {
    current,
    dailyForecast,
    microclimateAlerts,
    location: weather.location,
    source: weather.source || "Open-Meteo",
    retrievedAt: weather.retrieved_at || null,
  };
}

module.exports = { buildWeatherData };
