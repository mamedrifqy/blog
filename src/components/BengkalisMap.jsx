/**
 * BengkalisMap.jsx
 * Choropleth map of Bengkalis kecamatan colored by a chosen metric
 * (CVI, fire probability, ONI correlation).
 * Drives from scroll steps like the other map components.
 */
import { useEffect, useRef, useState } from 'react';

const BASEMAP = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const CENTER  = [102.4, 1.45];
const ZOOM    = 8.8;

const TIER_COLOR = {
  'CRITICAL': '#e05c28',
  'HIGH':     '#f4a023',
  'MODERATE': '#f4d023',
  'LOW':      '#3ab06e',
  'LOW*':     '#7ec850',
};

export default function BengkalisMap({ steps = [], colorBy = 'cvi', dataUrl = '/data/bengkalis_kecamatan.geojson' }) {
  const mapContainer = useRef(null);
  const mapRef       = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  const [mapReady,   setMapReady]   = useState(false);
  const [activeKec,  setActiveKec]  = useState(null);

  const colorConfig = {
    cvi:       { label: 'CVI', stops: [0.1,'#1a4a2e', 0.3,'#3ab06e', 0.5,'#f4a023', 0.65,'#e05c28'] },
    p_elnino:  { label: 'P(fire) El Niño %', stops: [5,'#1a4a2e', 25,'#3ab06e', 50,'#f4a023', 80,'#e05c28'] },
    r_oni:     { label: 'r ONI', stops: [-0.05,'#e05c28', 0.1,'#888', 0.3,'#3ab06e', 0.5,'#7ec850'] },
  };

  useEffect(() => {
    let map;
    async function initMap() {
      const maplibregl = (await import('maplibre-gl')).default;
      map = new maplibregl.Map({
        container: mapContainer.current,
        style: BASEMAP, center: CENTER, zoom: ZOOM,
        minZoom: 7, maxZoom: 13,
        attributionControl: { compact: true },
      });
      mapRef.current = map;

      map.on('load', async () => {
        const res  = await fetch(dataUrl);
        const data = await res.json();
        map.addSource('bengkalis', { type: 'geojson', data, generateId: true });

        const cfg   = colorConfig[colorBy] || colorConfig.cvi;
        const stops = cfg.stops;

        map.addLayer({
          id: 'kec-fill', type: 'fill', source: 'bengkalis',
          paint: {
            'fill-color': ['interpolate', ['linear'], ['get', colorBy],
              stops[0], stops[1], stops[2], stops[3], stops[4], stops[5], stops[6], stops[7]
            ],
            'fill-opacity': ['case',
              ['boolean', ['feature-state', 'hover'], false], 0.92, 0.72
            ],
          }
        });

        map.addLayer({
          id: 'kec-outline', type: 'line', source: 'bengkalis',
          paint: {
            'line-color': 'rgba(255,255,255,0.3)',
            'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2.5, 0.8],
          }
        });

        map.addLayer({
          id: 'kec-label', type: 'symbol', source: 'bengkalis',
          layout: {
            'text-field':  ['get', 'kecamatan'],
            'text-font':   ['Open Sans Regular'],
            'text-size':   11,
            'text-anchor': 'center',
          },
          paint: {
            'text-color':       '#f0ece0',
            'text-halo-color':  'rgba(0,0,0,0.7)',
            'text-halo-width':  1.5,
          }
        });

        // Hover state
        let hoveredId = null;
        const popup = new maplibregl.Popup({ closeButton: false, offset: 8, maxWidth: '280px' });

        map.on('mousemove', 'kec-fill', (e) => {
          if (!e.features.length) return;
          map.getCanvas().style.cursor = 'pointer';
          if (hoveredId !== null) map.setFeatureState({ source:'bengkalis', id: hoveredId }, { hover: false });
          hoveredId = e.features[0].id;
          map.setFeatureState({ source:'bengkalis', id: hoveredId }, { hover: true });

          const p = e.features[0].properties;
          const tierColor = TIER_COLOR[p.tier] || '#8a9e8f';
          popup.setLngLat(e.lngLat).setHTML(`
            <div style="font-family:'Source Sans 3',sans-serif">
              <strong style="color:#f0ece0;font-size:0.95rem">${p.kecamatan}</strong>
              <span style="display:inline-block;margin-left:0.5rem;padding:0.1em 0.5em;
                background:${tierColor}22;color:${tierColor};border-radius:2px;
                font-size:0.7rem;font-weight:700;letter-spacing:0.06em">${p.tier}</span><br/>
              <table style="width:100%;margin-top:0.5rem;font-size:0.8rem;border-collapse:collapse">
                <tr><td style="color:#8a9e8f;padding:1px 0">CVI</td>
                    <td style="color:#f4a023;font-weight:600;text-align:right">${(+p.cvi).toFixed(3)}</td></tr>
                <tr><td style="color:#8a9e8f">Hotspots</td>
                    <td style="color:#e05c28;font-weight:600;text-align:right">${p.hotspots.toLocaleString()}</td></tr>
                <tr><td style="color:#8a9e8f">Gambut</td>
                    <td style="color:#f0ece0;text-align:right">${(+p.peat_ha).toLocaleString()} ha</td></tr>
                <tr><td style="color:#8a9e8f">P(El Niño)</td>
                    <td style="color:${+p.p_elnino>50?'#e05c28':'#f4a023'};font-weight:600;text-align:right">${p.p_elnino}%</td></tr>
                <tr><td style="color:#8a9e8f">r ONI</td>
                    <td style="color:${+p.r_oni<0?'#e05c28':'#3ab06e'};text-align:right">${(+p.r_oni).toFixed(3)}</td></tr>
                <tr><td style="color:#8a9e8f">Lag puncak</td>
                    <td style="color:#f0ece0;text-align:right">${p.lag_peak!==null&&p.lag_peak!=='null'?p.lag_peak+' bln':'n/s'}</td></tr>
              </table>
            </div>
          `).addTo(map);
        });

        map.on('mouseleave', 'kec-fill', () => {
          map.getCanvas().style.cursor = '';
          if (hoveredId !== null) map.setFeatureState({ source:'bengkalis', id: hoveredId }, { hover: false });
          hoveredId = null;
          popup.remove();
        });

        setMapReady(true);
      });
    }
    initMap();
    return () => map?.remove();
  }, [dataUrl, colorBy]);

  // Scrollama
  useEffect(() => {
    if (!mapReady) return;
    let scroller;
    async function init() {
      const scrollama = (await import('scrollama')).default;
      scroller = scrollama();
      scroller.setup({ step: '.beng-scroll-step', offset: 0.5 })
        .onStepEnter(({ index }) => {
          setActiveStep(index);
          const step = steps[index];
          if (!step || !mapRef.current) return;
          const map = mapRef.current;

          // Change fill color property if step specifies it
          if (step.colorBy && map.getLayer('kec-fill')) {
            const cfg   = colorConfig[step.colorBy] || colorConfig.cvi;
            const stops = cfg.stops;
            map.setPaintProperty('kec-fill', 'fill-color', [
              'interpolate', ['linear'], ['get', step.colorBy],
              stops[0], stops[1], stops[2], stops[3], stops[4], stops[5], stops[6], stops[7]
            ]);
          }

          // Highlight specific kecamatan
          if (step.highlight && map.getLayer('kec-fill')) {
            map.setPaintProperty('kec-fill', 'fill-opacity', [
              'case',
              ['==', ['get', 'kecamatan'], step.highlight], 0.95,
              ['boolean', ['feature-state', 'hover'], false], 0.85, 0.22
            ]);
          } else if (map.getLayer('kec-fill')) {
            map.setPaintProperty('kec-fill', 'fill-opacity', [
              'case', ['boolean', ['feature-state', 'hover'], false], 0.92, 0.72
            ]);
          }

          map.flyTo({
            center:   step.center || CENTER,
            zoom:     step.zoom   || ZOOM,
            duration: 1800,
            easing:   t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t,
          });
        });
      window.addEventListener('resize', scroller.resize);
    }
    init();
    return () => scroller?.destroy();
  }, [mapReady, steps]);

  const currentStep = steps[activeStep];

  return (
    <div className="scrolly-outer">
      <div className="map-sticky-wrapper">
        <div ref={mapContainer} className="map-canvas" />
        {currentStep?.badge && (
          <div className="map-badge">{currentStep.badge}</div>
        )}
        {/* CVI legend */}
        <div className="map-legend">
          <div className="legend-title">{colorConfig[currentStep?.colorBy || colorBy]?.label || 'CVI'}</div>
          <div className="legend-ramp" style={{background:'linear-gradient(to right,#1a4a2e,#3ab06e,#f4a023,#e05c28)',height:'8px',width:'120px',borderRadius:'2px'}}/>
          <div className="legend-labels"><span>Rendah</span><span>Tinggi</span></div>
          <div style={{marginTop:'0.6rem',borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:'0.5rem'}}>
            {Object.entries(TIER_COLOR).filter(([k])=>k!=='LOW*').map(([tier,color])=>(
              <div key={tier} style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.2rem'}}>
                <span style={{width:10,height:10,background:color,borderRadius:2,flexShrink:0}}/>
                <span style={{fontSize:'0.68rem',color:'#8a9e8f'}}>{tier}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="scroll-steps-col">
        {steps.map((step, i) => (
          <div key={step.id} className={`scroll-step beng-scroll-step${i===activeStep?' is-active':''}`} data-step={i}>
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
            </div>
          </div>
        ))}
        <div style={{height:'40vh'}}/>
      </div>

      <style>{`
        .scrolly-outer{position:relative;display:flex;align-items:flex-start}
        .map-sticky-wrapper{position:sticky;top:60px;flex:0 0 58%;height:calc(100vh - 60px);overflow:hidden}
        .map-canvas{width:100%;height:100%}
        .map-badge{position:absolute;top:16px;left:16px;background:rgba(12,26,16,0.88);border:1px solid rgba(58,176,110,0.4);color:#f4a023;font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:700;padding:0.35rem 0.85rem;border-radius:4px;backdrop-filter:blur(8px);letter-spacing:0.02em}
        .map-legend{position:absolute;bottom:32px;left:16px;background:rgba(12,26,16,0.88);border:1px solid rgba(255,255,255,0.07);padding:0.75rem 0.9rem;border-radius:4px;backdrop-filter:blur(8px);font-family:'Source Sans 3',sans-serif}
        .legend-title{font-size:0.68rem;text-transform:uppercase;letter-spacing:0.08em;color:#8a9e8f;margin-bottom:0.4rem}
        .legend-labels{display:flex;justify-content:space-between;font-size:0.65rem;color:#8a9e8f;margin-top:0.25rem;width:120px}
        .scroll-steps-col{flex:1;padding:0 2rem;pointer-events:none}
        .scroll-step{min-height:80vh;display:flex;align-items:center;padding:4rem 0;pointer-events:all}
        .step-inner{background:rgba(12,26,16,0.75);border:1px solid rgba(255,255,255,0.06);border-left:3px solid rgba(58,176,110,0.2);padding:1.5rem 1.75rem;border-radius:6px;backdrop-filter:blur(10px);transition:border-left-color 0.4s,background 0.4s;max-width:340px}
        .scroll-step.is-active .step-inner{border-left-color:#3ab06e;background:rgba(18,31,22,0.92)}
        .step-year{font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#3ab06e;margin-bottom:0.5rem;font-family:'Source Sans 3',sans-serif}
        .step-title{font-family:'Playfair Display',serif;font-size:1.15rem;color:#f0ece0;line-height:1.3;margin-bottom:0.75rem}
        .step-text{font-size:0.875rem;color:#8a9e8f;line-height:1.65;margin:0}
        .step-stat{display:flex;flex-direction:column;margin-top:1rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.06)}
        .stat-num{font-family:'Playfair Display',serif;font-size:1.8rem;font-weight:900;color:#e05c28;line-height:1}
        .stat-label{font-size:0.72rem;color:#8a9e8f;margin-top:0.2rem}
        @media(max-width:768px){.scrolly-outer{flex-direction:column}.map-sticky-wrapper{flex:none;width:100%;height:60vw}.scroll-steps-col{padding:0 1rem}.step-inner{max-width:100%}}
      `}</style>
    </div>
  );
}
