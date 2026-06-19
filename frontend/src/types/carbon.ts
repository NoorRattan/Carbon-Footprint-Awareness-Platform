export interface CarbonCalculateRequest {
  category: string
  subcategory: string
  amount: number
}

export interface CarbonCalculateResponse {
  carbon_kg: number
  unit: string
  description: string
}
