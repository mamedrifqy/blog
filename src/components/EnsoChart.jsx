/**
 * EnsoChart.jsx
 * ─────────────────────────────────────────────────────────────
 * Chart.js dual-axis chart showing ENSO (ONI index) vs Riau
 * hotspot count over time.  Mirrors the analysis from your
 * Python correlation workflow.
 *
 * Props:
 *   data: Array<{ year, month, oni, hotspots, regency? }>
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from 'react';

const ENSO_COLORS = {
  el_nino:  '#e05c28',
  la_nina:  '#378add',
  neutral:  'rgba(138,158,143,0.2)',
};

export default function EnsoChart({ data = [], title = 'ENSO vs Hotspot Count' }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    async function buildChart() {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const labels   = data.map(d => `${d.year}-${String(d.month).padStart(2,'0')}`);
      const oni      = data.map(d => d.oni);
      const hotspots = data.map(d => d.hotspots);

      // Background bands for El Nino / La Nina phases
      const backgroundPlugin = {
        id: 'enso-bands',
        beforeDraw(chart) {
          const { ctx, chartArea, scales } = chart;
          if (!chartArea) return;
          const yScale = scales.y1;
          ctx.save();
          data.forEach((d, i) => {
            if (Math.abs(d.oni) < 0.5) return;
            const x0 = scales.x.getPixelForValue(i - 0.5);
            const x1 = scales.x.getPixelForValue(i + 0.5);
            ctx.fillStyle = d.oni > 0
              ? 'rgba(224,92,40,0.08)'
              : 'rgba(55,138,221,0.08)';
            ctx.fillRect(x0, chartArea.top, x1 - x0, chartArea.height);
          });
          ctx.restore();
        }
      };

      chartRef.current = new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              type:  'line',
              label: 'ONI Index (ENSO)',
              data:  oni,
              borderColor: ctx => {
                const v = oni[ctx.dataIndex];
                return v > 0.5 ? ENSO_COLORS.el_nino : v < -0.5 ? ENSO_COLORS.la_nina : '#8a9e8f';
              },
              segment: {
                borderColor: ctx => {
                  const v = oni[ctx.p0DataIndex];
                  return v > 0.5 ? ENSO_COLORS.el_nino : v < -0.5 ? ENSO_COLORS.la_nina : '#8a9e8f';
                },
              },
              backgroundColor: 'transparent',
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 5,
              tension: 0.3,
              yAxisID: 'y1',
              order: 1,
            },
            {
              type:  'bar',
              label: 'Hotspot count',
              data:  hotspots,
              backgroundColor: hotspots.map(v =>
                v > 1500 ? 'rgba(255,220,80,0.8)'
                : v > 500 ? 'rgba(240,140,30,0.75)'
                : 'rgba(200,80,20,0.6)'
              ),
              borderColor:     'rgba(0,0,0,0)',
              borderRadius:    2,
              yAxisID: 'y',
              order: 2,
            },
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: {
              labels: {
                color:    '#8a9e8f',
                font:     { family: "'Source Sans 3', sans-serif", size: 12 },
                boxWidth: 14,
                padding:  16,
              }
            },
            tooltip: {
              backgroundColor: 'rgba(12,26,16,0.95)',
              titleColor:      '#f0ece0',
              bodyColor:       '#8a9e8f',
              borderColor:     'rgba(255,255,255,0.07)',
              borderWidth:     1,
              padding:         12,
              callbacks: {
                label: ctx => {
                  if (ctx.datasetIndex === 0) return ` ONI: ${ctx.raw.toFixed(2)}`;
                  return ` Hotspots: ${ctx.raw.toLocaleString()}`;
                }
              }
            },
          },
          scales: {
            x: {
              ticks: {
                color:         '#4a5e50',
                font:          { size: 10 },
                maxRotation:   45,
                maxTicksLimit: 24,
              },
              grid: { color: 'rgba(255,255,255,0.03)' },
            },
            y: {
              position:  'left',
              title:     { display: true, text: 'Hotspot count', color: '#4a5e50', font: { size: 11 } },
              ticks:     { color: '#4a5e50', font: { size: 10 } },
              grid:      { color: 'rgba(255,255,255,0.04)' },
            },
            y1: {
              position:  'right',
              title:     { display: true, text: 'ONI Index', color: '#4a5e50', font: { size: 11 } },
              ticks:     { color: '#4a5e50', font: { size: 10 } },
              grid:      { drawOnChartArea: false },
              min: -2.5,
              max:  3.0,
            },
          }
        },
        plugins: [backgroundPlugin],
      });
    }

    buildChart();
    return () => chartRef.current?.destroy();
  }, [data]);

  return (
    <div style={{
      background:   'var(--bg-card, #121f16)',
      border:       '1px solid var(--border, rgba(255,255,255,0.07))',
      borderRadius: '8px',
      padding:      '1.5rem',
      margin:       '2rem 0',
    }}>
      {title && (
        <h4 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize:   '1.05rem',
          color:      '#f0ece0',
          marginBottom: '0.4rem',
        }}>{title}</h4>
      )}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <Chip color="rgba(224,92,40,0.2)" textColor="#e05c28" label="El Niño (ONI > +0.5)" />
        <Chip color="rgba(55,138,221,0.2)" textColor="#378add" label="La Niña (ONI < −0.5)" />
      </div>
      <div style={{ height: 280, position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>
      <p style={{ fontSize: '0.72rem', color: '#4a5e50', marginTop: '0.75rem', marginBottom: 0 }}>
        Source: NOAA ONI data × MODIS/VIIRS hotspot archive · Riau Province
      </p>
    </div>
  );
}

function Chip({ color, textColor, label }) {
  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          '0.4rem',
      fontSize:     '0.75rem',
      color:        textColor,
      background:   color,
      padding:      '0.2em 0.6em',
      borderRadius: '2px',
      fontFamily:   "'Source Sans 3', sans-serif",
    }}>{label}</span>
  );
}
