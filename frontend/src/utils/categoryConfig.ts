import type { ActivityCategory } from '../types/activity'

export interface CategoryMeta {
  readonly label: string
  readonly icon: string
  readonly color: string
  readonly description: string
}

export interface SubcategoryMeta {
  readonly label: string
  readonly unit: string
  readonly placeholder: string
}

/**
 * Display metadata for each top-level activity category.
 */
export const CATEGORY_CONFIG: Record<ActivityCategory, CategoryMeta> = {
  transport: {
    label: 'Transport',
    icon: '🚗',
    color: 'bg-blue-500',
    description: 'Car, train, flights and other travel',
  },
  food: {
    label: 'Food',
    icon: '🍽️',
    color: 'bg-green-500',
    description: 'Meat, dairy, vegetables and other food',
  },
  energy: {
    label: 'Home Energy',
    icon: '⚡',
    color: 'bg-amber-500',
    description: 'Electricity, gas and other home energy',
  },
  shopping: {
    label: 'Shopping',
    icon: '🛍️',
    color: 'bg-purple-500',
    description: 'Clothing, electronics and other purchases',
  },
  waste: {
    label: 'Waste',
    icon: '♻️',
    color: 'bg-slate-500',
    description: 'Landfill, recycling and composting',
  },
}

/**
 * Display metadata for every subcategory.
 * unit is the display label shown next to the input (e.g. "km", "kg", "kWh", "items", "hours", "litres").
 * placeholder is example input text.
 */
export const SUBCATEGORY_CONFIG: Record<string, SubcategoryMeta> = {
  // transport (unit: km)
  car_petrol: { label: 'Petrol car', unit: 'km', placeholder: 'e.g. 25' },
  car_diesel: { label: 'Diesel car', unit: 'km', placeholder: 'e.g. 25' },
  car_electric: { label: 'Electric car', unit: 'km', placeholder: 'e.g. 25' },
  car_hybrid: { label: 'Hybrid car', unit: 'km', placeholder: 'e.g. 25' },
  motorcycle: { label: 'Motorcycle', unit: 'km', placeholder: 'e.g. 15' },
  bus: { label: 'Bus', unit: 'km', placeholder: 'e.g. 10' },
  train_local: { label: 'Train (local/national)', unit: 'km', placeholder: 'e.g. 50' },
  train_eurostar: { label: 'Eurostar', unit: 'km', placeholder: 'e.g. 500' },
  flight_domestic: { label: 'Domestic flight', unit: 'km', placeholder: 'e.g. 300' },
  flight_shorthaul: {
    label: 'Short-haul flight (<3700 km)',
    unit: 'km',
    placeholder: 'e.g. 1500',
  },
  flight_longhaul: {
    label: 'Long-haul flight (>3700 km)',
    unit: 'km',
    placeholder: 'e.g. 8000',
  },
  ferry: { label: 'Ferry (foot passenger)', unit: 'km', placeholder: 'e.g. 50' },
  cycling: { label: 'Cycling', unit: 'km', placeholder: 'e.g. 10' },
  walking: { label: 'Walking', unit: 'km', placeholder: 'e.g. 5' },
  // food
  beef: { label: 'Beef', unit: 'kg', placeholder: 'e.g. 0.5' },
  lamb: { label: 'Lamb / Mutton', unit: 'kg', placeholder: 'e.g. 0.3' },
  pork: { label: 'Pork', unit: 'kg', placeholder: 'e.g. 0.4' },
  chicken: { label: 'Chicken / Poultry', unit: 'kg', placeholder: 'e.g. 0.5' },
  fish_farmed: { label: 'Farmed fish', unit: 'kg', placeholder: 'e.g. 0.3' },
  fish_wild: { label: 'Wild-caught fish', unit: 'kg', placeholder: 'e.g. 0.3' },
  eggs: { label: 'Eggs', unit: 'kg', placeholder: 'e.g. 0.5' },
  dairy_milk: { label: 'Dairy milk', unit: 'litres', placeholder: 'e.g. 2' },
  cheese: { label: 'Cheese', unit: 'kg', placeholder: 'e.g. 0.2' },
  vegetables: { label: 'Vegetables', unit: 'kg', placeholder: 'e.g. 1' },
  fruits: { label: 'Fruits', unit: 'kg', placeholder: 'e.g. 1' },
  bread: { label: 'Bread / Grain', unit: 'kg', placeholder: 'e.g. 0.5' },
  rice: { label: 'Rice', unit: 'kg', placeholder: 'e.g. 0.5' },
  pasta: { label: 'Pasta', unit: 'kg', placeholder: 'e.g. 0.5' },
  legumes: { label: 'Legumes (beans, lentils)', unit: 'kg', placeholder: 'e.g. 0.4' },
  coffee: { label: 'Coffee (beans)', unit: 'kg', placeholder: 'e.g. 0.25' },
  // energy (unit: kWh)
  electricity_uk: { label: 'Electricity (UK grid)', unit: 'kWh', placeholder: 'e.g. 100' },
  electricity_us: { label: 'Electricity (US grid)', unit: 'kWh', placeholder: 'e.g. 100' },
  electricity_eu: { label: 'Electricity (EU grid)', unit: 'kWh', placeholder: 'e.g. 100' },
  electricity_in: { label: 'Electricity (India grid)', unit: 'kWh', placeholder: 'e.g. 100' },
  electricity_au: {
    label: 'Electricity (Australia grid)',
    unit: 'kWh',
    placeholder: 'e.g. 100',
  },
  electricity_renewable: {
    label: 'Renewable electricity',
    unit: 'kWh',
    placeholder: 'e.g. 100',
  },
  natural_gas: { label: 'Natural gas', unit: 'kWh', placeholder: 'e.g. 200' },
  heating_oil: { label: 'Heating oil', unit: 'kWh', placeholder: 'e.g. 150' },
  lpg: { label: 'LPG', unit: 'kWh', placeholder: 'e.g. 100' },
  wood_pellets: { label: 'Wood pellets', unit: 'kWh', placeholder: 'e.g. 100' },
  // shopping
  clothing_new: { label: 'New clothing item', unit: 'items', placeholder: 'e.g. 2' },
  clothing_second: { label: 'Second-hand clothing', unit: 'items', placeholder: 'e.g. 2' },
  electronics_phone: { label: 'New smartphone', unit: 'items', placeholder: 'e.g. 1' },
  electronics_laptop: { label: 'New laptop / tablet', unit: 'items', placeholder: 'e.g. 1' },
  electronics_tv: { label: 'New TV', unit: 'items', placeholder: 'e.g. 1' },
  furniture_flat: {
    label: 'Flat-pack furniture (large)',
    unit: 'items',
    placeholder: 'e.g. 1',
  },
  book_new: { label: 'New book', unit: 'items', placeholder: 'e.g. 3' },
  streaming_hour: { label: 'Streaming video', unit: 'hours', placeholder: 'e.g. 4' },
  // waste (unit: kg)
  landfill: { label: 'General waste (landfill)', unit: 'kg', placeholder: 'e.g. 5' },
  recycled: { label: 'Recycling', unit: 'kg', placeholder: 'e.g. 3' },
  composted: { label: 'Composted food/garden waste', unit: 'kg', placeholder: 'e.g. 2' },
  incineration: {
    label: 'Incineration / energy from waste',
    unit: 'kg',
    placeholder: 'e.g. 2',
  },
}

/**
 * Returns an array of subcategory keys for a given activity category.
 * @param category - The activity category
 * @returns Array of subcategory key strings
 */
export function getSubcategoriesForCategory(category: ActivityCategory): string[] {
  const categorySubcategoryMap: Record<ActivityCategory, string[]> = {
    transport: [
      'car_petrol',
      'car_diesel',
      'car_electric',
      'car_hybrid',
      'motorcycle',
      'bus',
      'train_local',
      'train_eurostar',
      'flight_domestic',
      'flight_shorthaul',
      'flight_longhaul',
      'ferry',
      'cycling',
      'walking',
    ],
    food: [
      'beef',
      'lamb',
      'pork',
      'chicken',
      'fish_farmed',
      'fish_wild',
      'eggs',
      'dairy_milk',
      'cheese',
      'vegetables',
      'fruits',
      'bread',
      'rice',
      'pasta',
      'legumes',
      'coffee',
    ],
    energy: [
      'electricity_uk',
      'electricity_us',
      'electricity_eu',
      'electricity_in',
      'electricity_au',
      'electricity_renewable',
      'natural_gas',
      'heating_oil',
      'lpg',
      'wood_pellets',
    ],
    shopping: [
      'clothing_new',
      'clothing_second',
      'electronics_phone',
      'electronics_laptop',
      'electronics_tv',
      'furniture_flat',
      'book_new',
      'streaming_hour',
    ],
    waste: ['landfill', 'recycled', 'composted', 'incineration'],
  }
  return categorySubcategoryMap[category]
}
