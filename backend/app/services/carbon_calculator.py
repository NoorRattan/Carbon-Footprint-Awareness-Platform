"""Carbon emission factor calculator for EcoTrack.

Contains the complete emission factor table (kg CO₂e per unit) for all
50 subcategories across 5 emission categories, national average footprints
by region, and pure calculation functions.

Data sources:
- Transport & Energy: UK DESNZ Greenhouse Gas Conversion Factors 2024
- Food: Our World in Data (Poore & Nemecek 2018, updated 2023)
- Shopping: WRAP UK lifecycle assessments, EU Ecodesign data
- Waste: UK DESNZ 2024
- National averages: CCUK 2023, US EPA 2023, EEA 2023, IEA 2023,
  Australian DCCEEW 2023, World Bank 2023
"""

EMISSION_FACTORS: dict[str, dict[str, float]] = {
    "transport": {
        "car_petrol":            0.192,  # per km — UK DESNZ 2024 (average petrol car)
        "car_diesel":            0.171,  # per km — UK DESNZ 2024 (average diesel car)
        "car_electric":          0.053,  # per km — UK DESNZ 2024 (UK grid 2024)
        "car_hybrid":            0.120,  # per km — UK DESNZ 2024 (average PHEV/HEV)
        "motorcycle":            0.114,  # per km — UK DESNZ 2024
        "bus":                   0.089,  # per km — UK DESNZ 2024 (local bus, average occupancy)
        "train_local":           0.035,  # per km — UK DESNZ 2024 (national rail)
        "train_eurostar":        0.006,  # per km — Eurostar published 2024
        "flight_domestic":       0.255,  # per km — DESNZ 2024 (includes RFI factor)
        "flight_shorthaul":      0.195,  # per km — DESNZ 2024 (< 3700 km, economy)
        "flight_longhaul":       0.148,  # per km — DESNZ 2024 (> 3700 km, economy)
        "ferry":                 0.113,  # per km — DESNZ 2024 (foot passenger)
        "cycling":               0.000,  # per km — zero operational emissions
        "walking":               0.000,  # per km — zero operational emissions
    },
    "food": {
        "beef":                  27.0,   # per kg — Our World in Data (2023)
        "lamb":                  39.2,   # per kg — Our World in Data
        "pork":                  12.1,   # per kg — Our World in Data
        "chicken":                6.9,   # per kg — Our World in Data
        "fish_farmed":           13.6,   # per kg — Our World in Data (average farmed)
        "fish_wild":              3.0,   # per kg — Our World in Data (average wild-caught)
        "eggs":                   4.8,   # per kg — Our World in Data
        "dairy_milk":             3.2,   # per litre — Our World in Data
        "cheese":                21.2,   # per kg — Our World in Data
        "vegetables":             2.0,   # per kg — Our World in Data (average)
        "fruits":                 1.1,   # per kg — Our World in Data (average)
        "bread":                  1.6,   # per kg — Our World in Data
        "rice":                   4.0,   # per kg — Our World in Data
        "pasta":                  1.9,   # per kg — Our World in Data
        "legumes":                0.9,   # per kg — Our World in Data (beans, lentils)
        "coffee":                28.5,   # per kg of beans — Our World in Data
    },
    "energy": {
        "electricity_uk":        0.207,  # per kWh — UK DESNZ 2024 grid average
        "electricity_us":        0.386,  # per kWh — US EPA eGRID 2023 national avg
        "electricity_eu":        0.233,  # per kWh — IEA Europe avg 2023
        "electricity_in":        0.708,  # per kWh — IEA India avg 2023
        "electricity_au":        0.510,  # per kWh — NGER Australia 2023
        "electricity_renewable": 0.011,  # per kWh — IPCC lifecycle wind/solar avg
        "natural_gas":           0.203,  # per kWh (gas) — DESNZ 2024
        "heating_oil":           0.298,  # per kWh (thermal) — DESNZ 2024
        "lpg":                   0.214,  # per kWh (thermal) — DESNZ 2024
        "wood_pellets":          0.039,  # per kWh (thermal) — DESNZ 2024 (sustainable)
    },
    "shopping": {
        "clothing_new":          33.0,   # per item — WRAP UK average garment lifecycle
        "clothing_second":        3.3,   # per item — WRAP (10% of new garment)
        "electronics_phone":     70.0,   # per item — Apple/Samsung lifecycle assessments avg
        "electronics_laptop":   422.0,   # per item — IDC lifecycle avg
        "electronics_tv":       400.0,   # per item — EU ecodesign avg
        "furniture_flat":       150.0,   # per large flat-pack item — industry LCA avg
        "book_new":               2.5,   # per book — CISAC lifecycle data
        "streaming_hour":         0.036, # per hour — IEA digital lifecycle 2023
    },
    "waste": {
        "landfill":               0.587, # per kg — DESNZ 2024 (mixed waste to landfill)
        "recycled":               0.021, # per kg — DESNZ 2024 (average mixed recycling)
        "composted":              0.100, # per kg — DESNZ 2024 (food/garden compost)
        "incineration":           0.210, # per kg — DESNZ 2024 (energy from waste)
    },
}

VALID_SUBCATEGORIES: dict[str, frozenset[str]] = {
    category: frozenset(subcats.keys())
    for category, subcats in EMISSION_FACTORS.items()
}

UNIT_LABELS: dict[str, str | dict[str, str]] = {
    "transport": "km",
    "food": {
        "dairy_milk": "litres",
        "default": "kg",
    },
    "energy": "kWh",
    "shopping": {
        "streaming_hour": "hours",
        "default": "items",
    },
    "waste": "kg",
}

NATIONAL_AVERAGES: dict[str, float] = {
    "UK":     6.3,   # UK Climate Change Committee 2023
    "US":    14.5,   # US EPA 2023
    "EU":     7.8,   # EEA 2023 average
    "IN":     1.9,   # Our World in Data 2023
    "AU":    14.8,   # Australian Dept of Climate Change 2023
    "OTHER":  7.0,   # World Bank global average 2023
}

SUBCATEGORY_LABELS: dict[str, str] = {
    # Transport
    "car_petrol":            "Petrol car",
    "car_diesel":            "Diesel car",
    "car_electric":          "Electric car",
    "car_hybrid":            "Hybrid car",
    "motorcycle":            "Motorcycle",
    "bus":                   "Bus",
    "train_local":           "Train (local/national)",
    "train_eurostar":        "Eurostar",
    "flight_domestic":       "Domestic flight",
    "flight_shorthaul":      "Short-haul flight (<3700 km)",
    "flight_longhaul":       "Long-haul flight (>3700 km)",
    "ferry":                 "Ferry (foot passenger)",
    "cycling":               "Cycling",
    "walking":               "Walking",
    # Food
    "beef":                  "Beef",
    "lamb":                  "Lamb / Mutton",
    "pork":                  "Pork",
    "chicken":               "Chicken / Poultry",
    "fish_farmed":           "Farmed fish",
    "fish_wild":             "Wild-caught fish",
    "eggs":                  "Eggs",
    "dairy_milk":            "Dairy milk",
    "cheese":                "Cheese",
    "vegetables":            "Vegetables",
    "fruits":                "Fruits",
    "bread":                 "Bread / Grain",
    "rice":                  "Rice",
    "pasta":                 "Pasta",
    "legumes":               "Legumes (beans, lentils)",
    "coffee":                "Coffee (beans)",
    # Energy
    "electricity_uk":        "Electricity (UK grid)",
    "electricity_us":        "Electricity (US grid)",
    "electricity_eu":        "Electricity (EU grid)",
    "electricity_in":        "Electricity (India grid)",
    "electricity_au":        "Electricity (Australia grid)",
    "electricity_renewable": "Renewable electricity",
    "natural_gas":           "Natural gas",
    "heating_oil":           "Heating oil",
    "lpg":                   "LPG",
    "wood_pellets":          "Wood pellets",
    # Shopping
    "clothing_new":          "New clothing item",
    "clothing_second":       "Second-hand clothing item",
    "electronics_phone":     "New smartphone",
    "electronics_laptop":    "New laptop / tablet",
    "electronics_tv":        "New TV",
    "furniture_flat":        "Flat-pack furniture (large item)",
    "book_new":              "New book",
    "streaming_hour":        "Streaming video",
    # Waste
    "landfill":              "General waste (landfill)",
    "recycled":              "Recycling",
    "composted":             "Composted food / garden waste",
    "incineration":          "Incineration / energy from waste",
}


def calculate_carbon(category: str, subcategory: str, amount: float) -> float:
    """Calculate CO₂e emissions for a given activity.

    Looks up the emission factor for the given category/subcategory pair
    and multiplies it by the amount to return kg CO₂e.

    Args:
        category: Top-level emission category. Must be a key in EMISSION_FACTORS.
        subcategory: Specific subcategory key (e.g., 'car_petrol', 'beef').
                     Must be a key within EMISSION_FACTORS[category].
        amount: Quantity in the unit appropriate for the subcategory.
                Must be strictly greater than zero.

    Returns:
        Carbon emissions in kg CO₂e, rounded to 4 decimal places.

    Raises:
        ValueError: If category is not in EMISSION_FACTORS.
        ValueError: If subcategory is not valid for the given category.
                    The error message lists valid subcategories for the category.
        ValueError: If amount is not a positive number.
    """
    if category not in EMISSION_FACTORS:
        valid = sorted(EMISSION_FACTORS.keys())
        raise ValueError(f"Invalid category '{category}'. Valid categories: {valid}")
    if subcategory not in EMISSION_FACTORS[category]:
        valid = sorted(EMISSION_FACTORS[category].keys())
        raise ValueError(
            f"Invalid subcategory '{subcategory}' for category '{category}'. "
            f"Valid subcategories: {valid}"
        )
    if amount <= 0:
        raise ValueError(f"amount must be positive, got {amount}")
    factor = EMISSION_FACTORS[category][subcategory]
    return round(factor * amount, 4)


def get_unit_label(category: str, subcategory: str) -> str:
    """Return the unit label string for a given category and subcategory.

    Most categories have a single unit for all subcategories.
    Food uses 'litres' for dairy_milk and 'kg' for everything else.
    Shopping uses 'hours' for streaming_hour and 'items' for everything else.

    Args:
        category: Top-level emission category.
        subcategory: Specific subcategory key.

    Returns:
        Unit label string (e.g., 'km', 'kg', 'kWh', 'items', 'litres', 'hours').

    Raises:
        ValueError: If category is not in UNIT_LABELS.
    """
    if category not in UNIT_LABELS:
        raise ValueError(f"Unknown category '{category}' for unit label lookup.")
    label = UNIT_LABELS[category]
    if isinstance(label, dict):
        return label.get(subcategory, label["default"])
    return label
