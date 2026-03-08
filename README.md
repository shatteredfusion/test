# GeoPrint STL Builder

A single-page web app that uses **CesiumJS** for globe navigation and **three.js** for deterministic mesh generation + STL export.

## Features

- Full-world 3D globe start view with smooth pan/zoom (city/building scale).
- Place search (Nominatim).
- Area drawing mode with rectangle/square/custom ratio/preset print-bed modes.
- Move mode for repositioning the selected box.
- Real-world width/height/area readout in metric or imperial.
- Estimated building count from Overpass before generation.
- Print settings panel (size, base thickness, terrain/building multipliers, water styles, export format, etc.).
- Fetches open data in-browser:
  - OSM buildings + building parts + water from Overpass API.
  - Terrain heights from OpenTopoData (SRTM90m).
- 3D model preview (three.js) and STL export (ASCII or binary).

## Architecture

- `index.html`: shell + UI layout.
- `main.js`: orchestration/state/events and generation flow.
- `style.css`: dark professional panel styling.
- `src/mapViewer.js`: Cesium viewer setup + search/fly-to.
- `src/areaSelection.js`: selection draw/move interactions + metrics.
- `src/settings.js`: all print settings and form rendering.
- `src/dataFetchers.js`: Overpass + terrain API calls.
- `src/osmParser.js`: parse OSM JSON into building/water polygons + height inference.
- `src/meshBuilder.js`: local projection + terrain/base/building/water geometry assembly.
- `src/preview.js`: interactive three.js preview scene.
- `src/stlExporter.js`: STL generation + download.

## Data sources and API notes

1. **OpenStreetMap via Overpass API** (`https://overpass-api.de/api/interpreter`)
   - Used for building footprints, building parts, and water polygons.
   - Public endpoint can time out or rate-limit under heavy use.
2. **OpenTopoData SRTM90m** (`https://api.opentopodata.org/v1/srtm90m`)
   - Used for terrain grid sampling.
   - If unavailable, generation reports a friendly terrain error.
3. **Nominatim Search** (`https://nominatim.openstreetmap.org/search`)
   - Used for place-name search and map centering.

## Height inference logic

For each building/building:part polygon:

1. If OSM `height` exists, parse meters directly.
2. Else if `building:levels` exists, infer `levels * floorHeightM`.
3. Else use configurable fallback (`defaultBuildingHeightM`).

Then scale to printable units with:

- `buildingMultiplier`
- `minBuildingHeightMm`

## STL export path

1. Convert geographic coordinates to a local planar meter space around selection center.
2. Build terrain surface grid and base plate.
3. Extrude building polygons into volumes.
4. Add water layer based on style (flush/recessed/raised).
5. Merge geometries and export through `THREE STLExporter` to binary/ascii STL.

## Running locally

Because the app uses ES modules and external CDNs/APIs, run from an HTTP server (not `file://`).

### Option A (Python)

```bash
python3 -m http.server 8080
```

Open: `http://localhost:8080`

### Option B (Node)

```bash
npx serve .
```

## Practical limits / known limitations

- Browser-only mesh merging is robust for many cases but not a full CAD boolean solver.
- Very large areas may be blocked by a hard area limit for performance.
- Terrain API or Overpass timeouts can occur; the UI reports errors.
- Building clipping at selection boundaries is currently logical/optional in UI but simplified in implementation.
- Merge-touching-buildings toggle is present but currently not a geometric union pass.
- Roads/parks/frame/north arrow/hollow/emboss toggles are exposed for workflow completeness; only core terrain/buildings/water generation is modeled directly in this version.

## Why no backend by default?

The app is fully client-side to keep setup simple and dependency-light. If you need heavier preprocessing, caching, or Overpass proxying, add an optional Node proxy in front of Overpass/OpenTopoData.
