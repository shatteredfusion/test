export function parseOsmFeatures(osmJson, options = {}) {
  const nodes = new Map();
  const ways = new Map();
  const relations = [];
  for (const element of osmJson.elements) {
    if (element.type === "node") nodes.set(element.id, element);
    if (element.type === "way") ways.set(element.id, element);
    if (element.type === "relation") relations.push(element);
  }

  const buildings = [];
  const waters = [];

  for (const way of ways.values()) {
    const tags = way.tags || {};
    const polygon = wayToPolygon(way, nodes);
    if (!polygon) continue;
    if (tags.building || tags["building:part"]) {
      buildings.push({ polygon, heightM: inferBuildingHeight(tags, options), tags });
    }
    if (isWater(tags)) waters.push({ polygon, tags });
  }

  for (const rel of relations) {
    const tags = rel.tags || {};
    if (!(tags.building || tags["building:part"] || isWater(tags))) continue;
    const outers = rel.members.filter((m) => m.type === "way" && m.role === "outer").map((m) => ways.get(m.ref)).filter(Boolean);
    for (const outer of outers) {
      const polygon = wayToPolygon(outer, nodes);
      if (!polygon) continue;
      if (tags.building || tags["building:part"]) {
        buildings.push({ polygon, heightM: inferBuildingHeight(tags, options), tags });
      }
      if (isWater(tags)) waters.push({ polygon, tags });
    }
  }

  return { buildings, waters };
}

function wayToPolygon(way, nodes) {
  if (!way.nodes || way.nodes.length < 4 || way.nodes[0] !== way.nodes.at(-1)) return null;
  const coords = [];
  for (const id of way.nodes) {
    const node = nodes.get(id);
    if (!node) return null;
    coords.push([node.lon, node.lat]);
  }
  return coords;
}

function inferBuildingHeight(tags, options) {
  if (tags.height) {
    const parsed = parseFloat(String(tags.height).replace(/[a-zA-Z]/g, ""));
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  if (tags["building:levels"]) {
    const levels = parseFloat(tags["building:levels"]);
    if (Number.isFinite(levels)) return levels * (options.floorHeightM || 3);
  }
  return options.defaultBuildingHeightM || 12;
}

function isWater(tags) {
  return tags.natural === "water" || Boolean(tags.waterway) || tags.landuse === "reservoir";
}
