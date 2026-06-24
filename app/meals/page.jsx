'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { beverageApi, dailyHabitsApi, favoriteBeveragesApi, favoriteFoodsApi, favoriteMealsApi, habitDefinitionsApi, healthMetricsApi, mealsApi, profileApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import {
  calculateNetCarbs,
  getPrimaryCarbLabel,
  getPrimaryCarbValue,
  hasDetailedCarbData,
  usesNetCarbs,
} from '@/lib/carbUtils';
import { getDateDaysBefore, getTodayDate } from '@/lib/utils/dateUtils';
import { calculateCaloriesFromMacros } from '@/lib/utils/macroUtils';
import { formatPortionAmount } from '@/lib/foodPortions';
import {
  applyPortionDrivenMacroUpdate,
  createMealMacroSnapshot,
  getCalculatedMealMacros,
} from '@/lib/mealEditor';
import {
  BEVERAGE_TYPES,
  BEVERAGE_UNITS,
  buildBeverageRecordedAt,
  convertBeverageToFlOz,
  formatBeverageFromFlOz,
  getDefaultBeverageForm,
  getBeverageDisplayName,
  getDefaultCountsTowardHydration,
  getHydrationContributionLabel,
  getHydrationContributionFlOz,
  getHydrationHelperCopy,
  getPreferredBeverageUnit,
  shouldCountTowardHydration,
  getWaterQuickAddOptions,
  summarizeBeverageEntries,
} from '@/lib/beverages';
import {
  buildFavoriteTemplatePayload,
  buildMealsFromTemplate,
  buildRepeatMeals,
  findMostRecentMealSection,
  getMealTypeLabel,
  groupMealsByType,
  MEAL_TYPE_OPTIONS,
} from '@/lib/mealTemplates';
import { buildFavoriteMealSuggestions, getMealSectionSignature } from '@/lib/mealSuggestions';
import { buildFavoriteFoodPayload, buildMealFromFavoriteFood } from '@/lib/favoriteFoods';
import { buildBeverageFromFavorite, buildFavoriteBeveragePayload } from '@/lib/favoriteBeverages';
import { buildBeverageDuplicatePayload, buildMealDuplicatePayload } from '@/lib/intakeDuplicates';
import { getHydrationFeedback } from '@/lib/hydrationFeedback';
import { getMealFeedback } from '@/lib/mealFeedback';
import { buildDailyWinChallengeSummary } from '@/lib/dailyWinTemplates';
import { lookupByBarcode } from '@/lib/foodLookup';
import { getCustomDailyHabitPayloads, getDailyWinsSummary, getDailyWinsValues, mergeDailyWinDefinitions } from '@/lib/dailyWins';
import { getDayTypeDescription, getDayTypeGuidance } from '@/lib/coachingProfile';
import Loading from '@/components/Loading';
import ErrorMessage from '@/components/ErrorMessage';
import HydrationFeedback from '@/components/HydrationFeedback';
import Modal from '@/components/Modal';
import BarcodeScanner from '@/components/BarcodeScanner';
import ProductLookup from '@/components/ProductLookup';
import FoodSearch from '@/components/FoodSearch';

function getEmptyFormData(mealType = 'breakfast') {
  return {
    mealType,
    mealName: '',
    portionAmount: '',
    portionUnit: 'serving',
    portionGrams: '',
    protein: '',
    fat: '',
    carbs: '',
    fiber: '',
    sugarAlcohols: '',
    calories: '',
    externalFoodId: null,
    externalFoodSource: null,
  };
}

function getBeverageFormFromEntry(entry) {
  return {
    beverageType: entry.beverageType,
    displayName: entry.displayName || '',
    amount: entry.amount?.toString() || '',
    unit: entry.unit || 'fl_oz',
    time: entry.recordedAt?.slice(11, 16) || '20:00',
    countsTowardHydration: shouldCountTowardHydration(entry),
    calories: entry.calories?.toString() || '',
    protein: entry.protein?.toString() || '',
    carbs: entry.carbs?.toString() || '',
    fat: entry.fat?.toString() || '',
    caffeineMg: entry.caffeineMg?.toString() || '',
  };
}

function hasDerivedPortionData(formData) {
  return Boolean(formData.portionAmount || formData.portionGrams);
}

function getMealActionButtonStyle(active) {
  return {
    flex: '1 1 auto',
    minWidth: '110px',
    ...(active ? {} : { backgroundColor: 'transparent' }),
  };
}

function formatFoodPortion(meal) {
  if (!meal.portionAmount || !meal.portionUnit) return null;
  const unitLabel = meal.portionAmount === 1 && meal.portionUnit.endsWith('s')
    ? meal.portionUnit.slice(0, -1)
    : meal.portionUnit;
  const human = `${formatPortionAmount(meal.portionAmount)} ${unitLabel}`;
  if (meal.portionGrams) {
    return `${human} • ${formatPortionAmount(meal.portionGrams)}g`;
  }
  return human;
}

function formatCarbDetail(meal, dietStyle) {
  const primaryLabel = getPrimaryCarbLabel(dietStyle);
  const primaryValue = Math.round(getPrimaryCarbValue(meal, dietStyle));
  const details = [
    `${primaryLabel === 'Net Carbs' ? 'Net' : 'C'} ${primaryValue}`,
    `Total ${Math.round(meal.carbs || 0)}`,
  ];

  if (Number(meal.fiber || 0) > 0) {
    details.push(`Fiber ${Math.round(meal.fiber)}`);
  }
  if (Number(meal.sugarAlcohols || 0) > 0) {
    details.push(`Sugar Alcohols ${Math.round(meal.sugarAlcohols)}`);
  }

  return details.join(' • ');
}

function formatFavoriteBeverageDetails(entry, preferredBeverageUnit) {
  const details = [formatBeverageFromFlOz(entry.amountFlOz, preferredBeverageUnit)];
  if (entry.beverageType === 'other' && entry.displayName) {
    details.unshift(entry.displayName);
  }
  if (shouldCountTowardHydration(entry)) {
    details.push('counts toward hydration');
  }
  if (entry.calories || entry.protein || entry.carbs || entry.fat) {
    details.push(`${Math.round(entry.calories)} cal • P ${Math.round(entry.protein)} • C ${Math.round(entry.carbs)} • F ${Math.round(entry.fat)}`);
  }
  if (entry.caffeineMg) {
    details.push(`${Math.round(entry.caffeineMg)} mg caffeine`);
  }
  return details;
}

function InlineActionButton({ children, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        padding: '4px 0',
        fontSize: '13px',
        fontWeight: 600,
        color: danger ? 'var(--danger-color)' : 'var(--primary-color)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function DailyWinToggle({ active, children, onClick }) {
  return (
    <button
      type="button"
      className={`btn ${active ? 'btn-primary' : 'btn-outline'}`}
      style={{ flex: '1 1 auto', minWidth: '88px', padding: '8px 10px' }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function getMealFeedbackStyles(tone) {
  if (tone === 'positive') {
    return {
      background: 'var(--feedback-positive-surface)',
      border: '1px solid var(--feedback-positive-border)',
      labelColor: 'var(--success-color)',
    };
  }

  return {
    background: 'var(--feedback-info-surface)',
    border: '1px solid var(--feedback-info-border)',
    labelColor: 'var(--primary-color)',
  };
}

function MealFeedback({ feedback }) {
  const styles = getMealFeedbackStyles(feedback.tone);

  return (
    <div
      style={{
        marginBottom: '16px',
        padding: '10px 12px',
        borderRadius: '12px',
        background: styles.background,
        border: styles.border,
      }}
    >
      <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, color: styles.labelColor }}>
        {feedback.shortLabel}
      </p>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
        {feedback.message}
      </p>
    </div>
  );
}

const RECENT_MEAL_LOOKBACK_DAYS = 14;

export default function Meals() {
  const initialDate = typeof window === 'undefined' ? '' : getTodayDate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [meals, setMeals] = useState([]);
  const [recentMeals, setRecentMeals] = useState([]);
  const [favoriteMeals, setFavoriteMeals] = useState([]);
  const [favoriteFoods, setFavoriteFoods] = useState([]);
  const [favoriteBeverages, setFavoriteBeverages] = useState([]);
  const [beverageEntries, setBeverageEntries] = useState([]);
  const [customHabits, setCustomHabits] = useState([]);
  const [dailyWins, setDailyWins] = useState(getDailyWinsValues(initialDate));
  const [dailyWinsSavedAt, setDailyWinsSavedAt] = useState(null);
  const [savingDailyWins, setSavingDailyWins] = useState(false);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isFavoriteFoodsOpen, setIsFavoriteFoodsOpen] = useState(false);
  const [isFavoriteBeveragesOpen, setIsFavoriteBeveragesOpen] = useState(false);
  const [favoriteFoodSearch, setFavoriteFoodSearch] = useState('');
  const [favoriteBeverageSearch, setFavoriteBeverageSearch] = useState('');
  const [favoriteDraft, setFavoriteDraft] = useState(null);
  const [favoriteFoodDraft, setFavoriteFoodDraft] = useState(null);
  const [favoriteBeverageDraft, setFavoriteBeverageDraft] = useState(null);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [scannerRestartKey, setScannerRestartKey] = useState(0);
  const [scannerAddedCount, setScannerAddedCount] = useState(0);
  const [editingMeal, setEditingMeal] = useState(null);
  const [formData, setFormData] = useState(getEmptyFormData());
  const [mealMacroSnapshot, setMealMacroSnapshot] = useState(null);
  const [manualMacroOverride, setManualMacroOverride] = useState(false);
  const [beverageForm, setBeverageForm] = useState(getDefaultBeverageForm(initialDate || ''));
  const [editingBeverage, setEditingBeverage] = useState(null);
  const [beverageEditorOpen, setBeverageEditorOpen] = useState(false);
  const [savingBeverage, setSavingBeverage] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [dismissedSuggestionKeys, setDismissedSuggestionKeys] = useState([]);

  const fetchMeals = async () => {
    try {
      setLoading(true);
      setError(null);
      const recentStartDate = getDateDaysBefore(selectedDate, RECENT_MEAL_LOOKBACK_DAYS);
      const [profileData, mealData, recentMealData, favoriteMealData, favoriteFoodData, favoriteBeverageData, beverageData, healthMetricData, customHabitData, dailyHabitLogData] = await Promise.all([
        profileApi.getProfile(),
        mealsApi.getMeals({ date: selectedDate }),
        mealsApi.getMeals({ startDate: recentStartDate, endDate: selectedDate }),
        favoriteMealsApi.getFavoriteMeals(),
        favoriteFoodsApi.getFavoriteFoods(),
        favoriteBeveragesApi.getFavoriteBeverages(),
        beverageApi.getBeverages({ date: selectedDate }),
        healthMetricsApi.getHealthMetrics({ startDate: selectedDate, endDate: selectedDate }),
        habitDefinitionsApi.getHabitDefinitions(),
        dailyHabitsApi.getDailyHabitLogs({ startDate: selectedDate, endDate: selectedDate }),
      ]);
      const dailyMetric = healthMetricData[0] || null;
      setProfile(profileData);
      setMeals(mealData);
      setRecentMeals(recentMealData);
      setFavoriteMeals(favoriteMealData);
      setFavoriteFoods(favoriteFoodData);
      setFavoriteBeverages(favoriteBeverageData);
      setBeverageEntries(beverageData);
      setCustomHabits(customHabitData);
      setDailyWins(getDailyWinsValues(selectedDate, dailyMetric, customHabitData, dailyHabitLogData));
      setDailyWinsSavedAt(dailyMetric?.updatedAt || null);
      setBeverageForm(getDefaultBeverageForm(selectedDate, profileData.units));
      setEditingBeverage(null);
      setBeverageEditorOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(getTodayDate());
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDate) return;
    fetchMeals();
  }, [selectedDate]);

  useEffect(() => {
    if (!actionMessage) return undefined;
    const timeoutId = setTimeout(() => setActionMessage(''), 2500);
    return () => clearTimeout(timeoutId);
  }, [actionMessage]);

  useEffect(() => {
    setDismissedSuggestionKeys([]);
  }, [selectedDate]);

  const groupedMeals = useMemo(() => groupMealsByType(meals), [meals]);
  const groupedYesterdayMeals = useMemo(() => {
    const yesterday = getDateDaysBefore(selectedDate, 1);
    return groupMealsByType(recentMeals.filter((meal) => meal.date === yesterday));
  }, [recentMeals, selectedDate]);
  const lastMealSection = useMemo(() => findMostRecentMealSection(recentMeals), [recentMeals]);
  const favoriteSuggestions = useMemo(() => buildFavoriteMealSuggestions({
    meals,
    recentMeals,
    favoriteMeals,
    selectedDate,
  }), [favoriteMeals, meals, recentMeals, selectedDate]);
  const visibleFavoriteSuggestions = useMemo(() => (
    favoriteSuggestions.filter((suggestion) => !dismissedSuggestionKeys.includes(`${suggestion.mealType}::${suggestion.signature}`))
  ), [dismissedSuggestionKeys, favoriteSuggestions]);
  const preferredBeverageUnit = getPreferredBeverageUnit(profile?.units);
  const filteredFavoriteFoods = useMemo(() => {
    const query = favoriteFoodSearch.trim().toLowerCase();
    if (!query) return favoriteFoods;

    return favoriteFoods.filter((favoriteFood) => {
      const mealTypeLabel = getMealTypeLabel(favoriteFood.defaultMealType || 'breakfast').toLowerCase();
      const portion = formatFoodPortion(favoriteFood)?.toLowerCase() || '';
      return (
        favoriteFood.name.toLowerCase().includes(query)
        || mealTypeLabel.includes(query)
        || portion.includes(query)
      );
    });
  }, [favoriteFoodSearch, favoriteFoods]);
  const filteredFavoriteBeverages = useMemo(() => {
    const query = favoriteBeverageSearch.trim().toLowerCase();
    if (!query) return favoriteBeverages;

    return favoriteBeverages.filter((favoriteBeverage) => (
      favoriteBeverage.name.toLowerCase().includes(query)
      || getBeverageDisplayName(favoriteBeverage).toLowerCase().includes(query)
      || formatFavoriteBeverageDetails(favoriteBeverage, preferredBeverageUnit)
        .some((detail) => detail.toLowerCase().includes(query))
    ));
  }, [favoriteBeverageSearch, favoriteBeverages, preferredBeverageUnit]);
  const favoriteSuggestionMap = useMemo(() => new Map(
    visibleFavoriteSuggestions.map((suggestion) => [`${suggestion.mealType}::${suggestion.signature}`, suggestion]),
  ), [visibleFavoriteSuggestions]);
  const beverageHydrationPreview = useMemo(() => {
    if (beverageForm.amount === '') return null;
    const amountFlOz = convertBeverageToFlOz(beverageForm.amount, beverageForm.unit);
    if (!Number.isFinite(amountFlOz) || amountFlOz <= 0) return null;

    const contributionFlOz = getHydrationContributionFlOz({
      beverageType: beverageForm.beverageType,
      displayName: beverageForm.displayName,
      countsTowardHydration: beverageForm.countsTowardHydration,
      amountFlOz,
    });

    if (contributionFlOz <= 0) return 'This beverage will not add to the hydration total.';
    return `Counts as ${formatBeverageFromFlOz(contributionFlOz, preferredBeverageUnit)} hydration credit.`;
  }, [
    beverageForm.amount,
    beverageForm.beverageType,
    beverageForm.countsTowardHydration,
    beverageForm.displayName,
    beverageForm.unit,
    preferredBeverageUnit,
  ]);
  const beverageSummary = useMemo(() => summarizeBeverageEntries(beverageEntries, {
    preferredUnit: preferredBeverageUnit,
    weightKg: profile?.weight,
    dietStyle: profile?.dietStyle,
    date: selectedDate,
  }), [beverageEntries, preferredBeverageUnit, profile?.dietStyle, profile?.weight, selectedDate]);
  const hydrationHelper = getHydrationHelperCopy({ dietStyle: profile?.dietStyle });
  const activeDailyWins = useMemo(
    () => mergeDailyWinDefinitions(profile?.dailyWinsActiveKeys, customHabits),
    [customHabits, profile?.dailyWinsActiveKeys],
  );
  const dailyWinsSummary = useMemo(
    () => getDailyWinsSummary(dailyWins, activeDailyWins),
    [activeDailyWins, dailyWins],
  );
  const dailyWinsChallenge = useMemo(
    () => buildDailyWinChallengeSummary({
      templateKey: profile?.dailyWinsTemplateKey,
      challengeStartDate: profile?.dailyWinsChallengeStartDate,
      referenceDate: selectedDate,
      dailyWinsSummary,
    }),
    [dailyWinsSummary, profile?.dailyWinsChallengeStartDate, profile?.dailyWinsTemplateKey, selectedDate],
  );
  const dayTypeGuidance = useMemo(() => getDayTypeGuidance({
    dayType: dailyWins.dayType,
    coachingMode: profile?.coachingMode,
    ageGroup: profile?.ageGroup,
  }), [dailyWins.dayType, profile?.ageGroup, profile?.coachingMode]);
  const hydrationFeedback = useMemo(() => getHydrationFeedback({
    entries: beverageEntries,
    summary: beverageSummary,
    dietStyle: profile?.dietStyle,
    isCurrentDay: selectedDate === getTodayDate(),
    currentHour: new Date().getHours(),
  }), [beverageEntries, beverageSummary, profile?.dietStyle, selectedDate]);
  const hydrationTargetBreakdown = useMemo(() => ([
    `base ${formatBeverageFromFlOz(beverageSummary.baselineFlOz, preferredBeverageUnit)}`,
    beverageSummary.workoutBonusFlOz > 0
      ? `workout ${formatBeverageFromFlOz(beverageSummary.workoutBonusFlOz, preferredBeverageUnit)}`
      : null,
    beverageSummary.dietStyleBonusFlOz > 0
      ? `${beverageSummary.dietStyleBonusLabel} ${formatBeverageFromFlOz(beverageSummary.dietStyleBonusFlOz, preferredBeverageUnit)}`
      : null,
  ].filter(Boolean)), [
    beverageSummary.baselineFlOz,
    beverageSummary.dietStyleBonusFlOz,
    beverageSummary.dietStyleBonusLabel,
    beverageSummary.workoutBonusFlOz,
    preferredBeverageUnit,
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (['portionAmount', 'portionUnit', 'portionGrams'].includes(name)) {
        return applyPortionDrivenMacroUpdate(updated, mealMacroSnapshot, manualMacroOverride);
      }
      if (['protein', 'carbs', 'fiber', 'sugarAlcohols', 'fat', 'calories'].includes(name)) {
        setManualMacroOverride(true);
        return updated;
      }
      if (!hasDerivedPortionData(updated) && name !== 'calories' && updated.protein && updated.fat && updated.carbs && !manualMacroOverride) {
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
        mealType: formData.mealType,
        mealName: formData.mealName,
        portionAmount: formData.portionAmount,
        portionUnit: formData.portionUnit,
        portionGrams: formData.portionGrams,
        protein: parseFloat(formData.protein),
        fat: parseFloat(formData.fat),
        carbs: parseFloat(formData.carbs),
        fiber: formData.fiber === '' ? null : parseFloat(formData.fiber),
        sugarAlcohols: formData.sugarAlcohols === '' ? null : parseFloat(formData.sugarAlcohols),
        calories: parseFloat(formData.calories),
      };
      if (editingMeal) {
        await mealsApi.updateMeal(editingMeal.id, mealData);
      } else {
        await mealsApi.createMeal(mealData);
      }
      setIsModalOpen(false);
      setEditingMeal(null);
      setFormData(getEmptyFormData(selectedMealType));
      setMealMacroSnapshot(null);
      setManualMacroOverride(false);
      fetchMeals();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDailyWinsSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingDailyWins(true);
      await healthMetricsApi.createHealthMetric({
        recordedAt: dailyWins.recordedAt,
        workoutCompleted: dailyWins.workoutCompleted === '' ? null : dailyWins.workoutCompleted === 'true',
        dayType: dailyWins.dayType || null,
        readingCompleted: dailyWins.readingCompleted === '' ? null : dailyWins.readingCompleted === 'true',
        prayerCompleted: dailyWins.prayerCompleted === '' ? null : dailyWins.prayerCompleted === 'true',
        sleepHours: dailyWins.sleepHours === '' ? null : Number(dailyWins.sleepHours),
        energyLevel: dailyWins.energyLevel === '' ? null : Number(dailyWins.energyLevel),
        sorenessLevel: dailyWins.sorenessLevel === '' ? null : Number(dailyWins.sorenessLevel),
      });
      await Promise.all(
        getCustomDailyHabitPayloads(dailyWins, customHabits, selectedDate)
          .map((payload) => dailyHabitsApi.upsertDailyHabitLog(payload)),
      );
      setActionMessage(`Saved ${dailyWinsSummary.completed} of ${dailyWinsSummary.total} daily wins`);
      await fetchMeals();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingDailyWins(false);
    }
  };

  const handleEdit = (meal) => {
    setEditingMeal(meal);
    setSelectedMealType(meal.mealType || 'breakfast');
    setMealMacroSnapshot(createMealMacroSnapshot(meal));
    setManualMacroOverride(false);
    setFormData({
      mealType: meal.mealType || 'breakfast',
      mealName: meal.mealName,
      portionAmount: meal.portionAmount?.toString() || '',
      portionUnit: meal.portionUnit || 'serving',
      portionGrams: meal.portionGrams?.toString() || '',
      protein: meal.protein.toString(),
      fat: meal.fat.toString(),
      carbs: meal.carbs.toString(),
      fiber: meal.fiber?.toString() || '',
      sugarAlcohols: meal.sugarAlcohols?.toString() || '',
      calories: meal.calories.toString(),
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    const item = meals.find((m) => m.id === id);
    if (!item) return;
    setMeals((current) => current.filter((m) => m.id !== id));
    toast(`${item.mealName} deleted`, {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => setMeals((current) => {
          const index = meals.findIndex((m) => m.id === id);
          const updated = [...current];
          updated.splice(index, 0, item);
          return updated;
        }),
      },
      onDismiss: () => {
        mealsApi.deleteMeal(id).catch((err) => {
          setMeals((current) => {
            const index = meals.findIndex((m) => m.id === id);
            const updated = [...current];
            updated.splice(index, 0, item);
            return updated;
          });
          toast.error(err.message);
        });
      },
    });
  };

  const handleDuplicateMeal = async (meal) => {
    try {
      await mealsApi.createMeal(buildMealDuplicatePayload(meal, selectedDate));
      setActionMessage(`Duplicated ${meal.mealName}`);
      await fetchMeals();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openAddModal = (mealType = selectedMealType) => {
    setEditingMeal(null);
    setSelectedMealType(mealType);
    setFormData(getEmptyFormData(mealType));
    setMealMacroSnapshot(null);
    setManualMacroOverride(false);
    setScannedProduct(null);
    setIsModalOpen(true);
  };

  const openBarcodeScanner = (mealType = selectedMealType) => {
    setSelectedMealType(mealType);
    setScannedProduct(null);
    setLookupLoading(false);
    setScannerAddedCount(0);
    setScannerRestartKey((current) => current + 1);
    setIsScannerOpen(true);
  };

  const openFoodSearch = (mealType = selectedMealType) => {
    setSelectedMealType(mealType);
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
    } catch (err) {
      toast.error(err.message || 'Failed to lookup product. Please try again or enter manually.');
    } finally {
      setLookupLoading(false);
    }
  };

  const resumeScannerSession = () => {
    setScannedProduct(null);
    setLookupLoading(false);
    setScannerRestartKey((current) => current + 1);
  };

  const closeScannerSession = () => {
    setIsScannerOpen(false);
    setScannedProduct(null);
    setLookupLoading(false);
    setScannerAddedCount(0);
  };

  const handleAddScannedMeal = async (mealData, { keepScanning = true } = {}) => {
    try {
      const result = await mealsApi.createMeal({
        date: selectedDate,
        mealType: selectedMealType,
        mealName: mealData.mealName,
        portionAmount: mealData.portionAmount,
        portionUnit: mealData.portionUnit,
        portionGrams: mealData.portionGrams,
        protein: mealData.protein,
        fat: mealData.fat,
        carbs: mealData.carbs,
        fiber: mealData.fiber,
        sugarAlcohols: mealData.sugarAlcohols,
        calories: mealData.calories,
        externalFoodId: mealData.externalFoodId ?? null,
        externalFoodSource: mealData.externalFoodSource ?? null,
      });
      setActionMessage(`Added ${mealData.mealName}`);
      setScannerAddedCount((current) => current + 1);
      if (keepScanning) resumeScannerSession();
      else closeScannerSession();
      fetchMeals();
      if (result?.suggestFavorite) {
        toast(`You've used ${mealData.mealName} twice — save as a favorite?`, {
          duration: 8000,
          action: {
            label: 'Save',
            onClick: () => favoriteFoodsApi.createFavoriteFood({
              name: mealData.mealName,
              defaultMealType: selectedMealType,
              portionAmount: mealData.portionAmount,
              portionUnit: mealData.portionUnit,
              portionGrams: mealData.portionGrams,
              protein: mealData.protein,
              fat: mealData.fat,
              carbs: mealData.carbs,
              fiber: mealData.fiber,
              sugarAlcohols: mealData.sugarAlcohols,
              calories: mealData.calories,
            }).then(() => toast.success(`${mealData.mealName} saved to favorites`))
              .catch((err) => toast.error(err.message || 'Failed to save favorite')),
          },
        });
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSaveFavorite = (section) => {
    setFavoriteDraft({
      mealType: section.mealType,
      name: `${section.label} Favorite`,
      items: section.items,
    });
  };

  const handleDismissFavoriteSuggestion = (suggestion) => {
    const key = `${suggestion.mealType}::${suggestion.signature}`;
    setDismissedSuggestionKeys((current) => [...current, key]);
  };

  const handleSaveFavoriteFood = (meal) => {
    setFavoriteFoodDraft({
      meal,
      name: meal.mealName,
    });
  };

  const submitFavoriteDraft = async () => {
    if (!favoriteDraft?.name?.trim()) return;
    try {
      await favoriteMealsApi.createFavoriteMeal(
        buildFavoriteTemplatePayload(favoriteDraft.name.trim(), favoriteDraft.mealType, favoriteDraft.items),
      );
      setFavoriteDraft(null);
      fetchMeals();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submitFavoriteFoodDraft = async () => {
    if (!favoriteFoodDraft?.name?.trim()) return;
    try {
      await favoriteFoodsApi.createFavoriteFood(
        buildFavoriteFoodPayload(favoriteFoodDraft.meal, favoriteFoodDraft.name.trim()),
      );
      setFavoriteFoodDraft(null);
      await fetchMeals();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const addFavoriteMeal = async (favoriteMeal) => {
    try {
      const payloads = buildMealsFromTemplate(favoriteMeal, selectedDate);
      await Promise.all(payloads.map((payload) => mealsApi.createMeal(payload)));
      setIsFavoritesOpen(false);
      fetchMeals();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const addFavoriteFood = async (favoriteFood, mealType = selectedMealType) => {
    try {
      await mealsApi.createMeal(buildMealFromFavoriteFood(favoriteFood, selectedDate, mealType));
      setIsFavoriteFoodsOpen(false);
      setActionMessage(`Added ${favoriteFood.name}`);
      await fetchMeals();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const addFavoriteBeverage = async (favoriteBeverage) => {
    try {
      await beverageApi.createBeverage(buildBeverageFromFavorite(favoriteBeverage, selectedDate));
      setIsFavoriteBeveragesOpen(false);
      setActionMessage(`Added ${favoriteBeverage.name}`);
      await fetchMeals();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const removeFavoriteMeal = (id) => {
    const item = favoriteMeals.find((m) => m.id === id);
    if (!item) return;
    setFavoriteMeals((current) => current.filter((m) => m.id !== id));
    toast(`${item.name} deleted`, {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => setFavoriteMeals((current) => [...current, item]),
      },
      onDismiss: () => {
        favoriteMealsApi.deleteFavoriteMeal(id).catch((err) => {
          setFavoriteMeals((current) => [...current, item]);
          toast.error(err.message);
        });
      },
    });
  };

  const removeFavoriteFood = (id) => {
    const item = favoriteFoods.find((f) => f.id === id);
    if (!item) return;
    setFavoriteFoods((current) => current.filter((f) => f.id !== id));
    toast(`${item.name} deleted`, {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => setFavoriteFoods((current) => [...current, item]),
      },
      onDismiss: () => {
        favoriteFoodsApi.deleteFavoriteFood(id).catch((err) => {
          setFavoriteFoods((current) => [...current, item]);
          toast.error(err.message);
        });
      },
    });
  };

  const removeFavoriteBeverage = (id) => {
    const item = favoriteBeverages.find((b) => b.id === id);
    if (!item) return;
    setFavoriteBeverages((current) => current.filter((b) => b.id !== id));
    toast(`${item.name} deleted`, {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => setFavoriteBeverages((current) => [...current, item]),
      },
      onDismiss: () => {
        favoriteBeveragesApi.deleteFavoriteBeverage(id).catch((err) => {
          setFavoriteBeverages((current) => [...current, item]);
          toast.error(err.message);
        });
      },
    });
  };

  const repeatSection = async (section) => {
    try {
      const payloads = buildRepeatMeals(section.items, selectedDate);
      await Promise.all(payloads.map((payload) => mealsApi.createMeal(payload)));
      fetchMeals();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddMealAgainToday = async (meal) => {
    try {
      await mealsApi.createMeal(buildMealDuplicatePayload(meal, getTodayDate()));
      setActionMessage(`Added ${meal.mealName} to today`);
      await fetchMeals();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBeverageSubmit = async (entry, { entryId = editingBeverage?.id } = {}) => {
    try {
      setSavingBeverage(true);
      if (entryId) {
        await beverageApi.updateBeverage(entryId, entry);
      } else {
        await beverageApi.createBeverage(entry);
      }
      await fetchMeals();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingBeverage(false);
    }
  };

  const handleQuickAddWater = async (amount, unit) => {
    await handleBeverageSubmit({
      amount,
      unit,
      recordedAt: buildBeverageRecordedAt(selectedDate),
      beverageType: 'water',
      displayName: null,
      countsTowardHydration: true,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    }, { entryId: null });
  };

  const handleEditBeverage = (entry) => {
    setEditingBeverage(entry);
    setBeverageForm(getBeverageFormFromEntry(entry));
    setBeverageEditorOpen(true);
  };

  const handleDeleteBeverage = (id) => {
    const entry = beverageEntries.find((b) => b.id === id);
    if (!entry) return;
    const label = getBeverageDisplayName(entry);
    setBeverageEntries((current) => current.filter((b) => b.id !== id));
    toast(`${label} deleted`, {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => setBeverageEntries((current) => [...current, entry]),
      },
      onDismiss: () => {
        beverageApi.deleteBeverage(id).catch((err) => {
          setBeverageEntries((current) => [...current, entry]);
          toast.error(err.message);
        });
      },
    });
  };

  const handleDuplicateBeverage = async (entry) => {
    try {
      await beverageApi.createBeverage(buildBeverageDuplicatePayload(entry, selectedDate));
      const beverageLabel = getBeverageDisplayName(entry).toLowerCase();
      setActionMessage(`Added another ${formatBeverageFromFlOz(entry.amountFlOz, preferredBeverageUnit)} ${beverageLabel}`);
      await fetchMeals();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleFavoriteBeverage = (entry) => {
    const defaultName = entry.displayName?.trim() || BEVERAGE_TYPES.find((type) => type.key === entry.beverageType)?.label || 'Favorite Beverage';
    setFavoriteBeverageDraft({
      name: defaultName,
      payload: buildFavoriteBeveragePayload(entry, defaultName),
    });
  };

  const submitFavoriteBeverageDraft = async () => {
    if (!favoriteBeverageDraft?.name?.trim()) {
      toast.error('Enter a favorite beverage name.');
      return;
    }

    try {
      await favoriteBeveragesApi.createFavoriteBeverage({
        ...favoriteBeverageDraft.payload,
        name: favoriteBeverageDraft.name.trim(),
      });
      setFavoriteBeverageDraft(null);
      setActionMessage(`Saved ${favoriteBeverageDraft.name.trim()}`);
      await fetchMeals();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const resetBeverageEditor = () => {
    setEditingBeverage(null);
    setBeverageForm(getDefaultBeverageForm(selectedDate, profile?.units));
    setBeverageEditorOpen(false);
  };

  const handleBeverageFormSubmit = async (e) => {
    e.preventDefault();
    await handleBeverageSubmit({
      amount: beverageForm.amount,
      unit: beverageForm.unit,
      recordedAt: buildBeverageRecordedAt(selectedDate, beverageForm.time),
      beverageType: beverageForm.beverageType,
      displayName: beverageForm.beverageType === 'other' ? beverageForm.displayName : null,
      countsTowardHydration: beverageForm.countsTowardHydration,
      calories: beverageForm.calories,
      protein: beverageForm.protein,
      carbs: beverageForm.carbs,
      fat: beverageForm.fat,
      caffeineMg: beverageForm.caffeineMg,
    });
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} onRetry={fetchMeals} />;

  const macrosAreDerived = hasDerivedPortionData(formData);
  const calculatedMealMacros = mealMacroSnapshot ? getCalculatedMealMacros(formData, mealMacroSnapshot) : null;
  const netCarbsPreview = calculateNetCarbs(formData.carbs, formData.fiber, formData.sugarAlcohols);
  const primaryCarbLabel = getPrimaryCarbLabel(profile?.dietStyle);
  const primaryCarbBasis = usesNetCarbs(profile?.dietStyle);

  const handleResetMealMacros = () => {
    if (!calculatedMealMacros) return;
    setFormData((current) => ({
      ...current,
      ...calculatedMealMacros,
    }));
    setManualMacroOverride(false);
  };

  return (
    <div className="container" style={{ padding: '20px' }}>
      <div className="stack-layout" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: '8px', fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>Intake</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Track meals, snacks, and beverages in one daily intake flow. Water stays one-tap fast.
          </p>
          {actionMessage ? (
            <p style={{ margin: '8px 0 0', color: 'var(--primary-color)', fontSize: '14px', fontWeight: 600 }}>
              {actionMessage}
            </p>
          ) : null}
        </div>
        <div className="page-header-actions">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="form-input"
            style={{ flex: '1 1 auto', minWidth: '150px', maxWidth: '300px' }}
          />
          <button onClick={() => setIsFavoritesOpen(true)} className="btn btn-outline" style={{ flex: '0 1 auto' }}>
            Favorite Meals
          </button>
          <button onClick={() => setIsFavoriteFoodsOpen(true)} className="btn btn-outline" style={{ flex: '0 1 auto' }}>
            Favorite Foods
          </button>
          <button onClick={() => setIsFavoriteBeveragesOpen(true)} className="btn btn-outline" style={{ flex: '0 1 auto' }}>
            Favorite Beverages
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '12px' }}>Quick Intake</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {MEAL_TYPE_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setSelectedMealType(option.key)}
              className={`btn ${selectedMealType === option.key ? 'btn-primary' : 'btn-outline'}`}
              style={getMealActionButtonStyle(selectedMealType === option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="cluster-actions">
          <button onClick={() => openFoodSearch(selectedMealType)} className="btn btn-secondary" style={{ flex: '1 1 160px' }}>
            Search Food
          </button>
          <button onClick={() => openBarcodeScanner(selectedMealType)} className="btn btn-secondary" style={{ flex: '1 1 160px' }}>
            Scan Barcode
          </button>
          <button onClick={() => openAddModal(selectedMealType)} className="btn btn-primary" style={{ flex: '1 1 160px' }}>
            Add Food Manually
          </button>
          <button onClick={() => setIsFavoriteFoodsOpen(true)} className="btn btn-outline" style={{ flex: '1 1 160px' }}>
            Add Favorite Food
          </button>
        </div>
        <p style={{ margin: '12px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
          Current target meal: <strong>{getMealTypeLabel(selectedMealType)}</strong>
        </p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        {activeDailyWins.length === 0 ? (
          <div className="page-header">
            <div>
              <h2 style={{ margin: '0 0 6px' }}>Today&apos;s Wins</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                No Daily Wins configured.
              </p>
            </div>
            <Link href="/profile" className="btn btn-outline">
              Configure Daily Wins
            </Link>
          </div>
        ) : (
          <>
            <div className="page-header" style={{ marginBottom: '12px' }}>
              <div>
                <h2 style={{ margin: '0 0 6px' }}>Today&apos;s Wins</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Keep this fast. Log the few daily wins you actually want to stay consistent with.
                </p>
                <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Active: {activeDailyWins.map((definition) => definition.label).join(' • ')}
                </p>
                {dailyWinsChallenge ? (
                  <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {dailyWinsChallenge.templateName} • Day {dailyWinsChallenge.dayNumber}
                    {dailyWinsChallenge.durationDays ? ` of ${dailyWinsChallenge.durationDays}` : ''}
                    {dailyWinsChallenge.daysRemaining != null ? ` • ${dailyWinsChallenge.daysRemaining} days left` : ''}
                  </p>
                ) : null}
                {profile?.youthSafetyMessage ? (
                  <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {profile.youthSafetyMessage}
                  </p>
                ) : null}
                {dayTypeGuidance ? (
                  <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {dayTypeGuidance}
                  </p>
                ) : null}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                  {dailyWinsSummary.completed} / {dailyWinsSummary.total}
                </p>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {dailyWinsSummary.percentage}% complete
                </p>
              </div>
            </div>

            <form onSubmit={handleDailyWinsSubmit} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Day Type</p>
                <div className="cluster-actions">
                  {['workout_day', 'practice_day', 'competition_day', 'recovery_day', 'rest_day'].map((dayType) => (
                    <DailyWinToggle
                      key={dayType}
                      active={dailyWins.dayType === dayType}
                      onClick={() => setDailyWins((current) => ({ ...current, dayType }))}
                    >
                      {getDayTypeDescription(dayType)}
                    </DailyWinToggle>
                  ))}
                </div>
              </div>
              <div className="grid grid-2">
                {activeDailyWins.map((definition) => (
                  <div key={definition.key}>
                    <p style={{ margin: '0 0 8px', fontWeight: 600 }}>{definition.label}</p>
                    <div className="cluster-actions">
                      {definition.inputType === 'boolean' ? (
                        <>
                          <DailyWinToggle active={dailyWins[definition.key] === 'true'} onClick={() => setDailyWins((current) => ({ ...current, [definition.key]: 'true' }))}>Done</DailyWinToggle>
                          <DailyWinToggle active={dailyWins[definition.key] === 'false'} onClick={() => setDailyWins((current) => ({ ...current, [definition.key]: 'false' }))}>Not Yet</DailyWinToggle>
                        </>
                      ) : null}
                      {definition.key === 'sleepHours' ? [5, 6, 7, 8, 9].map((value) => (
                        <DailyWinToggle
                          key={`${definition.key}-${value}`}
                          active={Number(dailyWins.sleepHours) === value}
                          onClick={() => setDailyWins((current) => ({ ...current, sleepHours: String(value) }))}
                        >
                          {value === 9 ? '9+' : `${value}h`}
                        </DailyWinToggle>
                      )) : null}
                      {definition.inputType === 'rating' ? [1, 2, 3, 4, 5].map((value) => (
                        <DailyWinToggle
                          key={`${definition.key}-${value}`}
                          active={Number(dailyWins[definition.key]) === value}
                          onClick={() => setDailyWins((current) => ({ ...current, [definition.key]: String(value) }))}
                        >
                          {value}
                        </DailyWinToggle>
                      )) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={savingDailyWins}>
                  {savingDailyWins ? 'Saving...' : "Save Today's Wins"}
                </button>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {dailyWinsSavedAt
                    ? `Updated for ${selectedDate}.`
                    : 'Daily Wins stay lightweight here so logging feels easy to repeat.'}
                </p>
              </div>
            </form>
          </>
        )}
      </div>

      <div id="beverages" className="card" style={{ marginBottom: '24px', marginTop: '32px' }}>
        <div className="page-header" style={{ marginBottom: '12px' }}>
          <div>
            <h2 style={{ margin: '0 0 6px' }}>Hydration &amp; Beverages</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
              Water counts fully. Other beverages can contribute partially to hydration based on beverage type.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
              {beverageSummary.display.consumed} / {beverageSummary.display.target}
            </p>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
              {beverageSummary.remainingFlOz > 0
                ? `${beverageSummary.display.remaining} remaining`
                : 'Hydration target met'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {getWaterQuickAddOptions(profile?.units).map((option) => (
            <button
              key={`hydration-${option.label}`}
              type="button"
              className="btn btn-outline"
              style={{ flex: '1 1 104px', padding: '10px 12px' }}
              onClick={() => handleQuickAddWater(option.amount, option.unit)}
              disabled={savingBeverage}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            className="btn btn-outline"
            style={{ flex: '1 1 140px', padding: '10px 12px' }}
            onClick={() => setIsFavoriteBeveragesOpen(true)}
          >
            Add Favorite Beverage
          </button>
        </div>

        <details open={beverageEditorOpen}>
          <summary
            style={{ cursor: 'pointer', fontWeight: 600 }}
            onClick={(e) => {
              e.preventDefault();
              setBeverageEditorOpen((current) => !current);
            }}
          >
            {editingBeverage ? 'Edit Beverage' : 'Log Beverage'}
          </summary>
          <form onSubmit={handleBeverageFormSubmit} style={{ display: 'grid', gap: '12px', marginTop: '14px' }}>
            <div className="grid grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Beverage</label>
                <select
                  className="form-select"
                  value={beverageForm.beverageType}
                  onChange={(e) => setBeverageForm((current) => ({
                    ...current,
                    beverageType: e.target.value,
                    displayName: e.target.value === 'other' ? current.displayName : '',
                    countsTowardHydration: getDefaultCountsTowardHydration(e.target.value),
                  }))}
                >
                  {BEVERAGE_TYPES.map((type) => (
                    <option key={type.key} value={type.key}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={beverageForm.time}
                  onChange={(e) => setBeverageForm((current) => ({ ...current, time: e.target.value }))}
                />
              </div>
            </div>

            {beverageForm.beverageType === 'other' ? (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Custom Beverage Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={beverageForm.displayName}
                  onChange={(e) => setBeverageForm((current) => ({ ...current, displayName: e.target.value }))}
                  placeholder="e.g., LMNT Grapefruit"
                  required
                />
              </div>
            ) : null}

            <div className="grid grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  min="0"
                  max="128"
                  step="0.1"
                  className="form-input"
                  value={beverageForm.amount}
                  onChange={(e) => setBeverageForm((current) => ({ ...current, amount: e.target.value }))}
                  placeholder="Amount"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Unit</label>
                <select
                  className="form-select"
                  value={beverageForm.unit}
                  onChange={(e) => setBeverageForm((current) => ({ ...current, unit: e.target.value }))}
                >
                  {BEVERAGE_UNITS.map((unit) => (
                    <option key={unit.key} value={unit.key}>{unit.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={beverageForm.countsTowardHydration}
                onChange={(e) => setBeverageForm((current) => ({ ...current, countsTowardHydration: e.target.checked }))}
              />
              Counts toward hydration
            </label>
            {beverageHydrationPreview ? (
              <p style={{ margin: '-6px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                {beverageHydrationPreview}
              </p>
            ) : null}

            <div className="grid grid-4">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Calories</label>
                <input type="number" min="0" step="0.1" className="form-input" value={beverageForm.calories} onChange={(e) => setBeverageForm((current) => ({ ...current, calories: e.target.value }))} placeholder="0" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Protein</label>
                <input type="number" min="0" step="0.1" className="form-input" value={beverageForm.protein} onChange={(e) => setBeverageForm((current) => ({ ...current, protein: e.target.value }))} placeholder="0" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Carbs</label>
                <input type="number" min="0" step="0.1" className="form-input" value={beverageForm.carbs} onChange={(e) => setBeverageForm((current) => ({ ...current, carbs: e.target.value }))} placeholder="0" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Fat</label>
                <input type="number" min="0" step="0.1" className="form-input" value={beverageForm.fat} onChange={(e) => setBeverageForm((current) => ({ ...current, fat: e.target.value }))} placeholder="0" />
              </div>
            </div>

            <div className="grid grid-2" style={{ alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Caffeine (mg)</label>
                <input type="number" min="0" max="1000" step="1" className="form-input" value={beverageForm.caffeineMg} onChange={(e) => setBeverageForm((current) => ({ ...current, caffeineMg: e.target.value }))} placeholder="Optional" />
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button type="submit" className="btn btn-primary" disabled={savingBeverage} style={{ flex: '1 1 160px' }}>
                  {savingBeverage ? 'Saving...' : editingBeverage ? 'Update Beverage' : 'Log Beverage'}
                </button>
                {editingBeverage ? (
                  <button type="button" className="btn btn-outline" onClick={resetBeverageEditor} style={{ flex: '1 1 140px' }}>
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
          </form>
        </details>

        <div style={{ display: 'grid', gap: '8px', marginTop: '14px' }}>
          <HydrationFeedback feedback={hydrationFeedback} style={{ marginBottom: '4px' }} />
          <details>
            <summary style={{ cursor: 'pointer', color: 'var(--primary-color)', fontWeight: 600, fontSize: '14px' }}>
              Read more
            </summary>
            <div style={{ display: 'grid', gap: '6px', marginTop: '8px' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                Target: {hydrationTargetBreakdown.join(' + ')}
              </p>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                Total fluids: {beverageSummary.display.totalFluids}
              </p>
              {beverageSummary.display.totalFluids !== beverageSummary.display.consumed ? (
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Weighted hydration: {beverageSummary.display.consumed}
                </p>
              ) : null}
              {hydrationHelper.map((message) => (
                <p key={message} style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {message}
                </p>
              ))}
            </div>
          </details>
        </div>

        {beverageEntries.length > 0 ? (
          <div style={{ display: 'grid', gap: '10px', marginTop: '16px' }}>
            {beverageEntries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '12px',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>
                    {getBeverageDisplayName(entry)}
                  </p>
                  <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {formatBeverageFromFlOz(entry.amountFlOz, preferredBeverageUnit)}
                    {` • ${getHydrationContributionLabel(entry, preferredBeverageUnit)}`}
                  </p>
                  {(entry.calories || entry.protein || entry.carbs || entry.fat) ? (
                    <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {Math.round(entry.calories)} cal • P {Math.round(entry.protein)} • C {Math.round(entry.carbs)} • F {Math.round(entry.fat)}
                    </p>
                  ) : null}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {entry.recordedAt.slice(11, 16)}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '6px' }}>
                    <InlineActionButton onClick={() => handleEditBeverage(entry)}>Edit</InlineActionButton>
                    <InlineActionButton onClick={() => handleFavoriteBeverage(entry)}>Favorite</InlineActionButton>
                    <InlineActionButton onClick={() => handleDuplicateBeverage(entry)}>Duplicate</InlineActionButton>
                    <InlineActionButton onClick={() => handleDeleteBeverage(entry.id)} danger>Delete</InlineActionButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: '16px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
            No beverages logged for this day yet. Quick water works best when you want one tap and done.
          </p>
        )}
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '12px' }}>Repeat Shortcuts</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => lastMealSection && repeatSection(lastMealSection)}
            className="btn btn-outline"
            style={{ flex: '1 1 180px' }}
            disabled={!lastMealSection}
          >
            Repeat Last Meal
          </button>
          {['breakfast', 'lunch', 'dinner'].map((mealType) => {
            const section = groupedYesterdayMeals.find((entry) => entry.mealType === mealType);
            return (
              <button
                key={mealType}
                type="button"
                onClick={() => section && repeatSection(section)}
                className="btn btn-outline"
                style={{ flex: '1 1 180px' }}
                disabled={!section}
              >
                Repeat Yesterday&apos;s {getMealTypeLabel(mealType)}
              </button>
            );
          })}
        </div>
      </div>

      {groupedMeals.length === 0 ? (
        <div className="card" style={{ padding: '32px 24px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '8px' }}>No meals logged for this day</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Start with breakfast, lunch, dinner, or a quick snack. Favorite meals and quick water keep daily intake logging fast.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: favoriteMeals.length > 0 || favoriteFoods.length > 0 ? '16px' : 0 }}>
            <button onClick={() => openFoodSearch(selectedMealType)} className="btn btn-primary">Search Food</button>
            <button onClick={() => openAddModal(selectedMealType)} className="btn btn-outline">Add Manually</button>
            {favoriteFoods.length > 0 ? (
              <button onClick={() => setIsFavoriteFoodsOpen(true)} className="btn btn-outline">Add Favorite Food</button>
            ) : null}
          </div>
          {favoriteMeals.length > 0 && (
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '14px' }}>Start from a saved favorite:</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {favoriteMeals.slice(0, 3).map((favoriteMeal) => (
                  <button
                    key={favoriteMeal.id}
                    type="button"
                    onClick={() => addFavoriteMeal(favoriteMeal)}
                    className="btn btn-outline"
                    style={{ flex: '1 1 180px' }}
                  >
                    {favoriteMeal.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {favoriteFoods.length > 0 && (
            <div style={{ marginTop: favoriteMeals.length > 0 ? '16px' : 0 }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '14px' }}>Start from a saved favorite food:</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {favoriteFoods.slice(0, 3).map((favoriteFood) => (
                  <button
                    key={favoriteFood.id}
                    type="button"
                    onClick={() => addFavoriteFood(favoriteFood)}
                    className="btn btn-outline"
                    style={{ flex: '1 1 180px' }}
                  >
                    {favoriteFood.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {groupedMeals.map((section) => {
            const mealFeedback = getMealFeedback(section, profile?.dietStyle);

            return (
              <div key={section.mealType} className="card">
                {favoriteSuggestionMap.get(`${section.mealType}::${getMealSectionSignature(section.items)}`) ? (
                  <div
                    style={{
                      marginBottom: '16px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: 'var(--feedback-positive-surface)',
                      border: '1px solid var(--feedback-positive-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '12px',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: '0 0 4px', fontWeight: 700 }}>Smart favorite suggestion</p>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                        You&apos;ve logged this {section.label.toLowerCase()} {favoriteSuggestionMap.get(`${section.mealType}::${getMealSectionSignature(section.items)}`).occurrences} times in the last {RECENT_MEAL_LOOKBACK_DAYS} days. Save it for faster re-adding.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => handleSaveFavorite(section)} className="btn btn-outline" style={{ padding: '8px 12px' }}>
                        Save Favorite
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDismissFavoriteSuggestion(favoriteSuggestionMap.get(`${section.mealType}::${getMealSectionSignature(section.items)}`))}
                        className="btn btn-outline"
                        style={{ padding: '8px 12px' }}
                      >
                        Not Now
                      </button>
                    </div>
                  </div>
                ) : null}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ margin: '0 0 4px' }}>{section.label}</h2>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                      {section.count} food item{section.count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => openFoodSearch(section.mealType)} className="btn btn-outline" style={{ padding: '10px 14px' }}>
                      Add Food
                    </button>
                    <button type="button" onClick={() => handleSaveFavorite(section)} className="btn btn-outline" style={{ padding: '10px 14px' }}>
                      Save as Favorite
                    </button>
                  </div>
                </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px' }}>Calories</p>
                  <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)' }}>{Math.round(section.totals.calories)}</p>
                </div>
                <div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px' }}>Protein</p>
                  <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 'bold' }}>{section.totals.protein}g</p>
                </div>
                <div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px' }}>{primaryCarbLabel}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 'bold' }}>
                    {Math.round(primaryCarbBasis ? section.totals.netCarbs : section.totals.carbs)}g
                  </p>
                  {primaryCarbBasis ? (
                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      Total {Math.round(section.totals.carbs)}g • Fiber {Math.round(section.totals.fiber)}g
                    </p>
                  ) : null}
                </div>
                <div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px' }}>Fat</p>
                  <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 'bold' }}>{section.totals.fat}g</p>
                </div>
              </div>

              {mealFeedback ? <MealFeedback feedback={mealFeedback} /> : null}

              <div style={{ display: 'grid', gap: '12px' }}>
                {section.items.map((meal) => (
                  <div
                    key={meal.id}
                    style={{
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-color)',
                      display: 'grid',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700 }}>{meal.mealName}</p>
                        <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                          {formatFoodPortion(meal) || 'Portion not specified'}
                        </p>
                        <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
                          {new Date(meal.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontWeight: 700 }}>{Math.round(meal.calories)} cal</p>
                        <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
                          P {Math.round(meal.protein)} • {formatCarbDetail(meal, profile?.dietStyle)} • F {Math.round(meal.fat)}
                        </p>
                        {hasDetailedCarbData(meal) ? (
                          <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
                            Total Carbs: {Math.round(meal.carbs)}g • Fiber: {Math.round(meal.fiber || 0)}g
                            {Number(meal.sugarAlcohols || 0) > 0 ? ` • Sugar Alcohols: ${Math.round(meal.sugarAlcohols)}g` : ''}
                            {` • Net Carbs: ${Math.round(meal.netCarbs || calculateNetCarbs(meal.carbs, meal.fiber, meal.sugarAlcohols))}g`}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <InlineActionButton onClick={() => handleEdit(meal)}>Edit food</InlineActionButton>
                      {selectedDate === getTodayDate() ? (
                        <InlineActionButton onClick={() => handleDuplicateMeal(meal)}>Duplicate</InlineActionButton>
                      ) : (
                        <InlineActionButton onClick={() => handleAddMealAgainToday(meal)}>Add Again Today</InlineActionButton>
                      )}
                      <InlineActionButton onClick={() => handleSaveFavoriteFood(meal)}>Favorite</InlineActionButton>
                      <InlineActionButton onClick={() => handleDelete(meal.id)} danger>Delete</InlineActionButton>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMeal(null);
          setMealMacroSnapshot(null);
          setManualMacroOverride(false);
        }}
        title={editingMeal ? 'Edit Food Item' : `Add Food to ${getMealTypeLabel(formData.mealType || selectedMealType)}`}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Meal Category</label>
            <select name="mealType" value={formData.mealType} onChange={handleInputChange} className="form-select" required>
              {MEAL_TYPE_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Food Name</label>
            <input
              type="text"
              name="mealName"
              value={formData.mealName}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g., Eggs, Chicken Breast, Greek Yogurt"
              required
            />
          </div>

          <div className="grid grid-3">
            <div className="form-group">
              <label className="form-label">Amount</label>
              <input type="number" name="portionAmount" value={formData.portionAmount} onChange={handleInputChange} className="form-input" step="0.01" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <input type="text" name="portionUnit" value={formData.portionUnit} onChange={handleInputChange} className="form-input" placeholder="serving" />
            </div>
            <div className="form-group">
              <label className="form-label">Grams</label>
              <input type="number" name="portionGrams" value={formData.portionGrams} onChange={handleInputChange} className="form-input" step="0.01" min="0" />
            </div>
          </div>

          {(macrosAreDerived || manualMacroOverride) && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 12px' }}>
              Macros can be edited manually if the food database value is wrong.
              {manualMacroOverride
                ? ' Manual edits are currently preserved until you reset them.'
                : ' Portion changes can still scale the original values when a baseline is available.'}
            </p>
          )}

          {calculatedMealMacros && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', margin: '0 0 16px' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                Edit macros directly when you need to correct a scanned or database entry.
              </p>
              <button type="button" onClick={handleResetMealMacros} className="btn btn-outline" style={{ padding: '8px 12px', flex: '0 0 auto' }}>
                Reset to Calculated Values
              </button>
            </div>
          )}

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Protein (g)</label>
              <input type="number" name="protein" value={formData.protein} onChange={handleInputChange} className="form-input" step="0.01" min="0" required />
            </div>
            <div className="form-group">
              <label className="form-label">Total Carbs (g)</label>
              <input type="number" name="carbs" value={formData.carbs} onChange={handleInputChange} className="form-input" step="0.01" min="0" required />
            </div>
            <div className="form-group">
              <label className="form-label">Fiber (g)</label>
              <input type="number" name="fiber" value={formData.fiber} onChange={handleInputChange} className="form-input" step="0.01" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Sugar Alcohols (g)</label>
              <input type="number" name="sugarAlcohols" value={formData.sugarAlcohols} onChange={handleInputChange} className="form-input" step="0.01" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Fat (g)</label>
              <input type="number" name="fat" value={formData.fat} onChange={handleInputChange} className="form-input" step="0.01" min="0" required />
            </div>
            <div className="form-group">
              <label className="form-label">Calories</label>
              <input type="number" name="calories" value={formData.calories} onChange={handleInputChange} className="form-input" step="1" min="0" required />
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 12px' }}>
            Net carbs are calculated as total carbs minus fiber and sugar alcohols.
            {' '}Current net carbs: <strong>{netCarbsPreview}g</strong>.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
            <button type="submit" className="btn btn-primary">
              {editingMeal ? 'Update Food' : 'Add Food'}
            </button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isScannerOpen}
        onClose={closeScannerSession}
        title={scannedProduct
          ? `Add Scanned Food to ${getMealTypeLabel(selectedMealType)}`
          : `Scan for ${getMealTypeLabel(selectedMealType)}${scannerAddedCount > 0 ? ` · ${scannerAddedCount} added` : ''}`}
      >
        {lookupLoading ? (
          <Loading message="Looking up product..." />
        ) : scannedProduct ? (
          <ProductLookup
            product={scannedProduct}
            onAddToMeal={(mealData) => handleAddScannedMeal(mealData, { keepScanning: true })}
            onAddAndClose={(mealData) => handleAddScannedMeal(mealData, { keepScanning: false })}
            onBack={resumeScannerSession}
            continuousMode
          />
        ) : (
          <BarcodeScanner
            key={scannerRestartKey}
            autoStart
            onScanSuccess={handleBarcodeScanned}
            onClose={closeScannerSession}
            onSearchFood={() => {
              closeScannerSession();
              openFoodSearch(selectedMealType);
            }}
            onAddManual={() => {
              closeScannerSession();
              openAddModal(selectedMealType);
            }}
          />
        )}
      </Modal>

      <Modal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} title={`Search Food for ${getMealTypeLabel(selectedMealType)}`}>
        <FoodSearch onSelectFood={handleFoodSelected} onClose={() => setIsSearchOpen(false)} />
      </Modal>

      <Modal isOpen={!!scannedProduct && !isScannerOpen} onClose={() => setScannedProduct(null)} title={`Add Food to ${getMealTypeLabel(selectedMealType)}`}>
        {scannedProduct && (
          <ProductLookup
            product={scannedProduct}
            onAddToMeal={(mealData) => handleAddScannedMeal(mealData, { keepScanning: false })}
            onBack={() => {
              setScannedProduct(null);
              setIsSearchOpen(true);
            }}
          />
        )}
      </Modal>

      <Modal isOpen={isFavoritesOpen} onClose={() => setIsFavoritesOpen(false)} title="Favorite Meals">
        {favoriteMeals.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            No favorite meals yet. Save a breakfast, lunch, dinner, or snack after logging it once.
          </p>
        ) : (
          <div className="compact-card-list">
            {favoriteMeals.map((favoriteMeal) => (
              <div key={favoriteMeal.id} className="card" style={{ boxShadow: 'none', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px' }}>{favoriteMeal.name}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {getMealTypeLabel(favoriteMeal.mealType)} • {favoriteMeal.items.length} item{favoriteMeal.items.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                    <InlineActionButton onClick={() => addFavoriteMeal(favoriteMeal)}>Add Today</InlineActionButton>
                    <InlineActionButton onClick={() => removeFavoriteMeal(favoriteMeal.id)} danger>Delete</InlineActionButton>
                  </div>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {Math.round(favoriteMeal.calories)} cal • P {Math.round(favoriteMeal.protein)} • {formatCarbDetail(favoriteMeal, profile?.dietStyle)} • F {Math.round(favoriteMeal.fat)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isFavoriteFoodsOpen}
        onClose={() => {
          setIsFavoriteFoodsOpen(false);
          setFavoriteFoodSearch('');
        }}
        title="Favorite Foods"
      >
        {favoriteFoods.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            No favorite foods yet. Favorite an item from your intake log to reuse it without duplicate/edit work.
          </p>
        ) : (
          <div className="compact-card-list">
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
              Add to current target meal: <strong>{getMealTypeLabel(selectedMealType)}</strong>
            </p>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="favorite-food-search" style={{ marginBottom: '6px' }}>Search favorites</label>
              <input
                id="favorite-food-search"
                type="search"
                value={favoriteFoodSearch}
                onChange={(e) => setFavoriteFoodSearch(e.target.value)}
                className="form-input"
                placeholder="Search by name, meal, or portion"
              />
            </div>
            {filteredFavoriteFoods.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                No favorite foods match that search yet.
              </p>
            ) : filteredFavoriteFoods.map((favoriteFood) => (
              <div key={favoriteFood.id} className="card" style={{ boxShadow: 'none', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px' }}>{favoriteFood.name}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                      Default: {getMealTypeLabel(favoriteFood.defaultMealType || 'breakfast')}
                      {formatFoodPortion(favoriteFood) ? ` • ${formatFoodPortion(favoriteFood)}` : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                    <InlineActionButton onClick={() => addFavoriteFood(favoriteFood)}>Add to {getMealTypeLabel(selectedMealType)}</InlineActionButton>
                    <InlineActionButton onClick={() => removeFavoriteFood(favoriteFood.id)} danger>Delete</InlineActionButton>
                  </div>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {Math.round(favoriteFood.calories)} cal • P {Math.round(favoriteFood.protein)} • {formatCarbDetail(favoriteFood, profile?.dietStyle)} • F {Math.round(favoriteFood.fat)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isFavoriteBeveragesOpen}
        onClose={() => {
          setIsFavoriteBeveragesOpen(false);
          setFavoriteBeverageSearch('');
        }}
        title="Favorite Beverages"
      >
        {favoriteBeverages.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            No favorite beverages yet. Favorite a beverage entry from your intake log to reuse it without rebuilding the hydration or macro details.
          </p>
        ) : (
          <div className="compact-card-list">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="favorite-beverage-search" style={{ marginBottom: '6px' }}>Search favorites</label>
              <input
                id="favorite-beverage-search"
                type="search"
                value={favoriteBeverageSearch}
                onChange={(e) => setFavoriteBeverageSearch(e.target.value)}
                className="form-input"
                placeholder="Search by name, type, or hydration details"
              />
            </div>
            {filteredFavoriteBeverages.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                No favorite beverages match that search yet.
              </p>
            ) : filteredFavoriteBeverages.map((favoriteBeverage) => (
              <div key={favoriteBeverage.id} className="card" style={{ boxShadow: 'none', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px' }}>{favoriteBeverage.name}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {getBeverageDisplayName(favoriteBeverage)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                    <InlineActionButton onClick={() => addFavoriteBeverage(favoriteBeverage)}>Add Today</InlineActionButton>
                    <InlineActionButton onClick={() => removeFavoriteBeverage(favoriteBeverage.id)} danger>Delete</InlineActionButton>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '4px' }}>
                  {formatFavoriteBeverageDetails(favoriteBeverage, preferredBeverageUnit).map((detail) => (
                    <p key={detail} style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {detail}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal isOpen={!!favoriteDraft} onClose={() => setFavoriteDraft(null)} title="Save Favorite Meal">
        {favoriteDraft && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Favorite Meal Name</label>
              <input
                type="text"
                value={favoriteDraft.name}
                onChange={(e) => setFavoriteDraft((current) => ({ ...current, name: e.target.value }))}
                className="form-input"
                placeholder="e.g., High Protein Breakfast"
              />
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
              This saves {favoriteDraft.items.length} food item{favoriteDraft.items.length === 1 ? '' : 's'} from {getMealTypeLabel(favoriteDraft.mealType)} with their portion details and macro snapshot.
            </p>
            <button type="button" onClick={submitFavoriteDraft} className="btn btn-primary">Save Favorite Meal</button>
            <button type="button" onClick={() => setFavoriteDraft(null)} className="btn btn-outline">Cancel</button>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!favoriteFoodDraft} onClose={() => setFavoriteFoodDraft(null)} title="Save Favorite Food">
        {favoriteFoodDraft && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Favorite Food Name</label>
              <input
                type="text"
                value={favoriteFoodDraft.name}
                onChange={(e) => setFavoriteFoodDraft((current) => ({ ...current, name: e.target.value }))}
                className="form-input"
                placeholder="e.g., Oikos Triple Zero"
              />
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
              This saves one food item with its portion details, carb details, and macro snapshot for quick re-adding on any day.
            </p>
            <button type="button" onClick={submitFavoriteFoodDraft} className="btn btn-primary">Save Favorite Food</button>
            <button type="button" onClick={() => setFavoriteFoodDraft(null)} className="btn btn-outline">Cancel</button>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!favoriteBeverageDraft} onClose={() => setFavoriteBeverageDraft(null)} title="Save Favorite Beverage">
        {favoriteBeverageDraft && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Favorite Beverage Name</label>
              <input
                type="text"
                value={favoriteBeverageDraft.name}
                onChange={(e) => setFavoriteBeverageDraft((current) => ({ ...current, name: e.target.value }))}
                className="form-input"
                placeholder="e.g., Morning Coffee"
              />
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
              This saves one beverage entry with its amount, hydration flag, and macro details for quick re-adding on any day.
            </p>
            <button type="button" onClick={submitFavoriteBeverageDraft} className="btn btn-primary">Save Favorite Beverage</button>
            <button type="button" onClick={() => setFavoriteBeverageDraft(null)} className="btn btn-outline">Cancel</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
