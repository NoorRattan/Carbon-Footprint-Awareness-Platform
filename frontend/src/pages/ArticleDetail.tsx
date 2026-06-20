import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { educationApi } from '../services/api'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import type { EducationArticle } from '../types'

const renderArticleContent = (content: string): React.ReactNode[] => {
  const listItems: string[] = []
  const nodes: React.ReactNode[] = []

  const flushList = () => {
    if (listItems.length === 0) return
    nodes.push(
      <ul key={`list-${nodes.length}`} className="list-disc pl-6 space-y-2 text-slate-700">
        {listItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
    listItems.splice(0, listItems.length)
  }

  content.split('\n').forEach((rawLine, index) => {
    const line = rawLine.trim()
    if (!line) {
      flushList()
      return
    }

    if (line.startsWith('### ')) {
      flushList()
      nodes.push(
        <h3 key={index} className="text-xl font-semibold text-slate-900 mt-8">
          {line.slice(4)}
        </h3>
      )
      return
    }

    if (line.startsWith('## ')) {
      flushList()
      nodes.push(
        <h2 key={index} className="text-2xl font-bold text-slate-900 mt-10">
          {line.slice(3)}
        </h2>
      )
      return
    }

    if (line.startsWith('# ')) {
      flushList()
      nodes.push(
        <h2 key={index} className="text-2xl font-bold text-slate-900 mt-8">
          {line.slice(2)}
        </h2>
      )
      return
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.slice(2))
      return
    }

    flushList()
    nodes.push(
      <p key={index} className="leading-7 text-slate-700">
        {line}
      </p>
    )
  })

  flushList()
  return nodes
}

const ArticleDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<EducationArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) {
        setError('Article not found')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const data = await educationApi.getBySlug(slug)
        setArticle(data)
      } catch {
        setError('Article not found')
      } finally {
        setLoading(false)
      }
    }

    fetchArticle()
  }, [slug])

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="text-center py-12 text-slate-500">
        Loading article...
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">Article Not Found</h1>
        <p className="text-slate-600">This learning article is not available.</p>
        <Link to="/learn" className="text-primary hover:underline font-medium">
          Back to Learn
        </Link>
      </div>
    )
  }

  return (
    <article className="max-w-3xl mx-auto space-y-8">
      <Link to="/learn" className="text-primary hover:underline font-medium">
        Back to Learn
      </Link>

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">{article.category}</Badge>
          <span className="text-sm text-slate-500">{article.readTime} min read</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{article.title}</h1>
      </header>

      <Card>
        <div className="space-y-5">{renderArticleContent(article.content)}</div>
      </Card>
    </article>
  )
}

export default ArticleDetail
