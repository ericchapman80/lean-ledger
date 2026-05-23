'use client';

import { useState, useEffect } from 'react';
import { mealsApi } from '@/lib/api';
import { getTodayDate, formatDisplayDate } from '@/lib/utils/dateUtils';
import { calculateCaloriesFromMacros } from '@/lib/utils/macroUtils';
import { lookupByBarcode } from '@/lib/foodLookup';
import Loading from '@/components/Loading';
import ErrorMessage from '@/components/ErrorMessage';
import Modal from '@/components/Modal';
import BarcodeScanner from '@/components/BarcodeScanner';
import ProductLookup from '@/components/ProductLookup';
import FoodSearch from '@/components/FoodSearch';

export default function Meals() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meals, setMeals] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [formData, setFormData] = useState({
    mealName: '',
    protein: '',
    fat: '',
    carbs: '',
    calories: '',
  });

  const fetchMeals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mealsApi.getMeals({ date: selectedDate });
      setMeals(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMeals(); }, [selectedDate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name !== 'calories' && updated.protein && updated.fat && updated.carbs) {
        updated.calories = calculateCaloriesFromMacros(
          parseFloat(updated.protein) || 0,
          parseFloat(updated.fat) || 0,
          parseFloat(updated.carbs) || 0,
        ).toString();
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const mealData = {
        date: selectedDate,
        mealName: formData.mealName,
        protein: parseFloat(formData.protein),
        fat: parseFloat(formData.fat),
        carbs: parseFloat(formData.carbs),
        calories: parseFloat(formData.calories),
      };
      if (editingMeal) {
        await mealsApi.updateMeal(editingMeal.id, mealData);
      } else {
        await mealsApi.createMeal(mealData);
      }
      setIsModalOpen(false);
      setEditingMeal(null);
      setFormData({ mealName: '', protein: '', fat: '', carbs: '', calories: '' });
      fetchMeals();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (meal) => {
    setEditingMeal(meal);
    setFormData({
      mealName: meal.mealName,
      protein: meal.protein.toString(),
      fat: meal.fat.toString(),
      carbs: meal.carbs.toString(),
      calories: meal.calories.toString(),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this meal?')) return;
    try {
      await mealsApi.deleteMeal(id);
      fetchMeals();
    } catch (err) {
      alert(err.message);
    }
  };

  const openAddModal = () => {
    setEditingMeal(null);
    setFormData({ mealName: '', protein: '', fat: '', carbs: '', calories: '' });
    setScannedProduct(null);
    setIsModalOpen(true);
  };

  const openBarcodeScanner = () => {
    setScannedProduct(null);
    setIsScannerOpen(true);
  };

  const openFoodSearch = () => {
    setScannedProduct(null);
    setIsSearchOpen(true);
  };

  const handleFoodSelected = (food) => {
    setScannedProduct(food);
    setIsSearchOpen(false);
  };

  const handleBarcodeScanned = async (barcode) => {
    setLookupLoading(true);
    try {
      const product = await lookupByBarcode(barcode);
      setScannedProduct(product);
      setIsScannerOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to lookup product. Please try again or enter manually.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleAddScannedMeal = async (mealData) => {
    try {
      await mealsApi.createMeal({
        date: selectedDate,
        mealName: mealData.mealName,
        protein: mealData.protein,
        fat: mealData.fat,
        carbs: mealData.carbs,
        calories: mealData.calories,
      });
      setScannedProduct(null);
      fetchMeals();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="container" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: '8px', fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>Meals</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{formatDisplayDate(selectedDate)}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="form-input"
            style={{ flex: '1 1 auto', minWidth: '150px', maxWidth: '300px' }}
          />
          <button onClick={openFoodSearch} className="btn btn-secondary" style={{ flex: '0 1 auto' }}>🔍 Search Food</button>
          <button onClick={openBarcodeScanner} className="btn btn-secondary" style={{ flex: '0 1 auto' }}>📷 Scan</button>
          <button onClick={openAddModal} className="btn btn-primary" style={{ flex: '0 1 auto' }}>✏️ Manual</button>
        </div>
      </div>

      {error && <ErrorMessage error={error} onRetry={fetchMeals} />}

      {meals.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🍽️</div>
          <h3 style={{ marginBottom: '8px' }}>No meals logged yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Start tracking your macros by adding your first meal
          </p>
          <button onClick={openAddModal} className="btn btn-primary">Add Your First Meal</button>
        </div>
      ) : (
        <div className="grid grid-2">
          {meals.map((meal) => (
            <div key={meal.id} className="card">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, marginBottom: '4px' }}>{meal.mealName}</h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {new Date(meal.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={() => handleEdit(meal)} className="btn btn-secondary"
                    style={{ padding: '8px 16px', flex: '1 1 auto', minWidth: '100px' }}>Edit</button>
                  <button onClick={() => handleDelete(meal.id)} className="btn btn-danger"
                    style={{ padding: '8px 16px', flex: '1 1 auto', minWidth: '100px' }}>Delete</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Protein</p>
                  <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '4px 0 0' }}>{Math.round(meal.protein)}g</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Carbs</p>
                  <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '4px 0 0' }}>{Math.round(meal.carbs)}g</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Fat</p>
                  <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '4px 0 0' }}>{Math.round(meal.fat)}g</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Calories</p>
                  <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '4px 0 0', color: 'var(--primary-color)' }}>
                    {Math.round(meal.calories)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingMeal(null); }}
        title={editingMeal ? 'Edit Meal' : 'Add Meal'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Meal Name</label>
            <input type="text" name="mealName" value={formData.mealName} onChange={handleInputChange}
              className="form-input" placeholder="e.g., Breakfast, Lunch, Snack" required />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Protein (g)</label>
              <input type="number" name="protein" value={formData.protein} onChange={handleInputChange}
                className="form-input" step="0.1" min="0" required />
            </div>
            <div className="form-group">
              <label className="form-label">Carbs (g)</label>
              <input type="number" name="carbs" value={formData.carbs} onChange={handleInputChange}
                className="form-input" step="0.1" min="0" required />
            </div>
            <div className="form-group">
              <label className="form-label">Fat (g)</label>
              <input type="number" name="fat" value={formData.fat} onChange={handleInputChange}
                className="form-input" step="0.1" min="0" required />
            </div>
            <div className="form-group">
              <label className="form-label">Calories</label>
              <input type="number" name="calories" value={formData.calories} onChange={handleInputChange}
                className="form-input" min="0" required />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
            <button type="submit" className="btn btn-primary">
              {editingMeal ? 'Update Meal' : 'Add Meal'}
            </button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} title="Scan Product Barcode">
        {lookupLoading ? (
          <Loading message="Looking up product..." />
        ) : (
          <BarcodeScanner onScanSuccess={handleBarcodeScanned} onClose={() => setIsScannerOpen(false)} />
        )}
      </Modal>

      <Modal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} title="Search for Food">
        <FoodSearch onSelectFood={handleFoodSelected} onClose={() => setIsSearchOpen(false)} />
      </Modal>

      <Modal isOpen={!!scannedProduct} onClose={() => setScannedProduct(null)} title="Add Food Item">
        {scannedProduct && (
          <ProductLookup
            product={scannedProduct}
            onAddToMeal={handleAddScannedMeal}
            onBack={() => {
              setScannedProduct(null);
              if (isSearchOpen) setIsSearchOpen(true);
              else setIsScannerOpen(true);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
