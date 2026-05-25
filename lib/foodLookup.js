/**
 * Food Lookup Service using multiple APIs
 * - Open Food Facts (packaged foods)
 * - USDA FoodData Central (general foods, ingredients)
 * - Nutritionix (restaurants, branded foods)
 */

import { calculateMacrosForPortion, estimateServingGrams } from '@/lib/foodPortions.js';

const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v2/product';
const USDA_API = 'https://api.nal.usda.gov/fdc/v1';
const USDA_API_KEY = 'DEMO_KEY'; // Free demo key, get your own at https://fdc.nal.usda.gov/api-key-signup.html

/**
 * Search for food across multiple databases
 * @param {string} query - Search term
 * @returns {Promise<Array>} Combined results from all sources
 */
export async function searchFood(query) {
  if (!query || query.trim().length < 2) {
    throw new Error('Please enter at least 2 characters');
  }

  try {
    // Search all databases in parallel
    const [openFoodResults, usdaResults] = await Promise.all([
      searchOpenFoodFacts(query).catch(() => []),
      searchUSDA(query).catch(() => [])
    ]);

    // Combine and deduplicate results
    const allResults = [
      ...openFoodResults.map(r => ({ ...r, source: 'Open Food Facts' })),
      ...usdaResults.map(r => ({ ...r, source: 'USDA' }))
    ];

    // Sort by relevance (products with images first, then by name match)
    return allResults.sort((a, b) => {
      if (a.imageUrl && !b.imageUrl) return -1;
      if (!a.imageUrl && b.imageUrl) return 1;
      return 0;
    }).slice(0, 20); // Limit to 20 results
  } catch (error) {
    console.error('Food search error:', error);
    throw new Error('Failed to search for food');
  }
}

/**
 * Search Open Food Facts database
 */
async function searchOpenFoodFacts(query) {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10`
    );

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.products || data.products.length === 0) return [];

    return data.products
      .filter(p => p.product_name && p.nutriments)
      .map(parseProductData);
  } catch (error) {
    console.error('Open Food Facts search error:', error);
    return [];
  }
}

/**
 * Search USDA FoodData Central
 */
async function searchUSDA(query) {
  try {
    const response = await fetch(
      `${USDA_API}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=10`
    );

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.foods || data.foods.length === 0) return [];

    return data.foods.map(parseUSDAFood);
  } catch (error) {
    console.error('USDA search error:', error);
    return [];
  }
}

/**
 * Get common restaurant items (pre-defined common foods)
 */
export function getCommonRestaurantItems(query) {
  const commonFoods = [
    // Fast Food
    { name: "McDonald's Big Mac", protein: 25, carbs: 46, fat: 29, calories: 540, category: "Fast Food" },
    { name: "McDonald's Quarter Pounder", protein: 30, carbs: 42, fat: 28, calories: 530, category: "Fast Food" },
    { name: "McDonald's Chicken McNuggets (6pc)", protein: 14, carbs: 16, fat: 16, calories: 250, category: "Fast Food" },
    { name: "McDonald's French Fries (Medium)", protein: 4, carbs: 44, fat: 16, calories: 340, category: "Fast Food" },
    { name: "Subway 6\" Turkey Breast", protein: 18, carbs: 46, fat: 3.5, calories: 280, category: "Fast Food" },
    { name: "Subway 6\" Chicken & Bacon Ranch", protein: 36, carbs: 47, fat: 27, calories: 570, category: "Fast Food" },
    { name: "Chipotle Chicken Burrito Bowl", protein: 32, carbs: 40, fat: 14, calories: 420, category: "Fast Food" },
    { name: "Chipotle Steak Burrito", protein: 30, carbs: 67, fat: 23, calories: 605, category: "Fast Food" },
    { name: "Pizza Hut Pepperoni Pizza (1 slice, large)", protein: 12, carbs: 30, fat: 13, calories: 280, category: "Fast Food" },
    { name: "Domino's Cheese Pizza (1 slice, large)", protein: 11, carbs: 34, fat: 10, calories: 270, category: "Fast Food" },
    { name: "KFC Original Recipe Chicken Breast", protein: 35, carbs: 9, fat: 19, calories: 350, category: "Fast Food" },
    { name: "Taco Bell Crunchy Taco", protein: 8, carbs: 13, fat: 10, calories: 170, category: "Fast Food" },
    { name: "Chick-fil-A Chicken Sandwich", protein: 28, carbs: 41, fat: 17, calories: 440, category: "Fast Food" },
    
    // Breakfast
    { name: "Starbucks Bacon, Egg & Cheese", protein: 19, carbs: 44, fat: 18, calories: 410, category: "Breakfast" },
    { name: "Dunkin' Donuts Glazed Donut", protein: 3, carbs: 31, fat: 14, calories: 260, category: "Breakfast" },
    { name: "IHOP Buttermilk Pancakes (3)", protein: 16, carbs: 94, fat: 25, calories: 630, category: "Breakfast" },
    { name: "Scrambled Eggs (2 large)", protein: 13, carbs: 1, fat: 11, calories: 140, category: "Breakfast" },
    { name: "Oatmeal with Berries (1 cup)", protein: 6, carbs: 54, fat: 3, calories: 270, category: "Breakfast" },
    
    // Common Foods
    { name: "Grilled Chicken Breast (4oz)", protein: 35, carbs: 0, fat: 4, calories: 180, category: "Protein" },
    { name: "Ground Beef (4oz, 80/20)", protein: 28, carbs: 0, fat: 23, calories: 310, category: "Protein" },
    { name: "Salmon Fillet (4oz)", protein: 25, carbs: 0, fat: 13, calories: 230, category: "Protein" },
    { name: "White Rice (1 cup, cooked)", protein: 4, carbs: 45, fat: 0.5, calories: 205, category: "Carbs" },
    { name: "Brown Rice (1 cup, cooked)", protein: 5, carbs: 45, fat: 2, calories: 215, category: "Carbs" },
    { name: "Sweet Potato (1 medium)", protein: 2, carbs: 24, fat: 0, calories: 100, category: "Carbs" },
    { name: "Broccoli (1 cup)", protein: 3, carbs: 6, fat: 0, calories: 30, category: "Vegetables" },
    { name: "Avocado (1 whole)", protein: 3, carbs: 12, fat: 21, calories: 240, category: "Healthy Fats" },
    { name: "Banana (1 medium)", protein: 1, carbs: 27, fat: 0, calories: 105, category: "Fruits" },
    { name: "Apple (1 medium)", protein: 0, carbs: 25, fat: 0, calories: 95, category: "Fruits" },
    { name: "Peanut Butter (2 tbsp)", protein: 8, carbs: 7, fat: 16, calories: 190, category: "Healthy Fats" },
    { name: "Greek Yogurt (1 cup, plain)", protein: 20, carbs: 9, fat: 0, calories: 120, category: "Protein" },
    { name: "Whole Milk (1 cup)", protein: 8, carbs: 12, fat: 8, calories: 150, category: "Dairy" },
    { name: "Cheddar Cheese (1oz)", protein: 7, carbs: 1, fat: 9, calories: 115, category: "Dairy" },
    { name: "Whole Wheat Bread (1 slice)", protein: 4, carbs: 13, fat: 1, calories: 80, category: "Carbs" },
    { name: "Pasta (1 cup, cooked)", protein: 8, carbs: 43, fat: 1, calories: 220, category: "Carbs" },
  ];

  if (!query) return [];

  const searchTerm = query.toLowerCase();
  return commonFoods
    .filter(food => food.name.toLowerCase().includes(searchTerm))
    .map((food) => {
      const servingGrams = estimateServingGrams({
        name: food.name,
        servingSize: 1,
        servingUnit: 'serving',
        source: 'Common Foods',
      });
      const multiplier = servingGrams / 100;

      return {
        ...food,
        source: 'Common Foods',
        servingSize: 1,
        servingUnit: 'serving',
        servingGrams,
        proteinPer100g: parseFloat((food.protein / multiplier).toFixed(1)),
        carbsPer100g: parseFloat((food.carbs / multiplier).toFixed(1)),
        fatPer100g: parseFloat((food.fat / multiplier).toFixed(1)),
        caloriesPer100g: Math.round(food.calories / multiplier),
      };
    });
}

/**
 * Lookup product by barcode
 * @param {string} barcode - Product barcode (UPC, EAN, etc.)
 * @returns {Promise<Object>} Product nutritional information
 */
export async function lookupByBarcode(barcode) {
  try {
    const response = await fetch(`${OPEN_FOOD_FACTS_API}/${barcode}.json`);
    
    if (!response.ok) {
      throw new Error('Product not found');
    }

    const data = await response.json();

    if (data.status === 0 || !data.product) {
      throw new Error('Product not found in database');
    }

    return parseProductData(data.product);
  } catch (error) {
    console.error('Food lookup error:', error);
    throw new Error(error.message || 'Failed to lookup product');
  }
}

/**
 * Parse product data from Open Food Facts format
 * @param {Object} product - Raw product data
 * @returns {Object} Standardized product info
 */
function parseProductData(product) {
  const nutriments = product.nutriments || {};
  
  // Get serving size or use 100g as default
  const servingSize = product.serving_quantity || 100;
  const servingUnit = product.serving_quantity_unit || 'g';
  
  // Extract macros per 100g
  const proteinPer100g = nutriments['proteins_100g'] || nutriments['proteins'] || 0;
  const carbsPer100g = nutriments['carbohydrates_100g'] || nutriments['carbohydrates'] || 0;
  const fatPer100g = nutriments['fat_100g'] || nutriments['fat'] || 0;
  const caloriesPer100g = nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0;

  // Calculate for serving size
  const multiplier = servingSize / 100;
  const servingGrams = estimateServingGrams({
    name: product.product_name || 'Unknown Product',
    brands: product.brands || '',
    categories: product.categories_tags || [],
    servingSize,
    servingUnit,
    source: 'Open Food Facts',
  });
  
  return {
    barcode: product.code || product._id,
    name: product.product_name || 'Unknown Product',
    brands: product.brands || '',
    imageUrl: product.image_url || product.image_front_url,
    servingSize: servingSize,
    servingUnit: servingUnit,
    servingGrams,
    
    // Per serving
    protein: parseFloat((proteinPer100g * multiplier).toFixed(1)),
    carbs: parseFloat((carbsPer100g * multiplier).toFixed(1)),
    fat: parseFloat((fatPer100g * multiplier).toFixed(1)),
    calories: Math.round(caloriesPer100g * multiplier),
    
    // Per 100g for reference
    proteinPer100g: parseFloat(proteinPer100g.toFixed(1)),
    carbsPer100g: parseFloat(carbsPer100g.toFixed(1)),
    fatPer100g: parseFloat(fatPer100g.toFixed(1)),
    caloriesPer100g: Math.round(caloriesPer100g),
    
    // Additional info
    categories: product.categories_tags || [],
    ingredients: product.ingredients_text || '',
    allergens: product.allergens_tags || [],
    nutritionGrade: product.nutrition_grades || null,
    
    // Raw data for debugging
    raw: product
  };
}

/**
 * Parse USDA food data
 */
function parseUSDAFood(food) {
  const nutrients = food.foodNutrients || [];
  
  const getNutrient = (nutrientId) => {
    const nutrient = nutrients.find(n => n.nutrientId === nutrientId);
    return nutrient ? parseFloat(nutrient.value) : 0;
  };

  // USDA Nutrient IDs
  const protein = getNutrient(1003);  // Protein
  const carbs = getNutrient(1005);    // Carbohydrates
  const fat = getNutrient(1004);      // Total lipid (fat)
  const calories = getNutrient(1008); // Energy (kcal)

  return {
    id: food.fdcId,
    name: food.description || food.lowercaseDescription || 'Unknown',
    brands: food.brandOwner || '',
    servingSize: 100,
    servingUnit: 'g',
    servingGrams: 100,
    
    protein: parseFloat(protein.toFixed(1)),
    carbs: parseFloat(carbs.toFixed(1)),
    fat: parseFloat(fat.toFixed(1)),
    calories: Math.round(calories),
    
    proteinPer100g: parseFloat(protein.toFixed(1)),
    carbsPer100g: parseFloat(carbs.toFixed(1)),
    fatPer100g: parseFloat(fat.toFixed(1)),
    caloriesPer100g: Math.round(calories),
    
    category: food.foodCategory || '',
    dataType: food.dataType || ''
  };
}

/**
 * Calculate macros for a custom portion size
 * @param {Object} productData - Product data from parseProductData
 * @param {number} portionGrams - Desired portion in grams
 * @returns {Object} Macros for the specified portion
 */
export function calculatePortionMacros(productData, portionGrams) {
  const result = calculateMacrosForPortion(productData, portionGrams, 'grams');
  return {
    protein: result.protein,
    carbs: result.carbs,
    fat: result.fat,
    calories: result.calories,
  };
}
