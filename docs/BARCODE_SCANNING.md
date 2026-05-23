# 📷 Barcode Scanning Feature

## ✅ Feature Added!

Your Macro Tracker now includes **barcode scanning** to automatically lookup food nutritional information!

---

## 🎯 How It Works

### **1. Scan Barcode**
- Click "📷 Scan Barcode" button on the Meals page
- Grant camera permission when prompted
- Point camera at product barcode (UPC, EAN, etc.)
- Click "Capture Barcode" to scan

### **2. Manual Entry**
- If camera doesn't work, enter barcode manually
- Type the barcode number (usually 12-13 digits)
- Click "Lookup" to search

### **3. View Product Info**
- See product name, brand, and image
- View nutritional information
- Adjust portion size (default is one serving)
- See Nutri-Score rating (A-E quality rating)

### **4. Add to Meals**
- Adjust portion to match what you ate
- Click "Add to Today's Meals"
- Product automatically added with correct macros!

---

## 📊 Data Source

Uses **Open Food Facts** - a free, open-source food database:
- 🌍 2+ million products worldwide
- 🆓 Completely free, no API key needed
- 📱 Covers most packaged foods
- 🔄 Crowdsourced and constantly updated

### What Can Be Scanned:
- ✅ Packaged foods with barcodes
- ✅ UPC codes (North America)
- ✅ EAN codes (Europe/International)
- ✅ Most grocery store products
- ✅ Snacks, drinks, cereals, etc.

### What Cannot Be Scanned:
- ❌ Fresh produce (no barcodes)
- ❌ Restaurant meals
- ❌ Homemade food
- ❌ Very new/local products (may not be in database)

---

## 🎨 Features

### **Smart Portion Control**
- Adjust portion size in grams
- Quick buttons for 100g and 1 serving
- Macros update automatically
- Shows per-100g reference values

### **Product Information**
- Product name and brand
- Product image
- Ingredient list
- Allergen information
- Nutri-Score rating (health rating A-E)

### **Mobile-Friendly**
- Uses back camera on mobile devices
- Touch-optimized interface
- Manual entry fallback
- Works on all devices

---

## 🔧 Technical Details

### **Camera API**
- Uses native `getUserMedia()` API
- Requests back camera on mobile
- Automatically requests permissions
- Graceful fallback to manual entry

### **Barcode Detection**
- Uses Barcode Detection API (Chrome/Edge)
- Supports multiple barcode formats
- Fallback to manual entry if not supported
- Works with standard product barcodes

### **Privacy**
- All scanning happens on your device
- No images stored or uploaded
- Only barcode number sent to Open Food Facts
- Camera stream stops when closed

---

## 📱 Browser Support

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| Camera Access | ✅ | ✅ | ✅ | ✅ |
| Barcode Detection | ✅ | ❌ | ❌ | ✅ |
| Manual Entry | ✅ | ✅ | ✅ | ✅ |

**Note:** On browsers without Barcode Detection API (Safari, Firefox), use manual barcode entry.

---

## 🎓 Usage Tips

### **Best Results:**
1. **Good Lighting** - Scan in bright, even light
2. **Steady Hand** - Hold phone steady when capturing
3. **Clean Barcode** - Make sure barcode is clear and undamaged
4. **Right Distance** - Keep camera 6-8 inches from barcode
5. **Horizontal Alignment** - Keep barcode lines horizontal

### **If Scanning Fails:**
1. Try better lighting
2. Clean camera lens
3. Try different angle
4. Use manual entry as backup
5. Type barcode numbers from package

### **Finding Barcodes:**
- Usually on back or bottom of package
- Look for black and white vertical lines
- Number is printed below the lines
- Most are 12-13 digits long

---

## 🔍 Example Products That Work Well

- ✅ Protein bars and shakes
- ✅ Breakfast cereals
- ✅ Packaged snacks
- ✅ Bottled drinks
- ✅ Frozen meals
- ✅ Canned goods
- ✅ Condiments and sauces

---

## 🆘 Troubleshooting

### **Camera Not Working**

**Problem:** Camera permission denied
**Solution:** 
1. Allow camera access in browser settings
2. On mobile: Check Settings → Safari/Chrome → Camera
3. Refresh the page and try again

**Problem:** Black screen
**Solution:**
1. Close other apps using camera
2. Restart browser
3. Try different browser
4. Use manual entry instead

### **Product Not Found**

**Problem:** "Product not found in database"
**Solution:**
1. Verify barcode number is correct
2. Try entering manually
3. Product may be too new/local
4. Add meal manually with nutrition label

**Problem:** Wrong product shown
**Solution:**
1. Double-check barcode number
2. Verify it matches package
3. Contact Open Food Facts to update

### **Barcode Detection Not Available**

**Problem:** "Barcode scanning not supported"
**Solution:**
1. Use Chrome or Edge browser
2. Use manual barcode entry
3. Still gets same nutritional data!

---

## 💡 Pro Tips

### **Meal Prep:**
- Scan all ingredients during grocery shopping
- Save time during meal logging
- Build a favorite foods list

### **Quick Logging:**
- Scan → Adjust Portion → Add (3 taps!)
- Much faster than manual entry
- Accurate nutritional data

### **Track Accurately:**
- Use kitchen scale for portions
- Adjust serving size to match
- Save partial servings for later

---

## 🔮 Future Enhancements

Potential additions:
- [ ] Save favorite scanned products
- [ ] Recent scans history
- [ ] Custom product database
- [ ] Batch scanning (multiple items)
- [ ] Recipe barcode creation
- [ ] Offline barcode database
- [ ] Text/OCR nutrition label scanning

---

## 📚 Credits

- **Open Food Facts** - Product database (https://openfoodfacts.org)
- **Barcode Detection API** - Native browser barcode scanning
- **MediaDevices API** - Camera access

---

## 🎉 Start Scanning!

1. Go to **Meals** page
2. Click **"📷 Scan Barcode"**
3. Point at product barcode
4. Capture and add!

**It's that easy!** 🚀

---

*Data powered by Open Food Facts - The free food products database*
