import { logEvent } from 'firebase/analytics'
import { analytics } from '../firebase'

/**
 * Checks whether the user has given GDPR analytics consent.
 * @returns true if consent is granted, false otherwise.
 */
const hasConsent = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }
  return localStorage.getItem('ecotrack_analytics_consent') === 'true'
}

/**
 * Tracks a custom event in Firebase Analytics if GDPR consent is granted.
 * @param eventName The name of the event to track.
 * @param params Optional event parameters.
 * @returns void
 */
export const trackEvent = (eventName: string, params?: Record<string, unknown>): void => {
  if (!hasConsent() || !analytics) {
    return
  }
  logEvent(analytics, eventName, params)
}

/**
 * Tracks a page view event in Firebase Analytics.
 * @param pagePath The path of the visited page.
 * @returns void
 */
export const trackPageView = (pagePath: string): void => {
  trackEvent('page_view', { page_path: pagePath })
}

/**
 * Tracks when a user logs a carbon-producing activity.
 * @param category The activity category (e.g. transport, food).
 * @param subcategory The specific subcategory.
 * @param carbonKg The calculated carbon emissions in kg.
 * @returns void
 */
export const trackActivityLogged = (
  category: string,
  subcategory: string,
  carbonKg: number
): void => {
  trackEvent('log_activity', {
    category,
    subcategory,
    carbon_kg: carbonKg,
  })
}

/**
 * Tracks when a user views their personalized carbon insights.
 * @param totalCarbonKg The total carbon footprint of the user for the period.
 * @returns void
 */
export const trackInsightViewed = (totalCarbonKg: number): void => {
  trackEvent('view_insights', {
    total_carbon_kg: totalCarbonKg,
  })
}
