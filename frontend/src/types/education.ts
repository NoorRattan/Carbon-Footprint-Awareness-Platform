/** Educational article returned by the learning content API. */
export interface EducationArticle {
  /** URL-safe article slug. */
  readonly slug: string
  /** Article title. */
  readonly title: string
  /** Full article markdown-like content. */
  readonly content: string
  /** Article category label. */
  readonly category: string
  /** Estimated reading time in minutes. */
  readonly readTime: number
  /** ISO timestamp when the article was last updated. */
  readonly updatedAt: string
}

/** Education article list endpoint response. */
export interface EducationListResponse {
  /** Article summaries without full content. */
  readonly articles: Omit<EducationArticle, 'content'>[]
}
