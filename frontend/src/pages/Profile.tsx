import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { userApi } from '../services/api'
import { auth } from '../firebase'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import type { UserProfile, UserRegion, DietType } from '../types'

/** Select option model for profile fields. */
interface ProfileOption<TValue extends string> {
  /** Stored option value. */
  readonly value: TValue
  /** Human-readable option label. */
  readonly label: string
}

/** Achievement badge shown on the profile page. */
interface AchievementBadge {
  /** Badge identifier from the backend profile. */
  readonly id: string
  /** Human-readable badge label. */
  readonly label: string
  /** Decorative badge icon. */
  readonly icon: string
}

/** All supported region options. */
const REGIONS: ProfileOption<UserRegion>[] = [
  { value: 'UK', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
  { value: 'EU', label: 'European Union' },
  { value: 'IN', label: 'India' },
  { value: 'AU', label: 'Australia' },
  { value: 'OTHER', label: 'Other' },
]

/** All supported diet types. */
const DIET_TYPES: ProfileOption<DietType>[] = [
  { value: 'meat-heavy', label: 'Meat-heavy' },
  { value: 'average', label: 'Average' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
]

/** Badge definitions for achievements display. */
const ALL_BADGES: AchievementBadge[] = [
  { id: 'first_log', label: 'First Log', icon: '📝' },
  { id: 'week_streak', label: '7-Day Streak', icon: '🔥' },
  { id: 'month_streak', label: '30-Day Streak', icon: '⭐' },
  { id: 'goal_setter', label: 'Goal Setter', icon: '🎯' },
  { id: 'goal_achieved', label: 'Goal Achieved', icon: '🏆' },
  { id: 'eco_warrior', label: 'Eco Warrior', icon: '🌍' },
  { id: 'low_footprint', label: 'Low Footprint', icon: '🌱' },
  { id: 'reducer', label: 'Carbon Reducer', icon: '📉' },
]

/**
 * Protected profile page for viewing and editing user details, displaying achievements,
 * and managing account data including account deletion.
 * @returns The user profile management page.
 */
const Profile: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Editable fields
  const [displayName, setDisplayName] = useState('')
  const [region, setRegion] = useState<UserRegion>('UK')
  const [dietType, setDietType] = useState<DietType>('average')
  const [householdSize, setHouseholdSize] = useState('1')

  useEffect(() => {
    const fetchProfile = async (): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        const data = await userApi.getProfile()
        setProfile(data)
        setDisplayName(data.displayName)
        setRegion(data.region)
        setDietType(data.dietType)
        setHouseholdSize(String(data.householdSize))
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load profile'
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  /**
   * Saves updated profile fields to the API.
   * @returns A promise that resolves when the profile save completes.
   */
  const handleSave = useCallback(async (): Promise<void> => {
    setSaving(true)
    setSaveMessage(null)
    try {
      await userApi.updateProfile({
        displayName: displayName.trim(),
        region,
        dietType,
        householdSize: parseInt(householdSize, 10) || 1,
      })
      setSaveMessage('Profile saved successfully!')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save profile'
      setError(message)
    } finally {
      setSaving(false)
    }
  }, [displayName, region, dietType, householdSize])

  /**
   * Handles permanent account deletion with Firebase sign-out and redirect.
   * @returns A promise that resolves when account deletion completes.
   */
  const handleDeleteAccount = useCallback(async (): Promise<void> => {
    setDeleting(true)
    try {
      await userApi.deleteAccount()
      await auth.signOut()
      navigate('/')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete account'
      setError(message)
      setDeleting(false)
    }
  }, [navigate])

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div role="alert" aria-live="assertive" className="text-center py-12 text-red-600">
        {error}
      </div>
    )
  }

  const earnedBadges = profile?.badges ?? []
  const streak = profile?.streak ?? 0

  return (
    <div className="space-y-10 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>

      {/* Profile details */}
      <section aria-labelledby="profile-details-heading">
        <h2 id="profile-details-heading" className="text-xl font-bold text-slate-800 mb-4">
          Your Profile
        </h2>
        <Card>
          <div className="space-y-5">
            <div>
              <label
                htmlFor="profile-name"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Display name
              </label>
              <input
                id="profile-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="profile-email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Email
              </label>
              <input
                id="profile-email"
                type="email"
                value={user?.email ?? ''}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor="profile-region"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Region
              </label>
              <select
                id="profile-region"
                value={region}
                onChange={(e) => setRegion(e.target.value as UserRegion)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="profile-diet"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Diet type
              </label>
              <select
                id="profile-diet"
                value={dietType}
                onChange={(e) => setDietType(e.target.value as DietType)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {DIET_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="profile-household"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Household size
              </label>
              <input
                id="profile-household"
                type="number"
                min="1"
                max="20"
                value={householdSize}
                onChange={(e) => setHouseholdSize(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {saveMessage && (
              <div
                role="status"
                aria-live="polite"
                className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm"
              >
                {saveMessage}
              </div>
            )}

            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm"
              >
                {error}
              </div>
            )}

            <Button onClick={handleSave} loading={saving}>
              Save Changes
            </Button>
          </div>
        </Card>
      </section>

      {/* Achievements */}
      <section aria-labelledby="achievements-heading">
        <h2 id="achievements-heading" className="text-xl font-bold text-slate-800 mb-4">
          Achievements
        </h2>
        <Card>
          <div className="space-y-4">
            <p className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <span aria-hidden="true">🔥</span> {streak}-day streak
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ALL_BADGES.map((badge) => {
                const earned = earnedBadges.includes(badge.id)
                return (
                  <div
                    key={badge.id}
                    className={`text-center p-3 rounded-lg border ${
                      earned ? 'border-primary/30 bg-primary/5' : 'border-slate-200 opacity-40'
                    }`}
                    aria-label={`${badge.label}: ${earned ? 'earned' : 'not yet earned'}`}
                  >
                    <span aria-hidden="true" className="text-2xl block mb-1">
                      {badge.icon}
                    </span>
                    <span className="text-xs font-medium text-slate-600">{badge.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      </section>

      {/* Data / Account deletion */}
      <section aria-labelledby="data-heading">
        <h2 id="data-heading" className="text-xl font-bold text-slate-800 mb-4">
          Your Data
        </h2>
        <Card>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              EcoTrack stores only the data needed to calculate and track your footprint.
            </p>
            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
              Delete my account
            </Button>
          </div>
        </Card>
      </section>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            This will permanently delete all your data. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="danger" loading={deleting} onClick={handleDeleteAccount}>
              Yes, delete my account
            </Button>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Profile
