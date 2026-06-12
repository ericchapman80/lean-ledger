'use client';

import { useState } from 'react';
import { getCommonRestaurantItems } from '@/lib/foodLookup';
import { calculateNetCarbs } from '@/lib/carbUtils';

export default function FoodSearch({ onSelectFood, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [resultSource, setResultSource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCommon, setShowCommon] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      setError('Please enter a search term');
      return;
    }

    setLoading(true);
    setError(null);
    setShowCommon(false);
    setSearchResults([]);
    setResultSource(null);

    try {
      const res = await fetch(`/api/food-search?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Search failed. Please try again.');
      }
      const { source, results } = await res.json();
      setResultSource(source);
      setSearchResults(results);
      if (results.length === 0) {
        setError('No results found. Try a different search term or add manually.');
      }
    } catch (err) {
      setError(err.message || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showCommonFoods = () => {
    const common = getCommonRestaurantItems('common');
    setSearchResults(common.map(normalizeCommon));
    setResultSource('common');
    setShowCommon(true);
    setSearchQuery('');
    setError(null);
  };

  const handleSelectFood = (food) => {
    onSelectFood({
      id: food.id,
      externalFoodId: food.id ?? null,
      externalFoodSource: food.source ?? null,
      name: food.name,
      brands: food.brand || food.brands || '',
      imageUrl: food.imageUrl || null,
      servingSize: food.servingSize,
      servingUnit: food.servingUnit,
      servingGrams: food.servingGrams || food.servingSize || null,
      protein: food.protein,
      carbs: food.carbs,
      fiber: food.fiber || 0,
      sugarAlcohols: food.sugarAlcohols || 0,
      fat: food.fat,
      calories: food.calories,
      netCarbs: food.netCarbs ?? calculateNetCarbs(food.carbs, food.fiber, food.sugarAlcohols),
      proteinPer100g: food.proteinPer100g || food.protein,
      carbsPer100g: food.carbsPer100g || food.carbs,
      fiberPer100g: food.fiberPer100g || food.fiber || 0,
      sugarAlcoholsPer100g: food.sugarAlcoholsPer100g || food.sugarAlcohols || 0,
      fatPer100g: food.fatPer100g || food.fat,
      caloriesPer100g: food.caloriesPer100g || food.calories,
      source: food.source,
    });
  };

  const sourceLabel = resultSource === 'usda'
    ? 'Results from USDA FoodData Central'
    : resultSource === 'combined'
    ? 'Results blended from USDA FoodData Central and Open Food Facts'
    : resultSource === 'openfoodfacts'
    ? 'Results from Open Food Facts'
    : resultSource === 'common'
    ? 'Popular Foods & Restaurants'
    : null;

  return (
    <div className="food-search">
      <h3 style={{ marginBottom: '16px' }}>Search for Food</h3>

      <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            placeholder="e.g., chicken breast, Big Mac, apple..."
            autoFocus
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
              🔍 Search
            </button>
            <button type="button" onClick={showCommonFoods} className="btn btn-secondary" style={{ flex: 1 }}>
              📋 Common Foods
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: 'var(--danger-surface)',
          borderLeft: '4px solid var(--danger-color)',
          borderRadius: '4px',
          marginBottom: '16px',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {loading && <SkeletonResults />}

      {!loading && searchResults.length > 0 && (
        <div>
          {sourceLabel && (
            <p style={{ marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {resultSource === 'usda' && (
                <span style={{ background: 'var(--feedback-info-surface)', border: '1px solid var(--feedback-info-border)', borderRadius: '4px', padding: '1px 6px', fontSize: '11px', fontWeight: '600', color: 'var(--primary-color)' }}>
                  USDA
                </span>
              )}
              {resultSource === 'combined' && (
                <span style={{ background: 'var(--feedback-info-surface)', border: '1px solid var(--feedback-info-border)', borderRadius: '4px', padding: '1px 6px', fontSize: '11px', fontWeight: '600', color: 'var(--primary-color)' }}>
                  USDA + OFF
                </span>
              )}
              {sourceLabel}
            </p>
          )}

          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            {searchResults.map((food, index) => (
              <button
                key={`${food.id || food.barcode || index}`}
                type="button"
                onClick={() => handleSelectFood(food)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderBottom: index < searchResults.length - 1 ? '1px solid var(--border-color)' : 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderTop: 'none',
                  cursor: 'pointer',
                  background: 'var(--card-background)',
                  textAlign: 'left',
                  transition: 'background-color 0.15s',
                  borderRadius: index === 0 ? '8px 8px 0 0' : index === searchResults.length - 1 ? '0 0 8px 8px' : '0',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-muted)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card-background)'; }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {food.imageUrl && (
                    <img
                      src={food.imageUrl}
                      alt={food.name}
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                      {food.name}
                    </div>
                    {(food.brand || food.brands) && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        {food.brand || food.brands}
                      </div>
                    )}
                    {food.category && (
                      <div style={{ fontSize: '11px', color: 'var(--primary-color)', marginBottom: '4px' }}>
                        {food.category}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span>{food.calories} cal</span>
                      <span>P: {food.protein}g</span>
                      <span>C: {food.carbs}g</span>
                      {(food.fiber || food.sugarAlcohols) ? (
                        <span>Net: {food.netCarbs ?? calculateNetCarbs(food.carbs, food.fiber, food.sugarAlcohols)}g</span>
                      ) : null}
                      <span>F: {food.fat}g</span>
                    </div>
                    {food.servingSize && food.servingUnit && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        per {food.servingSize}{food.servingUnit}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '20px', color: 'var(--primary-color)', flexShrink: 0 }}>→</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <button onClick={onClose} className="btn btn-outline" style={{ width: '100%', marginTop: '16px' }}>
        Cancel
      </button>

      <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--surface-muted)', borderRadius: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        <strong>💡 Tips:</strong>
        <ul style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
          <li>Try restaurants: "McDonald's", "Chipotle"</li>
          <li>Try ingredients: "chicken breast", "brown rice"</li>
          <li>Be specific: "grilled chicken" vs "chicken"</li>
        </ul>
      </div>
    </div>
  );
}

function SkeletonResults() {
  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px' }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ padding: '12px', borderBottom: i < 2 ? '1px solid var(--border-color)' : 'none', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '4px', background: 'var(--surface-muted)', flexShrink: 0, animation: 'shimmer 1.4s infinite' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ height: '14px', borderRadius: '4px', background: 'var(--surface-muted)', width: '60%', animation: 'shimmer 1.4s infinite' }} />
            <div style={{ height: '12px', borderRadius: '4px', background: 'var(--surface-muted)', width: '40%', animation: 'shimmer 1.4s infinite' }} />
          </div>
        </div>
      ))}
      <style>{`
        @keyframes shimmer {
          0%   { opacity: 1; }
          50%  { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function normalizeCommon(food) {
  return {
    ...food,
    id: null,
    externalFoodId: null,
    externalFoodSource: null,
    brand: null,
    imageUrl: null,
    netCarbs: calculateNetCarbs(food.carbs, food.fiber || 0, food.sugarAlcohols || 0),
  };
}
