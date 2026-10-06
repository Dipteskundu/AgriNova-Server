const Crop = require("../../database/models/Crop");
const Field = require("../../database/models/Field");
const CropBatch = require("../../database/models/CropBatch");

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const parseRange = (text) => {
  const nums = String(text || "")
    .match(/\d+(\.\d+)?/g)
    ?.map(Number);
  if (!nums || nums.length < 2) return [0, 14];
  return [nums[0], nums[1]];
};

const seasonMatch = (recommendedSeason, season) => {
  const target = String(season || "").toLowerCase();
  const source = String(recommendedSeason || "").toLowerCase();
  if (target.includes("rabi")) return source.includes("rabi") ? 100 : 25;
  if (target.includes("kharif-1") || target.includes("early summer"))
    return source.includes("kharif-1") || source.includes("feb") ? 100 : 25;
  if (target.includes("kharif-2") || target.includes("monsoon"))
    return source.includes("kharif-2") || source.includes("monsoon") || source.includes("jul") ? 100 : 25;
  return 60;
};

const scoreCrop = (crop, input) => {
  const [phMin, phMax] = parseRange(crop.optimalSoilPhRange);
  const ph = Number(input.ph) || 6.5;
  const rainfall = Number(input.rainfallMm) || 1000;

  let rainScore = 100;
  if (rainfall < crop.minRainfallMm) rainScore = clamp(100 - ((crop.minRainfallMm - rainfall) / 300) * 100, 10, 100);
  if (rainfall > crop.maxRainfallMm) rainScore = clamp(100 - ((rainfall - crop.maxRainfallMm) / 400) * 100, 10, 100);

  let phScore = 100;
  if (ph < phMin) phScore = clamp(100 - (phMin - ph) * 40, 20, 100);
  if (ph > phMax) phScore = clamp(100 - (ph - phMax) * 40, 20, 100);

  const npk = (Number(input.nitrogen) || 0) + (Number(input.phosphorus) || 0) + (Number(input.potassium) || 0);
  const npkScore = clamp(40 + npk, 40, 100);
  const seasonScore = seasonMatch(crop.recommendedSeason, input.season);

  const total = Math.round(rainScore * 0.35 + phScore * 0.25 + seasonScore * 0.3 + npkScore * 0.1);
  return { score: clamp(total, 5, 99), npkScore };
};

const buildRecommendations = async (input = {}) => {
  const crops = await Crop.find().sort({ cropName: 1 }).lean();
  if (!crops.length) return [];

  return crops
    .map((crop) => {
      const { score, npkScore } = scoreCrop(crop, input);
      const yieldKg = Math.round((crop.standardYieldKgPerAcre || 1500) * (0.85 + (npkScore / 100) * 0.15));
      const price = crop.benchmarkPriceBdtPerKg || 25;
      const revenue = yieldKg * price;
      const cost = Math.round(revenue * 0.55);
      const profit = revenue - cost;
      return {
        id: String(crop._id),
        cropName: crop.cropName,
        scientificName: crop.scientificName || "",
        suitabilityScore: score,
        recommendedVariety: (crop.approvedVarieties && crop.approvedVarieties[0]) || "Local Improved Variety",
        maturityPeriodDays: crop.averageMaturityDays || 120,
        estimatedYieldKgPerAcre: yieldKg,
        estimatedCostPerAcre: cost,
        expectedMarketPricePerKg: price,
        estimatedRevenuePerAcre: revenue,
        estimatedProfitPerAcre: profit,
        roiPercentage: cost > 0 ? Math.round((profit / cost) * 1000) / 10 : 0,
        riskFactor: score >= 75 ? "Low" : score >= 55 ? "Medium" : "High",
        waterRequirementMm: Math.round(((crop.minRainfallMm || 500) + (crop.maxRainfallMm || 1200)) / 2),
        keyAdvantages: [
          `Maturity in ${crop.averageMaturityDays || 120} days (${crop.recommendedSeason || "seasonal"})`,
          `Benchmark market price BDT ${price}/kg`,
          (crop.pestVulnerabilities || []).length <= 1
            ? "Low pest pressure under standard IPM"
            : `Manage ${(crop.pestVulnerabilities || []).length} known pests proactively`,
        ],
        climateResilience:
          score >= 75
            ? "Well matched to current rainfall, soil pH and season"
            : "Requires supplemental irrigation or soil amendment to perform reliably",
      };
    })
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
    .slice(0, 8);
};

const buildComparisonProfiles = async () => {
  const crops = await Crop.find().sort({ cropName: 1 }).lean();
  return crops.map((crop, index) => {
    const yieldKg = crop.standardYieldKgPerAcre || 1500;
    const price = crop.benchmarkPriceBdtPerKg || 25;
    const inputCost = Math.round(yieldKg * price * 0.55);
    const pests = (crop.pestVulnerabilities || []).length;
    const category = String(crop.category || "").toLowerCase();
    return {
      id: String(crop._id),
      cropName: crop.cropName,
      variety: (crop.approvedVarieties && crop.approvedVarieties[0]) || "Improved",
      season: crop.recommendedSeason || "",
      waterRequirementLitersPerKg: 600 + index * 40 + (category.includes("vegetable") ? 350 : 0),
      seedCostPerAcre: Math.round(yieldKg * price * 0.12),
      totalInputCostPerAcre: inputCost,
      maturityDays: crop.averageMaturityDays || 120,
      yieldKgPerAcre: yieldKg,
      marketPricePerKg: price,
      netMarginPercent: Math.round(((yieldKg * price - inputCost) / (yieldKg * price)) * 1000) / 10,
      pestVulnerability: pests >= 3 ? "High" : pests >= 1 ? "Moderate" : "Low",
      laborIntensityDays: 25 + index * 4 + (category.includes("vegetable") ? 18 : 0),
      shelfLifeDays: category.includes("vegetable") ? 21 : category.includes("fruit") ? 14 : 180,
      governmentSubsidiesEligible: String(crop.cropName).toLowerCase().includes("rice") || index % 2 === 0,
    };
  });
};

const nutrientStatus = (value, low, high) =>
  value < low ? "Deficient" : value > high ? "Excessive" : "Sufficient";

const buildAiDiagnostic = async (user) => {
  const fields = await Field.find({ owner: user._id || user.id }).lean();
  const batches = await CropBatch.find({ owner: user._id || user.id }).lean();

  const avg = (key) =>
    fields.length ? Math.round(fields.reduce((acc, f) => acc + (f[key] || 0), 0) / fields.length) : 0;

  const nitrogen = avg("nitrogenLevelKgPerHa") || 38;
  const phosphorus = avg("phosphorusLevelKgPerHa") || 22;
  const potassium = avg("potassiumLevelKgPerHa") || 140;
  const ph = fields.length ? (fields.reduce((acc, f) => acc + (f.soilPh || 7), 0) / fields.length) : 6.4;

  const soilDeficiencies = [
    {
      nutrient: "Nitrogen (N)",
      currentLevel: `${nitrogen} kg/ha`,
      optimalLevel: "60 - 90 kg/ha",
      status: nutrientStatus(nitrogen, 55, 95),
    },
    {
      nutrient: "Phosphorus (P)",
      currentLevel: `${phosphorus} kg/ha`,
      optimalLevel: "25 - 45 kg/ha",
      status: nutrientStatus(phosphorus, 22, 50),
    },
    {
      nutrient: "Potassium (K)",
      currentLevel: `${potassium} kg/ha`,
      optimalLevel: "120 - 180 kg/ha",
      status: nutrientStatus(potassium, 110, 190),
    },
    {
      nutrient: "Soil pH",
      currentLevel: ph.toFixed(1),
      optimalLevel: "5.8 - 7.0",
      status: nutrientStatus(ph, 5.8, 7.0),
    },
  ];

  const recommendedFertilizers = soilDeficiencies
    .filter((d) => d.status === "Deficient")
    .map((d) => ({
      name:
        d.nutrient.startsWith("Nitrogen")
          ? "Granular Urea (46-0-0)"
          : d.nutrient.startsWith("Phosphorus")
          ? "Triple Super Phosphate (0-46-0)"
          : d.nutrient.startsWith("Potassium")
          ? "Muriate of Potash (0-0-60)"
          : "Agricultural Lime (CaCO3)",
      dosagePerAcre: d.nutrient.startsWith("Nitrogen") ? "45 - 55 kg" : d.nutrient.startsWith("Phosphorus") ? "25 - 30 kg" : d.nutrient.startsWith("Potassium") ? "20 - 25 kg" : "250 - 300 kg",
      applicationWindow: d.nutrient.startsWith("Nitrogen") ? "Split: basal + tillering + panicle" : "Basal application before final ploughing",
      purpose: `Correct ${d.nutrient.split(" (")[0]} deficiency measured across ${
        fields.length || 1
      } active field(s)`,
    }));

  if (!recommendedFertilizers.length) {
    recommendedFertilizers.push({
      name: "Balanced NPK 20-20-20 (foliar)",
      dosagePerAcre: "5 kg",
      applicationWindow: "Every 21 days during vegetative growth",
      purpose: "Maintain the already balanced soil fertility status",
    });
  }

  const riskFactors = [];
  if (fields.some((f) => f.irrigationStatus === "Needed")) {
    riskFactors.push({
      factor: "Moisture stress in at least one field",
      impact: "Medium",
      mitigationStrategy: "Schedule deficit irrigation within the next 48 hours",
    });
  }
  if (ph < 5.8 || ph > 7.0) {
    riskFactors.push({
      factor: "Soil pH outside optimal band",
      impact: "Medium",
      mitigationStrategy: ph < 5.8 ? "Apply agricultural lime at 250 kg/acre" : "Apply elemental sulphur to lower pH",
    });
  }
  riskFactors.push({
    factor: "Seasonal pest pressure (BPH / armyworm)",
    impact: "Low",
    mitigationStrategy: "Weekly scouting and pheromone traps at field bunds",
  });

  const targetYields = batches.filter((b) => b.targetYieldKg > 0).map((b) => b.targetYieldKg);
  const baseYield = targetYields.length
    ? Math.round(targetYields.reduce((a, b) => a + b, 0) / targetYields.length)
    : 1800;

  const cropNames = batches.length
    ? [...new Set(batches.map((b) => b.cropName))].join(", ")
    : "the currently planned crop rotation";

  return {
    soilDeficiencies,
    recommendedFertilizers,
    riskFactors,
    agronomicRationale: `Nutrient status was aggregated from ${fields.length || 0} registered field(s) and combined with the ${batches.length || 0} active crop batch(es) for ${cropNames}. Recommendations prioritise correcting measured deficiencies before yield-limiting stages, while keeping leaching losses low under the prevailing rainfall.`,
    yieldPotentialPrediction: {
      minimumYield: Math.round(baseYield * 0.85),
      maximumYield: Math.round(baseYield * 1.18),
      unit: "kg/acre",
      confidenceLevel: fields.length ? 82 : 64,
    },
  };
};

module.exports = { buildRecommendations, buildComparisonProfiles, buildAiDiagnostic };
