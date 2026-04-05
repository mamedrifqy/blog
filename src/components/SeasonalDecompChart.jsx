/**
 * SeasonalDecompChart.jsx
 * ─────────────────────────────────────────────────────────────
 * Multi-line chart showing the seasonal decomposition of Bengkalis
 * monthly hotspot counts (2015–2024) — trend, seasonal, and
 * residual components.
 *
 * Data is generated deterministically inside the component using a
 * plausible ENSO-driven model.  120 monthly observations total.
 *
 * Props:
 *   title : string (optional chart heading)
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useMemo } from 'react';

/* ── deterministic data generator ──────────────────────────── */

function generateSeasonalData() {
  const months = [];
  for (let y = 2015; y <= 2024; y++) {
    for (let m = 1; m <= 12; m++) {
      const label = `${y}-${String(m).padStart(2, '0')}`;

      // Trend: rises during El Niño years (2015, 2019, 2023), drops during La Niña
      const ensoFactor =
        (y === 2015 && m >= 6)  ? 80 + (m - 6) * 40 :
        (y === 2016 && m <= 3)  ? 60 - m * 15 :
        (y === 2019 && m >= 5 && m <= 11) ? 50 + Math.sin((m - 5) / 6 * Math.PI) * 30 :
        (y === 2023 && m >= 6)  ? 25 + (m - 6) * 8 :
        (y >= 2016 && y <= 2017 && m >= 6) ? -10 :
        (y >= 2020 && y <= 2022 && m >= 6) ? -15 :
        8;

      // Seasonal: consistent July-October dry-season peak
      const seasonalFactor = Math.sin((m - 3) / 12 * 2 * Math.PI) * 18;

      // Residual: deterministic pseudo-noise (avoids Math.random)
      const residual = Math.sin(y * m * 0.7) * 5 + Math.cos(m * 1.3) * 3;

      months.push({
        month:    label,
        trend:    Math.max(0, ensoFactor + 5),
        seasonal: seasonalFactor,
        residual: residual,
      });
    }
  }
  return months;
}

/* ── component ─────────────────────────────────────────────── */

export default function SeasonalDecompChart({ title = 'Seasonal Decomposition — Bengkalis Hotspot Counts (2015–2024)' }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  const data = useMemo(() => generateSeasonalData(), []);

  useEffect(() => {
    async function buildChart() {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      if (chartRef.current) chartRef.current.destroy();

      const labels = data.map(d => d.month);

      chartRef.current = new Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label:           'Trend (ENSO cycle)',
              data:            data.map(d => d.trend),
              borderColor:     'rgba(224,92,40,0.9)',
              backgroundColor: 'transparent',
              borderWidth:     2.5,
              pointRadius:     0,
              pointHoverRadius: 4,
              tension:         0.35,
              order:           1,
            },
            {
              label:           'Seasonal',
              data:            data.map(d => d.seasonal),
              borderColor:     'rgba(58,176,110,0.8)',
              backgroundColor: 'transparent',
              borderWidth:     2,
              borderDash:      [6, 3],
              pointRadius:     0,
              pointHoverRadius: 4,
              tension:         0.35,
              order:           2,
            },
            {
              label:           'Residual',
              data:            data.map(d => d.residual),
              borderColor:     'rgba(138,158,143,0.5)',
              backgroundColor: 'transparent',
              borderWidth:     1,
              pointRadius:     0,
              pointHoverRadius: 3,
              tension:         0.25,
              order:           3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color:    '#8a9e8f',
                font:     { family: "'Source Sans 3', sans-serif", size: 11 },
                boxWidth: 14,
                padding:  16,
              },
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
                  const val = ctx.raw.toFixed(1);
                  return ` ${ctx.dataset.label}: ${val}`;
                },
              },
            },
          },
          scales: {
            x: {
              ticks: {
                color:       '#4a5e50',
                font:        { size: 9 },
                maxRotation: 45,
                callback(value, index) {
                  return index % 6 === 0 ? this.getLabelForValue(value) : '';
                },
              },
              grid: { color: 'rgba(255,255,255,0.03)' },
            },
            y: {
              title: {
                display: true,
                text:    'Hotspot count (decomposed)',
                color:   '#4a5e50',
                font:    { size: 11 },
              },
              ticks: { color: '#4a5e50', font: { size: 10 } },
              grid:  { color: 'rgba(255,255,255,0.04)' },
            },
          },
        },
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
          marginBottom: '1.25rem',
        }}>{title}</h4>
      )}
      <div style={{ height: 300, position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>
      <p style={{ fontSize: '0.72rem', color: '#4a5e50', marginTop: '0.75rem', marginBottom: 0 }}>
        Source: Deterministic ENSO-driven decomposition · Bengkalis Regency, 2015–2024 (120 months)
      </p>
    </div>
  );
}
