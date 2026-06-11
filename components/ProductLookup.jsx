import { useEffect, useMemo, useState } from 'react';
import { calculateNetCarbs } from '@/lib/carbUtils';
import {
  buildPortionSummary,
  calculateMacrosForPortion,
  formatPortionAmount,
  inferFoodPortionProfile,
  parsePortionAmount,
} from '@/lib/foodPortions';

function getInitialUnit(product) {
  const profile = inferFoodPortionProfile(product);
  if (profile.units.includes('serving')) {
    return 'serving';
  }
  return profile.defaultUnit;
}

function getInitialAmount(product, unit) {
  if (unit === 'serving') return '1';

  const servingUnit = String(product.servingUnit || '').toLowerCase();
  if (unit === 'grams' && ['g', 'gram', 'grams'].includes(servingUnit) && product.servingSize) {
    return formatPortionAmount(Number(product.servingSize));
  }
  if (unit === 'milliliters' && ['ml', 'milliliters'].includes(servingUnit) && product.servingSize) {
    return formatPortionAmount(Number(product.servingSize));
  }

  return '1';
}

function getQuickOptions(product, selectedUnit) {
  if (selectedUnit === 'serving') return ['1', '2'];

  const profile = inferFoodPortionProfile(product);
  if (profile.kind === 'liquid') {
    return ['0.5', '1', '2'];
  }

  if (selectedUnit === 'pounds') return ['0.25', '0.5', '1'];
  if (selectedUnit === 'ounces') return ['4', '8', '12'];
  return ['50', '100', '150'];
}

export default function ProductLookup({ product, onAddToMeal, onBack }) {
  const profile = useMemo(() => inferFoodPortionProfile(product), [product]);
  const [portionUnit, setPortionUnit] = useState(getInitialUnit(product));
  const [portionInput, setPortionInput] = useState(() => getInitialAmount(product, getInitialUnit(product)));
  const [macros, setMacros] = useState(() => ({
    protein: product.protein,
    carbs: product.carbs,
    fiber: product.fiber || 0,
    sugarAlcohols: product.sugarAlcohols || 0,
    netCarbs: product.netCarbs ?? calculateNetCarbs(product.carbs, product.fiber, product.sugarAlcohols),
    fat: product.fat,
    calories: product.calories,
    portionGrams: product.servingGrams || 100,
  }));

  const parsedAmount = parsePortionAmount(portionInput);

  useEffect(() => {
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    setMacros(calculateMacrosForPortion(product, parsedAmount, portionUnit));
  }, [parsedAmount, portionUnit, product]);

  const portionSummary = useMemo(() => {
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return null;
    return buildPortionSummary(parsedAmount, portionUnit, macros.portionGrams);
  }, [macros.portionGrams, parsedAmount, portionUnit]);

  const handleAddMeal = () => {
    onAddToMeal({
      mealName: product.brands ? `${product.brands} ${product.name}` : product.name,
      portionAmount: Number.isFinite(parsedAmount) ? Number(formatPortionAmount(parsedAmount)) : null,
      portionUnit,
      portionGrams: macros.portionGrams,
      protein: macros.protein,
      carbs: macros.carbs,
      fiber: macros.fiber,
      sugarAlcohols: macros.sugarAlcohols,
      fat: macros.fat,
      calories: macros.calories,
      externalFoodId: product.externalFoodId ?? null,
      externalFoodSource: product.externalFoodSource ?? null,
    });
  };

  const handleUnitChange = (newUnit) => {
    setPortionUnit(newUnit);
    if (portionInput.trim()) return;
    setPortionInput(getInitialAmount(product, newUnit));
  };

  const nutritionHeading = portionSummary
    ? `Nutrition for ${portionSummary.label}`
    : 'Nutrition for this portion';

  return (
    <div className="product-lookup">
      <button onClick={onBack} className="btn btn-outline" style={{ marginBottom: '16px' }}>
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
              borderRadius: '8px',
            }}
          />
        )}

        <h3 style={{ margin: '0 0 8px' }}>{product.name}</h3>
        {product.brands && (
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 12px' }}>{product.brands}</p>
        )}

        {product.nutritionGrade && (
          <div
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '12px',
              backgroundColor: getNutritionGradeColor(product.nutritionGrade),
              color: 'white',
              fontWeight: 'bold',
              fontSize: '12px',
              marginBottom: '16px',
            }}
          >
            Nutri-Score: {product.nutritionGrade.toUpperCase()}
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
          <h4 style={{ marginBottom: '12px' }}>Portion Size</h4>
          <div className="grid grid-2" style={{ marginBottom: '12px' }}>
            <input
              type="text"
              value={portionInput}
              onChange={(e) => setPortionInput(e.target.value)}
              className="form-input"
              placeholder="e.g. 1, 0.5, 1/2"
            />
            <select
              value={portionUnit}
              onChange={(e) => handleUnitChange(e.target.value)}
              className="form-select"
            >
              {profile.units.map((unit) => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>

          <p style={{ margin: '0 0 12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Use decimals or fractions such as `0.5`, `1.5`, `1/4`, or `3/4`.
          </p>

          {portionSummary && (
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'var(--feedback-info-surface)',
                border: '1px solid var(--feedback-info-border)',
                marginBottom: '16px',
              }}
            >
              <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{portionSummary.helperText}</p>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                Macros are normalized internally to grams for calculation accuracy.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {getQuickOptions(product, portionUnit).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPortionInput(option)}
                className="btn btn-outline"
                style={{ flex: '1 1 auto', minWidth: '88px', fontSize: '14px' }}
              >
                {option} {portionUnit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setPortionUnit('serving');
                setPortionInput('1');
              }}
              className="btn btn-outline"
              style={{ flex: '1 1 auto', minWidth: '88px', fontSize: '14px' }}
            >
              1 serving
            </button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <h4 style={{ marginBottom: '6px' }}>{nutritionHeading}</h4>
          {portionSummary && (
            <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Normalized gram equivalent: {portionSummary.gramsLabel}
            </p>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '16px',
            }}
          >
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Calories</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0', color: 'var(--primary-color)' }}>
                {macros.calories}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Protein</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0' }}>{macros.protein}g</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Total Carbs</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0' }}>{macros.carbs}g</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Fiber</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0' }}>{macros.fiber}g</p>
            </div>
            {macros.sugarAlcohols > 0 ? (
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Sugar Alcohols</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0' }}>{macros.sugarAlcohols}g</p>
              </div>
            ) : null}
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Net Carbs</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0' }}>{macros.netCarbs}g</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Fat</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0' }}>{macros.fat}g</p>
            </div>
          </div>

          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: 'var(--surface-muted)',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            Per 100g: {product.caloriesPer100g} cal • P: {product.proteinPer100g}g • C: {product.carbsPer100g}g • Fiber: {product.fiberPer100g || 0}g
            {product.sugarAlcoholsPer100g ? ` • Sugar Alcohols: ${product.sugarAlcoholsPer100g}g` : ''}
            {` • Net: ${calculateNetCarbs(product.carbsPer100g, product.fiberPer100g, product.sugarAlcoholsPer100g)}g • F: ${product.fatPer100g}g`}
          </div>
          <p style={{ margin: '12px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Net carbs are calculated as total carbs minus fiber and sugar alcohols.
          </p>
        </div>
      </div>

      <button
        onClick={handleAddMeal}
        className="btn btn-primary"
        style={{ width: '100%' }}
        disabled={!Number.isFinite(parsedAmount) || parsedAmount <= 0}
      >
        ✓ Add to Today's Meals
      </button>

      {product.ingredients && (
        <div style={{ marginTop: '20px', fontSize: '14px' }}>
          <h4 style={{ marginBottom: '8px' }}>Ingredients</h4>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{product.ingredients}</p>
        </div>
      )}
    </div>
  );
}

function getNutritionGradeColor(grade) {
  const colors = {
    a: '#008000',
    b: '#85BB2F',
    c: '#FFD700',
    d: '#FFA500',
    e: '#FF0000',
  };
  return colors[grade.toLowerCase()] || '#999';
}
