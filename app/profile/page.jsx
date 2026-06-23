'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  accessApi,
  authApi,
  bodyCompositionGoalsApi,
  habitDefinitionsApi,
  householdLinksApi,
  profileApi,
  profilesApi,
} from '@/lib/api';
import { toast } from '@/lib/toast';
import {
  ACTIVITY_FOCUS_OPTIONS,
  calculateAgeFromDateOfBirth,
  deriveAgeGroup,
  deriveCoachingMode,
  getAllowedGoalStrategies,
  getActivityFocusDescription,
  getAgeGroupDescription,
  getCoachingModeDescription,
  getGoalStrategyDescription,
  getYouthSafetyMessage,
  mapGoalStrategyToLegacyGoal,
  normalizeGoalStrategyForAge,
} from '@/lib/coachingProfile';
import { DAILY_WIN_DEFINITION_MAP, DEFAULT_ACTIVE_DAILY_WIN_KEYS, DEFAULT_DAILY_WIN_KEYS, getActiveDailyWinDefinitions } from '@/lib/dailyWins';
import { applyDailyWinTemplate, buildDailyWinChallengeSummary, DAILY_WIN_TEMPLATES } from '@/lib/dailyWinTemplates';
import {
  getActivityLevelDescription,
  getDietStyleDescription,
} from '@/lib/utils/macroUtils';
import { getTodayDate } from '@/lib/utils/dateUtils';
import { cmToFeetInches, feetInchesToCm, kgToLbs, lbsToKg, formatHeight, formatWeight, getWeightUnit } from '@/lib/utils/unitUtils';
import {
  buildBodyCompositionGoalPayload,
  formatBodyFatTarget,
  formatGoalDate,
  formatGoalMass,
  formatGoalPercent,
  getBodyCompositionGoalForm,
  getGoalOutcomeLabel,
  getBodyCompositionStatusMeta,
} from '@/lib/bodyCompositionGoalDisplay';
import Loading from '@/components/Loading';
import ErrorMessage from '@/components/ErrorMessage';
import ThemeToggle from '@/components/ThemeToggle';

const LEAN_RECOMP_HELPER_TEXT = 'Lean Recomp prioritizes fat loss while preserving or building muscle. Focus on strength performance, waist trend, and weekly average weight instead of day-to-day scale swings.';
const LEAN_RECOMP_PROTEIN_HELPER = 'If you are around 231 lb and strength training, a typical Lean Recomp protein target lands around 180–220g per day.';

function moveDailyWinKey(keys, key, direction) {
  const currentIndex = keys.indexOf(key);
  if (currentIndex === -1) return keys;

  const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0 || nextIndex >= keys.length) return keys;

  const reordered = [...keys];
  [reordered[currentIndex], reordered[nextIndex]] = [reordered[nextIndex], reordered[currentIndex]];
  return reordered;
}

function moveCustomHabit(habits, id, direction) {
  const currentIndex = habits.findIndex((habit) => habit.id === id);
  if (currentIndex === -1) return habits;

  const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0 || nextIndex >= habits.length) return habits;

  const reordered = [...habits];
  [reordered[currentIndex], reordered[nextIndex]] = [reordered[nextIndex], reordered[currentIndex]];
  return reordered;
}

function normalizeCustomHabits(habits) {
  return habits.map((habit, index) => ({
    ...habit,
    sortOrder: index,
  }));
}

function toggleActivityFocus(current, value) {
  if (value === 'none') {
    return current.includes('none') ? [] : ['none'];
  }

  const withoutNone = current.filter((entry) => entry !== 'none');
  if (withoutNone.includes(value)) {
    return withoutNone.filter((entry) => entry !== value);
  }

  return [...withoutNone, value];
}

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
            background: 'var(--feedback-info-surface)',
            border: '1px solid var(--feedback-info-border)',
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

const EMPTY_GOAL_FORM = {
  name: 'Project 200',
  goalWeight: '',
  goalBodyFatPercent: '',
  targetBodyFatMin: '',
  targetBodyFatMax: '',
  minimumLeanMass: '',
  minimumMuscleMass: '',
  targetDate: '',
};

export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [authStatus, setAuthStatus] = useState({ mode: 'disabled', user: null });
  const [activeContext, setActiveContext] = useState({ activeName: null, selfName: null, isViewingSelf: true });
  const [goalState, setGoalState] = useState({ activeGoal: null, history: [] });
  const [goalEditing, setGoalEditing] = useState(false);
  const [goalSubmitting, setGoalSubmitting] = useState(false);
  const [goalForm, setGoalForm] = useState(EMPTY_GOAL_FORM);
  const [allowedMembers, setAllowedMembers] = useState([]);
  const [receivedHouseholdInvitations, setReceivedHouseholdInvitations] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteNote, setInviteNote] = useState('');
  const [savedCustomHabits, setSavedCustomHabits] = useState([]);
  const [customHabits, setCustomHabits] = useState([]);
  const [newCustomHabitName, setNewCustomHabitName] = useState('');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('');
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    age: '',
    height: '',
    heightFeet: '',
    heightInches: '',
    weight: '',
    gender: 'male',
    activityLevel: 'moderate',
    goalStrategy: 'maintenance',
    activityFocus: [],
    dietStyle: 'balanced',
    units: 'imperial',
    dailyWinsActiveKeys: DEFAULT_ACTIVE_DAILY_WIN_KEYS,
    dailyWinsTemplateKey: '',
    dailyWinsChallengeStartDate: '',
    useCustomMacros: false,
    customMacros: { protein: '', fat: '', carbs: '', calories: '' },
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, habitData, authStatusData, householdLinkData, goalData] = await Promise.all([
        profileApi.getProfile(),
        habitDefinitionsApi.getHabitDefinitions(),
        authApi.getStatus(),
        householdLinksApi.getInvitations(),
        bodyCompositionGoalsApi.getGoals(),
      ]);
      const profileRows = authStatusData?.user ? await profilesApi.getProfiles().catch(() => []) : [];
      const memberData = authStatusData?.user?.role === 'admin'
        ? await accessApi.getMembers()
        : [];
      setProfile(data);
      setAuthStatus(authStatusData);
      setAllowedMembers(memberData);
      setReceivedHouseholdInvitations((householdLinkData?.received || []).filter((invitation) => invitation.status === 'pending'));
      setGoalState({
        activeGoal: goalData?.activeGoal || null,
        history: goalData?.history || [],
      });
      const activeProfile = profileRows.find((row) => row.isActive) || profileRows.find((row) => row.isPrimary) || null;
      const selfProfile = profileRows.find((row) => row.isSelf) || profileRows.find((row) => row.isPrimary) || null;
      setActiveContext({
        activeName: activeProfile?.name || null,
        selfName: selfProfile?.name || authStatusData?.user?.name || null,
        isViewingSelf: !activeProfile || activeProfile.isSelf || activeProfile.isPrimary,
      });
      setGoalForm(getBodyCompositionGoalForm(goalData?.activeGoal, activeProfile?.units || data?.units || 'metric'));
      setGoalEditing(false);
      setSavedCustomHabits(habitData);
      setCustomHabits(habitData);
      setSelectedTemplateKey(data?.dailyWinsTemplateKey || '');

      if (data) {
        const units = data.units || 'metric';
        const { feet, inches } = cmToFeetInches(data.height);
        setFormData({
          dateOfBirth: data.dateOfBirth || '',
          age: data.age.toString(),
          height: data.height.toString(),
          heightFeet: feet.toString(),
          heightInches: inches.toString(),
          weight: units === 'imperial' ? kgToLbs(data.weight).toString() : data.weight.toString(),
          gender: data.gender,
          activityLevel: data.activityLevel,
          goalStrategy: data.goalStrategy || 'maintenance',
          activityFocus: data.activityFocus || [],
          dietStyle: data.dietStyle || 'balanced',
          units: units,
          dailyWinsActiveKeys: data.dailyWinsActiveKeys || DEFAULT_ACTIVE_DAILY_WIN_KEYS,
          dailyWinsTemplateKey: data.dailyWinsTemplateKey || '',
          dailyWinsChallengeStartDate: data.dailyWinsChallengeStartDate || '',
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

  const handleInviteMember = async (e) => {
    e.preventDefault();
    try {
      const created = await accessApi.inviteMember({
        email: inviteEmail,
        role: inviteRole,
        note: inviteNote,
      });
      setAllowedMembers((current) => [created, ...current.filter((member) => member.id !== created.id)]);
      setInviteEmail('');
      setInviteRole('member');
      setInviteNote('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRoleChange = async (memberId, role) => {
    try {
      const updated = await accessApi.updateMember(memberId, { role });
      setAllowedMembers((current) => current.map((member) => (
        member.id === memberId ? updated : member
      )));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRevokeMember = async (memberId) => {
    try {
      const updated = await accessApi.revokeMember(memberId);
      setAllowedMembers((current) => current.map((member) => (
        member.id === memberId ? updated : member
      )));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAcceptHouseholdInvitation = async (invitationId) => {
    try {
      await householdLinksApi.acceptInvitation(invitationId);
      toast.success('Household invitation accepted');
      await fetchProfile();
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeclineHouseholdInvitation = async (invitationId) => {
    try {
      await householdLinksApi.declineInvitation(invitationId);
      setReceivedHouseholdInvitations((current) => current.filter((invitation) => invitation.id !== invitationId));
      toast.success('Household invitation declined');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    try {
      setGoalSubmitting(true);
      const payload = buildBodyCompositionGoalPayload(goalForm, profile.units);
      if (goalState.activeGoal) {
        await bodyCompositionGoalsApi.updateGoal(goalState.activeGoal.id, payload);
      } else {
        await bodyCompositionGoalsApi.createGoal(payload);
      }
      await fetchProfile();
      toast.success(goalState.activeGoal ? 'Body composition goal updated' : 'Body composition goal created');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGoalSubmitting(false);
    }
  };

  const handleCompleteGoal = async () => {
    if (!goalState.activeGoal) return;
    try {
      setGoalSubmitting(true);
      await bodyCompositionGoalsApi.completeGoal(goalState.activeGoal.id);
      await fetchProfile();
      toast.success('Body composition goal completed');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGoalSubmitting(false);
    }
  };

  const handleArchiveGoal = async () => {
    if (!goalState.activeGoal) return;
    try {
      setGoalSubmitting(true);
      await bodyCompositionGoalsApi.archiveGoal(goalState.activeGoal.id);
      await fetchProfile();
      toast.success('Body composition goal archived');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGoalSubmitting(false);
    }
  };

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

      const safeGoalStrategy = normalizeGoalStrategyForAge({
        ageGroup: deriveAgeGroup({ dateOfBirth: formData.dateOfBirth }),
        goalStrategy: formData.goalStrategy,
        activityFocus: formData.activityFocus,
      });

      const profileData = {
        dateOfBirth: formData.dateOfBirth,
        age: calculateAgeFromDateOfBirth(formData.dateOfBirth),
        height: heightInCm,
        weight: weightInKg,
        gender: formData.gender,
        activityLevel: formData.activityLevel,
        goalStrategy: safeGoalStrategy,
        goal: mapGoalStrategyToLegacyGoal(safeGoalStrategy),
        activityFocus: formData.activityFocus,
        dietStyle: formData.dietStyle,
        units: formData.units,
        dailyWinsActiveKeys: formData.dailyWinsActiveKeys,
        dailyWinsTemplateKey: formData.dailyWinsTemplateKey || null,
        dailyWinsChallengeStartDate: formData.dailyWinsTemplateKey
          ? (formData.dailyWinsChallengeStartDate || getTodayDate())
          : null,
        customMacros: formData.useCustomMacros ? {
          protein: parseFloat(formData.customMacros.protein),
          fat:     parseFloat(formData.customMacros.fat),
          carbs:   parseFloat(formData.customMacros.carbs),
          calories: parseFloat(formData.customMacros.calories),
        } : null,
      };

      const data = await profileApi.createOrUpdateProfile(profileData);
      const existingById = new Map(savedCustomHabits.filter((habit) => typeof habit.id === 'number').map((habit) => [habit.id, habit]));
      const stagedHabits = normalizeCustomHabits(customHabits);
      const currentIds = new Set(stagedHabits.filter((habit) => typeof habit.id === 'number').map((habit) => habit.id));

      for (const habit of savedCustomHabits) {
        if (typeof habit.id === 'number' && !currentIds.has(habit.id)) {
          await habitDefinitionsApi.deleteHabitDefinition(habit.id);
        }
      }

      for (const habit of stagedHabits) {
        if (typeof habit.id === 'number') {
          const previous = existingById.get(habit.id);
          if (
            !previous
            || previous.name !== habit.name
            || previous.isActive !== habit.isActive
            || previous.sortOrder !== habit.sortOrder
          ) {
            await habitDefinitionsApi.updateHabitDefinition(habit.id, {
              name: habit.name,
              isActive: habit.isActive,
              sortOrder: habit.sortOrder,
            });
          }
        } else {
          await habitDefinitionsApi.createHabitDefinition({
            name: habit.name,
            isActive: habit.isActive,
          });
        }
      }

      const syncedHabits = await habitDefinitionsApi.getHabitDefinitions();
      const wasFirstSetup = !profile;
      setProfile(data);
      setSavedCustomHabits(syncedHabits);
      setCustomHabits(syncedHabits);
      setNewCustomHabitName('');
      setEditing(false);
      if (wasFirstSetup) router.push('/');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const activeDailyWins = getActiveDailyWinDefinitions(formData.dailyWinsActiveKeys);
  const inactiveDailyWins = DEFAULT_DAILY_WIN_KEYS
    .filter((key) => !formData.dailyWinsActiveKeys.includes(key))
    .map((key) => DAILY_WIN_DEFINITION_MAP[key]);
  const activeTemplateKey = selectedTemplateKey || formData.dailyWinsTemplateKey;
  const challengePreview = buildDailyWinChallengeSummary({
    templateKey: activeTemplateKey,
    challengeStartDate: formData.dailyWinsChallengeStartDate,
    referenceDate: getTodayDate(),
  });
  const derivedAge = calculateAgeFromDateOfBirth(formData.dateOfBirth);
  const derivedAgeGroup = deriveAgeGroup({ dateOfBirth: formData.dateOfBirth, age: derivedAge });
  const allowedGoalStrategies = getAllowedGoalStrategies({
    ageGroup: derivedAgeGroup,
    activityFocus: formData.activityFocus,
  });
  const normalizedGoalStrategy = normalizeGoalStrategyForAge({
    ageGroup: derivedAgeGroup,
    goalStrategy: formData.goalStrategy,
    activityFocus: formData.activityFocus,
  });
  const derivedCoachingMode = deriveCoachingMode({
    ageGroup: derivedAgeGroup,
    goalStrategy: normalizedGoalStrategy,
    activityFocus: formData.activityFocus,
  });
  const youthSafetyMessage = getYouthSafetyMessage({
    ageGroup: derivedAgeGroup,
    coachingMode: derivedCoachingMode,
  });
  const isAuthLive = authStatus.mode === 'enabled';
  const isViewingOtherProfile = !activeContext.isViewingSelf && !!activeContext.activeName;
  const activeGoal = goalState.activeGoal;
  const goalStatusMeta = getBodyCompositionStatusMeta(activeGoal?.status?.overall);
  const goalScopeLabel = isViewingOtherProfile
    ? `${activeContext.activeName} is the current active profile`
    : 'This goal is scoped to your active profile';
  const accountSummary = authStatus.user?.email
    ? `Signed in as ${authStatus.user.email}.`
    : isAuthLive
      ? 'Google sign-in is enabled for this environment.'
      : authStatus.mode === 'configured'
        ? 'Google credentials are configured, but sign-in is intentionally still off in this environment.'
        : 'Single-user mode is still active in this environment.';
  const isAdmin = authStatus.user?.role === 'admin';

  useEffect(() => {
    if (normalizedGoalStrategy !== formData.goalStrategy) {
      setFormData((current) => ({ ...current, goalStrategy: normalizedGoalStrategy }));
    }
  }, [formData.goalStrategy, normalizedGoalStrategy]);

  if (loading) return <Loading />;

  if (editing || !profile) {
    return (
      <div className="container" style={{ paddingTop: '24px', paddingBottom: '40px', maxWidth: '800px' }}>
        {isViewingOtherProfile ? (
          <div
            style={{
              marginBottom: '24px',
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'var(--warning-surface)',
              border: '1px solid var(--warning-color)',
            }}
          >
            <p style={{ margin: '0 0 6px', fontWeight: 600 }}>
              Household view is currently set to {activeContext.activeName}
            </p>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
              Profile settings always edit your own account ({activeContext.selfName || 'you'}). Use the profile switcher or <Link href="/household">Household Profiles</Link> to change who Dashboard, Intake, and Trends are showing.
            </p>
          </div>
        ) : null}
        <h1 style={{ marginBottom: '32px' }}>
          {profile ? 'Edit Profile' : 'Let’s build your coaching profile'}
        </h1>

        <div className="card">
          <form onSubmit={handleSubmit}>
            {!profile && (
              <div
                style={{
                  marginBottom: '24px',
                  padding: '16px 18px',
                  borderRadius: '12px',
                  background: 'var(--feedback-info-surface)',
                  border: '1px solid var(--feedback-info-border)',
                }}
              >
                <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Quick onboarding interview</p>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  Answer a few questions and Lean Ledger will derive the right coaching mode, macro posture, and daily guidance automatically.
                </p>
              </div>
            )}

            <h2 style={{ marginBottom: '24px' }}>1. Who are we coaching?</h2>

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
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData((p) => ({ ...p, dateOfBirth: e.target.value }))}
                  className="form-input"
                  max={getTodayDate()}
                  required
                />
                {derivedAge != null ? (
                  <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    Age {derivedAge} • {getAgeGroupDescription(derivedAgeGroup)}
                  </p>
                ) : null}
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
            </div>

            <h2 style={{ marginTop: '32px', marginBottom: '24px' }}>2. What are you working toward?</h2>

            <div className="form-group">
              <label className="form-label">Goal Strategy</label>
              <select value={formData.goalStrategy}
                onChange={(e) => setFormData((p) => ({ ...p, goalStrategy: e.target.value }))}
                className="form-select" required>
                {allowedGoalStrategies.map((goalStrategy) => (
                  <option key={goalStrategy} value={goalStrategy}>
                    {getGoalStrategyDescription(goalStrategy)}
                  </option>
                ))}
              </select>
              {youthSafetyMessage ? (
                <div style={{
                  marginTop: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'var(--feedback-positive-surface)',
                  border: '1px solid var(--feedback-positive-border)',
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {youthSafetyMessage}
                  </p>
                </div>
              ) : null}
              {normalizedGoalStrategy === 'lean_recomp' && (
                <div style={{
                  marginTop: '12px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'var(--feedback-info-surface)',
                  border: '1px solid var(--feedback-info-border)',
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
            {youthSafetyMessage ? (
              <div
                style={{
                  marginTop: '16px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'var(--warning-surface)',
                  border: '1px solid var(--warning-color)',
                }}
              >
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {youthSafetyMessage}
                </p>
              </div>
            ) : null}

            <h2 style={{ marginTop: '32px', marginBottom: '24px' }}>3. What activities matter most right now?</h2>

            <div className="form-group">
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {ACTIVITY_FOCUS_OPTIONS.map((focus) => {
                  const active = formData.activityFocus.includes(focus);
                  return (
                    <button
                      key={focus}
                      type="button"
                      className={active ? 'btn btn-primary' : 'btn btn-outline'}
                      onClick={() => setFormData((current) => ({
                        ...current,
                        activityFocus: toggleActivityFocus(current.activityFocus, focus),
                      }))}
                    >
                      {getActivityFocusDescription(focus)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                marginTop: '18px',
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'var(--feedback-positive-surface)',
                border: '1px solid var(--feedback-positive-border)',
              }}
            >
              <p style={{ margin: '0 0 6px', fontWeight: 600 }}>Derived coaching preview</p>
              <p style={{ margin: '0 0 6px', color: 'var(--text-secondary)' }}>
                Age group: {getAgeGroupDescription(derivedAgeGroup) || 'Add date of birth'}
              </p>
              <p style={{ margin: '0 0 6px', color: 'var(--text-secondary)' }}>
                Goal strategy: {getGoalStrategyDescription(normalizedGoalStrategy)}
              </p>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Coaching mode: {getCoachingModeDescription(derivedCoachingMode)}
              </p>
            </div>

            <h2 style={{ marginTop: '32px', marginBottom: '24px' }}>4. What does your routine look like?</h2>

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

            <h2 style={{ marginTop: '32px', marginBottom: '24px' }}>5. Current body metrics</h2>

            <div className="grid grid-2">
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

            <h2 style={{ marginTop: '32px', marginBottom: '24px' }}>6. Nutrition style</h2>
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
              {formData.goalStrategy === 'lean_recomp' && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                  Protein stays high, calories stay fixed to the goal, carbs adapt to your selected style, and fat fills the remainder.
                </p>
              )}
            </div>

            <h2 style={{ marginTop: '32px', marginBottom: '24px' }}>Daily Wins</h2>
            <div className="card" style={{ padding: '18px', marginBottom: '24px', background: 'var(--feedback-info-surface)' }}>
              <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                Keep Intake focused. Choose the suggested daily wins you actually want to see there, then order them for tap-first logging.
              </p>

              <div style={{ marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid var(--border-color)' }}>
                <p style={{ margin: '0 0 10px', fontWeight: 600 }}>Challenge template</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <select
                    value={selectedTemplateKey}
                    onChange={(e) => setSelectedTemplateKey(e.target.value)}
                    className="form-select"
                    style={{ flex: '1 1 260px' }}
                  >
                    <option value="">Choose a template</option>
                    {DAILY_WIN_TEMPLATES.map((template) => (
                      <option key={template.key} value={template.key}>{template.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={!selectedTemplateKey}
                    onClick={() => {
                      const applied = applyDailyWinTemplate({
                        templateKey: selectedTemplateKey,
                        customHabits,
                      });
                      setFormData((current) => ({
                        ...current,
                        dailyWinsActiveKeys: applied.suggestedKeys,
                        dailyWinsTemplateKey: selectedTemplateKey,
                        dailyWinsChallengeStartDate: current.dailyWinsChallengeStartDate || getTodayDate(),
                      }));
                      setCustomHabits(normalizeCustomHabits(applied.customHabits));
                    }}
                  >
                    Apply Template
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={!formData.dailyWinsTemplateKey}
                    onClick={() => {
                      setSelectedTemplateKey('');
                      setFormData((current) => ({
                        ...current,
                        dailyWinsTemplateKey: '',
                        dailyWinsChallengeStartDate: '',
                      }));
                    }}
                  >
                    Clear
                  </button>
                </div>
                {selectedTemplateKey ? (
                  <p style={{ margin: '10px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {DAILY_WIN_TEMPLATES.find((template) => template.key === selectedTemplateKey)?.description}
                  </p>
                ) : null}
                {formData.dailyWinsTemplateKey ? (
                  <div style={{ marginTop: '14px', display: 'grid', gap: '10px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ marginBottom: '6px' }}>Challenge start date</label>
                      <input
                        type="date"
                        value={formData.dailyWinsChallengeStartDate}
                        onChange={(e) => setFormData((current) => ({
                          ...current,
                          dailyWinsChallengeStartDate: e.target.value,
                        }))}
                        className="form-input"
                        max={getTodayDate()}
                      />
                    </div>
                    {challengePreview ? (
                      <div
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1px solid var(--feedback-info-border)',
                          background: 'var(--feedback-info-surface)',
                        }}
                      >
                        <p style={{ margin: '0 0 6px', fontWeight: 600 }}>
                          {challengePreview.templateName} • Day {challengePreview.dayNumber}
                          {challengePreview.durationDays ? ` of ${challengePreview.durationDays}` : ''}
                        </p>
                        <p style={{ margin: '0 0 6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                          Started {formData.dailyWinsChallengeStartDate}
                          {challengePreview.daysRemaining != null ? ` • ${challengePreview.daysRemaining} days left` : ''}
                        </p>
                        {challengePreview.percentComplete != null ? (
                          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                            {challengePreview.percentComplete}% through the current run.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div style={{ display: 'grid', gap: '12px', marginBottom: '18px' }}>
                {activeDailyWins.map((definition, index) => (
                  <div
                    key={definition.key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      background: 'var(--card-background)',
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontWeight: 600 }}>{definition.label}</p>
                      <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        Active on Intake
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setFormData((current) => ({
                          ...current,
                          dailyWinsActiveKeys: moveDailyWinKey(current.dailyWinsActiveKeys, definition.key, 'up'),
                        }))}
                        disabled={index === 0}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setFormData((current) => ({
                          ...current,
                          dailyWinsActiveKeys: moveDailyWinKey(current.dailyWinsActiveKeys, definition.key, 'down'),
                        }))}
                        disabled={index === activeDailyWins.length - 1}
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setFormData((current) => ({
                          ...current,
                          dailyWinsActiveKeys: current.dailyWinsActiveKeys.filter((key) => key !== definition.key),
                        }))}
                        disabled={activeDailyWins.length === 1}
                      >
                        Hide
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <p style={{ margin: '0 0 10px', fontWeight: 600 }}>Available suggested habits</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {inactiveDailyWins.map((definition) => (
                    <button
                      key={definition.key}
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setFormData((current) => ({
                        ...current,
                        dailyWinsActiveKeys: [...current.dailyWinsActiveKeys, definition.key],
                      }))}
                    >
                      Add {definition.label}
                    </button>
                  ))}
                  {inactiveDailyWins.length === 0 ? (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                      All suggested Daily Wins are active.
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '18px', marginBottom: '24px', background: 'var(--feedback-positive-surface)' }}>
              <h3 style={{ margin: '0 0 10px' }}>Custom Daily Wins</h3>
              <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                Add up to 10 boolean habits like Reading 10 Pages, Prayer, Mobility, or No Alcohol. These show up after your suggested Daily Wins on Intake.
              </p>

              <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
                {customHabits.map((habit, index) => (
                  <div
                    key={habit.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      background: 'var(--card-background)',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        value={habit.name}
                        onChange={(e) => setCustomHabits((current) => current.map((entry) => (
                          entry.id === habit.id ? { ...entry, name: e.target.value } : entry
                        )))}
                        className="form-input"
                        maxLength={40}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        <input
                          type="checkbox"
                          checked={habit.isActive !== false}
                          onChange={(e) => setCustomHabits((current) => current.map((entry) => (
                            entry.id === habit.id ? { ...entry, isActive: e.target.checked } : entry
                          )))}
                        />
                        Active on Intake
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setCustomHabits((current) => moveCustomHabit(current, habit.id, 'up'))}
                        disabled={index === 0}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setCustomHabits((current) => moveCustomHabit(current, habit.id, 'down'))}
                        disabled={index === customHabits.length - 1}
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setCustomHabits((current) => current.filter((entry) => entry.id !== habit.id))}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {customHabits.length === 0 ? (
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                    No custom Daily Wins yet.
                  </p>
                ) : null}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={newCustomHabitName}
                  onChange={(e) => setNewCustomHabitName(e.target.value)}
                  className="form-input"
                  placeholder="Add a custom boolean habit"
                  maxLength={40}
                  style={{ flex: '1 1 240px' }}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={customHabits.length >= 10}
                  onClick={() => {
                    const trimmed = newCustomHabitName.trim();
                    if (!trimmed) return;
                    setCustomHabits((current) => normalizeCustomHabits([
                      ...current,
                      {
                        id: `new-${Date.now()}`,
                        name: trimmed,
                        isActive: true,
                      },
                    ]));
                    setNewCustomHabitName('');
                  }}
                >
                  Add Habit
                </button>
              </div>
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
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '40px', maxWidth: '800px' }}>
      {isViewingOtherProfile ? (
        <div
          style={{
            marginBottom: '24px',
            padding: '14px 16px',
            borderRadius: '12px',
            background: 'var(--warning-surface)',
            border: '1px solid var(--warning-color)',
          }}
        >
          <p style={{ margin: '0 0 6px', fontWeight: 600 }}>
            Household view is currently set to {activeContext.activeName}
          </p>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
            This page always shows your own account settings ({activeContext.selfName || 'you'}). Use the profile switcher or <Link href="/household">Household Profiles</Link> to change who Dashboard, Intake, and Trends are showing.
          </p>
        </div>
      ) : null}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Your Profile</h1>
        <button onClick={() => setEditing(true)} className="btn btn-primary">Edit Profile</button>
      </div>

      {error && <ErrorMessage error={error} onRetry={fetchProfile} />}

      <div className="grid grid-2" style={{ marginBottom: '32px' }}>
        <div className="card">
          <h2 style={{ marginBottom: '24px' }}>Personal Info</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Date of Birth</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{profile.dateOfBirth || 'Not set'}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Age</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{profile.age} years</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Age Group</p>
              <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{getAgeGroupDescription(profile.ageGroup)}</p>
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
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Goal Strategy</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{getGoalStrategyDescription(profile.goalStrategy)}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Coaching Mode</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{getCoachingModeDescription(profile.coachingMode)}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Activity Focus</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                {profile.activityFocus?.length > 0
                  ? profile.activityFocus.map(getActivityFocusDescription).join(' • ')
                  : 'None'}
              </p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Diet Style</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{getDietStyleDescription(profile.dietStyle)}</p>
            </div>
            {profile.youthSafetyMessage ? (
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Safety Guardrail</p>
                <p style={{ fontSize: '14px', margin: 0, color: 'var(--text-secondary)' }}>
                  {profile.youthSafetyMessage}
                </p>
              </div>
            ) : null}
            {profile.goalStrategy === 'lean_recomp' && (
              <div style={{
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'var(--feedback-info-surface)',
                border: '1px solid var(--feedback-info-border)',
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

      <div className="card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0 }}>Appearance</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: '14px' }}>
              Color theme
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ marginBottom: '12px' }}>Account & Access</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 8px' }}>
              {accountSummary}
            </p>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>
              Manage Google sign-in, session state, and future member access from here.
            </p>
          </div>
          <Link href="/login" className="btn btn-outline">
            {authStatus.user?.email ? 'Manage Sign-In' : 'Open Sign-In'}
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div>
            <h2 style={{ marginBottom: '10px' }}>Body Composition Goal</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 8px' }}>
              {goalScopeLabel}. Weight still matters, but this phase judges success by fat loss quality and lean-mass preservation.
            </p>
            {activeGoal ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '999px',
                padding: '6px 10px',
                border: `1px solid ${goalStatusMeta.border}`,
                background: goalStatusMeta.background,
                color: goalStatusMeta.color,
                fontSize: '12px',
                fontWeight: 600,
              }}>
                {goalStatusMeta.label}
              </span>
            ) : null}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {activeGoal && !goalEditing ? (
              <button type="button" onClick={() => {
                setGoalForm(getBodyCompositionGoalForm(activeGoal, profile.units));
                setGoalEditing(true);
              }} className="btn btn-outline">
                Edit Goal
              </button>
            ) : null}
            {!activeGoal && !goalEditing ? (
              <button type="button" onClick={() => {
                setGoalForm(EMPTY_GOAL_FORM);
                setGoalEditing(true);
              }} className="btn btn-primary">
                Create Goal
              </button>
            ) : null}
          </div>
        </div>

        {goalEditing ? (
          <form onSubmit={handleGoalSubmit} style={{ display: 'grid', gap: '16px' }}>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Phase name</label>
                <input
                  type="text"
                  value={goalForm.name}
                  onChange={(e) => setGoalForm((current) => ({ ...current, name: e.target.value }))}
                  className="form-input"
                  placeholder="Project 200"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Target date</label>
                <input
                  type="date"
                  value={goalForm.targetDate}
                  onChange={(e) => setGoalForm((current) => ({ ...current, targetDate: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Goal weight ({getWeightUnit(profile.units)})</label>
                <input
                  type="number"
                  step="0.1"
                  value={goalForm.goalWeight}
                  onChange={(e) => setGoalForm((current) => ({ ...current, goalWeight: e.target.value }))}
                  className="form-input"
                  placeholder={profile.units === 'imperial' ? '200' : '90.7'}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Goal body fat %</label>
                <input
                  type="number"
                  step="0.1"
                  value={goalForm.goalBodyFatPercent}
                  onChange={(e) => setGoalForm((current) => ({ ...current, goalBodyFatPercent: e.target.value }))}
                  className="form-input"
                  placeholder="12"
                />
              </div>
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Body fat target min % (optional)</label>
                <input
                  type="number"
                  step="0.1"
                  value={goalForm.targetBodyFatMin}
                  onChange={(e) => setGoalForm((current) => ({ ...current, targetBodyFatMin: e.target.value }))}
                  className="form-input"
                  placeholder="10"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Body fat target max % (optional)</label>
                <input
                  type="number"
                  step="0.1"
                  value={goalForm.targetBodyFatMax}
                  onChange={(e) => setGoalForm((current) => ({ ...current, targetBodyFatMax: e.target.value }))}
                  className="form-input"
                  placeholder="12"
                />
              </div>
            </div>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Minimum lean mass ({getWeightUnit(profile.units)})</label>
                <input
                  type="number"
                  step="0.1"
                  value={goalForm.minimumLeanMass}
                  onChange={(e) => setGoalForm((current) => ({ ...current, minimumLeanMass: e.target.value }))}
                  className="form-input"
                  placeholder={profile.units === 'imperial' ? '176' : '79.8'}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Minimum muscle mass ({getWeightUnit(profile.units)})</label>
                <input
                  type="number"
                  step="0.1"
                  value={goalForm.minimumMuscleMass}
                  onChange={(e) => setGoalForm((current) => ({ ...current, minimumMuscleMass: e.target.value }))}
                  className="form-input"
                  placeholder={profile.units === 'imperial' ? '168' : '76.2'}
                />
              </div>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
              Use either a single body-fat target or an optional range. If a range is provided, it takes priority over the exact target.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button type="submit" className="btn btn-primary" disabled={goalSubmitting}>
                {goalSubmitting ? 'Saving...' : activeGoal ? 'Update Goal' : 'Create Goal'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => {
                setGoalEditing(false);
                setGoalForm(getBodyCompositionGoalForm(activeGoal, profile.units));
              }}>
                Cancel
              </button>
            </div>
          </form>
        ) : activeGoal ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div className="grid grid-2">
              <div style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--surface-muted)' }}>
                <p style={{ margin: '0 0 6px', color: 'var(--text-secondary)', fontSize: '13px' }}>Weight Goal</p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                  {formatGoalMass(activeGoal.current?.weight, profile.units)} → {formatGoalMass(activeGoal.goalWeight, profile.units)}
                </p>
                <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {activeGoal.progress?.remainingWeightToGoal != null
                    ? `${formatGoalMass(activeGoal.progress.remainingWeightToGoal, profile.units)} remaining`
                    : 'Weight progress will appear once enough data is logged.'}
                </p>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--surface-muted)' }}>
                <p style={{ margin: '0 0 6px', color: 'var(--text-secondary)', fontSize: '13px' }}>Body Fat Goal</p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                  {formatGoalPercent(activeGoal.current?.bodyFatPercent)} → {formatBodyFatTarget(activeGoal)}
                </p>
                <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {activeGoal.progress?.remainingFatToLose != null
                    ? `${formatGoalMass(activeGoal.progress.remainingFatToLose, profile.units)} estimated fat remaining`
                    : 'Add body fat measurements to track fat-loss progress.'}
                </p>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--surface-muted)' }}>
                <p style={{ margin: '0 0 6px', color: 'var(--text-secondary)', fontSize: '13px' }}>Lean Mass Floor</p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                  Maintain ≥ {formatGoalMass(activeGoal.minimumLeanMass, profile.units)}
                </p>
                <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Current {formatGoalMass(activeGoal.current?.leanMass, profile.units)}
                  {activeGoal.progress?.leanMassChangeSinceStart != null ? ` • ${activeGoal.progress.leanMassChangeSinceStart > 0 ? '+' : ''}${formatGoalMass(activeGoal.progress.leanMassChangeSinceStart, profile.units)} since start` : ''}
                </p>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--surface-muted)' }}>
                <p style={{ margin: '0 0 6px', color: 'var(--text-secondary)', fontSize: '13px' }}>Muscle Mass Floor</p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                  Maintain ≥ {formatGoalMass(activeGoal.minimumMuscleMass, profile.units)}
                </p>
                <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Current {formatGoalMass(activeGoal.current?.muscleMass, profile.units)}
                  {activeGoal.progress?.muscleMassChangeSinceStart != null ? ` • ${activeGoal.progress.muscleMassChangeSinceStart > 0 ? '+' : ''}${formatGoalMass(activeGoal.progress.muscleMassChangeSinceStart, profile.units)} since start` : ''}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                Started from {formatGoalMass(activeGoal.baseline?.weight, profile.units)} on {formatGoalDate(activeGoal.baseline?.recordedAt?.slice(0, 10))}.
              </p>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                Target date: {formatGoalDate(activeGoal.targetDate)}.
                {activeGoal.estimatedCompletionDate ? ` Estimated based on recent trend: ${formatGoalDate(activeGoal.estimatedCompletionDate)}.` : ' Estimated completion date will appear after at least 3 entries across 14 days.'}
              </p>
              {activeGoal.status?.warnings?.length > 0 ? (
                <div style={{ display: 'grid', gap: '6px', marginTop: '6px' }}>
                  {activeGoal.status.warnings.map((warning) => (
                    <p key={warning} style={{ margin: 0, color: 'var(--warning-color)', fontSize: '13px' }}>
                      {warning}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-primary" onClick={handleCompleteGoal} disabled={goalSubmitting}>
                {goalSubmitting ? 'Saving...' : 'Mark Complete'}
              </button>
              <button type="button" className="btn btn-outline" onClick={handleArchiveGoal} disabled={goalSubmitting}>
                Archive Goal
              </button>
            </div>
          </div>
        ) : (
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            No active body composition goal yet. Create one here to track weight, body fat, lean mass, and muscle mass together instead of relying on scale weight alone.
          </p>
        )}

        {goalState.history.length > 0 ? (
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 10px' }}>Phase History</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {goalState.history.slice(0, 3).map((goal) => (
                <div key={goal.id} style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{goal.name}</p>
                    {getGoalOutcomeLabel(goal) ? (
                      <span style={{
                        borderRadius: '999px',
                        padding: '4px 8px',
                        border: '1px solid var(--border-color)',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                      }}>
                        {getGoalOutcomeLabel(goal)}
                      </span>
                    ) : null}
                  </div>
                  <p style={{ margin: '0 0 4px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {formatGoalDate(goal.startedAt?.slice(0, 10))} → {formatGoalDate((goal.completedAt || goal.archivedAt)?.slice(0, 10))}
                  </p>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                    Baseline {formatGoalMass(goal.baseline?.weight, profile.units)} • Completion {formatGoalMass(goal.completionWeight, profile.units)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {receivedHouseholdInvitations.length > 0 && (
        <div className="card" style={{ marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '12px' }}>Household invitations</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px' }}>
            Link this existing account into another household without creating a duplicate profile.
          </p>
          <div style={{ display: 'grid', gap: '12px' }}>
            {receivedHouseholdInvitations.map((invitation) => (
              <div
                key={invitation.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                  padding: '14px 16px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                }}
              >
                <div>
                  <p style={{ margin: '0 0 6px', fontWeight: 600 }}>{invitation.householdName || 'Household invitation'}</p>
                  <p style={{ margin: '0 0 6px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Invited by {invitation.inviterName || 'an admin'} • role {invitation.role}
                  </p>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                    Your existing data stays on your account and becomes available through the shared household switcher.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-primary" onClick={() => handleAcceptHouseholdInvitation(invitation.id)}>
                    Accept
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => handleDeclineHouseholdInvitation(invitation.id)}>
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="card" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div>
              <h2 style={{ marginBottom: '12px' }}>Members & Invites</h2>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Access is approval-based. Only emails you allow here can complete Google sign-in.
              </p>
            </div>
          </div>

          <form onSubmit={handleInviteMember} style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Invite email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="form-input"
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="form-select"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Note (optional)</label>
              <input
                type="text"
                value={inviteNote}
                onChange={(e) => setInviteNote(e.target.value)}
                className="form-input"
                placeholder="Eric's son / family member / coach"
                maxLength={120}
              />
            </div>
            <div>
              <button type="submit" className="btn btn-primary">Invite Member</button>
            </div>
          </form>

          <div style={{ display: 'grid', gap: '12px' }}>
            {allowedMembers.map((member) => (
              <div
                key={member.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                  padding: '14px 16px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                }}
              >
                <div>
                  <p style={{ margin: '0 0 6px', fontWeight: 600 }}>{member.email}</p>
                  <p style={{ margin: '0 0 6px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {member.status === 'accepted'
                      ? 'Accepted and able to sign in.'
                      : member.status === 'revoked'
                        ? 'Access revoked.'
                        : 'Approved but has not signed in yet.'}
                  </p>
                  {member.note ? (
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {member.note}
                    </p>
                  ) : null}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    className="form-select"
                    style={{ minWidth: '120px' }}
                    disabled={member.status === 'revoked'}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  {member.status !== 'revoked' ? (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => handleRevokeMember(member.id)}
                    >
                      Revoke
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
            {allowedMembers.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                No invited members yet.
              </p>
            ) : null}
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: '32px' }}>
        <h2 style={{ marginBottom: '16px' }}>Daily Wins</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px' }}>
          Daily Wins are opt-in. Intake only shows the habits you explicitly turn on here.
        </p>
        {profile.dailyWinsTemplateKey ? (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid var(--feedback-info-border)',
              background: 'var(--feedback-info-surface)',
            }}
          >
            <p style={{ margin: '0 0 6px', fontWeight: 600 }}>
              {DAILY_WIN_TEMPLATES.find((template) => template.key === profile.dailyWinsTemplateKey)?.name || 'Active template'}
            </p>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
              Started {profile.dailyWinsChallengeStartDate || 'not set'}.
            </p>
          </div>
        ) : null}
        {profile.activeDailyWins?.length > 0 ? (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {profile.activeDailyWins.map((definition) => (
              <span
                key={definition.key}
                style={{
                  borderRadius: '999px',
                  border: '1px solid var(--feedback-info-border)',
                  background: 'var(--feedback-info-surface)',
                  color: 'var(--primary-color)',
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                {definition.label}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            No Daily Wins configured yet.
          </p>
        )}
        {savedCustomHabits.length > 0 ? (
          <>
            <p style={{ color: 'var(--text-secondary)', margin: '18px 0 10px' }}>
              Custom habits
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {savedCustomHabits.map((habit) => (
                <span
                  key={habit.id}
                  style={{
                    borderRadius: '999px',
                    border: `1px solid ${habit.isActive !== false ? 'var(--feedback-positive-border)' : 'var(--border-color)'}`,
                    background: habit.isActive !== false ? 'var(--feedback-positive-surface)' : 'var(--surface-muted)',
                    color: habit.isActive !== false ? 'var(--primary-color)' : 'var(--text-secondary)',
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {habit.name}
                </span>
              ))}
            </div>
          </>
        ) : null}
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
                  {profile.goalStrategy === 'lean_recomp' && profile.recommendedMacros.deficit && (
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
                {profile.goalStrategy === 'lean_recomp' && profile.recommendedMacros.deficit && (
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
