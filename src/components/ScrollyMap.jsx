import { useEffect, useRef, useState } from 'react';

/**
 * ScrollyMap — sticky map + scrolling step cards + live chart overlay
 *
 * Props:
 *   steps: Array of step config objects (see STEP_SCHEMA below)
 *   dataUrl: path to GeoJSON in /public/data/
 *
 * STEP_SCHEMA:
 * {
 *   id: string           unique key
 *   title: string        card heading
 *   text: string         card body text
 *   center: [lng, lat]   map fly-to center
 *   zoom: number         map fly-to zoom
 *   bearing?: number     map rotation
 *   year?: number|null   filter hotspot layer to this year (null = all years)
 *   highlightRegency?: string   highlight a specific regency name
 * }
 */
export default function ScrollyMap({ steps = [], dataUrl = '/data/riau_hotspots.geojson' }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const scrollerRef = useRef(null);

  const [activeStep, setActiveStep] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);

  // ── ONI data for the chart overlay ──────────────────────────────────
  const ONI_DATA = {
    labels: ['2015','2016','2017','2018','2019','2020','2021','2022','2023','2024','2025'],
    oni:    [ 2.3,  -0.7, -0.9,  0.3,   0.8,  -1.3,  -1.0,  -1.2,   1.5,   0.6,  -0.8],
    fires:  [318000, 42000, 28000, 55000, 196000, 18000, 21000, 15000, 142000, 88000, 35000],
  };

  // ── 1. Init MapLibre ─────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;

    let map;

    // Lazy-load maplibre-gl to avoid SSR issues
    import('maplibre-gl').then(({ default: maplibregl }) => {
      map = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [101.5, 0.3],
        zoom: 7,
        bearing: 0,
        pitch: 0,
        attributionControl: { compact: true },
      });

      mapRef.current = map;

      map.on('load', async () => {
        // Add hotspot GeoJSON source
        map.addSource('hotspots', {
          type: 'geojson',
          data: dataUrl,
        });

        // ── Base heatmap layer (all years) ─────────────────────────────
        map.addLayer({
          id: 'hotspots-heat',
          type: 'heatmap',
          source: 'hotspots',
          maxzoom: 11,
          paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'count'], 0, 0, 100000, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 5, 1, 10, 3],
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0,   'rgba(0,0,0,0)',
              0.2, 'rgba(232,130,12,0.3)',
              0.5, 'rgba(232,130,12,0.7)',
              0.8, 'rgba(200, 60, 20, 0.9)',
              1,   'rgba(255,230,180,1)',
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 5, 30, 10, 60],
            'heatmap-opacity': 0.85,
          },
        });

        // ── Circle layer (individual regency dots) ─────────────────────
        map.addLayer({
          id: 'hotspots-circle',
          type: 'circle',
          source: 'hotspots',
          minzoom: 6,
          paint: {
            'circle-radius': [
              'interpolate', ['linear'],
              ['get', 'count'],
              0, 4, 50000, 18, 200000, 36, 350000, 52,
            ],
            'circle-color': [
              'match', ['get', 'enso_phase'],
              'el_nino',  '#e8820c',
              'la_nina',  '#3b8bd4',
              'neutral',  '#8a8472',
              '#8a8472',
            ],
            'circle-opacity': 0.85,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': 'rgba(255,255,255,0.2)',
          },
        });

        // ── Highlight layer ────────────────────────────────────────────
        map.addLayer({
          id: 'hotspots-highlight',
          type: 'circle',
          source: 'hotspots',
          filter: ['==', ['get', 'regency'], ''],
          paint: {
            'circle-radius': [
              'interpolate', ['linear'], ['get', 'count'],
              0, 6, 350000, 56,
            ],
            'circle-color': 'transparent',
            'circle-stroke-width': 2.5,
            'circle-stroke-color': '#fff',
            'circle-opacity': 1,
          },
        });

        // ── Popups on hover ────────────────────────────────────────────
        const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });

        map.on('mouseenter', 'hotspots-circle', (e) => {
          map.getCanvas().style.cursor = 'pointer';
          const { regency, year, count, enso_phase } = e.features[0].properties;
          const phase = enso_phase === 'el_nino' ? '🔴 El Niño' : enso_phase === 'la_nina' ? '🔵 La Niña' : '⚪ Neutral';
          popup
            .setLngLat(e.lngLat)
            .setHTML(`
              <strong style="font-family:'Fraunces',serif;font-size:15px">${regency}</strong>
              <div style="font-size:12px;color:#8a8472;margin-top:4px;font-family:'JetBrains Mono',monospace">
                ${year} · ${phase}
              </div>
              <div style="margin-top:8px;font-size:13px">
                🔥 <strong style="color:#e8820c">${count.toLocaleString()}</strong> hotspots
              </div>
            `)
            .addTo(map);
        });

        map.on('mouseleave', 'hotspots-circle', () => {
          map.getCanvas().style.cursor = '';
          popup.remove();
        });

        setMapLoaded(true);
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [dataUrl]);

  // ── 2. Init Chart.js ─────────────────────────────────────────────────
  useEffect(() => {
    if (!chartRef.current) return;

    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);

      chartInstance.current = new Chart(chartRef.current, {
        type: 'bar',
        data: {
          labels: ONI_DATA.labels,
          datasets: [
            {
              type: 'bar',
              label: 'Fire hotspots',
              data: ONI_DATA.fires,
              backgroundColor: ONI_DATA.oni.map(v =>
                v > 0.5 ? 'rgba(232,130,12,0.7)' :
                v < -0.5 ? 'rgba(59,139,212,0.7)' :
                'rgba(138,132,114,0.5)'
              ),
              borderColor: 'transparent',
              yAxisID: 'y',
            },
            {
              type: 'line',
              label: 'ONI (ENSO)',
              data: ONI_DATA.oni,
              borderColor: '#fff',
              borderWidth: 1.5,
              pointRadius: 3,
              pointBackgroundColor: ONI_DATA.oni.map(v =>
                v > 0.5 ? '#e8820c' : v < -0.5 ? '#3b8bd4' : '#8a8472'
              ),
              tension: 0.3,
              yAxisID: 'y1',
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 400 },
          plugins: {
            legend: {
              display: true,
              labels: {
                color: '#8a8472',
                font: { family: "'JetBrains Mono', monospace", size: 10 },
                boxWidth: 10,
                padding: 10,
              },
            },
            tooltip: {
              backgroundColor: 'rgba(20,20,16,0.95)',
              titleColor: '#e6e0cc',
              bodyColor: '#8a8472',
              borderColor: 'rgba(232,224,204,0.1)',
              borderWidth: 1,
              titleFont: { family: "'Fraunces', serif", size: 13 },
              bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
              callbacks: {
                label: (ctx) => {
                  if (ctx.datasetIndex === 0)
                    return ` ${ctx.raw.toLocaleString()} hotspots`;
                  return ` ONI: ${ctx.raw}`;
                },
              },
            },
          },
          scales: {
            x: {
              ticks: { color: '#5a564a', font: { family: "'JetBrains Mono', monospace", size: 9 } },
              grid: { color: 'rgba(255,255,255,0.04)' },
            },
            y: {
              position: 'left',
              ticks: {
                color: '#5a564a',
                font: { family: "'JetBrains Mono', monospace", size: 9 },
                callback: v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v,
              },
              grid: { color: 'rgba(255,255,255,0.04)' },
            },
            y1: {
              position: 'right',
              min: -2,
              max: 3,
              ticks: {
                color: '#5a564a',
                font: { family: "'JetBrains Mono', monospace", size: 9 },
                callback: v => v.toFixed(1),
              },
              grid: { drawOnChartArea: false },
            },
          },
        },
      });
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, []);

  // ── 3. Highlight active year in chart ────────────────────────────────
  const highlightChartYear = (year) => {
    if (!chartInstance.current || !year) return;
    const idx = ONI_DATA.labels.indexOf(String(year));
    if (idx === -1) return;

    const base = ONI_DATA.oni.map((v, i) =>
      i === idx ? (v > 0.5 ? 'rgba(232,130,12,1)' : v < -0.5 ? 'rgba(59,139,212,1)' : 'rgba(138,132,114,1)') :
      (v > 0.5 ? 'rgba(232,130,12,0.25)' : v < -0.5 ? 'rgba(59,139,212,0.25)' : 'rgba(138,132,114,0.2)')
    );
    chartInstance.current.data.datasets[0].backgroundColor = base;
    chartInstance.current.update('none');
  };

  // ── 4. Respond to step changes ────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const step = steps[activeStep];
    if (!step) return;

    // Fly to position
    map.flyTo({
      center: step.center,
      zoom: step.zoom,
      bearing: step.bearing ?? 0,
      duration: 1800,
      essential: true,
    });

    // Filter by year
    if (step.year) {
      map.setFilter('hotspots-circle', ['==', ['get', 'year'], step.year]);
      map.setFilter('hotspots-heat',   ['==', ['get', 'year'], step.year]);
      highlightChartYear(step.year);
    } else {
      map.setFilter('hotspots-circle', null);
      map.setFilter('hotspots-heat',   null);
      if (chartInstance.current) {
        const reset = ONI_DATA.oni.map(v =>
          v > 0.5 ? 'rgba(232,130,12,0.7)' : v < -0.5 ? 'rgba(59,139,212,0.7)' : 'rgba(138,132,114,0.5)'
        );
        chartInstance.current.data.datasets[0].backgroundColor = reset;
        chartInstance.current.update('none');
      }
    }

    // Highlight regency
    if (step.highlightRegency) {
      map.setFilter('hotspots-highlight', [
        'all',
        ['==', ['get', 'regency'], step.highlightRegency],
        step.year ? ['==', ['get', 'year'], step.year] : ['literal', true],
      ]);
    } else {
      map.setFilter('hotspots-highlight', ['==', ['get', 'regency'], '']);
    }
  }, [activeStep, mapLoaded, steps]);

  // ── 5. Init Scrollama ─────────────────────────────────────────────────
  useEffect(() => {
    import('scrollama').then(({ default: scrollama }) => {
      const scroller = scrollama();
      scroller
        .setup({
          step: '.scrolly-step',
          offset: 0.5,
          debug: false,
        })
        .onStepEnter(({ index }) => setActiveStep(index))
        .onStepExit(({ index, direction }) => {
          // Snap to first/last step when scrolling out of bounds
          if (direction === 'up' && index === 0) setActiveStep(0);
        });

      scrollerRef.current = scroller;

      const handleResize = () => scroller.resize();
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        scroller.destroy();
      };
    });
  }, []);

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="scrolly-outer">
      {/* Sticky map panel */}
      <div className="map-sticky">
        <div ref={mapContainer} className="map-canvas" />

        {/* Legend overlay */}
        <div className="map-legend">
          <span className="legend-item">
            <span className="dot" style={{ background: '#e8820c' }} />El Niño
          </span>
          <span className="legend-item">
            <span className="dot" style={{ background: '#3b8bd4' }} />La Niña
          </span>
          <span className="legend-item">
            <span className="dot" style={{ background: '#8a8472' }} />Neutral
          </span>
        </div>

        {/* Step label on map */}
        <div className="map-step-label">
          <span className="step-num mono">{String(activeStep + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span>
        </div>

        {/* Chart panel */}
        <div className="chart-overlay">
          <p className="chart-title mono">hotspots vs ENSO · 2015–2025</p>
          <div style={{ height: '150px', position: 'relative' }}>
            <canvas ref={chartRef} />
          </div>
        </div>
      </div>

      {/* Scroll steps */}
      <div className="steps-column">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={`scrolly-step ${i === activeStep ? 'is-active' : ''}`}
            data-step={i}
          >
            <div className="step-card">
              <span className="step-index mono">{String(i + 1).padStart(2, '0')}</span>
              {step.year && (
                <span className="step-year mono">{step.year}</span>
              )}
              <h3 className="step-title">{step.title}</h3>
              <p className="step-text">{step.text}</p>
              {step.stat && (
                <div className="step-stat">
                  <span className="stat-value mono">{step.stat.value}</span>
                  <span className="stat-label">{step.stat.label}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .scrolly-outer {
          position: relative;
          display: flex;
          align-items: flex-start;
        }

        .map-sticky {
          position: sticky;
          top: 56px;
          width: 60%;
          height: calc(100vh - 56px);
          flex-shrink: 0;
        }

        .map-canvas {
          width: 100%;
          height: 100%;
        }

        .map-legend {
          position: absolute;
          top: 16px;
          left: 16px;
          background: rgba(12,12,10,0.85);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(232,224,204,0.08);
          border-radius: 8px;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #8a8472;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .map-step-label {
          position: absolute;
          top: 16px;
          right: 16px;
        }

        .step-num {
          font-size: 11px;
          color: rgba(232,224,204,0.3);
          letter-spacing: 0.1em;
        }

        .chart-overlay {
          position: absolute;
          bottom: 16px;
          left: 16px;
          right: 16px;
          background: rgba(10,10,8,0.88);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(232,224,204,0.08);
          border-radius: 10px;
          padding: 14px 16px;
        }

        .chart-title {
          font-size: 10px;
          color: #5a564a;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .steps-column {
          width: 40%;
          padding: 10vh 0;
        }

        .scrolly-step {
          min-height: 85vh;
          display: flex;
          align-items: center;
          padding: 2rem 2.5rem;
        }

        .step-card {
          background: rgba(20,20,16,0.92);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(232,224,204,0.08);
          border-radius: 12px;
          padding: 2rem;
          width: 100%;
          transition: border-color 0.3s, box-shadow 0.3s;
        }

        .scrolly-step.is-active .step-card {
          border-color: rgba(232,130,12,0.3);
          box-shadow: 0 0 0 1px rgba(232,130,12,0.1), 0 16px 48px rgba(0,0,0,0.5);
        }

        .step-index {
          display: block;
          font-size: 10px;
          color: #5a564a;
          letter-spacing: 0.12em;
          margin-bottom: 0.25rem;
        }

        .step-year {
          display: inline-block;
          font-size: 11px;
          color: #e8820c;
          background: rgba(232,130,12,0.12);
          border-radius: 4px;
          padding: 2px 8px;
          margin-bottom: 1rem;
          letter-spacing: 0.08em;
        }

        .step-title {
          font-family: 'Fraunces', serif;
          font-size: 1.15rem;
          font-weight: 600;
          color: #e6e0cc;
          line-height: 1.3;
          margin-bottom: 0.75rem;
        }

        .step-text {
          font-size: 0.9rem;
          color: #8a8472;
          line-height: 1.75;
          margin: 0;
        }

        .step-stat {
          margin-top: 1.25rem;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(232,224,204,0.06);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-value {
          font-size: 1.8rem;
          color: #e8820c;
          letter-spacing: -0.02em;
        }

        .stat-label {
          font-size: 0.78rem;
          color: #5a564a;
          letter-spacing: 0.04em;
        }

        @media (max-width: 768px) {
          .scrolly-outer { flex-direction: column; }
          .map-sticky { position: relative; top: 0; width: 100%; height: 55vw; }
          .steps-column { width: 100%; }
          .scrolly-step { padding: 1rem; min-height: auto; margin-bottom: 1rem; }
        }
      `}</style>
    </div>
  );
}
