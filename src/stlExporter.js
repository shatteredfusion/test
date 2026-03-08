import { STLExporter } from "https://unpkg.com/three@0.160.1/examples/jsm/exporters/STLExporter.js";
import * as THREE from "https://unpkg.com/three@0.160.1/build/three.module.js";

export function exportGeometryToStl(geometry, format = "binary") {
  const exporter = new STLExporter();
  const mesh = new THREE.Mesh(geometry);
  const stl = exporter.parse(mesh, { binary: format === "binary" });
  return stl;
}

export function triggerDownload(stlData, filename, binary = true) {
  const blob = binary
    ? new Blob([stlData], { type: "model/stl" })
    : new Blob([stlData], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
