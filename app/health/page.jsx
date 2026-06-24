'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { healthMetricsApi, profileApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import {
  CSV_IMPORT_FIELDS,
  HEALTH_METRIC_FIELDS,
  formatHealthMetricDisplayValue,
  getHealthMetricFieldMeta,
  getHealthMetricInputProps,
  inferColumnMapping,
  mapCsvRows,
  parseCsvText,
} from '@/lib/healthMetrics';
import { formatDisplayDate, getTodayDate } from '@/lib/utils/dateUtils';
import Loading from '@/components/Loading';
import ErrorMessage from '@/components/ErrorMessage';

const ADVANCED_HELPER = 'These metrics are optional and should be used as directional trends, not medical measurements.';
const IMPORT_HELPER = 'Advanced metrics are optional and best used as trends, not medical-grade measurements.';

const MANUAL_GROUPS = [
  {
    title: 'Core Body Metrics',
    fields: ['weight', 'bmi', 'bodyFatPercent', 'skeletalMuscle', 'muscleMass', 'proteinPercent'],
  },
  {
    title: 'Scale / Composition Metrics',
    fields: ['bmr', 'fatFreeBodyWeight', 'subcutaneousFatPercent', 'visceralFat', 'bodyWaterPercent', 'boneMass', 'metabolicAge'],
  },
  {
    title: 'Recovery & Activity Metrics',
    fields: ['steps', 'activeCalories', 'restingHeartRate', 'sleepHours', 'hrv'],
  },
];

function getEmptyFormData(date = getTodayDate()) {
  return {
    recordedAt: date ? `${date}T07:00` : '',
    ...Object.fromEntries(HEALTH_METRIC_FIELDS.map((field) => [field.key, ''])),
  };
}

export default function HealthPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [formData, setFormData] = useState(() => getEmptyFormData(typeof window === 'undefined' ? '' : getTodayDate()));
  const [submitting, setSubmitting] = useState(false);
  const [csvData, setCsvData] = useState({ headers: [], rows: [] });
  const [mapping, setMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileData, metricData] = await Promise.all([
        profileApi.getProfile(),
        healthMetricsApi.getHealthMetrics({ limit: 25 }),
      ]);
      setProfile(profileData);
      setMetrics(metricData);
    } catch (err) {
      setError(err.message || 'Failed to load health metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    if (!formData.recordedAt) {
      setFormData(getEmptyFormData());
    }
  }, [formData.recordedAt]);

  const csvPreview = useMemo(() => {
    if (csvData.rows.length === 0) return [];
    return mapCsvRows(csvData.rows, mapping);
  }, [csvData, mapping]);

  const validPreviewRows = csvPreview.filter((row) => row.valid);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await healthMetricsApi.createHealthMetric(formData);
      setFormData(getEmptyFormData());
      await fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCsvFile = async (file) => {
    const text = await file.text();
    const parsed = parseCsvText(text);
    setCsvData(parsed);
    setMapping(inferColumnMapping(parsed.headers));
    setImportResult(null);
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      const result = await healthMetricsApi.importHealthMetrics(validPreviewRows.map((row) => row.mapped));
      setImportResult(result);
      setCsvData({ headers: [], rows: [] });
      setMapping({});
      await fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} onRetry={fetchData} />;

  const displayUnits = profile?.units || 'metric';
  const weightMeta = getHealthMetricFieldMeta('weight', displayUnits);
  const muscleMassMeta = getHealthMetricFieldMeta('muscleMass', displayUnits);

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '40px' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Advanced Health Metrics</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, maxWidth: '760px' }}>
            Keep core Lean Recomp tracking focused on weight, waist, protein, calories, workouts, and consistency.
            Advanced metrics are optional layers for trend context.
          </p>
        </div>
        <Link href="/profile" className="btn btn-outline">Back to Profile</Link>
      </div>

      <div className="card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'grid', gap: '8px' }}>
          <p style={{ margin: 0 }}>
            <strong>Optional only.</strong> If you only track weight, calories, protein, waist, and workouts, you can safely ignore this page.
          </p>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{ADVANCED_HELPER}</p>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: '32px' }}>
        <div className="card">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Recent Entries</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>{metrics.length}</p>
        </div>
        <div className="card">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Import Mode</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
            {csvData.headers.length > 0 ? 'CSV Preview Ready' : 'Manual or CSV'}
          </p>
        </div>
        <div className="card">
          <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Recommended Use</p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Trends, not pressure</p>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ marginBottom: '8px' }}>Import Health Metrics</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0, maxWidth: '760px' }}>
          Use manual entry for a few occasional readings, or import a CSV from a smart scale when you want more history.
        </p>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '32px' }}>
        <details className="card">
          <summary style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}>Manual Entry</summary>
          <p style={{ color: 'var(--text-secondary)', margin: '16px 0 24px' }}>{IMPORT_HELPER}</p>
          <form onSubmit={handleManualSubmit}>
            <div className="form-group">
              <label className="form-label">Recorded At</label>
              <input
                type="datetime-local"
                value={formData.recordedAt}
                onChange={(e) => setFormData((current) => ({ ...current, recordedAt: e.target.value }))}
                className="form-input"
                required
              />
            </div>

            {MANUAL_GROUPS.map((group, index) => (
              <details key={group.title} style={{ marginBottom: '20px' }} open={index === 0}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: '12px' }}>{group.title}</summary>
                <div className="grid grid-2" style={{ marginTop: '12px' }}>
                  {group.fields.map((fieldKey) => {
                    const field = HEALTH_METRIC_FIELDS.find((metric) => metric.key === fieldKey);
                    const fieldMeta = getHealthMetricFieldMeta(field.key, displayUnits);
                    const inputProps = getHealthMetricInputProps(field.key, displayUnits);
                    return (
                      <div className="form-group" key={field.key}>
                        <label className="form-label">{fieldMeta.label}{fieldMeta.unit ? ` (${fieldMeta.unit})` : ''}</label>
                        <input
                          type="number"
                          value={formData[field.key]}
                          onChange={(e) => setFormData((current) => ({ ...current, [field.key]: e.target.value }))}
                          className="form-input"
                          step={inputProps.step}
                          min={inputProps.min}
                          max={inputProps.max}
                        />
                      </div>
                    );
                  })}
                </div>
              </details>
            ))}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Health Metrics'}
            </button>
          </form>
        </details>

        <details className="card" open={csvData.headers.length > 0}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}>CSV Upload</summary>
          <p style={{ color: 'var(--text-secondary)', margin: '16px 0' }}>
            Upload scale or body composition exports, map columns, preview rows, then import.
          </p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{IMPORT_HELPER}</p>

          <div className="form-group">
            <label className="form-label">CSV File</label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCsvFile(file);
              }}
              className="form-input"
            />
          </div>

          {csvData.headers.length > 0 && (
            <>
              <details style={{ marginBottom: '20px' }} open>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Column Mapping</summary>
                <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
                  {csvData.headers.map((header) => (
                    <div key={header} style={{ display: 'grid', gap: '6px' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>{header}</label>
                      <select
                        value={mapping[header] || 'ignore'}
                        onChange={(e) => setMapping((current) => ({ ...current, [header]: e.target.value }))}
                        className="form-select"
                      >
                        {CSV_IMPORT_FIELDS.map((fieldKey) => (
                          <option key={fieldKey} value={fieldKey}>
                            {fieldKey === 'recordedAt'
                              ? 'Recorded At'
                              : HEALTH_METRIC_FIELDS.find((field) => field.key === fieldKey)?.label || fieldKey}
                          </option>
                        ))}
                        <option value="ignore">Ignore</option>
                      </select>
                    </div>
                  ))}
                </div>
              </details>

              <details style={{ marginBottom: '20px' }} open>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                  Preview
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>
                    {` • ${validPreviewRows.length} valid, ${csvPreview.length - validPreviewRows.length} with errors`}
                  </span>
                </summary>
                <div className="table-scroll" style={{ marginTop: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Row</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Recorded At</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Mapped Values</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.slice(0, 8).map((row) => (
                        <tr key={row.rowNumber} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '10px' }}>{row.rowNumber}</td>
                          <td style={{ padding: '10px' }}>{row.mapped.recordedAt || 'Missing'}</td>
                          <td style={{ padding: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {Object.entries(row.mapped)
                              .filter(([key, value]) => key !== 'recordedAt' && key !== 'date' && value != null)
                              .map(([key, value]) => {
                                const field = HEALTH_METRIC_FIELDS.find((metric) => metric.key === key);
                                return `${field?.label || key}: ${formatHealthMetricDisplayValue(key, value, displayUnits)}`;
                              })
                              .join(', ') || 'No mapped metrics'}
                          </td>
                          <td style={{ padding: '10px', color: row.valid ? 'var(--success-color)' : 'var(--danger-color)' }}>
                            {row.valid ? 'Ready' : row.errors.join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={handleImport}
                disabled={importing || validPreviewRows.length === 0}
              >
                {importing ? 'Importing...' : 'Import Valid Rows'}
              </button>
            </>
          )}

          {!csvData.headers.length && (
            <div style={{
              border: '1px dashed var(--border-color)',
              borderRadius: '8px',
              padding: '20px',
              color: 'var(--text-secondary)',
            }}>
              Map a date/time column to <strong>Recorded At</strong>, then map any optional supported fields such as
              weight, body fat, muscle mass, protein percent, BMR, visceral fat, or body water.
            </div>
          )}

          {importResult && (
            <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
              Imported {importResult.imported} rows. {importResult.failed > 0 ? `${importResult.failed} rows failed validation.` : 'No validation errors.'}
            </p>
          )}
        </details>
      </div>

      <details className="card">
        <summary style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}>Recent Health Metric Entries</summary>
        <div style={{ marginTop: '16px' }}>
          {metrics.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              No advanced health metrics yet. Core Lean Recomp tracking still works without them.
            </p>
          ) : (
            <div className="table-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Recorded At</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Weight ({weightMeta.unit})</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Body Fat %</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Muscle Mass ({muscleMassMeta.unit})</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Sleep</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.slice(0, 12).map((metric) => (
                    <tr key={metric.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px' }}>{formatDisplayDate(metric.date)}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {formatHealthMetricDisplayValue('weight', metric.weight, displayUnits)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{metric.bodyFatPercent ?? '—'}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {formatHealthMetricDisplayValue('muscleMass', metric.muscleMass, displayUnits)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{metric.sleepHours ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
