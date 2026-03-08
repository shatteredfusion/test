export const defaultSettings = {
  modelWidthMm: 180,
  modelDepthMm: 180,
  baseThicknessMm: 2,
  minBuildingHeightMm: 1,
  terrainMultiplier: 1.5,
  buildingMultiplier: 1,
  defaultBuildingHeightM: 12,
  floorHeightM: 3,
  includeTerrain: true,
  includeBuildings: true,
  includeWater: true,
  waterStyle: "flush",
  waterDepthMm: 1,
  clipBuildings: true,
  mergeTouchingBuildings: false,
  simplifyLevel: "medium",
  hollowModel: false,
  embossText: "none",
  exportFormat: "binary",
  unitsDisplay: "metric",
  northArrow: false,
  borderFrame: false,
  roadEngraving: false,
  greenRelief: false,
};

export function buildSettingsUI(container, state, onChange) {
  const controls = [
    ["Print size", [
      input("modelWidthMm", "Model width (mm)", "number", { min: 40, max: 300, step: 1 }),
      input("modelDepthMm", "Model depth (mm)", "number", { min: 40, max: 300, step: 1 }),
      input("baseThicknessMm", "Base thickness (mm)", "number", { min: 0.8, max: 20, step: 0.1 }),
    ]],
    ["Heights", [
      input("minBuildingHeightMm", "Min building height (mm)", "number", { min: 0.2, max: 10, step: 0.1 }),
      input("terrainMultiplier", "Terrain exaggeration", "number", { min: 0, max: 10, step: 0.1 }),
      input("buildingMultiplier", "Building exaggeration", "number", { min: 0, max: 10, step: 0.1 }),
      input("defaultBuildingHeightM", "Default building height fallback (m)", "number", { min: 2, max: 200, step: 1 }),
      input("floorHeightM", "Floor height inference (m)", "number", { min: 2, max: 6, step: 0.1 }),
    ]],
    ["Feature toggles", [
      input("includeTerrain", "Include terrain", "checkbox"),
      input("includeBuildings", "Include buildings", "checkbox"),
      input("includeWater", "Include water", "checkbox"),
      input("clipBuildings", "Clip buildings at boundary", "checkbox"),
      input("mergeTouchingBuildings", "Merge touching buildings", "checkbox"),
      input("hollowModel", "Hollow model", "checkbox"),
      input("northArrow", "North arrow", "checkbox"),
      input("borderFrame", "Frame/border", "checkbox"),
      input("roadEngraving", "Road engraving", "checkbox"),
      input("greenRelief", "Park low-relief", "checkbox"),
    ]],
    ["Water + export", [
      input("waterStyle", "Water style", "select", { options: ["flush", "recessed", "raised"] }),
      input("waterDepthMm", "Water depth/height (mm)", "number", { min: 0, max: 10, step: 0.1 }),
      input("simplifyLevel", "Simplify geometry", "select", { options: ["low", "medium", "high"] }),
      input("embossText", "Underside emboss", "select", { options: ["none", "place", "coordinates", "scale"] }),
      input("exportFormat", "Export format", "select", { options: ["binary", "ascii"] }),
      input("unitsDisplay", "Units display", "select", { options: ["metric", "imperial"] }),
    ]],
  ];

  container.innerHTML = "";
  for (const [title, items] of controls) {
    const block = document.createElement("div");
    block.className = "setting-block";
    block.innerHTML = `<h3>${title}</h3>`;
    for (const item of items) {
      const label = document.createElement("label");
      label.textContent = item.label;
      const el = document.createElement("select" === item.type ? "select" : "input");
      if (item.type === "checkbox") {
        el.type = "checkbox";
        el.checked = state[item.key];
      } else if (item.type === "select") {
        for (const option of item.options) {
          const o = document.createElement("option");
          o.value = option;
          o.textContent = option;
          if (state[item.key] === option) o.selected = true;
          el.appendChild(o);
        }
      } else {
        el.type = item.type;
        Object.assign(el, item.attrs);
        el.value = state[item.key];
      }
      el.addEventListener("change", () => {
        state[item.key] = item.type === "checkbox" ? el.checked : (item.type === "number" ? Number(el.value) : el.value);
        onChange(item.key, state[item.key]);
      });
      label.appendChild(el);
      block.appendChild(label);
    }
    container.appendChild(block);
  }
}

function input(key, label, type, attrs = {}) {
  return { key, label, type, attrs, options: attrs.options || [] };
}
