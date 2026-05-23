# 🔍 Food Search Feature

## ✅ Feature Added!

Your Macro Tracker now includes **comprehensive food search** functionality to find nutritional information for:
- 🍔 **Restaurant foods** (McDonald's, Chipotle, Subway, etc.)
- 🥗 **Common foods** (chicken breast, rice, vegetables, etc.)
- 📦 **Packaged foods** (from Open Food Facts database)
- 🌾 **USDA foods** (ingredients, raw foods)

---

## 🎯 How to Use

### **Option 1: Search for Food** 🔍
1. Click **"🔍 Search Food"** on the Meals page
2. Type what you want to find:
   - Restaurant: "Big Mac", "Chipotle burrito"
   - Common: "chicken breast", "brown rice"
   - Brand: "Chobani Greek yogurt"
3. Click **Search** or **Common Foods**
4. Select item from results
5. Adjust portion size
6. Click **"Add to Today's Meals"**

### **Option 2: Scan Barcode** 📷
1. Click **"📷 Scan"** on the Meals page
2. Point camera at product barcode
3. Capture and view nutritional info
4. Adjust portion
5. Add to meals

### **Option 3: Manual Entry** ✏️
1. Click **"✏️ Manual"** on the Meals page
2. Type all macros manually
3. Add to meals

---

## 🍔 Pre-Loaded Restaurant & Common Foods

### **Fast Food Restaurants:**
- ✅ McDonald's (Big Mac, McNuggets, Fries, etc.)
- ✅ Subway (various sandwiches)
- ✅ Chipotle (bowls, burritos)
- ✅ Pizza Hut & Domino's (pizza slices)
- ✅ KFC (chicken)
- ✅ Taco Bell (tacos)
- ✅ Chick-fil-A (sandwiches)

### **Common Foods:**
- ✅ Proteins: Chicken breast, ground beef, salmon
- ✅ Carbs: White rice, brown rice, sweet potato, pasta
- ✅ Vegetables: Broccoli, spinach, etc.
- ✅ Fruits: Banana, apple, berries
- ✅ Dairy: Greek yogurt, milk, cheese
- ✅ Breakfast: Eggs, oatmeal, pancakes
- ✅ Snacks: Peanut butter, avocado

### **Breakfast Items:**
- ✅ Starbucks breakfast sandwiches
- ✅ Dunkin' Donuts
- ✅ IHOP pancakes
- ✅ Scrambled eggs
- ✅ Oatmeal

---

## 🌐 Online Databases

### **1. Open Food Facts**
- 2+ million packaged foods worldwide
- Product images
- Ingredient lists
- Nutri-Score ratings
- Allergen information

### **2. USDA FoodData Central**
- Official US food database
- Raw ingredients
- Generic foods
- Accurate nutritional data
- Restaurant items

### **3. Common Foods Database**
- Built-in popular items
- Fast food restaurants
- Common ingredients
- Instant results (no internet needed)

---

## 🎨 Features

### **Smart Search**
- Searches multiple databases simultaneously
- Shows common foods first
- Displays product images
- Source attribution (shows where data came from)
- Relevance sorting

### **Detailed Information**
- Product name and brand
- Category/type
- Nutritional values per serving
- Per 100g reference values
- Product images (when available)
- Source database

### **Flexible Portions**
- Adjust serving size
- Quick portion buttons (100g, 1 serving)
- Auto-calculated macros
- Real-time updates

### **User-Friendly**
- Search suggestions
- "Common Foods" quick access
- Mobile-optimized interface
- Touch-friendly selection
- Error handling with helpful messages

---

## 💡 Search Tips

### **For Best Results:**

**Be Specific:**
- ✅ "grilled chicken breast" → Better
- ❌ "chicken" → Too vague

**Include Brand/Restaurant:**
- ✅ "McDonald's Big Mac"
- ✅ "Chipotle chicken bowl"
- ✅ "Chobani Greek yogurt"

**Use Common Names:**
- ✅ "french fries" instead of "fried potatoes"
- ✅ "soda" instead of "carbonated beverage"

**Try Multiple Terms:**
- If "steak" doesn't work, try "beef"
- If "coke" doesn't work, try "coca cola"

**Check Common Foods First:**
- Click "Common Foods" button
- Browse popular items
- Faster than searching

---

## 📊 Search Results

Results show:
- **Product Name** - Clear food description
- **Brand** - Manufacturer/restaurant (if applicable)
- **Category** - Type of food
- **Macros Preview** - Cal, Protein, Carbs, Fat
- **Image** - Product photo (when available)
- **Source** - Which database it came from

**Source Types:**
- `Common Foods` - Built-in database (fastest)
- `Open Food Facts` - Packaged foods with barcodes
- `USDA` - Government food database

---

## 🎓 Usage Examples

### **Example 1: Fast Food**
```
Search: "Big Mac"
→ Select "McDonald's Big Mac"
→ Portion: 1 serving
→ Calories: 540, P: 25g, C: 46g, F: 29g
→ Add to meals
```

### **Example 2: Home Cooking**
```
Search: "chicken breast"
→ Select "Grilled Chicken Breast (4oz)"
→ Adjust portion: 6oz (170g)
→ Macros auto-calculate
→ Add to meals
```

### **Example 3: Breakfast**
```
Search: "oatmeal"
→ Select "Oatmeal with Berries"
→ Portion: 1 cup
→ Add to meals
```

### **Example 4: Packaged Snack**
```
Search: "protein bar"
→ See various brands
→ Select your favorite
→ Adjust portion
→ Add to meals
```

---

## 🔧 Technical Details

### **APIs Used:**
1. **Open Food Facts API**
   - Endpoint: `world.openfoodfacts.org`
   - Free, no API key needed
   - 2M+ products

2. **USDA FoodData Central**
   - Endpoint: `api.nal.usda.gov/fdc/v1`
   - Uses demo API key (get your own for production)
   - Official US government database

3. **Built-in Common Foods**
   - Pre-loaded popular items
   - No internet required
   - Instant results

### **Search Algorithm:**
- Parallel searches across all sources
- Results combined and deduplicated
- Prioritizes items with images
- Limited to 20 most relevant results

### **Data Privacy:**
- Search queries sent to public APIs
- No personal data transmitted
- Results cached in session only
- No tracking or analytics

---

## 🆘 Troubleshooting

### **No Results Found**

**Problem:** Search returns no results
**Solutions:**
1. Check spelling
2. Try simpler search terms
3. Use common/generic names
4. Click "Common Foods" for popular items
5. Use barcode scanner for packaged foods
6. Add manually if needed

### **Wrong Food Shown**

**Problem:** Results don't match what you're looking for
**Solutions:**
1. Be more specific in search
2. Include brand name
3. Add descriptors (grilled, fried, baked)
4. Browse Common Foods instead

### **Slow Search**

**Problem:** Search takes a long time
**Solutions:**
1. Check internet connection
2. Use Common Foods (instant, offline)
3. Try simpler search term
4. Refresh page and try again

### **API Errors**

**Problem:** "Search failed" message
**Solutions:**
1. Check internet connection
2. Wait a moment and retry
3. Use Common Foods instead
4. Add meal manually

---

## 📱 Mobile Experience

### **Optimized for Mobile:**
- Touch-friendly search results
- Large tap targets
- Scrollable results list
- Responsive design
- Works offline (Common Foods)

### **Mobile Tips:**
- Use "Common Foods" for fast access
- Scroll through results easily
- Tap to select food
- Adjust portions with number pad
- Quick add to meals

---

## 🔮 Data Sources Comparison

| Source | Items | Requires Internet | Images | Best For |
|--------|-------|-------------------|--------|----------|
| **Common Foods** | ~40 | ❌ No | ❌ | Fast food, popular items |
| **Open Food Facts** | 2M+ | ✅ Yes | ✅ | Packaged foods, brands |
| **USDA** | 370K+ | ✅ Yes | ❌ | Ingredients, raw foods |

---

## 💪 Benefits

### **Save Time:**
- No manual macro calculation
- Find foods in seconds
- Pre-populated data
- One-tap selection

### **Accuracy:**
- Verified databases
- Government data (USDA)
- Community-verified (Open Food Facts)
- Standardized measurements

### **Convenience:**
- Restaurant foods included
- Common items pre-loaded
- Multiple search options
- Flexible portions

### **Comprehensive:**
- Multiple databases
- Worldwide coverage
- Constantly updated
- Free to use

---

## 🎯 Future Enhancements

Potential additions:
- [ ] Recent searches history
- [ ] Favorite foods list
- [ ] Custom food database
- [ ] Meal templates
- [ ] Recipe builder
- [ ] More restaurant chains
- [ ] Barcode + search combo
- [ ] Voice search
- [ ] Image recognition (take photo of food)

---

## 📚 Credits

**Data Sources:**
- **Open Food Facts** - https://openfoodfacts.org
- **USDA FoodData Central** - https://fdc.nal.usda.gov
- **Built-in Database** - Curated common foods

**APIs:**
- Open Food Facts API (free, open-source)
- USDA FoodData Central API (public, free)

---

## 🎉 Start Searching!

1. Go to **Meals** page
2. Click **"🔍 Search Food"**
3. Type what you want to find
4. Select from results
5. Adjust portion
6. Add to meals

**It's that easy!** 🚀

---

*Powered by Open Food Facts and USDA FoodData Central*
