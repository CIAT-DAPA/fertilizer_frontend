# Dashboard: Metrics preview (`/dashboard/metrics`)

## Page structure

| Piece | Role |
|--------|------|
| Redux `report.kebele` | Kebele tuple from location flow: `[mongoId, name, ext_id, aclimate_id]` (see `Home.js` option `value={[id, name, ext_id, aclimate_id]}`). |
| `kebeleId` | `report.kebele[0]` — **must** be the 24-char hex `adm4` document `_id`. Used as path param: `GET /metrics/{kebeleId}`. |
| Crop select | `GET /crops` → `value` = crop `_id`. |
| Forecast select | `GET /forecast/{cropId}` → each option `value` = `YYYY-MM` (e.g. `2025-07`), `id` = forecast document `_id`. |
| Metrics fetch | `GET /metrics/{kebeleId}` returns **all** metric rows for that kebele; the UI keeps rows where `forecast` matches the selected forecast’s `id`. |
| Charts | `ColumnChart` groups by `type` / `type_name` and parses `values` (see below). |

## MongoDB: `metric` collection (how to read a row)

Each document links one kebele, one forecast run, and one metric type:

| Field | Meaning |
|--------|---------|
| `adm4` | ObjectId → `adm4` kebele (same as Redux `kebele[0]` string). |
| `forecast` | ObjectId → `forecast` (month + crop). Must exist; orphan refs used to break the old API. |
| `type` | ObjectId → `metric_type` (`nps`, `urea`, `n`, `p`, `dap`, `optimal-yield`, `compost`, …). |
| `values` | Array of **season / scenario** entries (see next section). |

### `values` shape

**Preferred (flat):** list of objects:

```json
[
  { "s": 1, "values": [198.91] },
  { "s": 2, "values": [198.91] },
  { "s": 3, "values": [198.91] },
  { "s": 4, "values": [198.91] }
]
```

- `s` = season step / scenario index used by the UI: **1** above normal, **2** normal, **3** below normal, **4** dominant (when present).
- `values` = numeric array; the chart uses the first number.

**Legacy imports** may have accidentally nested lists; the dashboard charts normalize those where possible.

**Single-step imports** (e.g. only season 4) look like:

```json
[ { "s": 4, "values": [248.0] } ]
```

The fertilizer chart still builds bars for whichever `s` values exist.

## Troubleshooting “No metrics for this kebele and forecast”

1. **Kebele id** — In browser devtools, confirm the request URL is  
   `http://localhost:5000/metrics/<24-hex-adm4-id>`.  
   If `<kebeleId>` is wrong or not 24 hex, the API returns `[]`.

2. **Forecast id** — Selected month must map to a real `forecast._id` for that crop. The UI resolves `id` from the `/forecast/{crop}` list (not only the `YYYY-MM` label).

3. **API errors** — If `/metrics/...` returns 500 or non-JSON, the page shows an error state (not “import notebook”). Restart the API after backend fixes.

4. **Data** — In MongoDB, verify:

   ```js
   db.metric.countDocuments({ adm4: ObjectId("…"), forecast: ObjectId("…") })
   ```

   Use the same `ObjectId`s as in `db.forecast.find({ crop: …, date: ISODate("2025-07-01") })`.
