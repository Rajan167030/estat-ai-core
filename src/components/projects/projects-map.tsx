import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "@tanstack/react-router";
import type { Project } from "@/lib/mock/data";
import { inr, num } from "@/lib/format";

/** City-centre coordinates for every city used in the mock dataset (see src/lib/mock/data.ts CITIES). */
const CITY_COORDS: Record<string, [number, number]> = {
  Bengaluru: [12.9716, 77.5946],
  Pune: [18.5204, 73.8567],
  Hyderabad: [17.385, 78.4867],
  Mumbai: [19.076, 72.8777],
  Chennai: [13.0827, 80.2707],
  Ahmedabad: [23.0225, 72.5714],
  Noida: [28.5355, 77.391],
  Kochi: [9.9312, 76.2673],
};

const STATUS_COLOR: Record<Project["status"], string> = {
  Delivered: "#16a34a",
  "Pre-launch": "#2563eb",
  "Under Construction": "#d97706",
  "Nearing Possession": "#0d9488",
};

function markerIcon(status: Project["status"]) {
  const color = STATUS_COLOR[status];
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.2)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -8],
  });
}

/** Deterministic small offset so multiple projects in the same city don't stack exactly on top of each other. */
function jitter([lat, lng]: [number, number], seed: number): [number, number] {
  const a = Math.sin(seed * 12.9898) * 43758.5453;
  const b = Math.sin(seed * 78.233) * 12345.6789;
  const dx = (a - Math.floor(a) - 0.5) * 0.09;
  const dy = (b - Math.floor(b) - 0.5) * 0.09;
  return [lat + dx, lng + dy];
}

export function ProjectsMap({ projects }: { projects: Project[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border" style={{ height: 360 }}>
      <MapContainer
        center={[21.5, 79]}
        zoom={5}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {projects.map((p, i) => {
          const base = CITY_COORDS[p.city];
          if (!base) return null;
          return (
            <Marker key={p.id} position={jitter(base, i + 1)} icon={markerIcon(p.status)}>
              <Popup>
                <div className="min-w-[160px]">
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: p.id }}
                    className="text-sm font-semibold hover:underline"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {p.locality}, {p.city}
                  </p>
                  <p className="mt-1 text-xs">
                    {num(p.available)} available · {inr(p.revenue)} revenue
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
