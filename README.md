# Karnataka Weather Analytics

Interactive weather and rainfall analytics app for Karnataka — District → Taluk → Hobli hierarchy with Google Maps.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Add your Google Maps API key
cp .env.example .env
# Edit .env and set VITE_GOOGLE_MAPS_API_KEY=your_key_here

# 3. Start dev server
npm run dev
```

Open http://localhost:5173

## Google Maps API Key (Free)

1. Go to https://console.cloud.google.com/
2. Create a project → Enable "Maps JavaScript API"
3. Create credentials → API Key
4. Paste it in your `.env` file:
   ```
   VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
   ```

## CORS Fix — Already Applied

The Vite proxy in `vite.config.js` forwards all `/api/*` requests to the backend:
```
Browser → /api/rainfalldata/DATE → Vite → http://203.201.62.116:8091/api/rainfalldata/DATE
```
No CORS errors. The browser only ever talks to localhost.

## Features

- 🗺️ **Google Maps** — coloured circles per district, click for District → Taluk → Hobli popup
- 🌧️ **Rainfall** — total/avg rainfall by District → Taluk → Hobli with collapsible tree
- 🌡️ **Weather** — temperature, humidity, wind speed hierarchy  
- 📊 **Data Table** — raw station data (District, Taluk, Hobli rows)
- 📅 **Date picker** — load any date from the API
