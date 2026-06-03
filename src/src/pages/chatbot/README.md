# Fertilizer Advisory Chatbot

## Overview
The Fertilizer Advisory Chatbot is an interactive AI-powered assistant that helps farmers get **DAP and Urea** recommendations plus **expected yield** for a specific location in Ethiopia. It uses Groq for natural language collection and the NextGen coordinates API for site-specific values (kg/ha), scaled to the farmer's farm size.

## Recommendation flow

The bot collects **three** inputs (no fertilizer choice):

1. **Crop type** (e.g. maize, wheat)
2. **Farm size** in hectares (ha)
3. **Location** — coordinates in Ethiopia or map selection

The system then:

- Fetches **DAP** and **Urea** rates (kg/ha) for crop + location
- Fetches **optimal yield** (kg/ha) for the same crop + location
- Multiplies each rate by farm size to get total **kg** for the field
- Returns a short message, for example:

  *For your Maize crop on 2 ha, apply 120 kg of DAP and 80 kg of Urea. With this, the expected yield you can get is 4,500 kg.*

- Adds **good agronomic practices** (planting time, land prep, spacing, weeds, moisture at application, pest monitoring)

## Layer matching

Layers are loaded from `layers_fertilizer` and parsed as `et_{crop}_{fertilizer}_probabilistic_{scenario}`.

| Product | Layer fertilizer segment | Scenario |
|--------|---------------------------|----------|
| DAP | `dap` | `dominant`, else `normal` |
| Urea | `urea` | `dominant`, else `normal` |
| Yield | `yieldtypes_optimal` | `dominant` |

Matching logic lives in `parseLayerName` and `findMatchingLayer` in `Chatbot.js`.

## API

- **Groq** — conversation and field extraction (`crop`, `farm_size_ha`, `coordinates`)
- **Coordinates** — `POST .../coordinates/{layer}/{coorStr}/{date}` returns kg/ha (or yield kg/ha)

## Map and bulk CSV

- **Map** — click within Ethiopia bounds; then provide crop and farm size if missing
- **CSV upload** — input columns: `Crop Type`, `latitude`, `longitude`. Output adds `DAP (kg/ha)` and `Urea (kg/ha)` per row (site-specific rates from the API; no farm size in bulk mode)

### CSV input format

```csv
Crop Type,latitude,longitude
wheat,9.145,40.489
maize,8.980,38.750
```

### CSV output format

```csv
Crop Type,latitude,longitude,DAP (kg/ha),Urea (kg/ha)
"wheat",9.145,40.489,"124","298"
```

## Environment

- `REACT_APP_GROQ_API` — Groq API key
