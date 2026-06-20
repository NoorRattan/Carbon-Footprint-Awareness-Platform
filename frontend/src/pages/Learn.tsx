import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { educationApi } from '../services/api'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { ACTIVITY_CATEGORIES, type EducationArticle } from '../types'

/** Category filter options for education articles. */
const FILTER_CATEGORIES = ['all', ...ACTIVITY_CATEGORIES] as const

/** Article category filter option shown in the Learn page tabs. */
type ArticleCategoryFilter = (typeof FILTER_CATEGORIES)[number]

/**
 * Public learn page displaying educational articles about carbon footprint reduction.
 * Fetches articles from the education API and provides category filtering.
 * @returns The learn page with filterable article cards grid.
 */
const Learn: React.FC = () => {
  const [articles, setArticles] = useState<Omit<EducationArticle, 'content'>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<ArticleCategoryFilter>('all')

  useEffect(() => {
    const fetchArticles = async (): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        const response = await educationApi.getAll(
          activeFilter === 'all' ? undefined : activeFilter
        )
        setArticles(response.articles)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load articles'
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    fetchArticles()
  }, [activeFilter])

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900">Learn About Your Carbon Footprint</h1>

      {/* Category filter tabs */}
      <nav aria-label="Article category filters">
        <ul className="flex flex-wrap gap-2">
          {FILTER_CATEGORIES.map((cat) => (
            <li key={cat}>
              <button
                type="button"
                onClick={() => setActiveFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  activeFilter === cat
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                aria-current={activeFilter === cat ? 'true' : undefined}
              >
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Loading state */}
      {loading && (
        <div role="status" aria-live="polite" className="text-center py-12 text-slate-500">
          Loading articles...
        </div>
      )}

      {/* Error state */}
      {error && (
        <div role="alert" aria-live="assertive" className="text-center py-12 text-red-600">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && articles.length === 0 && (
        <p className="text-center py-12 text-slate-500">No articles found for this category.</p>
      )}

      {/* Article cards grid */}
      {!loading && !error && articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Link
              key={article.slug}
              to={`/learn/${article.slug}`}
              className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl"
            >
              <Card hoverable className="h-full">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="info">{article.category}</Badge>
                    <span className="text-xs text-slate-400">{article.readTime} min read</span>
                  </div>
                  <h2 className="text-base font-semibold text-slate-800 line-clamp-2">
                    {article.title}
                  </h2>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default Learn
