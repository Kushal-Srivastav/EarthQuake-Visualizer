const { useEffect, useRef } = React;
import { FEED_URL, useEarthquakes } from '../hooks/useEarthquakes.jsx';
import { magnitudeToColor, computeScales } from '../utils/scales.js';

export default function MapWithQuakes() {
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const legendRef = useRef(null);
  const containerRef = useRef(null);
  const { data, error, loading, retry } = useEarthquakes();

  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map('map', { center: [20, 0], zoom: 2, worldCopyJump: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    const Legend = L.Control.extend({
      options: { position: 'bottomright' },
      onAdd: function () {
        const div = L.DomUtil.create('div', 'leaflet-control leaflet-bar');
        div.style.background = 'white';
        div.style.padding = '0.5rem 0.75rem';
        div.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
        div.style.borderRadius = '0.375rem';
        div.style.lineHeight = '1';
        div.style.fontSize = '0.85rem';
        div.style.minWidth = '180px';
        div.innerHTML = '<div style="font-weight:600;margin-bottom:6px;">Magnitude Legend</div>' +
          '<div id="legend-scale" aria-label="Magnitude color scale"></div>' +
          '<div id="legend-labels" style="display:flex;justify-content:space-between;margin-top:6px;"></div>';
        return div;
      },
    });
    legendRef.current = new Legend();
    legendRef.current.addTo(map);

    const resize = () => {
      const header = document.querySelector('header');
      const headerH = header ? header.offsetHeight : 0;
      const vh = window.innerHeight;
      const targetH = Math.max(300, vh - headerH);
      if (containerRef.current) containerRef.current.style.height = `${targetH}px`;
      map.invalidateSize();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    if (!data || !data.features) return;
    const features = data.features.filter(f => Array.isArray(f.geometry?.coordinates) && f.geometry.coordinates.length >= 2);
    const scales = computeScales(features);

    for (const f of features) {
      const [lon, lat, depth] = f.geometry.coordinates;
      const mag = Number(f.properties?.mag) || 0;
      const norm = scales.toNorm(mag);
      const color = magnitudeToColor(norm);
      const radius = scales.toRadius(mag);
      const when = f.properties?.time ? new Date(f.properties.time) : null;
      const title = f.properties?.place || 'Unknown location';

      const marker = L.circleMarker([lat, lon], {
        radius,
        color,
        weight: 1,
        opacity: 0.9,
        fillColor: color,
        fillOpacity: 0.35,
      });

      const popupHtml = `
        <div style="min-width:220px">
          <div style="font-weight:600;margin-bottom:4px;">${title}</div>
          <div><strong>Magnitude:</strong> ${mag.toFixed(1)}</div>
          <div><strong>Depth:</strong> ${isFinite(depth) ? depth.toFixed(1) + ' km' : 'N/A'}</div>
          <div><strong>Time:</strong> ${when ? when.toLocaleString() : 'N/A'}</div>
          <a href="${f.properties?.url || '#'}" target="_blank" rel="noreferrer" style="color:#2563eb;text-decoration:underline;display:inline-block;margin-top:6px;">USGS Event</a>
        </div>`;

      marker.bindPopup(popupHtml);
      marker.addTo(layer);
    }

    const legendRoot = document.querySelector('#legend-scale');
    const legendLabels = document.querySelector('#legend-labels');
    if (legendRoot && legendLabels) {
      legendRoot.innerHTML = '';
      legendLabels.innerHTML = '';
      const steps = 12;
      const bar = document.createElement('div');
      bar.style.display = 'grid';
      bar.style.gridTemplateColumns = `repeat(${steps}, 1fr)`;
      bar.style.height = '10px';
      bar.style.borderRadius = '999px';
      bar.style.overflow = 'hidden';
      for (let i = 0; i < steps; i++) {
        const norm = i / (steps - 1);
        const seg = document.createElement('div');
        seg.style.background = magnitudeToColor(norm);
        bar.appendChild(seg);
      }
      legendRoot.appendChild(bar);

      const mags = features.map(f => Number(f.properties?.mag) || 0).sort((a,b) => a-b);
      const pick = (p) => mags.length ? mags[Math.min(mags.length - 1, Math.max(0, Math.floor(p * (mags.length - 1))))] : 0;
      const labels = [0, 0.25, 0.5, 0.75, 1].map(p => pick(p));
      labels.forEach((m, idx) => {
        const el = document.createElement('div');
        el.textContent = m.toFixed(1);
        el.style.fontVariantNumeric = 'tabular-nums';
        if (idx === 0) el.style.textAlign = 'left';
        else if (idx === labels.length - 1) el.style.textAlign = 'right';
        else el.style.textAlign = 'center';
        legendLabels.appendChild(el);
      });
    }
  }, [data]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <section className="py-3">
        <p className="text-slate-600 text-sm">Interactive map of recent global earthquakes from the last 24 hours.</p>
      </section>
      <div className="relative rounded-lg overflow-hidden ring-1 ring-slate-200 shadow-sm">
        <div ref={containerRef} id="map" className="w-full" style={{ height: 480 }} aria-label="Earthquake map" />

        {loading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-[60]">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-6 w-6 text-slate-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              <span className="text-sm text-slate-700">Loading recent earthquakes…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-[70]">
            <div className="max-w-sm w-full rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
              <div className="font-semibold mb-1">Failed to load data</div>
              <div className="text-sm mb-3">{error.message || 'An unexpected error occurred.'}</div>
              <div className="flex gap-2">
                <button onClick={retry} className="px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700">Retry</button>
                <a className="px-3 py-1.5 rounded border border-red-300 text-sm hover:bg-white" href={FEED_URL} target="_blank" rel="noreferrer">Open feed</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



