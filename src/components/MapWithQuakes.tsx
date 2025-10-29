import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FEED_URL, useEarthquakes } from '../hooks/useEarthquakes';
import { magnitudeToColor, computeScales } from '../utils/scales';

export default function MapWithQuakes() {
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const legendRef = useRef<L.Control | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
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
      options: { position: 'bottomright' as L.ControlPosition },
      onAdd: function () {
        const div = L.DomUtil.create('div', 'leaflet-control leaflet-bar');
        div.style.background = 'rgba(255, 255, 255, 0.95)';
        div.style.backdropFilter = 'blur(10px)';
        div.style.padding = '1rem';
        div.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.1)';
        div.style.borderRadius = '1rem';
        div.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        div.style.lineHeight = '1.4';
        div.style.fontSize = '0.875rem';
        div.style.minWidth = '200px';
        div.style.fontFamily = 'Inter, system-ui, sans-serif';
        div.innerHTML = '<div style="font-weight:700;margin-bottom:8px;color:#1e293b;font-size:0.9rem;">Magnitude Scale</div>' +
          '<div id="legend-scale" aria-label="Magnitude color scale" style="margin-bottom:8px;"></div>' +
          '<div id="legend-labels" style="display:flex;justify-content:space-between;margin-top:8px;font-size:0.75rem;color:#64748b;font-weight:500;"></div>';
        return div;
      },
    });
    legendRef.current = new Legend();
    legendRef.current.addTo(map);

    const resize = () => {
      const header = document.querySelector('header');
      const headerH = header ? (header as HTMLElement).offsetHeight : 0;
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
    const features = data.features.filter((f: any) => Array.isArray(f.geometry?.coordinates) && f.geometry.coordinates.length >= 2);
    const scales = computeScales(features);

    for (const f of features) {
      const [lon, lat, depth] = f.geometry.coordinates as [number, number, number?];
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
        <div style="min-width:280px;font-family:Inter,system-ui,sans-serif;">
          <div style="display:flex;align-items:center;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">
            <div style="width:8px;height:8px;border-radius:50%;background:${color};margin-right:8px;"></div>
            <div style="font-weight:700;color:#1e293b;font-size:1rem;">${title}</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
            <div style="background:#f8fafc;padding:8px;border-radius:6px;text-align:center;">
              <div style="font-size:0.75rem;color:#64748b;font-weight:500;margin-bottom:2px;">MAGNITUDE</div>
              <div style="font-size:1.25rem;font-weight:700;color:${mag >= 5 ? '#dc2626' : mag >= 3 ? '#d97706' : '#16a34a'};">${mag.toFixed(1)}</div>
            </div>
            <div style="background:#f8fafc;padding:8px;border-radius:6px;text-align:center;">
              <div style="font-size:0.75rem;color:#64748b;font-weight:500;margin-bottom:2px;">DEPTH</div>
              <div style="font-size:1.25rem;font-weight:700;color:#1e293b;">${isFinite(depth as number) ? (depth as number).toFixed(1) + ' km' : 'N/A'}</div>
            </div>
          </div>
          <div style="background:#f1f5f9;padding:8px;border-radius:6px;margin-bottom:12px;">
            <div style="font-size:0.75rem;color:#64748b;font-weight:500;margin-bottom:4px;">TIME</div>
            <div style="font-size:0.875rem;color:#1e293b;font-weight:500;">${when ? when.toLocaleString() : 'N/A'}</div>
          </div>
          <a href="${f.properties?.url || '#'}" target="_blank" rel="noreferrer" style="display:inline-flex;align-items:center;padding:8px 12px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;text-decoration:none;border-radius:6px;font-size:0.875rem;font-weight:500;transition:all 0.2s;">
            <svg style="width:14px;height:14px;margin-right:6px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
            View on USGS
          </a>
        </div>`;

      marker.bindPopup(popupHtml);
      marker.addTo(layer);
    }

    const legendRoot = document.querySelector('#legend-scale');
    const legendLabels = document.querySelector('#legend-labels');
    if (legendRoot && legendLabels) {
      (legendRoot as HTMLElement).innerHTML = '';
      (legendLabels as HTMLElement).innerHTML = '';
      const steps = 12;
      const bar = document.createElement('div');
      bar.style.display = 'grid';
      bar.style.gridTemplateColumns = `repeat(${steps}, 1fr)`;
      bar.style.height = '12px';
      bar.style.borderRadius = '999px';
      bar.style.overflow = 'hidden';
      bar.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.1)';
      bar.style.border = '1px solid rgba(0,0,0,0.1)';
      for (let i = 0; i < steps; i++) {
        const norm = i / (steps - 1);
        const seg = document.createElement('div');
        seg.style.background = magnitudeToColor(norm);
        bar.appendChild(seg);
      }
      legendRoot.appendChild(bar);

      const mags = features.map((f: any) => Number(f.properties?.mag) || 0).sort((a: number, b: number) => a - b);
      const pick = (p: number) => mags.length ? mags[Math.min(mags.length - 1, Math.max(0, Math.floor(p * (mags.length - 1))))] : 0;
      const labels = [0, 0.25, 0.5, 0.75, 1].map(p => pick(p));
      labels.forEach((m, idx) => {
        const el = document.createElement('div');
        el.textContent = m.toFixed(1);
        (el.style as any).fontVariantNumeric = 'tabular-nums';
        if (idx === 0) el.style.textAlign = 'left';
        else if (idx === labels.length - 1) el.style.textAlign = 'right';
        else el.style.textAlign = 'center';
        legendLabels.appendChild(el);
      });
    }
  }, [data]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-white/10 backdrop-blur-sm">
        <div ref={containerRef} id="map" className="w-full" style={{ height: 600 }} aria-label="Earthquake map" />

        {loading && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-blue-50/90 backdrop-blur-sm flex items-center justify-center z-[60]">
            <div className="flex flex-col items-center gap-4 animate-fade-in-up">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg animate-pulse-slow">
                  <svg className="w-8 h-8 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur opacity-30 animate-pulse"></div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-800 mb-1">Loading Earthquake Data</h3>
                <p className="text-sm text-slate-600">Fetching real-time seismic activity...</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-red-50/95 backdrop-blur-sm flex items-center justify-center z-[70]">
            <div className="max-w-md w-full mx-4 animate-fade-in-up">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-red-200/50">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-xl gradient-danger flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">Failed to Load Data</h3>
                    <p className="text-sm text-red-600">Unable to fetch earthquake information</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-6">{error.message || 'An unexpected error occurred while loading earthquake data.'}</p>
                <div className="flex gap-3">
                  <button 
                    onClick={retry} 
                    className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Try Again
                  </button>
                  <a 
                    className="px-4 py-2.5 rounded-lg border border-red-300 text-red-700 text-sm font-medium hover:bg-red-50 transition-all duration-200" 
                    href={FEED_URL} 
                    target="_blank" 
                    rel="noreferrer"
                  >
                    View Source
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



