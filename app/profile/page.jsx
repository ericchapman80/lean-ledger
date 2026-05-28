'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { profileApi } from '@/lib/api';
import {
  getActivityLevelDescription,
  getDietStyleDescription,
  getGoalDescription,
} from '@/lib/utils/macroUtils';
import { cmToFeetInches, feetInchesToCm, kgToLbs, lbsToKg, formatHeight, formatWeight, getWeightUnit } from '@/lib/utils/unitUtils';
import Loading from '@/components/Loading';
import ErrorMessage from '@/components/ErrorMessage';

const LEAN_RECOMP_HELPER_TEXT = 'Lean Recomp prioritizes fat loss while preserving or building muscle. Focus on strength performance, waist trend, and weekly average weight instead of day-to-day scale swings.';
const LEAN_RECOMP_PROTEIN_HELPER = 'If you are around 231 lb and strength training, a typical Lean Recomp protein target lands around 180–220g per day.';

function MacroSummaryCard({
  title,
  macros,
  subtitle,
  metadata,
  badgeText,
}) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0 }}>{title}</h2>
          {subtitle && (
            <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>{subtitle}</p>
          )}
        </div>
        {badgeText && (
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--primary-color)',
            background: 'rgba(52, 152, 219, 0.08)',
            border: '1px solid rgba(52, 152, 219, 0.18)',
            borderRadius: '999px',
            padding: '6px 10px',
            whiteSpace: 'nowrap',
          }}>
            {badgeText}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Protein:</span><span style={{ fontWeight: 'bold' }}>{macros.protein}g</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Carbs:</span><span style={{ fontWeight: 'bold' }}>{macros.carbs}g</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Fat:</span><span style={{ fontWeight: 'bold' }}>{macros.fat}g</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '2px solid var(--border-color)' }}>
          <span style={{ fontWeight: 'bold' }}>Calories:</span>
          <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{macros.calories}</span>
        </div>
        {metadata && (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            {metadata}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    age: '',
    height: '',
    heightFeet: '',
    heightInches: '',
    weight: '',
    gender: 'male',
    activityLevel: 'moderate',
    goal: 'maintain',
    dietStyle: 'balanced',
    units: 'imperial',
    useCustomMacros: false,
    customMacros: { protein: '', fat: '', carbs: '', calories: '' },
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await profileApi.getProfile();
      setProfile(data);

      if (data) {
        const units = data.units || 'metric';
        const { feet, inches } = cmToFeetInches(data.height);
        setFormData({
          age: data.age.toString(),
          height: data.height.toString(),
          heightFeet: feet.toString(),
          heightInches: inches.toString(),
          weight: units === 'imperial' ? kgToLbs(data.weight).toString() : data.weight.toString(),
          gender: data.gender,
          activityLevel: data.activityLevel,
          goal: data.goal,
          dietStyle: data.dietStyle || 'balanced',
          units: units,
          useCustomMacros: !!data.customMacros,
          customMacros: data.customMacros || { protein: '', fat: '', carbs: '', calories: '' },
        });
      } else {
        setEditing(true);
      }
    } catch (err) {
      if (err.status === 404) {
        setEditing(true);
        setError(null);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let heightInCm, weightInKg;
      if (formData.units === 'imperial') {
        heightInCm = feetInchesToCm(
          parseInt(formData.heightFeet) || 0,
          parseInt(formData.heightInches) || 0,
        );
        weightInKg = lbsToKg(parseFloat(formData.weight));
      } else {
        heightInCm = parseFloat(formData.height);
        weightInKg = parseFloat(formData.weight);
      }

      const profileData = {
        age: parseInt(formData.age),
        height: heightInCm,
        weight: weightInKg,
        gender: formData.gender,
        activityLevel: formData.activityLevel,
        goal: formData.goal,
        dietStyle: formData.dietStyle,
        units: formData.units,
        customMacros: formData.useCustomMacros ? {
          protein: parseFloat(formData.customMacros.protein),
          fat:     parseFloat(formData.customMacros.fat),
          carbs:   parseFloat(formData.customMacros.carbs),
          calories: parseFloat(formData.customMacros.calories),
        } : null,
      };

      const data = await profileApi.createOrUpdateProfile(profileData);
      const wasFirstSetup = !profile;
      setProfile(data);
      setEditing(false);
      if (wasFirstSetup) router.push('/');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <Loading />;

  if (editing || !profile) {
    return (
      <div className="container" style={{ padding: '40px 20px', maxWidth: '800px' }}>
        <h1 style={{ marginBottom: '32px' }}>
          {profile ? 'Edit Profile' : 'Complete Your Profile'}
        </h1>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <h2 style={{ marginBottom: '24px' }}>Basic Information</h2>

            <div className="form-group">
              <label className="form-label">Units</label>
              <select value={formData.units}
                onChange={(e) => setFormData((p) => ({ ...p, units: e.target.value }))}
                className="form-select" required>
                <option value="imperial">Imperial (lb, feet/inches)</option>
                <option value="metric">Metric (kg, cm)</option>
              </select>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Age</label>
                <input type="number" value={formData.age}
                  onChange={(e) => setFormData((p) => ({ ...p, age: e.target.value }))}
                  className="form-input" min="1" max="120" required />
              </div>

              <div className="form-group">
                <label className="form-label">Gender</label>
                <select value={formData.gender}
                  onChange={(e) => setFormData((p) => ({ ...p, gender: e.target.value }))}
                  className="form-select" required>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {formData.units === 'metric' ? (
                <div className="form-group">
                  <label className="form-label">Height (cm)</label>
                  <input type="number" value={formData.height}
                    onChange={(e) => setFormData((p) => ({ ...p, height: e.target.value }))}
                    className="form-input" step="0.1" min="1" max="300" placeholder="e.g., 175" required />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Height</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="number" value={formData.heightFeet}
                      onChange={(e) => setFormData((p) => ({ ...p, heightFeet: e.target.value }))}
                      className="form-input" min="1" max="8" placeholder="Feet" required />
                    <input type="number" value={formData.heightInches}
                      onChange={(e) => setFormData((p) => ({ ...p, heightInches: e.target.value }))}
                      className="form-input" min="0" max="11" placeholder="Inches" required />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Weight ({getWeightUnit(formData.units)})</label>
                <input type="number" value={formData.weight}
                  onChange={(e) => setFormData((p) => ({ ...p, weight: e.target.value }))}
                  className="form-input" step="0.1" min="1"
                  max={formData.units === 'imperial' ? '1000' : '500'}
                  placeholder={formData.units === 'imperial' ? 'e.g., 165' : 'e.g., 75'} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Activity Level</label>
              <select value={formData.activityLevel}
                onChange={(e) => setFormData((p) => ({ ...p, activityLevel: e.target.value }))}
                className="form-select" required>
                <option value="sedentary">Sedentary - {getActivityLevelDescription('sedentary')}</option>
                <option value="light">Light - {getActivityLevelDescription('light')}</option>
                <option value="moderate">Moderate - {getActivityLevelDescription('moderate')}</option>
                <option value="active">Active - {getActivityLevelDescription('active')}</option>
                <option value="very_active">Very Active - {getActivityLevelDescription('very_active')}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Goal</label>
              <select value={formData.goal}
                onChange={(e) => setFormData((p) => ({ ...p, goal: e.target.value }))}
                className="form-select" required>
                <option value="recomp">Lean Recomp: Lose Fat + Build Muscle (Recommended)</option>
                <option value="lose">Weight Loss (500 cal deficit)</option>
                <option value="maintain">Maintain Weight</option>
                <option value="gain">Muscle Gain (300 cal surplus)</option>
              </select>
              {formData.goal === 'recomp' && (
                <div style={{
                  marginTop: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(52, 152, 219, 0.08)',
                  border: '1px solid rgba(52, 152, 219, 0.18)',
                }}>
                  <p style={{ margin: '0 0 6px', fontSize: '14px', color: 'var(--text-primary)' }}>
                    {LEAN_RECOMP_HELPER_TEXT}
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {LEAN_RECOMP_PROTEIN_HELPER}
                  </p>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Diet Style</label>
              <select value={formData.dietStyle}
                onChange={(e) => setFormData((p) => ({ ...p, dietStyle: e.target.value }))}
                className="form-select" required>
                <option value="balanced">Balanced</option>
                <option value="low_carb">Low Carb</option>
                <option value="keto">Keto</option>
                <option value="keto_flexible">Keto Weekdays / Flexible Weekends</option>
              </select>
              {formData.goal === 'recomp' && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                  Protein stays high, calories stay fixed to the goal, carbs adapt to your selected style, and fat fills the remainder.
                </p>
              )}
            </div>

            <h2 style={{ marginTop: '32px', marginBottom: '24px' }}>Macro Goals</h2>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.useCustomMacros}
                  onChange={(e) => setFormData((p) => ({ ...p, useCustomMacros: e.target.checked }))}
                  style={{ marginRight: '8px' }} />
                <span className="form-label" style={{ marginBottom: 0 }}>Use custom macro targets</span>
              </label>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                Leave unchecked to use recommended values based on your profile
              </p>
            </div>

            {formData.useCustomMacros && (
              <div className="grid grid-2">
                {['protein', 'carbs', 'fat', 'calories'].map((key) => (
                  <div className="form-group" key={key}>
                    <label className="form-label">
                      {key === 'calories' ? 'Calories' : `${key.charAt(0).toUpperCase() + key.slice(1)} (g)`}
                    </label>
                    <input type="number" value={formData.customMacros[key]}
                      onChange={(e) => setFormData((p) => ({
                        ...p, customMacros: { ...p.customMacros, [key]: e.target.value },
                      }))}
                      className="form-input" min="0"
                      required={formData.useCustomMacros} />
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px' }}>
              <button type="submit" className="btn btn-primary">
                {profile ? 'Update Profile' : 'Complete Setup'}
              </button>
              {profile && (
                <button type="button" onClick={() => setEditing(false)} className="btn btn-outline">Cancel</button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ margin: 0 }}>Your Profile</h1>
        <button onClick={() => setEditing(true)} className="btn btn-primary">Edit Profile</button>
      </div>

      {error && <ErrorMessage error={error} onRetry={fetchProfile} />}

      <div className="grid grid-2" style={{ marginBottom: '32px' }}>
        <div className="card">
          <h2 style={{ marginBottom: '24px' }}>Personal Info</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Age</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{profile.age} years</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Gender</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, textTransform: 'capitalize' }}>{profile.gender}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Height</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{formatHeight(profile.height, profile.units)}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Weight</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{formatWeight(profile.weight, profile.units)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '24px' }}>Goals & Activity</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Activity Level</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, textTransform: 'capitalize' }}>
                {profile.activityLevel.replace('_', ' ')}
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {getActivityLevelDescription(profile.activityLevel)}
              </p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Goal</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{getGoalDescription(profile.goal)}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Diet Style</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{getDietStyleDescription(profile.dietStyle)}</p>
            </div>
            {profile.goal === 'recomp' && (
              <div style={{
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(52, 152, 219, 0.08)',
                border: '1px solid rgba(52, 152, 219, 0.18)',
              }}>
                <p style={{ margin: '0 0 6px', fontSize: '14px', color: 'var(--text-primary)' }}>
                  {LEAN_RECOMP_HELPER_TEXT}
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {LEAN_RECOMP_PROTEIN_HELPER}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {profile.hasMacroOverrides ? (
          <>
            <MacroSummaryCard
              title="Recommended Targets"
              subtitle="System recommendation based on your profile, goal, and diet style."
              macros={profile.recommendedMacros}
              metadata={(
                <>
                  <p style={{ margin: 0 }}>BMR: {profile.recommendedMacros.bmr} kcal</p>
                  <p style={{ margin: 0 }}>TDEE: {profile.recommendedMacros.tdee} kcal</p>
                  {profile.goal === 'recomp' && profile.recommendedMacros.deficit && (
                    <p style={{ margin: 0 }}>Lean Recomp deficit: {profile.recommendedMacros.deficit} kcal</p>
                  )}
                </>
              )}
            />
            <MacroSummaryCard
              title="Active Targets"
              subtitle="Your custom macro targets are currently active."
              macros={profile.activeMacros}
              badgeText="Custom"
            />
          </>
        ) : (
          <MacroSummaryCard
            title="Macro Targets"
            subtitle={profile.hasCustomMacros
              ? 'Custom targets are enabled, but they currently match the system recommendation.'
              : 'System recommendation based on your profile, goal, and diet style.'}
            macros={profile.activeMacros}
            badgeText={profile.hasCustomMacros ? 'Matches recommendation' : 'Recommended'}
            metadata={(
              <>
                <p style={{ margin: 0 }}>BMR: {profile.recommendedMacros.bmr} kcal</p>
                <p style={{ margin: 0 }}>TDEE: {profile.recommendedMacros.tdee} kcal</p>
                {profile.goal === 'recomp' && profile.recommendedMacros.deficit && (
                  <p style={{ margin: 0 }}>Lean Recomp deficit: {profile.recommendedMacros.deficit} kcal</p>
                )}
              </>
            )}
          />
        )}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '12px' }}>Advanced Health Metrics</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', maxWidth: '680px' }}>
          Optional only. Use this if you want to import smart-scale or body-composition data without changing the core Lean Recomp workflow.
        </p>
        <Link href="/health" className="btn btn-outline">Open Advanced Health</Link>
      </div>
    </div>
  );
}
