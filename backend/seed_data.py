#!/usr/bin/env python3
"""Seed EcoTrack education articles to Firestore.

Usage:
    cd backend
    GOOGLE_CLOUD_PROJECT=ecotrack-app-2026 python seed_data.py

Safe to re-run because documents are written with merge=True.
Requires Application Default Credentials or GOOGLE_APPLICATION_CREDENTIALS.
"""

import logging
import os

from google.cloud import firestore

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)

ARTICLES: list[dict[str, object]] = [
    {
        "slug": "why-transport-matters",
        "title": "Why Transport Is Your Biggest Lever",
        "category": "transport",
        "readTime": 4,
        "published": True,
        "content": """Transport is often the fastest part of a personal footprint to change because
every journey has a clear alternative. A trip can be shorter, shared, shifted to
public transport, or avoided entirely. EcoTrack uses distance-based factors so
you can see the effect immediately: the same 20 km journey looks very different
depending on whether it is made in a petrol car, diesel car, bus, train, or on
foot.

## Key facts

- A petrol car emits 0.192 kg CO2e per km, so a 20 km round trip produces
  3.84 kg CO2e.
- A diesel car emits 0.171 kg CO2e per km, while a hybrid emits 0.120 kg CO2e
  per km and an electric car emits 0.053 kg CO2e per km on the UK grid.
- A bus emits 0.089 kg CO2e per passenger-km and local rail emits
  0.035 kg CO2e per passenger-km.
- Domestic flights are much more carbon intensive at 0.255 kg CO2e per km.
- Walking and cycling are recorded as 0.000 kg CO2e per km for direct
  operational emissions.

The comparison is powerful. Replacing a 20 km petrol-car commute with local rail
cuts that trip from 3.84 kg CO2e to 0.70 kg CO2e, saving 3.14 kg CO2e each time.
That single swap is equivalent to avoiding more than 16 km of petrol-car driving.
For a person commuting three times a week, the same change can prevent about
490 kg CO2e over a year. Choosing a bus instead of driving alone also matters:
the 20 km trip falls from 3.84 kg CO2e to 1.78 kg CO2e, roughly a 54% reduction.

Flights deserve special attention because their factors compound across long
distances. A 500 km domestic flight emits about 127.5 kg CO2e per passenger.
The same distance by local rail, where available, would be about 17.5 kg CO2e.
That gap is roughly equivalent to driving a petrol car for 573 km.

## What you can do

1. Replace one regular car journey each week with walking, cycling, bus, or rail.
   Start with the journey that is easiest to repeat.
2. Combine errands into one route so the fixed distance of short car trips is
   reduced.
3. Treat flights as high-impact events. Use rail for regional journeys where it
   is practical, and reserve flights for trips with no realistic substitute.

## Sources

- UK DESNZ Greenhouse Gas Conversion Factors 2024
- US EPA Emission Factors for Greenhouse Gas Inventories 2024
- Eurostar published carbon comparison data 2024""",
    },
    {
        "slug": "carbon-on-your-plate",
        "title": "Carbon on Your Plate",
        "category": "food",
        "readTime": 5,
        "published": True,
        "content": """Food emissions come from land use, fertiliser, animal digestion, feed,
processing, refrigeration, transport, and waste. The largest differences are not
usually about how far food travels; they are about what the food is and how it is
produced. EcoTrack therefore tracks food by weight or volume and applies factors
that make high-impact foods visible alongside everyday staples.

## Key facts

- Lamb is 39.2 kg CO2e per kg, the highest food factor in the app.
- Beef is 27.0 kg CO2e per kg, while pork is 12.1 kg CO2e per kg and chicken is
  6.9 kg CO2e per kg.
- Cheese is 21.2 kg CO2e per kg and dairy milk is 3.2 kg CO2e per litre.
- Rice is 4.0 kg CO2e per kg, pasta is 1.9 kg CO2e per kg, bread is
  1.6 kg CO2e per kg, and legumes are 0.9 kg CO2e per kg.
- Vegetables average 2.0 kg CO2e per kg and fruits average 1.1 kg CO2e per kg.

A 200 g beef portion produces about 5.4 kg CO2e. With the petrol-car factor of
0.192 kg CO2e per km, that one portion is equivalent to driving about 28 km. A
200 g chicken portion is about 1.38 kg CO2e, equivalent to roughly 7 km of
petrol-car driving. A 200 g serving of legumes is about 0.18 kg CO2e, less than
the footprint of driving 1 km. These comparisons explain why even small meal
swaps can show up quickly in a monthly footprint.

Dairy choices are also meaningful. One litre of dairy milk is 3.2 kg CO2e, close
to the emissions from driving a petrol car for 17 km. Cheese is concentrated:
100 g of cheese is about 2.12 kg CO2e. Rice can be higher than many people
expect because flooded paddies can release methane, so portion size still
matters even for plant-based staples.

## What you can do

1. Swap one beef or lamb meal each week for chicken, legumes, pasta, or a
   vegetable-led meal.
2. Keep high-impact foods for occasions where they matter most, and use portion
   size as a practical lever.
3. Reduce food waste by planning meals, freezing leftovers, and using perishable
   ingredients before buying more.

## Sources

- Our World in Data food emissions data based on Poore and Nemecek
- IPCC Fifth Assessment Report global warming potentials
- UK DESNZ Greenhouse Gas Conversion Factors 2024""",
    },
    {
        "slug": "home-energy-footprint",
        "title": "Your Home Energy Footprint",
        "category": "energy",
        "readTime": 5,
        "published": True,
        "content": """Home energy links daily comfort with the carbon intensity of the grid and the
fuel used for heating. Two homes can use the same number of kilowatt-hours and
produce very different emissions if one uses renewable electricity and the other
uses a fossil-heavy grid. EcoTrack records energy in kWh so electricity,
heating, and fuel choices can be compared on the same footing.

## Key facts

- UK grid electricity is 0.207 kg CO2e per kWh.
- US grid electricity is 0.386 kg CO2e per kWh, EU grid electricity is
  0.233 kg CO2e per kWh, India grid electricity is 0.708 kg CO2e per kWh, and
  Australia grid electricity is 0.510 kg CO2e per kWh.
- Renewable electricity is tracked at 0.011 kg CO2e per kWh on a lifecycle basis.
- Natural gas is 0.203 kg CO2e per kWh, heating oil is 0.298 kg CO2e per kWh,
  LPG is 0.214 kg CO2e per kWh, and sustainable wood pellets are
  0.039 kg CO2e per kWh.

The grid factor changes the story. Using 100 kWh of electricity in the UK emits
20.7 kg CO2e. The same use on the India grid emits 70.8 kg CO2e, equivalent to
driving a petrol car for about 369 km. On a renewable tariff, the same 100 kWh is
about 1.1 kg CO2e, roughly the same as driving a petrol car for 6 km. That is why
efficiency and supply both matter: use fewer kWh, and make each kWh cleaner.
For households that cannot change supplier, efficiency is still a strong lever
because every avoided kWh prevents emissions at the local grid factor.

Heating choices are another major lever. A month with 500 kWh of natural gas
heating is about 101.5 kg CO2e. The same useful heat from heating oil would be
149 kg CO2e. Even modest changes are measurable. Cutting 50 kWh of natural gas
through better insulation or thermostat control saves about 10.15 kg CO2e,
equivalent to avoiding 53 km of petrol-car driving.
Small repeated habits also matter: shorter showers, lower flow temperatures,
washing clothes at cooler settings, and air-drying laundry reduce energy demand
without changing the basic comfort of the home.

## What you can do

1. Switch to verified renewable electricity where it is available and affordable.
2. Reduce heating and cooling demand with draught sealing, insulation, curtains,
   shading, and thermostat schedules.
3. Track kWh monthly. Use smart meters or utility bills to find seasonal spikes
   before they become normal.

## Sources

- UK DESNZ Greenhouse Gas Conversion Factors 2024
- IEA Electricity Emission Factors 2023
- IPCC lifecycle emissions for renewable power""",
    },
    {
        "slug": "hidden-carbon-in-shopping",
        "title": "The Hidden Carbon in Your Shopping Cart",
        "category": "shopping",
        "readTime": 5,
        "published": True,
        "content": """Shopping emissions are often hidden because they happen before an item reaches
your home. Materials are extracted, processed, shipped, assembled, packaged, and
delivered. For electronics and furniture, much of the footprint is locked in on
the day of purchase. For clothing, frequent small purchases can quietly add up.
EcoTrack treats products as items, because the decision to buy new, buy used, or
delay replacement is the main carbon lever.

## Key facts

- A new clothing item is 33.0 kg CO2e.
- A second-hand clothing item is 3.3 kg CO2e, about 10% of the new item factor.
- A new smartphone is 70.0 kg CO2e.
- A new laptop or tablet is 422.0 kg CO2e, and a new TV is 400.0 kg CO2e.
- Large flat-pack furniture is 150.0 kg CO2e per item, a new book is
  2.5 kg CO2e, and streaming video is 0.036 kg CO2e per hour.

One new garment at 33.0 kg CO2e is equivalent to driving a petrol car for about
172 km. Buying the same garment second-hand is about 3.3 kg CO2e, equivalent to
17 km. That means the second-hand choice saves around 29.7 kg CO2e before the
item is even worn. If a person avoids one new clothing purchase each month, the
annual avoided footprint is about 396 kg CO2e.

Electronics are even more concentrated. A 422.0 kg CO2e laptop is equivalent to
about 2,198 km of petrol-car driving. Keeping a laptop for four years instead of
two spreads that embodied carbon over twice as much useful life. Streaming is
much smaller per hour, but regular habits still count: 10 hours a week for a
year is about 18.72 kg CO2e.
Books and furniture show the same pattern at different scales. A new book at
2.5 kg CO2e is small compared with electronics, but a regular habit of buying
new copies can still be reduced through libraries, sharing, or second-hand
shops. A single large furniture purchase at 150.0 kg CO2e is equivalent to about
781 km of petrol-car driving, so measuring durability before purchase is useful.

## What you can do

1. Pause before buying new. Ask whether repair, borrowing, renting, or
   second-hand purchase would meet the same need.
2. Extend the life of high-carbon items such as laptops, phones, TVs, and
   furniture with maintenance and protective accessories.
3. Track repeat purchases like clothing so occasional spending does not become a
   monthly carbon pattern.

## Sources

- WRAP UK garment lifecycle assessments
- EU Ecodesign and electronics lifecycle assessment data
- IEA digital lifecycle estimates 2023""",
    },
    {
        "slug": "reducing-waste-footprint",
        "title": "Reducing Your Waste Footprint",
        "category": "waste",
        "readTime": 4,
        "published": True,
        "content": """Waste emissions are created by what happens after something leaves your home.
Landfilled organic material can generate methane, recycling uses energy but
avoids some virgin material production, and incineration releases emissions even
when energy is recovered. The best waste strategy is still prevention, but
EcoTrack also makes disposal routes visible so better sorting has a measurable
effect.

## Key facts

- Mixed waste sent to landfill is 0.587 kg CO2e per kg.
- Mixed recycling is 0.021 kg CO2e per kg.
- Composted food or garden waste is 0.100 kg CO2e per kg.
- Incineration or energy-from-waste is 0.210 kg CO2e per kg.

The difference between landfill and recycling is large. A 5 kg bag of mixed
landfill waste produces about 2.935 kg CO2e. If the same weight is sorted into
mixed recycling, the recorded footprint is about 0.105 kg CO2e. The saving,
2.83 kg CO2e, is equivalent to avoiding almost 15 km of petrol-car driving.
Composting the same 5 kg of suitable food or garden waste would be 0.5 kg CO2e,
still far below landfill.

Waste choices also interact with shopping and food. A product that is never
bought creates no packaging waste, and a meal that is eaten rather than thrown
away avoids both the production footprint and the disposal footprint. This is
why prevention sits above recycling in the waste hierarchy. Recycling is useful,
but it is not a licence for unlimited consumption.

Incineration sits between landfill and recycling in the app's factors. A 10 kg
load sent to energy-from-waste is about 2.1 kg CO2e, compared with 5.87 kg CO2e
for landfill and 0.21 kg CO2e for recycling. Local rules vary, so the most
practical action is to learn exactly what your council or waste provider accepts
and keep those streams clean.
The biggest improvements usually come from making the right choice before bin
day. Buying loose produce, carrying a reusable bottle, refusing unnecessary
packaging, and repairing items all reduce the amount that must be collected,
processed, burned, buried, or recycled later.

## What you can do

1. Separate recyclables carefully and keep them clean enough to avoid
   contamination.
2. Compost food scraps and garden waste where local collection or home composting
   is available.
3. Reduce waste at the source by choosing refillable, repairable, durable, and
   minimally packaged products.

## Sources

- UK DESNZ Greenhouse Gas Conversion Factors 2024
- US EPA Emission Factors for Greenhouse Gas Inventories 2024
- IPCC Fifth Assessment Report methane global warming potentials""",
    },
]


def seed_articles(db: firestore.Client) -> None:
    """Write all education articles to the education collection."""
    for article in ARTICLES:
        slug = str(article["slug"])
        db.collection("education").document(slug).set(
            {**article, "updatedAt": firestore.SERVER_TIMESTAMP},
            merge=True,
        )
        logger.info("Seeded education/%s", slug)


def main() -> None:
    """Connect to Firestore and seed the article collection."""
    project = os.environ.get("GOOGLE_CLOUD_PROJECT", "ecotrack-app-2026")
    db = firestore.Client(project=project)
    seed_articles(db)
    logger.info("Seeding complete.")


if __name__ == "__main__":
    main()
