'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { profilesApi } from '@/lib/api';
import { lbsToKg, kgToLbs, inchesToCm, cmToInches } from '@/lib/utils/unitUtils';
import Loading from '@/components/Loading';
import ErrorMessage from '@/components/ErrorMessage';

const GENDERS = ['male', 'female', 'other'];
const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
const GOALS = ['lose', 'maintain', 'gain', 'recomp'];
const UNITS = ['metric', 'imperial'];

const EMPTY_FORM = {
  name: '',
  dateOfBirth: '',
  height: '',
  weight: '',
  gender: 'male',
  activityLevel: 'moderate',
  goal: 'maintain',
  units: 'metric',
};

function toPayload(form) {
  const isImperial = form.units === 'imperial';
  const rawHeight = form.height === '' ? null : Number(form.height);
  const rawWeight = form.weight === '' ? null : Number(form.weight);
  return {
    name: form.name.trim(),
    dateOfBirth: form.dateOfBirth,
    height: rawHeight == null ? null : (isImperial ? inchesToCm(rawHeight) : rawHeight),
    weight: rawWeight == null ? null : (isImperial ? lbsToKg(rawWeight) : rawWeight),
    gender: form.gender,
    activityLevel: form.activityLevel,
    goal: form.goal,
    units: form.units,
  };
}

export default function HouseholdPage() {
  const [profiles, setProfiles] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  async function load() {
    try {
      const rows = await profilesApi.getProfiles();
      setProfiles(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err.message || 'Failed to load profiles');
      setProfiles([]);
    }
  }

  useEffect(() => { load(); }, []);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function startAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  function startEdit(profile) {
    setEditingId(profile.id);
    const units = profile.units || 'metric';
    const isImperial = units === 'imperial';
    setForm({
      name: profile.name || '',
      dateOfBirth: profile.dateOfBirth || '',
      height: profile.height != null ? (isImperial ? cmToInches(profile.height).toString() : profile.height.toString()) : '',
      weight: profile.weight != null ? (isImperial ? kgToLbs(profile.weight).toString() : profile.weight.toString()) : '',
      gender: profile.gender || 'male',
      activityLevel: profile.activityLevel || 'moderate',
      goal: profile.goal || 'maintain',
      units,
    });
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = toPayload(form);
      if (editingId) {
        await profilesApi.updateProfile(editingId, payload);
      } else {
        await profilesApi.createProfile(payload);
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleSwitch(id) {
    setBusyId(id);
    try {
      await profilesApi.activateProfile(id);
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Failed to switch profile');
      setBusyId(null);
    }
  }

  async function handleRemove(profile) {
    setBusyId(profile.id);
    setConfirmRemoveId(null);
    setError(null);
    try {
      await profilesApi.deleteProfile(profile.id);
      if (editingId === profile.id) { setEditingId(null); setForm(EMPTY_FORM); }
      await load();
    } catch (err) {
      setError(err.message || 'Failed to remove profile');
    } finally {
      setBusyId(null);
    }
  }

  if (profiles === null) return <Loading />;

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '40px', maxWidth: '720px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1 style={{ margin: 0 }}>Household profiles</h1>
        <Link href="/profile" style={{ fontSize: '14px' }}>← Back to profile</Link>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginTop: 0 }}>
        Add and switch between the people in your household. Each profile keeps its own meals, weight,
        and habits. Switch profiles from the menu in the header.
      </p>

      {error && <ErrorMessage error={error} />}

      <div className="card" style={{ marginBottom: '20px' }}>
        {profiles.map((p) => (
          <div
            key={p.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
              padding: '12px 0', borderBottom: '1px solid var(--border-color)',
            }}
          >
            <div>
              <strong>{p.name}</strong>{' '}
              {p.isPrimary && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>(you)</span>}
              {p.isActive && <span style={{ fontSize: '12px', color: 'var(--primary-color)' }}> • active</span>}
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {p.isDependent ? 'Dependent profile' : 'Account holder'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              {!p.isActive && (
                <button type="button" className="btn btn-secondary" disabled={busyId === p.id} onClick={() => handleSwitch(p.id)}>
                  {busyId === p.id ? '…' : 'Switch to'}
                </button>
              )}
              {p.isDependent && (
                <>
                  <button type="button" className="btn btn-secondary" onClick={() => startEdit(p)}>Edit</button>
                  {confirmRemoveId === p.id ? (
                    <>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', alignSelf: 'center' }}>
                        Remove {p.name}? All their data will be deleted.
                      </span>
                      <button type="button" className="btn btn-danger" disabled={busyId === p.id} onClick={() => handleRemove(p)}>
                        {busyId === p.id ? '…' : 'Confirm'}
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => setConfirmRemoveId(null)}>Cancel</button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-danger" disabled={busyId === p.id} onClick={() => setConfirmRemoveId(p.id)}>Remove</button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>{editingId ? 'Edit profile' : 'Add a profile'}</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 0 }}>
          For a child, teen, or another family member. Their age is derived from date of birth.
        </p>
        <form onSubmit={handleSubmit}>
          <label>Name
            <input type="text" value={form.name} onChange={setField('name')} required maxLength={60} placeholder="e.g. Konnor" />
          </label>
          <label>Date of birth
            <input type="date" value={form.dateOfBirth} onChange={setField('dateOfBirth')} required />
          </label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <label style={{ flex: 1, minWidth: '120px' }}>{form.units === 'imperial' ? 'Height (in)' : 'Height (cm)'}
              <input type="number" step="any" value={form.height} onChange={setField('height')} required
                placeholder={form.units === 'imperial' ? 'e.g. 64' : 'e.g. 163'} />
            </label>
            <label style={{ flex: 1, minWidth: '120px' }}>{form.units === 'imperial' ? 'Weight (lb)' : 'Weight (kg)'}
              <input type="number" step="any" value={form.weight} onChange={setField('weight')} required
                placeholder={form.units === 'imperial' ? 'e.g. 130' : 'e.g. 59'} />
            </label>
            <label style={{ flex: 1, minWidth: '120px' }}>Units
              <select value={form.units} onChange={setField('units')}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </label>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <label style={{ flex: 1, minWidth: '120px' }}>Gender
              <select value={form.gender} onChange={setField('gender')}>
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
            <label style={{ flex: 1, minWidth: '120px' }}>Activity level
              <select value={form.activityLevel} onChange={setField('activityLevel')}>
                {ACTIVITY_LEVELS.map((a) => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
              </select>
            </label>
            <label style={{ flex: 1, minWidth: '120px' }}>Goal
              <select value={form.goal} onChange={setField('goal')}>
                {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : (editingId ? 'Save changes' : 'Add profile')}</button>
            {editingId && <button type="button" className="btn btn-secondary" onClick={startAdd}>Cancel</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
