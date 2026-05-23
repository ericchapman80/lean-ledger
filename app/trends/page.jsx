'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { statsApi } from '@/lib/api';
import { getDateDaysAgo, getTodayDate, formatDisplayDate } from '@/lib/utils/dateUtils';
import Loading from '@/components/Loading';
import ErrorMessage from '@/components/ErrorMessage';

export default function Trends() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trends, setTrends] = useState([]);
  const [period, setPeriod] = useState(7);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      setError(null);
      const startDate = getDateDaysAgo(period);
      const endDate = getTodayDate();
      const data = await statsApi.getTrends(startDate, endDate);
      setTrends(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrends(); }, [period]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} onRetry={fetchTrends} />;

  const chartData = trends.map((t) => ({ ...t, displayDate: formatDisplayDate(t.date) }));

  const averages = trends.length > 0 ? {
    protein: Math.round(trends.reduce((sum, t) => sum + t.protein, 0) / trends.length),
    carbs:   Math.round(trends.reduce((sum, t) => sum + t.carbs,   0) / trends.length),
    fat:     Math.round(trends.reduce((sum, t) => sum + t.fat,     0) / trends.length),
    calories: Math.round(trends.reduce((sum, t) => sum + t.calories, 0) / trends.length),
  } : null;

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ margin: 0 }}>Trends & Analytics</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setPeriod(7)}  className={`btn ${period === 7  ? 'btn-primary' : 'btn-outline'}`}>7 Days</button>
          <button onClick={() => setPeriod(14)} className={`btn ${period === 14 ? 'btn-primary' : 'btn-outline'}`}>14 Days</button>
          <button onClick={() => setPeriod(30)} className={`btn ${period === 30 ? 'btn-primary' : 'btn-outline'}`}>30 Days</button>
        </div>
      </div>

      {averages && (
        <div className="grid grid-4" style={{ marginBottom: '32px' }}>
          <div className="card">
            <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Avg. Protein</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#e74c3c' }}>{averages.protein}g</p>
          </div>
          <div className="card">
            <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Avg. Carbs</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#f39c12' }}>{averages.carbs}g</p>
          </div>
          <div className="card">
            <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Avg. Fat</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#3498db' }}>{averages.fat}g</p>
          </div>
          <div className="card">
            <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Avg. Calories</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: 'var(--primary-color)' }}>{averages.calories}</p>
          </div>
        </div>
      )}

      {chartData.length > 0 ? (
        <>
          <div className="card" style={{ marginBottom: '32px' }}>
            <h2 style={{ marginBottom: '24px' }}>Calories Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayDate" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="calories" stroke="var(--primary-color)" strokeWidth={3} name="Calories" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '24px' }}>Macronutrients Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayDate" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="protein" fill="#e74c3c" name="Protein (g)" />
                <Bar dataKey="carbs"   fill="#f39c12" name="Carbs (g)" />
                <Bar dataKey="fat"     fill="#3498db" name="Fat (g)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ marginBottom: '8px' }}>No data available</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Start logging meals to see your trends</p>
        </div>
      )}
    </div>
  );
}
