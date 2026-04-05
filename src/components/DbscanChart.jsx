/**
 * DbscanChart.jsx
 * ─────────────────────────────────────────────────────────────
 * Doughnut chart showing DBSCAN hotspot filtering pipeline:
 * anchors (≥70%), rescued (50–69% within 1.5 km of cluster),
 * and discarded (false positives).
 *
 * Props:
 *   data : { anchors: number, rescued: number, discarded: number }
 *   title: string (optional)
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from 'react';

const FILTER_COLORS = {
  anchors:   '#3ab06e',
  rescued:   '#f4a023',
  discarded: 'rgba(224,92,40,0.7)',
};

export default function DbscanChart({ data = {}, title = '' }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    async function build() {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      if (chartRef.current) chartRef.current.destroy();

      const { anchors = 0, rescued = 0, discarded = 0 } = data;
      const total = anchors + rescued + discarded;

      chartRef.current = new Chart(canvasRef.current, {
        type: 'doughnut',
        data: {
          labels: [`Anchors (≥70%) — ${anchors.toLocaleString()}`, `Rescued (50–69%) — ${rescued.toLocaleString()}`, `Discarded — ${discarded.toLocaleString()}`],
          datasets: [{
            data: [anchors, rescued, discarded],
            backgroundColor: [FILTER_COLORS.anchors, FILTER_COLORS.rescued, FILTER_COLORS.discarded],
            borderColor: 'rgba(0,0,0,0)',
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '55%',
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
              titleColor: '#f0ece0',
              bodyColor: '#8a9e8f',
              borderColor: 'rgba(255,255,255,0.07)',
              borderWidth: 1,
              padding: 12,
              callbacks: {
                label: ctx => ` ${ctx.label}: ${((ctx.raw / total) * 100).toFixed(1)}%`,
              },
            },
          },
        },
        plugins: [{
          id: 'center-text',
          beforeDraw(chart) {
            const { ctx, width, height } = chart;
            ctx.save();
            ctx.font = "900 1.6rem 'Playfair Display', serif";
            ctx.fillStyle = '#f0ece0';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(total.toLocaleString(), width / 2, height / 2 - 10);
            ctx.font = "400 0.7rem 'Source Sans 3', sans-serif";
            ctx.fillStyle = '#8a9e8f';
            ctx.fillText('total raw detections', width / 2, height / 2 + 14);
            ctx.restore();
          },
        }],
      });
    }

    build();
    return () => chartRef.current?.destroy();
  }, [data]);

  return (
    <div style={{
      background: 'var(--bg-card, #121f16)',
      border: '1px solid var(--border, rgba(255,255,255,0.07))',
      borderRadius: '8px',
      padding: '1.5rem',
      margin: '2rem 0',
    }}>
      {title && (
        <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem',
          color: '#f0ece0', marginBottom: '1.25rem' }}>{title}</h4>
      )}
      <div style={{ height: 300, position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>
      <p style={{ fontSize: '0.72rem', color: '#4a5e50', marginTop: '0.75rem', marginBottom: 0 }}>
        Source: MODIS C6.1 FIRMS archive · DBSCAN spatial filter (eps = 1.5 km) · Bengkalis Regency, 2015–2024
      </p>
    </div>
  );
}
