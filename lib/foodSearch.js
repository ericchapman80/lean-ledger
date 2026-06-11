import { calculateNetCarbs } from './carbUtils.js';

const OFF_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const USDA_SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';

export async function searchFoodDatabase(query) {
  const offResults = await searchOpenFoodFacts(query);
  if (offResults.length > 0) {
    return { source: 'openfoodfacts', results: offResults };
  }
  const usdaResults = await searchUSDA(query);
  if (usdaResults.length > 0) {
    return { source: 'usda', results: usdaResults };
  }
  return { source: 'none', results: [] };
}

async function searchOpenFoodFacts(query) {
  try {
    const url = `${OFF_SEARCH_URL}?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.products?.length) return [];
    return data.products
      .filter((p) => p.product_name && p.nutriments)
      .map(normalizeOFF)
      .filter(Boolean)
      .slice(0, 10);
  } catch {
    return [];
  }
}

async function searchUSDA(query) {
  const apiKey = process.env.USDA_FOOD_API_KEY;
  if (!apiKey) return [];
  try {
    const url = `${USDA_SEARCH_URL}?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(query)}&pageSize=10`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.foods?.length) return [];
    return data.foods.map(normalizeUSDA).filter(Boolean).slice(0, 10);
  } catch {
    return [];
  }
}

export function normalizeOFF(product) {
  const n = product.nutriments || {};
  const servingSize = product.serving_quantity || 100;
  const m = servingSize / 100;

  const protein = round1(+(n['proteins_100g'] || n['proteins'] || 0) * m);
  const carbs = round1(+(n['carbohydrates_100g'] || n['carbohydrates'] || 0) * m);
  const fiber = round1(+(n['fiber_100g'] || n['fiber'] || 0) * m);
  const sugarAlcohols = round1(+(n['sugar-alcohol_100g'] || n['sugar-alcohol'] || 0) * m);
  const fat = round1(+(n['fat_100g'] || n['fat'] || 0) * m);
  const calories = Math.round(+(n['energy-kcal_100g'] || n['energy-kcal'] || 0) * m);

  return {
    id: `off:${product.code || product._id}`,
    source: 'openfoodfacts',
    name: product.product_name,
    brand: product.brands || null,
    imageUrl: product.image_front_thumb_url || product.image_url || null,
    servingSize,
    servingUnit: product.serving_quantity_unit || 'g',
    calories,
    protein,
    fat,
    carbs,
    fiber,
    sugarAlcohols,
    netCarbs: calculateNetCarbs(carbs, fiber, sugarAlcohols),
  };
}

export function normalizeUSDA(food) {
  const get = (id) => {
    const n = (food.foodNutrients || []).find((x) => x.nutrientId === id);
    return n ? parseFloat(n.value) : 0;
  };

  const protein = round1(get(1003));
  const carbs = round1(get(1005));
  const fiber = round1(get(1079));
  const fat = round1(get(1004));
  const calories = Math.round(get(1008));

  return {
    id: `usda:${food.fdcId}`,
    source: 'usda',
    name: food.description || food.lowercaseDescription || 'Unknown',
    brand: food.brandOwner || null,
    imageUrl: null,
    servingSize: 100,
    servingUnit: 'g',
    calories,
    protein,
    fat,
    carbs,
    fiber,
    sugarAlcohols: 0,
    netCarbs: calculateNetCarbs(carbs, fiber, 0),
  };
}

function round1(n) {
  return parseFloat((+n).toFixed(1));
}
