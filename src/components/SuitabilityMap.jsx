/**
 * SuitabilityMap.jsx
 * Specialized scrollytelling map for the mangrove suitability article.
 * Renders polygon fills colored by suitability class instead of hotspot circles.
 */

import { useEffect, useRef, useState } from 'react';

const BASEMAP = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const CLASS_COLORS = {
  'Class 1 — Highly suitable':    '#3ab06e',
  'Class 2 — Suitable':           '#7ec850',
  'Class 3 — Marginally suitable':'#f4a023',
  'Class 4 — Not suitable':       '#e05c28',
};

const LEGEND = [
  { label: 'Class 1 — Highly suitable',    color: '#3ab06e' },
  { label: 'Class 2 — Suitable',           color: '#7ec850' },
  { label: 'Class 3 — Marginally suitable',color: '#f4a023' },
  { label: 'Class 4 — Not suitable',       color: '#e05c28' },
];

export default function SuitabilityMap({ steps = [], dataUrl = '/data/kuala_selat_suitability.geojson' }) {
  const mapContainer = useRef(null);
  const mapRef       = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  const [mapReady,   setMapReady]   = useState(false);
  const [hovered,    setHovered]    = useState(null);

  const DEFAULT_CENTER = [103.35, -0.50];
  const DEFAULT_ZOOM   = 12;

  /* ── Init map ──────────────────────────────────────────────── */
  useEffect(() => {
    let map;
    async function initMap() {
      const maplibregl = (await import('maplibre-gl')).default;

      map = new maplibregl.Map({
        container: mapContainer.current,
        style:     BASEMAP,
        center:    DEFAULT_CENTER,
        zoom:      DEFAULT_ZOOM,
        minZoom:   9,
        maxZoom:   16,
        attributionControl: { compact: true },
      });
      mapRef.current = map;

      map.on('load', async () => {
        const res  = await fetch(dataUrl);
        const data = await res.json();
        map.addSource('suitability', { type: 'geojson', data });

        // Fill polygons by dominant class
        map.addLayer({
          id: 'suit-fill', type: 'fill', source: 'suitability',
          paint: {
            'fill-color': [
              'match', ['get', 'dominant_class'],
              'Class 1 — Highly suitable',     '#3ab06e',
              'Class 2 — Suitable',            '#7ec850',
              'Class 3 — Marginally suitable', '#f4a023',
              'Class 4 — Not suitable',        '#e05c28',
              '#2a3e30',
            ],
            'fill-opacity': 0.72,
          }
        });

        // Outline
        map.addLayer({
          id: 'suit-outline', type: 'line', source: 'suitability',
          paint: {
            'line-color': 'rgba(255,255,255,0.25)',
            'line-width': 0.8,
          }
        });

        // Highlight on hover
        map.addLayer({
          id: 'suit-hover', type: 'fill', source: 'suitability',
          paint: {
            'fill-color': '#ffffff',
            'fill-opacity': ['case',
              ['boolean', ['feature-state', 'hovered'], false], 0.15, 0
            ],
          }
        });

        // Double-bounce highlight (Class 4 indicator)
        map.addLayer({
          id: 'suit-double-bounce', type: 'line', source: 'suitability',
          filter: ['==', ['get', 'double_bounce'], true],
          paint: {
            'line-color': '#e05c28',
            'line-width': 2.5,
            'line-dasharray': [2, 1],
          }
        });

        // Popup on click
        const popup = new maplibregl.Popup({ closeButton: false, offset: 6 });
        let hoveredId = null;

        map.on('mousemove', 'suit-fill', (e) => {
          if (e.features.length === 0) return;
          map.getCanvas().style.cursor = 'pointer';
          if (hoveredId !== null) {
            map.setFeatureState({ source: 'suitability', id: hoveredId }, { hovered: false });
          }
          hoveredId = e.features[0].id;
          map.setFeatureState({ source: 'suitability', id: hoveredId }, { hovered: true });

          const p = e.features[0].properties;
          const cls = p.dominant_class.split('—')[1]?.trim() || p.dominant_class;
          const clsColor = CLASS_COLORS[p.dominant_class] || '#8a9e8f';

          popup.setLngLat(e.lngLat).setHTML(`
            <strong style="color:#f0ece0">Polygon #${p.polygon_id}</strong><br/>
            <span style="color:#8a9e8f">Area:</span> <b>${p.area_ha} ha</b><br/>
            <span style="color:#8a9e8f">Dominant class:</span>
            <b style="color:${clsColor}">${cls}</b>
            <span style="color:#8a9e8f">(${p.dominant_pct}%)</span><br/>
            <span style="color:#8a9e8f">ΔVH:</span>
            <b style="color:${p.delta_vh > 3 ? '#e05c28' : '#8a9e8f'}">${p.delta_vh} dB</b>
            ${p.double_bounce ? '<br/><span style="color:#e05c28;font-size:0.8em">⚠ Double-bounce detected</span>' : ''}
          `).addTo(map);
        });

        map.on('mouseleave', 'suit-fill', () => {
          map.getCanvas().style.cursor = '';
          if (hoveredId !== null) {
            map.setFeatureState({ source: 'suitability', id: hoveredId }, { hovered: false });
          }
          hoveredId = null;
          popup.remove();
        });

        setMapReady(true);
      });
    }

    initMap();
    return () => map?.remove();
  }, [dataUrl]);

  /* ── Scrollama ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!mapReady) return;
    let scroller;
    async function initScrollama() {
      const scrollama = (await import('scrollama')).default;
      scroller = scrollama();
      scroller
        .setup({ step: '.suit-scroll-step', offset: 0.5 })
        .onStepEnter(({ index }) => {
          setActiveStep(index);
          const step = steps[index];
          if (!step || !mapRef.current) return;

          // Toggle layer visibility based on step
          const map = mapRef.current;
          if (step.showDoubleBouce === false && map.getLayer('suit-double-bounce')) {
            map.setLayoutProperty('suit-double-bounce', 'visibility', 'none');
          } else if (map.getLayer('suit-double-bounce')) {
            map.setLayoutProperty('suit-double-bounce', 'visibility', 'visible');
          }

          // Filter to specific class if step.filterClass is set
          if (step.filterClass && map.getLayer('suit-fill')) {
            map.setPaintProperty('suit-fill', 'fill-opacity', [
              'case',
              ['==', ['get', 'dominant_class'], step.filterClass], 0.85,
              0.18
            ]);
          } else if (map.getLayer('suit-fill')) {
            map.setPaintProperty('suit-fill', 'fill-opacity', 0.72);
          }

          map.flyTo({
            center:   step.center || DEFAULT_CENTER,
            zoom:     step.zoom   || DEFAULT_ZOOM,
            duration: 1600,
            easing:   t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t,
          });
        });
      window.addEventListener('resize', scroller.resize);
    }
    initScrollama();
    return () => scroller?.destroy();
  }, [mapReady, steps]);

  const currentStep = steps[activeStep];

  return (
    <div className="scrolly-outer">
      {/* Sticky map */}
      <div className="map-sticky-wrapper">
        <div ref={mapContainer} className="map-canvas" />

        {/* Step badge */}
        {currentStep?.badge && (
          <div className="map-badge">{currentStep.badge}</div>
        )}

        {/* Suitability legend */}
        <div className="map-legend">
          <div className="legend-title">Suitability class</div>
          {LEGEND.map(item => (
            <div key={item.label} className="legend-row">
              <span className="legend-swatch" style={{ background: item.color }} />
              <span className="legend-text">{item.label.split('—')[0].trim()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll steps */}
      <div className="scroll-steps-col suit-steps">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={`scroll-step suit-scroll-step${i === activeStep ? ' is-active' : ''}`}
            data-step={i}
          >
            <div className="step-inner">
              {step.badge && <div className="step-year">{step.badge}</div>}
              <h3 className="step-title">{step.title}</h3>
              <p className="step-text">{step.text}</p>
              {step.stat && (
                <div className="step-stat">
                  <span className="stat-num">{step.stat.value}</span>
                  <span className="stat-label">{step.stat.label}</span>
                </div>
              )}
              {step.formula && (
                <div className="step-formula">{step.formula}</div>
              )}
            </div>
          </div>
        ))}
        <div style={{ height: '40vh' }} />
      </div>

      <style>{`
        .scrolly-outer {
          position: relative;
          display: flex;
          align-items: flex-start;
        }
        .map-sticky-wrapper {
          position: sticky;
          top: 60px;
          flex: 0 0 58%;
          height: calc(100vh - 60px);
          overflow: hidden;
        }
        .map-canvas { width: 100%; height: 100%; }
        .map-badge {
          position: absolute;
          top: 16px; left: 16px;
          background: rgba(12,26,16,0.88);
          border: 1px solid rgba(58,176,110,0.4);
          color: #3ab06e;
          font-family: 'Source Sans 3', sans-serif;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.4rem 0.9rem;
          border-radius: 4px;
          backdrop-filter: blur(8px);
        }
        .map-legend {
          position: absolute;
          bottom: 32px; left: 16px;
          background: rgba(12,26,16,0.88);
          border: 1px solid rgba(255,255,255,0.07);
          padding: 0.75rem 0.9rem;
          border-radius: 4px;
          backdrop-filter: blur(8px);
          font-family: 'Source Sans 3', sans-serif;
        }
        .legend-title { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: #8a9e8f; margin-bottom: 0.5rem; }
        .legend-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem; }
        .legend-swatch { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
        .legend-text { font-size: 0.72rem; color: #8a9e8f; }
        .scroll-steps-col { flex: 1; padding: 0 2rem; pointer-events: none; }
        .scroll-step {
          min-height: 80vh;
          display: flex;
          align-items: center;
          padding: 4rem 0;
          pointer-events: all;
        }
        .step-inner {
          background: rgba(12,26,16,0.75);
          border: 1px solid rgba(255,255,255,0.06);
          border-left: 3px solid rgba(58,176,110,0.2);
          padding: 1.5rem 1.75rem;
          border-radius: 6px;
          backdrop-filter: blur(10px);
          transition: border-left-color 0.4s, background 0.4s;
          max-width: 340px;
        }
        .scroll-step.is-active .step-inner {
          border-left-color: #3ab06e;
          background: rgba(18,31,22,0.92);
        }
        .step-year {
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: #3ab06e;
          margin-bottom: 0.5rem; font-family: 'Source Sans 3', sans-serif;
        }
        .step-title {
          font-family: 'Playfair Display', serif; font-size: 1.15rem;
          color: #f0ece0; line-height: 1.3; margin-bottom: 0.75rem;
        }
        .step-text { font-size: 0.875rem; color: #8a9e8f; line-height: 1.65; margin: 0; }
        .step-stat {
          display: flex; flex-direction: column;
          margin-top: 1rem; padding-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .stat-num { font-family: 'Playfair Display', serif; font-size: 1.8rem; font-weight: 900; color: #3ab06e; line-height: 1; }
        .stat-label { font-size: 0.72rem; color: #8a9e8f; margin-top: 0.2rem; }
        .step-formula {
          margin-top: 0.75rem;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 4px;
          padding: 0.6rem 0.8rem;
          font-family: 'Source Code Pro', monospace;
          font-size: 0.78rem;
          color: #f4a023;
          line-height: 1.6;
        }
        @media (max-width: 768px) {
          .scrolly-outer { flex-direction: column; }
          .map-sticky-wrapper { flex: none; width: 100%; height: 60vw; }
          .scroll-steps-col { padding: 0 1rem; }
          .step-inner { max-width: 100%; }
        }
      `}</style>
    </div>
  );
}
