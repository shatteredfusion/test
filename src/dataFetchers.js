const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

export async function fetchOsmData(selection) {
  const bbox = `${selection.south},${selection.west},${selection.north},${selection.east}`;
  const query = `
[out:json][timeout:60];
(
  way["building"](${bbox});
  relation["building"](${bbox});
  way["building:part"](${bbox});
  relation["building:part"](${bbox});
  way["natural"="water"](${bbox});
  relation["natural"="water"](${bbox});
  way["waterway"](${bbox});
);
out body;
>;
out skel qt;
`;

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    body: query,
    headers: { "Content-Type": "text/plain" },
  });
  if (!response.ok) {
    throw new Error(`Overpass error (${response.status}).`);
  }
  return response.json();
}

export async function estimateBuildingCount(selection) {
  const bbox = `${selection.south},${selection.west},${selection.north},${selection.east}`;
  const query = `[out:json][timeout:25];(way["building"](${bbox});relation["building"](${bbox}););out count;`;
  const response = await fetch(OVERPASS_URL, { method: "POST", body: query, headers: { "Content-Type": "text/plain" } });
  if (!response.ok) throw new Error("Building estimate unavailable.");
  const json = await response.json();
  const countObj = json.elements.find((e) => e.type === "count");
  return Number(countObj?.tags?.ways || 0) + Number(countObj?.tags?.relations || 0);
}

export async function sampleTerrainGrid(selection, resolution = 36) {
  const rows = resolution;
  const cols = resolution;
  const points = [];
  for (let y = 0; y < rows; y++) {
    const lat = selection.south + (selection.north - selection.south) * (y / (rows - 1));
    for (let x = 0; x < cols; x++) {
      const lon = selection.west + (selection.east - selection.west) * (x / (cols - 1));
      points.push({ latitude: lat, longitude: lon });
    }
  }
  const chunks = [];
  for (let i = 0; i < points.length; i += 100) {
    chunks.push(points.slice(i, i + 100));
  }

  const heights = [];
  for (const chunk of chunks) {
    const locations = chunk.map((p) => `${p.latitude},${p.longitude}`).join("|");
    const url = `https://api.opentopodata.org/v1/srtm90m?locations=${locations}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Terrain unavailable.");
    const json = await response.json();
    for (const res of json.results) heights.push(res.elevation ?? 0);
  }

  return { rows, cols, heights };
}
