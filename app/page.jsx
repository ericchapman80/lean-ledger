'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { statsApi, profileApi } from '@/lib/api';
import { getTodayDate, formatDisplayDate } from '@/lib/utils/dateUtils';
import Loading from '@/components/Loading';
import ErrorMessage from '@/components/ErrorMessage';
import ProgressBar from '@/components/ProgressBar';
import MacroCard from '@/components/MacroCard';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, profileData] = await Promise.all([
        statsApi.getDailyStats(selectedDate),
        profileApi.getProfile(),
      ]);
      setStats(statsData);
      setProfile(profileData);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} onRetry={fetchData} />;
  if (!stats || !profile) return <ErrorMessage error="No data available" />;

  const { totals, targets, progress, mealCount } = stats;

  return (
    <div className="container" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: '8px', fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>
            Daily Dashboard
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            {formatDisplayDate(selectedDate)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', flexWrap: 'wrap' }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="form-input"
            style={{ flex: '1 1 auto', minWidth: '150px', maxWidth: '300px' }}
          />
          <Link href="/meals" className="btn btn-primary" style={{ flex: '0 1 auto' }}>
            <span className="hide-xs">+ Add </span>Meal
          </Link>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: '32px' }}>
        <MacroCard label="Protein" current={totals.protein} target={targets.protein} icon="🥩" color="#e74c3c" />
        <MacroCard label="Carbs"   current={totals.carbs}   target={targets.carbs}   icon="🍞" color="#f39c12" />
        <MacroCard label="Fat"     current={totals.fat}     target={targets.fat}     icon="🥑" color="#3498db" />
        <div className="card">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔥</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>Calories</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
              {Math.round(totals.calories)}
            </div>
            <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
              of {Math.round(targets.calories)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2 style={{ marginBottom: '24px' }}>Today's Progress</h2>
          <ProgressBar label="Protein"  current={totals.protein}  target={targets.protein} />
          <ProgressBar label="Carbs"    current={totals.carbs}    target={targets.carbs} />
          <ProgressBar label="Fat"      current={totals.fat}      target={targets.fat} />
          <ProgressBar label="Calories" current={totals.calories} target={targets.calories} />
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '24px' }}>Quick Stats</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Meals Logged Today</p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary-color)' }}>{mealCount}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Current Goal</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {profile.goal === 'lose' && '📉 Weight Loss'}
                {profile.goal === 'maintain' && '⚖️ Maintain'}
                {profile.goal === 'gain' && '📈 Muscle Gain'}
              </p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Calories Remaining</p>
              <p style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: targets.calories - totals.calories > 0 ? 'var(--success-color)' : 'var(--danger-color)',
              }}>
                {Math.round(Math.max(targets.calories - totals.calories, 0))} kcal
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
