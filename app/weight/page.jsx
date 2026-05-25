'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { weightApi, profileApi } from '@/lib/api';
import { getTodayDate, formatDisplayDate } from '@/lib/utils/dateUtils';
import { kgToLbs, lbsToKg, formatWeight } from '@/lib/utils/unitUtils';
import { getGoalDescription } from '@/lib/utils/macroUtils';
import Loading from '@/components/Loading';
import ErrorMessage from '@/components/ErrorMessage';

export default function Weight() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weights, setWeights] = useState([]);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ date: getTodayDate(), weight: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [weightsData, profileData] = await Promise.all([
        weightApi.getWeightLogs({ limit: 30 }),
        profileApi.getProfile(),
      ]);
      setWeights(weightsData);
      setProfile(profileData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const weightInKg = profile.units === 'imperial'
        ? lbsToKg(parseFloat(formData.weight))
        : parseFloat(formData.weight);
      await weightApi.logWeight({ date: formData.date, weight: weightInKg });
      setFormData({ date: getTodayDate(), weight: '' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <Loading />;

  const chartData = [...weights].reverse().map((w) => ({
    date: formatDisplayDate(w.date),
    weight: profile?.units === 'imperial' ? kgToLbs(w.weight) : w.weight,
  }));

  const weightChange = weights.length >= 2
    ? weights[0].weight - weights[weights.length - 1].weight
    : 0;

  const units = profile?.units || 'metric';
  const weightLabel = units === 'imperial' ? 'lbs' : 'kg';

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <h1 style={{ marginBottom: '32px' }}>Weight Tracking</h1>

      <div className="grid grid-2" style={{ marginBottom: '32px' }}>
        <div className="card">
          <h2 style={{ marginBottom: '24px' }}>Log Weight</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" value={formData.date}
                onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label">Weight ({weightLabel})</label>
              <input type="number" value={formData.weight}
                onChange={(e) => setFormData((p) => ({ ...p, weight: e.target.value }))}
                className="form-input" step="0.1" min="0"
                placeholder={units === 'imperial' ? 'e.g., 165' : 'e.g., 75.5'} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Log Weight</button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '24px' }}>Current Stats</h2>
          {profile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Current Weight</p>
                <p style={{ fontSize: '48px', fontWeight: 'bold', margin: 0, color: 'var(--primary-color)' }}>
                  {formatWeight(profile.weight, units)}
                </p>
              </div>
              {weights.length >= 2 && (
                <div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Change (30 days)</p>
                  <p style={{
                    fontSize: '32px', fontWeight: 'bold', margin: 0,
                    color: weightChange < 0 ? 'var(--success-color)'
                         : weightChange > 0 ? 'var(--danger-color)'
                         : 'var(--text-primary)',
                  }}>
                    {weightChange > 0 ? '+' : ''}
                    {units === 'imperial' ? kgToLbs(weightChange).toFixed(1) : weightChange.toFixed(1)} {weightLabel}
                  </p>
                </div>
              )}
              <div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Goal</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{getGoalDescription(profile.goal)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <ErrorMessage error={error} onRetry={fetchData} />}

      {chartData.length > 0 && (
        <div className="card">
          <h2 style={{ marginBottom: '24px' }}>Weight Trend (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="var(--primary-color)" strokeWidth={3}
                dot={{ fill: 'var(--primary-color)', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {weights.length > 0 && (
        <div className="card" style={{ marginTop: '32px' }}>
          <h2 style={{ marginBottom: '24px' }}>Weight History</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Weight ({weightLabel})</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Change</th>
                </tr>
              </thead>
              <tbody>
                {weights.map((weight, index) => {
                  const prevWeight = index < weights.length - 1 ? weights[index + 1].weight : weight.weight;
                  const change = weight.weight - prevWeight;
                  const displayWeight = units === 'imperial' ? kgToLbs(weight.weight) : weight.weight;
                  const displayChange = units === 'imperial' ? kgToLbs(change) : change;

                  return (
                    <tr key={weight.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px' }}>{formatDisplayDate(weight.date)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                        {displayWeight.toFixed(1)}
                      </td>
                      <td style={{
                        padding: '12px', textAlign: 'right',
                        color: change < 0 ? 'var(--success-color)'
                             : change > 0 ? 'var(--danger-color)'
                             : 'inherit',
                      }}>
                        {index < weights.length - 1 && (
                          <>{displayChange > 0 ? '+' : ''}{displayChange.toFixed(1)}</>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
