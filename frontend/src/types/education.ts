export interface EducationArticle {
  readonly slug: string
  readonly title: string
  readonly content: string
  readonly category: string
  readonly readTime: number
  readonly updatedAt: string
}

export interface EducationListResponse {
  readonly articles: Omit<EducationArticle, 'content'>[]
}
