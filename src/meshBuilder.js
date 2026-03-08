import * as THREE from "https://unpkg.com/three@0.160.1/build/three.module.js";
import { BufferGeometryUtils } from "https://unpkg.com/three@0.160.1/examples/jsm/utils/BufferGeometryUtils.js";

const M_PER_DEG = 111320;

export function buildPrintableMesh({ selection, terrain, features, settings }) {
  const group = [];
  const center = {
    lon: (selection.west + selection.east) / 2,
    lat: (selection.south + selection.north) / 2,
  };

  const scaleX = settings.modelWidthMm / geoWidthMeters(selection);
  const scaleY = settings.modelDepthMm / geoHeightMeters(selection);

  const terrainGeom = settings.includeTerrain
    ? buildTerrainSolid(selection, terrain, settings, center, scaleX, scaleY)
    : new THREE.BoxGeometry(settings.modelWidthMm, settings.baseThicknessMm, settings.modelDepthMm);
  terrainGeom.translate(0, settings.baseThicknessMm / 2, 0);
  group.push(terrainGeom);

  if (settings.includeBuildings) {
    for (const building of features.buildings) {
      const geom = polygonPrism(building.polygon, center, scaleX, scaleY, settings.baseThicknessMm, Math.max(settings.minBuildingHeightMm, metersToMm(building.heightM) * settings.buildingMultiplier));
      if (geom) group.push(geom);
    }
  }

  if (settings.includeWater) {
    for (const water of features.waters) {
      const waterOffset = settings.waterStyle === "recessed" ? -settings.waterDepthMm : settings.waterStyle === "raised" ? settings.waterDepthMm : 0;
      const geom = polygonPrism(water.polygon, center, scaleX, scaleY, settings.baseThicknessMm + waterOffset, 0.4);
      if (geom) group.push(geom);
    }
  }

  const merged = BufferGeometryUtils.mergeGeometries(group, false);
  merged.computeVertexNormals();
  return merged;
}

function buildTerrainSolid(selection, terrain, settings, center, scaleX, scaleY) {
  const { rows, cols, heights } = terrain;
  const positions = [];
  const indices = [];
  const minH = Math.min(...heights);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const lon = selection.west + (selection.east - selection.west) * (x / (cols - 1));
      const lat = selection.south + (selection.north - selection.south) * (y / (rows - 1));
      const [lx, lz] = lonLatToLocal(lon, lat, center);
      const topMm = settings.baseThicknessMm + (metersToMm(heights[y * cols + x] - minH) * settings.terrainMultiplier);
      positions.push(lx * scaleX, topMm, lz * scaleY);
    }
  }

  for (let y = 0; y < rows - 1; y++) {
    for (let x = 0; x < cols - 1; x++) {
      const a = y * cols + x;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geom.setIndex(indices);

  const side = new THREE.BoxGeometry(settings.modelWidthMm, settings.baseThicknessMm, settings.modelDepthMm);
  side.translate(0, settings.baseThicknessMm / 2, 0);

  return BufferGeometryUtils.mergeGeometries([geom, side], false);
}

function polygonPrism(polygon, center, scaleX, scaleY, bottomMm, heightMm) {
  if (!polygon?.length) return null;
  const shape = new THREE.Shape();
  polygon.forEach(([lon, lat], i) => {
    const [x, z] = lonLatToLocal(lon, lat, center);
    if (i === 0) shape.moveTo(x * scaleX, z * scaleY);
    else shape.lineTo(x * scaleX, z * scaleY);
  });
  const extrude = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.2, heightMm), bevelEnabled: false, steps: 1 });
  extrude.rotateX(-Math.PI / 2);
  extrude.translate(0, bottomMm + Math.max(0.2, heightMm), 0);
  return extrude;
}

function lonLatToLocal(lon, lat, center) {
  const x = (lon - center.lon) * M_PER_DEG * Math.cos((center.lat * Math.PI) / 180);
  const z = (lat - center.lat) * M_PER_DEG;
  return [x, z];
}

function geoWidthMeters(s) { return Math.abs(s.east - s.west) * M_PER_DEG * Math.cos(((s.north + s.south) / 2) * Math.PI / 180); }
function geoHeightMeters(s) { return Math.abs(s.north - s.south) * M_PER_DEG; }
function metersToMm(m) { return m * 1000; }
