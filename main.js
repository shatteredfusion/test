import { createMap, flyToLocation, searchPlace } from "./src/mapViewer.js";
import { setupAreaSelection, measureSelection } from "./src/areaSelection.js";
import { defaultSettings, buildSettingsUI } from "./src/settings.js";
import { estimateBuildingCount, fetchOsmData, sampleTerrainGrid } from "./src/dataFetchers.js";
import { parseOsmFeatures } from "./src/osmParser.js";
import { buildPrintableMesh } from "./src/meshBuilder.js";
import { createPreview } from "./src/preview.js";
import { exportGeometryToStl, triggerDownload } from "./src/stlExporter.js";

const appState = {
  settings: { ...defaultSettings },
  selection: null,
  geometry: null,
  placeName: "",
};

const viewer = await createMap("map");
const preview = createPreview(document.getElementById("preview-canvas"));

const ui = {
  searchInput: document.getElementById("search-input"),
  searchBtn: document.getElementById("search-btn"),
  selectAreaBtn: document.getElementById("select-area-btn"),
  moveAreaBtn: document.getElementById("move-area-btn"),
  selectionShape: document.getElementById("selection-shape"),
  customRatioW: document.getElementById("custom-ratio-w"),
  customRatioH: document.getElementById("custom-ratio-h"),
  selectionMetrics: document.getElementById("selection-metrics"),
  buildingEstimate: document.getElementById("building-estimate"),
  generateBtn: document.getElementById("generate-btn"),
  regenerateBtn: document.getElementById("regenerate-btn"),
  exportBtn: document.getElementById("export-btn"),
  settingsGrid: document.getElementById("settings-grid"),
  status: document.getElementById("status"),
  warning: document.getElementById("warning"),
  previewInfo: document.getElementById("preview-info"),
};

buildSettingsUI(ui.settingsGrid, appState.settings, () => {
  ui.warning.textContent = "Settings changed. Click Regenerate to apply without redrawing.";
});

const selector = setupAreaSelection(viewer, {
  getShape: () => {
    const value = ui.selectionShape.value;
    return value === "square" || value.startsWith("bed") ? "custom" : value;
  },
  getRatio: () => {
    const shape = ui.selectionShape.value;
    if (shape === "square") return { w: 1, h: 1 };
    if (shape === "bed180") return { w: 180, h: 180 };
    if (shape === "bed220") return { w: 220, h: 220 };
    if (shape === "bed256") return { w: 256, h: 256 };
    return { w: Number(ui.customRatioW.value) || 1, h: Number(ui.customRatioH.value) || 1 };
  },
  onSelection: debounce(async (selection) => {
    appState.selection = selection;
    updateSelectionMetrics();
    if (tooLarge(selection)) {
      ui.warning.textContent = "Selection too large for responsive in-browser generation. Please reduce extent.";
      return;
    }
    try {
      const count = await estimateBuildingCount(selection);
      ui.buildingEstimate.textContent = `Estimated buildings: ${count}`;
    } catch {
      ui.buildingEstimate.textContent = "Estimated buildings: unavailable";
    }
  }, 500),
});

ui.selectAreaBtn.addEventListener("click", () => selector.setMode("draw"));
ui.moveAreaBtn.addEventListener("click", () => selector.setMode("move"));

ui.searchBtn.addEventListener("click", async () => {
  if (!ui.searchInput.value.trim()) return;
  try {
    setStatus("Searching place...");
    const location = await searchPlace(ui.searchInput.value.trim());
    appState.placeName = location.displayName;
    flyToLocation(viewer, location);
    setStatus(`Centered on ${location.displayName}`);
  } catch (error) {
    setStatus(error.message, true);
  }
});

ui.generateBtn.addEventListener("click", () => generateModel());
ui.regenerateBtn.addEventListener("click", () => generateModel());
ui.exportBtn.addEventListener("click", () => {
  if (!appState.geometry) return;
  try {
    const binary = appState.settings.exportFormat === "binary";
    const stl = exportGeometryToStl(appState.geometry, appState.settings.exportFormat);
    triggerDownload(stl, `geoprint-${Date.now()}.stl`, binary);
    setStatus("STL exported.");
  } catch (error) {
    setStatus(`Export failure: ${error.message}`, true);
  }
});

async function generateModel() {
  if (!appState.selection) {
    setStatus("Please draw a selection first.", true);
    return;
  }
  if (tooLarge(appState.selection)) {
    setStatus("Area too large. Zoom in and draw a smaller area.", true);
    return;
  }

  try {
    ui.warning.textContent = "";
    setStatus("Fetching OSM features...");
    const osm = await fetchOsmData(appState.selection);
    const features = parseOsmFeatures(osm, appState.settings);
    if (!features.buildings.length) ui.warning.textContent = "No buildings found in selection.";

    setStatus("Sampling terrain...");
    const resolution = appState.settings.simplifyLevel === "high" ? 24 : appState.settings.simplifyLevel === "low" ? 56 : 36;
    const terrain = appState.settings.includeTerrain
      ? await sampleTerrainGrid(appState.selection, resolution)
      : { rows: 2, cols: 2, heights: [0, 0, 0, 0] };

    setStatus("Building watertight-ish mesh...");
    const geometry = buildPrintableMesh({
      selection: appState.selection,
      terrain,
      features,
      settings: appState.settings,
    });

    appState.geometry = geometry;
    preview.setGeometry(geometry);
    ui.exportBtn.disabled = false;
    const triCount = geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
    ui.previewInfo.textContent = `Triangles: ${Math.round(triCount).toLocaleString()} | Buildings: ${features.buildings.length} | Water polygons: ${features.waters.length}`;
    setStatus("Model ready.");
  } catch (error) {
    setStatus(error.message || "Generation failed.", true);
  }
}

function updateSelectionMetrics() {
  const metrics = measureSelection(appState.selection);
  if (!metrics) return;
  const convert = appState.settings.unitsDisplay === "imperial"
    ? {
        width: `${(metrics.widthM * 3.28084).toFixed(1)} ft`,
        height: `${(metrics.heightM * 3.28084).toFixed(1)} ft`,
        area: `${(metrics.areaM2 * 10.7639).toFixed(0)} ft²`,
      }
    : {
        width: `${metrics.widthM.toFixed(1)} m`,
        height: `${metrics.heightM.toFixed(1)} m`,
        area: `${metrics.areaM2.toFixed(0)} m²`,
      };
  ui.selectionMetrics.textContent = `Width: ${convert.width} | Height: ${convert.height} | Area: ${convert.area}`;
}

function tooLarge(selection) {
  const m = measureSelection(selection);
  return (m.widthM * m.heightM) > 30_000_000;
}

function debounce(fn, delay) {
  let timer = 0;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function setStatus(msg, isError = false) {
  ui.status.textContent = msg;
  ui.status.style.color = isError ? "#ff7f7f" : "#8fd8a0";
}
