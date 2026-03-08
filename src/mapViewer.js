export async function createMap(containerId) {
  const viewer = new Cesium.Viewer(containerId, {
    timeline: false,
    animation: false,
    baseLayerPicker: true,
    geocoder: false,
    sceneModePicker: true,
    infoBox: false,
    selectionIndicator: false,
    terrainProvider: new Cesium.EllipsoidTerrainProvider(),
  });

  try {
    viewer.terrainProvider = await Cesium.createWorldTerrainAsync();
  } catch {
    // fallback if Cesium terrain needs token
  }

  viewer.scene.globe.depthTestAgainstTerrain = true;
  viewer.camera.flyHome(0);
  return viewer;
}

export async function searchPlace(query) {
  const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
  const response = await fetch(endpoint, { headers: { "Accept-Language": "en" } });
  if (!response.ok) throw new Error("Place search failed.");
  const results = await response.json();
  if (!results.length) throw new Error("No location found.");
  const item = results[0];
  return {
    lat: Number(item.lat),
    lon: Number(item.lon),
    displayName: item.display_name,
    bbox: item.boundingbox?.map(Number),
  };
}

export function flyToLocation(viewer, { lon, lat }) {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(lon, lat, 5000),
    duration: 1.5,
  });
}
