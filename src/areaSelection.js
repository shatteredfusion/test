const EARTH_M_PER_DEG = 111320;

export function setupAreaSelection(viewer, options) {
  const state = {
    mode: "idle",
    start: null,
    end: null,
    rectangleEntity: null,
    selection: null,
  };

  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

  function cartesianToLonLat(pos) {
    const ray = viewer.camera.getPickRay(pos);
    const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
    if (!cartesian) return null;
    const c = Cesium.Cartographic.fromCartesian(cartesian);
    return { lon: Cesium.Math.toDegrees(c.longitude), lat: Cesium.Math.toDegrees(c.latitude) };
  }

  function applyShapeConstraint(start, rawEnd) {
    const shape = options.getShape();
    if (shape === "rectangle") return rawEnd;
    const ratio = options.getRatio();
    const dLon = rawEnd.lon - start.lon;
    const dLat = rawEnd.lat - start.lat;
    const signLon = Math.sign(dLon) || 1;
    const signLat = Math.sign(dLat) || 1;
    const lonMeters = Math.abs(dLon) * EARTH_M_PER_DEG * Math.cos(Cesium.Math.toRadians(start.lat));
    const latMeters = Math.abs(dLat) * EARTH_M_PER_DEG;
    const targetLatMeters = lonMeters * (ratio.h / ratio.w);
    const targetLonMeters = latMeters * (ratio.w / ratio.h);
    const useLatFromLon = latMeters < targetLatMeters;
    const adjustedLatMeters = useLatFromLon ? targetLatMeters : latMeters;
    const adjustedLonMeters = useLatFromLon ? lonMeters : targetLonMeters;
    return {
      lon: start.lon + signLon * adjustedLonMeters / (EARTH_M_PER_DEG * Math.cos(Cesium.Math.toRadians(start.lat))),
      lat: start.lat + signLat * adjustedLatMeters / EARTH_M_PER_DEG,
    };
  }

  function updateRectangle() {
    if (!state.start || !state.end) return;
    const west = Math.min(state.start.lon, state.end.lon);
    const east = Math.max(state.start.lon, state.end.lon);
    const south = Math.min(state.start.lat, state.end.lat);
    const north = Math.max(state.start.lat, state.end.lat);
    const rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);
    if (!state.rectangleEntity) {
      state.rectangleEntity = viewer.entities.add({
        rectangle: {
          coordinates: rectangle,
          material: Cesium.Color.fromCssColorString("#3ea6ff").withAlpha(0.2),
          outline: true,
          outlineColor: Cesium.Color.WHITE,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });
    } else {
      state.rectangleEntity.rectangle.coordinates = rectangle;
    }
    state.selection = { west, south, east, north };
    options.onSelection(state.selection);
  }

  handler.setInputAction((click) => {
    if (state.mode !== "draw") return;
    const point = cartesianToLonLat(click.position);
    if (!point) return;
    state.start = point;
    state.end = point;
    updateRectangle();
  }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

  handler.setInputAction((movement) => {
    if (!state.start) return;
    const point = cartesianToLonLat(movement.endPosition);
    if (!point) return;
    if (state.mode === "draw") {
      state.end = applyShapeConstraint(state.start, point);
      updateRectangle();
    } else if (state.mode === "move" && state.selection) {
      const deltaLon = point.lon - state.start.lon;
      const deltaLat = point.lat - state.start.lat;
      state.start = point;
      state.selection = {
        west: state.selection.west + deltaLon,
        east: state.selection.east + deltaLon,
        south: state.selection.south + deltaLat,
        north: state.selection.north + deltaLat,
      };
      state.end = { lon: state.selection.east, lat: state.selection.north };
      state.start = { lon: state.selection.west, lat: state.selection.south };
      updateRectangle();
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  handler.setInputAction(() => {
    state.start = null;
  }, Cesium.ScreenSpaceEventType.LEFT_UP);

  return {
    setMode(mode) { state.mode = mode; },
    getSelection() { return state.selection; },
  };
}

export function measureSelection(selection) {
  if (!selection) return null;
  const centerLat = (selection.north + selection.south) / 2;
  const widthM = Math.abs(selection.east - selection.west) * EARTH_M_PER_DEG * Math.cos(Cesium.Math.toRadians(centerLat));
  const heightM = Math.abs(selection.north - selection.south) * EARTH_M_PER_DEG;
  return { widthM, heightM, areaM2: widthM * heightM };
}
