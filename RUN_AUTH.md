# HaFAS user login & saved location

Users can register/sign in; **country, report type, region, zone, woreda, kebele**, and advisory layer flags are stored in MongoDB (`users` collection).

## Setup

### 1. API dependency

```bash
cd fertilizer_webapi/src
pip install -r requirements-auth.txt
```

### 2. Start API (port 5000, same as before)

```bash
cd fertilizer_webapi/src
pip install -r requirements-auth.txt
python agroadvisory_api.py
```

Auth routes are registered automatically. Restart the API after pulling changes so `/auth/login` is available.

New endpoints:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Get JWT token |
| GET | `/auth/me` | Profile + saved location (Bearer token) |
| GET | `/auth/preferences` | Saved location only |
| PUT | `/auth/preferences` | Save location from dashboard |

### 3. Demo user (optional)

```bash
cd fertilizer_webapi/src
python scripts/create_demo_user.py
```

- Email: `advisor@hafas.local`
- Password: `hafas123`

### 4. Frontend entry

`src/src/index.js` should import:

```javascript
import App from './AppDashboardAuth';
```

Uses `storeAuth` (report + auth reducers) and auto-saves location ~800ms after each change when signed in.

## User flow

1. Open **http://localhost:3000/login** (or **Sign in** in the navbar).
2. Register or sign in.
3. Select country → region → zone → woreda → kebele on the location page.
4. Preferences sync to MongoDB automatically (navbar shows “saved”).
5. On next visit, session restores and dashboard shows your saved names.

## MongoDB document shape

```json
{
  "email": "user@example.com",
  "location": {
    "country": ["Ethiopia", "507f1f77bcf86cd799439011"],
    "type": "kebele",
    "region": ["<id>", "Amhara", "ext"],
    "zone": ["<id>", "North Shewa", "ext"],
    "woreda": ["<id>", "Woreda name", "ext"],
    "kebele": ["<id>", "Kebele name", "ext", "aclimate_id"],
    "ad_fertilizer": true,
    "ad_optimal": true,
    "ad_risk": true,
    "ad_aclimate": true
  }
}
```

## Security note

Set `AUTH_SECRET_KEY` in production for JWT signing.
