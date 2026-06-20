import React, { useState, useEffect, useCallback } from 'react'
import {
  CATEGORY_CONFIG,
  SUBCATEGORY_CONFIG,
  getSubcategoriesForCategory,
} from '../../utils/categoryConfig'
import { getCategoryIcon } from '../../utils/carbonFormatter'
import { carbonApi, activitiesApi } from '../../services/api'
import { formatCarbon } from '../../utils/carbonFormatter'
import { todayInputDate } from '../../utils/dateUtils'
import Button from '../ui/Button'
import { ACTIVITY_CATEGORIES, type ActivityCategory } from '../../types'

/** Props for the ActivityForm component. */
export interface ActivityFormProps {
  /** Callback invoked after a successful activity submission. */
  readonly onSuccess: () => void
}

/** Default category selected when the activity form resets. */
const DEFAULT_ACTIVITY_CATEGORY: ActivityCategory = ACTIVITY_CATEGORIES[0]

/**
 * Multi-step activity logging form. Steps: category, subcategory, amount (with live CO₂ estimate), date, and optional notes.
 * @param props - Callback invoked after a successful activity log submission.
 * @returns A stepped form component for logging carbon-emitting activities.
 */
const ActivityForm: React.FC<ActivityFormProps> = ({ onSuccess }) => {
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState<ActivityCategory>(DEFAULT_ACTIVITY_CATEGORY)
  const [subcategory, setSubcategory] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayInputDate())
  const [notes, setNotes] = useState('')
  const [estimate, setEstimate] = useState<number | null>(null)
  const [estimateLoading, setEstimateLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const subcategories = getSubcategoriesForCategory(category)
  const today = todayInputDate()

  /** Reset subcategory when category changes. */
  useEffect(() => {
    const subs = getSubcategoriesForCategory(category)
    setSubcategory(subs[0] || '')
    setEstimate(null)
    setAmount('')
  }, [category])

  /** Fetch live CO₂ estimate when amount changes. */
  useEffect(() => {
    if (!amount || !subcategory || parseFloat(amount) <= 0) {
      setEstimate(null)
      return
    }

    const updateEstimate = async (): Promise<void> => {
      setEstimateLoading(true)
      try {
        const result = await carbonApi.calculate({
          category,
          subcategory,
          amount: parseFloat(amount),
        })
        setEstimate(result.carbon_kg)
      } catch (err: unknown) {
        void (err instanceof Error ? err.message : err)
        setEstimate(null)
      } finally {
        setEstimateLoading(false)
      }
    }

    const timer = setTimeout(() => {
      void updateEstimate()
    }, 400)

    return () => clearTimeout(timer)
  }, [amount, category, subcategory])

  /**
   * Handles form submission to log the activity.
   * @param e - The form submit event.
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault()
      setError(null)
      setSubmitting(true)

      try {
        await activitiesApi.log({
          category,
          subcategory,
          amount: parseFloat(amount),
          date,
          notes: notes.trim() || undefined,
        })
        setSuccessMessage('Activity logged successfully!')
        setTimeout(() => {
          setSuccessMessage(null)
          setStep(1)
          setCategory(DEFAULT_ACTIVITY_CATEGORY)
          setSubcategory(getSubcategoriesForCategory(DEFAULT_ACTIVITY_CATEGORY)[0] || '')
          setAmount('')
          setDate(todayInputDate())
          setNotes('')
          setEstimate(null)
          onSuccess()
        }, 1500)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to log activity'
        setError(message)
      } finally {
        setSubmitting(false)
      }
    },
    [category, subcategory, amount, date, notes, onSuccess]
  )

  const currentSubMeta = SUBCATEGORY_CONFIG[subcategory]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2" aria-label="Form progress">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
              s <= step ? 'bg-primary' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Category selection */}
      {step === 1 && (
        <fieldset>
          <legend className="text-lg font-semibold text-slate-800 mb-4">
            What type of activity?
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ACTIVITY_CATEGORIES.map((cat) => {
              const config = CATEGORY_CONFIG[cat]
              const icon = getCategoryIcon(cat)
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat)
                    setStep(2)
                  }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    category === cat
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                  aria-pressed={category === cat}
                >
                  <span aria-hidden="true" className="text-3xl">
                    {icon}
                  </span>
                  <span className="text-sm font-medium text-slate-700">{config.label}</span>
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      {/* Step 2: Subcategory selection */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">
              Select {CATEGORY_CONFIG[category].label} type
            </h3>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
            >
              Change category
            </button>
          </div>
          <div>
            <label
              htmlFor="subcategory-select"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Subcategory
            </label>
            <select
              id="subcategory-select"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {subcategories.map((sub) => (
                <option key={sub} value={sub}>
                  {SUBCATEGORY_CONFIG[sub]?.label || sub}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setStep(3)}>Next</Button>
          </div>
        </div>
      )}

      {/* Step 3: Amount with live estimate */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">How much?</h3>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
            >
              Change type
            </button>
          </div>
          <div>
            <label htmlFor="amount-input" className="block text-sm font-medium text-slate-700 mb-1">
              Amount ({currentSubMeta?.unit || 'units'})
            </label>
            <input
              id="amount-input"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={currentSubMeta?.placeholder || 'Enter amount'}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Live CO₂ estimate */}
          {estimateLoading && (
            <div role="status" aria-live="polite" className="text-sm text-slate-500">
              Calculating estimate...
            </div>
          )}
          {estimate !== null && !estimateLoading && (
            <p className="text-sm text-slate-600 bg-green-50 border border-green-200 rounded-lg p-3">
              This activity produces approximately{' '}
              <strong className="text-green-700">{formatCarbon(estimate)}</strong>
            </p>
          )}

          <div className="flex justify-end">
            <Button onClick={() => setStep(4)} disabled={!amount || parseFloat(amount) <= 0}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Date */}
      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">When did this happen?</h3>
          <div>
            <label htmlFor="date-input" className="block text-sm font-medium text-slate-700 mb-1">
              Date
            </label>
            <input
              id="date-input"
              type="date"
              max={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button onClick={() => setStep(5)}>Next</Button>
          </div>
        </div>
      )}

      {/* Step 5: Notes (optional) & Submit */}
      {step === 5 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">Notes? (optional)</h3>
          <div>
            <label htmlFor="notes-input" className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="Add optional details..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">{notes.length}/200 characters</p>
          </div>

          {/* Summary */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-1 text-sm">
            <p>
              <strong>Category:</strong> {CATEGORY_CONFIG[category].label}
            </p>
            <p>
              <strong>Type:</strong> {currentSubMeta?.label || subcategory}
            </p>
            <p>
              <strong>Amount:</strong> {amount} {currentSubMeta?.unit || ''}
            </p>
            <p>
              <strong>Date:</strong> {date}
            </p>
            {estimate !== null && (
              <p>
                <strong>Estimated CO₂:</strong> {formatCarbon(estimate)}
              </p>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(4)}>
              Back
            </Button>
            <Button type="submit" loading={submitting}>
              Log Activity
            </Button>
          </div>
        </div>
      )}

      {/* Success toast */}
      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm font-medium"
        >
          {successMessage}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm"
        >
          {error}
        </div>
      )}
    </form>
  )
}

export default ActivityForm
