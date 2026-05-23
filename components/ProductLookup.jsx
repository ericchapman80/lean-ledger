import { useState } from 'react';
import { calculatePortionMacros } from '../services/foodLookup';

export default function ProductLookup({ product, onAddToMeal, onBack }) {
  const [portion, setPortion] = useState(product.servingSize || 100);
  const [macros, setMacros] = useState({
    protein: product.protein,
    carbs: product.carbs,
    fat: product.fat,
    calories: product.calories
  });

  const handlePortionChange = (newPortion) => {
    setPortion(newPortion);
    const newMacros = calculatePortionMacros(product, parseFloat(newPortion));
    setMacros(newMacros);
  };

  const handleAddMeal = () => {
    onAddToMeal({
      mealName: product.brands ? `${product.brands} ${product.name}` : product.name,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      calories: macros.calories,
      portionSize: portion
    });
  };

  return (
    <div className="product-lookup">
      <button
        onClick={onBack}
        className="btn btn-outline"
        style={{ marginBottom: '16px' }}
      >
        ← Back to Scanner
      </button>

      <div className="card" style={{ marginBottom: '20px' }}>
        {product.imageUrl && (
          <img
            src={product.imageUrl}
            alt={product.name}
            style={{
              width: '100%',
              maxHeight: '200px',
              objectFit: 'contain',
              marginBottom: '16px',
              borderRadius: '8px'
            }}
          />
        )}

        <h3 style={{ margin: '0 0 8px' }}>{product.name}</h3>
        {product.brands && (
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 12px' }}>
            {product.brands}
          </p>
        )}

        {product.nutritionGrade && (
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '12px',
            backgroundColor: getNutritionGradeColor(product.nutritionGrade),
            color: 'white',
            fontWeight: 'bold',
            fontSize: '12px',
            marginBottom: '16px'
          }}>
            Nutri-Score: {product.nutritionGrade.toUpperCase()}
          </div>
        )}

        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '16px',
          marginTop: '16px'
        }}>
          <h4 style={{ marginBottom: '12px' }}>Portion Size</h4>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
            <input
              type="number"
              value={portion}
              onChange={(e) => handlePortionChange(e.target.value)}
              className="form-input"
              style={{ flex: 1 }}
              step="1"
              min="1"
            />
            <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
              {product.servingUnit || 'g'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handlePortionChange(100)}
              className="btn btn-outline"
              style={{ flex: '1 1 auto', minWidth: '80px', fontSize: '14px' }}
            >
              100g
            </button>
            {product.servingSize && product.servingSize !== 100 && (
              <button
                onClick={() => handlePortionChange(product.servingSize)}
                className="btn btn-outline"
                style={{ flex: '1 1 auto', minWidth: '80px', fontSize: '14px' }}
              >
                1 serving ({product.servingSize}g)
              </button>
            )}
          </div>
        </div>

        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '16px'
        }}>
          <h4 style={{ marginBottom: '16px' }}>Nutrition (for {portion}g)</h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '16px'
          }}>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                Calories
              </p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0', color: 'var(--primary-color)' }}>
                {macros.calories}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                Protein
              </p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0' }}>
                {macros.protein}g
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                Carbs
              </p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0' }}>
                {macros.carbs}g
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                Fat
              </p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0' }}>
                {macros.fat}g
              </p>
            </div>
          </div>

          <div style={{ 
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '6px',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}>
            Per 100g: {product.caloriesPer100g} cal • 
            P: {product.proteinPer100g}g • 
            C: {product.carbsPer100g}g • 
            F: {product.fatPer100g}g
          </div>
        </div>
      </div>

      <button
        onClick={handleAddMeal}
        className="btn btn-primary"
        style={{ width: '100%' }}
      >
        ✓ Add to Today's Meals
      </button>

      {product.ingredients && (
        <div style={{ marginTop: '20px', fontSize: '14px' }}>
          <h4 style={{ marginBottom: '8px' }}>Ingredients</h4>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {product.ingredients}
          </p>
        </div>
      )}
    </div>
  );
}

function getNutritionGradeColor(grade) {
  const colors = {
    'a': '#008000',
    'b': '#85BB2F',
    'c': '#FFD700',
    'd': '#FFA500',
    'e': '#FF0000'
  };
  return colors[grade.toLowerCase()] || '#999';
}
