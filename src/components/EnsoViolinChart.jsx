/**
 * EnsoViolinChart.jsx
 * ─────────────────────────────────────────────────────────────
 * Box-and-whisker chart showing the distribution of monthly
 * hotspot counts by ENSO phase (El Niño, Neutral, La Niña)
 * in Bengkalis Regency 2015–2024.
 *
 * Uses a regular Chart.js bar chart for the mean values with a
 * custom inline plugin that draws IQR boxes, median lines, and
 * min/max whiskers on the canvas — no extra dependencies needed.
 *
 * Props:
 *   data:  Array<{ phase, mean, median, q1, q3, min, max, n }>
 *   title: string (optional)
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from 'react';

const PHASE_COLORS = {
  'El Niño': { bg: 'rgba(224,92,40,0.85)',  border: '#e05c28' },
  'Neutral': { bg: 'rgba(244,160,35,0.75)', border: '#f4a023' },
  'La Niña': { bg: 'rgba(55,138,221,0.75)',  border: '#378add' },
};

const DEFAULT_DATA = [
  { phase: 'El Niño', mean: 45.2, median: 28.0, q1: 15.0, q3: 62.0, min: 1.0,  max: 280.0, n: 36 },
  { phase: 'Neutral', mean: 12.8, median: 8.0,  q1: 3.0,  q3: 18.0, min: 0.0,  max: 58.0,  n: 48 },
  { phase: 'La Niña', mean: 5.3,  median: 3.0,  q1: 1.0,  q3: 8.0,  min: 0.0,  max: 22.0,  n: 36 },
];

/**
 * Custom Chart.js plugin — draws box-and-whisker overlays
 * (IQR rectangle, median line, whisker stems & caps) on top
 * of the mean-value bars.
 */
function createBoxplotPlugin(sorted) {
  return {
    id: 'boxplotOverlay',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      const yScale = chart.scales.y;
      const xScale = chart.scales.x;
      if (!yScale || !xScale) return;

      sorted.forEach((item, i) => {
        const x = xScale.getPixelForValue(i);
        const halfBar = 30;

        /* IQR box ------------------------------------------------ */
        const q1y = yScale.getPixelForValue(item.q1);
        const q3y = yScale.getPixelForValue(item.q3);
        ctx.save();
        ctx.strokeStyle = 'rgba(240,236,224,0.55)';
        ctx.lineWidth   = 1.5;
        ctx.strokeRect(x - halfBar / 2, q3y, halfBar, q1y - q3y);

        /* Faint fill inside the IQR box */
        const colors = PHASE_COLORS[item.phase] || PHASE_COLORS['Neutral'];
        ctx.fillStyle = colors.bg.replace(/[\d.]+\)$/, '0.12)');
        ctx.fillRect(x - halfBar / 2, q3y, halfBar, q1y - q3y);

        /* Median line --------------------------------------------- */
        const medY = yScale.getPixelForValue(item.median);
        ctx.beginPath();
        ctx.moveTo(x - halfBar / 2, medY);
        ctx.lineTo(x + halfBar / 2, medY);
        ctx.strokeStyle = '#f0ece0';
        ctx.lineWidth   = 2.5;
        ctx.stroke();

        /* Whisker stems ------------------------------------------ */
        const minY = yScale.getPixelForValue(item.min);
        const maxY = yScale.getPixelForValue(item.max);
        ctx.beginPath();
        ctx.moveTo(x, q3y);
        ctx.lineTo(x, maxY);
        ctx.moveTo(x, q1y);
        ctx.lineTo(x, minY);
        ctx.strokeStyle = 'rgba(240,236,224,0.35)';
        ctx.lineWidth   = 1;
        ctx.stroke();

        /* Whisker caps ------------------------------------------- */
        const capW = halfBar / 4;
        ctx.beginPath();
        ctx.moveTo(x - capW, maxY);
        ctx.lineTo(x + capW, maxY);
        ctx.moveTo(x - capW, minY);
        ctx.lineTo(x + capW, minY);
        ctx.strokeStyle = 'rgba(240,236,224,0.35)';
        ctx.lineWidth   = 1;
        ctx.stroke();

        ctx.restore();
      });
    },
  };
}

export default function EnsoViolinChart({ data = DEFAULT_DATA, title = 'Hotspot Distribution by ENSO Phase' }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    async function buildChart() {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      // Sort by mean descending
      const sorted = [...data].sort((a, b) => b.mean - a.mean);
      const labels = sorted.map(d => d.phase);
      const means  = sorted.map(d => d.mean);
      const bgColors = sorted.map(d => (PHASE_COLORS[d.phase] || PHASE_COLORS['Neutral']).bg);
      const bdColors = sorted.map(d => (PHASE_COLORS[d.phase] || PHASE_COLORS['Neutral']).border);

      const boxplotPlugin = createBoxplotPlugin(sorted);

      chartRef.current = new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label:           'Mean monthly hotspots',
              data:            means,
              backgroundColor: bgColors,
              borderColor:     bdColors,
              borderWidth:     1,
              borderRadius:    4,
              barPercentage:   0.55,
              categoryPercentage: 0.7,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: { top: 20, bottom: 4 },
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              backgroundColor: 'rgba(12,26,16,0.95)',
              titleColor:      '#f0ece0',
              bodyColor:       '#8a9e8f',
              borderColor:     'rgba(255,255,255,0.07)',
              borderWidth:     1,
              padding:         12,
              bodyFont:        { family: "'Source Sans 3', sans-serif", size: 12 },
              titleFont:       { family: "'Source Sans 3', sans-serif", size: 13, weight: '600' },
              callbacks: {
                title: (items) => {
                  const idx = items[0].dataIndex;
                  return sorted[idx].phase;
                },
                label: (ctx) => {
                  const item = sorted[ctx.dataIndex];
                  return [
                    `Mean:   ${item.mean.toFixed(1)}`,
                    `Median: ${item.median.toFixed(1)}`,
                    `Q1:     ${item.q1.toFixed(1)}    Q3: ${item.q3.toFixed(1)}`,
                    `Range:  ${item.min.toFixed(1)} – ${item.max.toFixed(1)}`,
                    `n = ${item.n} months`,
                  ];
                },
              },
            },
          },
          scales: {
            x: {
              ticks: {
                color:  '#8a9e8f',
                font:   { family: "'Source Sans 3', sans-serif", size: 13, weight: '600' },
              },
              grid: { color: 'rgba(255,255,255,0.03)' },
              border: { color: 'rgba(255,255,255,0.06)' },
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text:    'Monthly hotspot count',
                color:   '#4a5e50',
                font:    { family: "'Source Sans 3', sans-serif", size: 11 },
              },
              ticks: {
                color: '#4a5e50',
                font:  { size: 10 },
              },
              grid:  { color: 'rgba(255,255,255,0.04)' },
              border: { color: 'rgba(255,255,255,0.06)' },
            },
          },
        },
        plugins: [boxplotPlugin],
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
          fontFamily:  "'Playfair Display', serif",
          fontSize:    '1.05rem',
          color:       '#f0ece0',
          marginBottom: '0.4rem',
        }}>{title}</h4>
      )}

      {/* Legend chips */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <Chip color="rgba(224,92,40,0.2)"  textColor="#e05c28" label="El Niño" />
        <Chip color="rgba(244,160,35,0.2)" textColor="#f4a023" label="Neutral" />
        <Chip color="rgba(55,138,221,0.2)" textColor="#378add" label="La Niña" />
      </div>

      {/* Chart canvas */}
      <div style={{ height: 300, position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>

      {/* Annotation */}
      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.72rem', color: '#4a5e50', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{
            display: 'inline-block', width: 18, height: 2,
            background: '#f0ece0', borderRadius: 1,
          }} /> Median
        </span>
        <span style={{ fontSize: '0.72rem', color: '#4a5e50', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{
            display: 'inline-block', width: 18, height: 10,
            border: '1px solid rgba(240,236,224,0.55)', borderRadius: 1,
          }} /> IQR (Q1–Q3)
        </span>
        <span style={{ fontSize: '0.72rem', color: '#4a5e50', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{
            display: 'inline-block', width: 18, height: 0,
            borderTop: '1px dashed rgba(240,236,224,0.5)',
          }} /> Min / Max whiskers
        </span>
      </div>

      <p style={{ fontSize: '0.72rem', color: '#4a5e50', marginTop: '0.5rem', marginBottom: 0 }}>
        Source: NOAA ONI data × MODIS/VIIRS hotspot archive · Bengkalis Regency 2015–2024
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
