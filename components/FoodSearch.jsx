import { useState } from 'react';
import { searchFood, getCommonRestaurantItems } from '@/lib/foodLookup';
import { calculateNetCarbs } from '@/lib/carbUtils';
import Loading from './Loading';

export default function FoodSearch({ onSelectFood, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCommon, setShowCommon] = useState(true);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a search term');
      return;
    }

    setLoading(true);
    setError(null);
    setShowCommon(false);

    try {
      // Search online databases
      const onlineResults = await searchFood(searchQuery);
      
      // Also search common foods
      const commonResults = getCommonRestaurantItems(searchQuery);
      
      // Combine results, common foods first
      const allResults = [...commonResults, ...onlineResults];
      
      setSearchResults(allResults);
      
      if (allResults.length === 0) {
        setError('No results found. Try a different search term or add manually.');
      }
    } catch (err) {
      setError(err.message || 'Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const showCommonFoods = () => {
    const common = getCommonRestaurantItems('');
    setSearchResults(common);
    setShowCommon(true);
    setSearchQuery('');
  };

  const handleSelectFood = (food) => {
    onSelectFood({
      ...food,
      // Ensure we have per100g values for portion calculation
      proteinPer100g: food.proteinPer100g || food.protein,
      carbsPer100g: food.carbsPer100g || food.carbs,
      fiberPer100g: food.fiberPer100g || food.fiber || 0,
      sugarAlcoholsPer100g: food.sugarAlcoholsPer100g || food.sugarAlcohols || 0,
      fatPer100g: food.fatPer100g || food.fat,
      caloriesPer100g: food.caloriesPer100g || food.calories,
      fiber: food.fiber || 0,
      sugarAlcohols: food.sugarAlcohols || 0,
      netCarbs: food.netCarbs ?? calculateNetCarbs(food.carbs, food.fiber, food.sugarAlcohols),
    });
  };

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
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ flex: 1 }}
            >
              🔍 Search
            </button>
            <button
              type="button"
              onClick={showCommonFoods}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
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
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {loading && <Loading message="Searching databases..." />}

      {!loading && searchResults.length > 0 && (
        <div>
          <p style={{ 
            marginBottom: '12px', 
            color: 'var(--text-secondary)',
            fontSize: '14px'
          }}>
            {showCommon ? 'Popular Foods & Restaurants' : `Found ${searchResults.length} results`}
          </p>
          
          <div style={{ 
            maxHeight: '400px', 
            overflowY: 'auto',
            border: '1px solid var(--border-color)',
            borderRadius: '8px'
          }}>
            {searchResults.map((food, index) => (
              <div
                key={`${food.id || food.barcode || index}`}
                onClick={() => handleSelectFood(food)}
                style={{
                  padding: '12px',
                  borderBottom: index < searchResults.length - 1 ? '1px solid var(--border-color)' : 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  backgroundColor: 'var(--card-background)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-muted)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card-background)'; }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {food.imageUrl && (
                    <img
                      src={food.imageUrl}
                      alt={food.name}
                      style={{
                        width: '50px',
                        height: '50px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        flexShrink: 0
                      }}
                    />
                  )}
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {food.name}
                    </div>
                    
                    {food.brands && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: 'var(--text-secondary)',
                        marginBottom: '4px'
                      }}>
                        {food.brands}
                      </div>
                    )}
                    
                    {food.category && (
                      <div style={{ 
                        fontSize: '11px', 
                        color: 'var(--primary-color)',
                        marginBottom: '4px'
                      }}>
                        {food.category}
                      </div>
                    )}
                    
                    <div style={{ 
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <span>{food.calories} cal</span>
                      <span>P: {food.protein}g</span>
                      <span>C: {food.carbs}g</span>
                      {(food.fiber || food.sugarAlcohols) ? (
                        <span>Net: {food.netCarbs ?? calculateNetCarbs(food.carbs, food.fiber, food.sugarAlcohols)}g</span>
                      ) : null}
                      <span>F: {food.fat}g</span>
                    </div>
                    
                    {food.source && (
                      <div style={{ 
                        fontSize: '10px', 
                        color: 'var(--text-secondary)',
                        marginTop: '4px',
                        fontStyle: 'italic'
                      }}>
                        Source: {food.source}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ 
                    fontSize: '20px',
                    color: 'var(--primary-color)',
                    flexShrink: 0
                  }}>
                    →
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        className="btn btn-outline"
        style={{ width: '100%', marginTop: '16px' }}
      >
        Cancel
      </button>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: 'var(--surface-muted)',
        borderRadius: '6px',
        fontSize: '12px',
        color: 'var(--text-secondary)'
      }}>
        <strong>💡 Tips:</strong>
        <ul style={{ margin: '8px 0 0 20px', paddingLeft: 0 }}>
          <li>Try searching for restaurants: "McDonald's", "Chipotle", etc.</li>
          <li>Search ingredients: "chicken breast", "brown rice"</li>
          <li>Be specific: "grilled chicken" vs just "chicken"</li>
          <li>Check "Common Foods" for popular items</li>
        </ul>
      </div>
    </div>
  );
}
