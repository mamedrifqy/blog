import { useEffect, useRef } from 'react';
import { useTheme, palette, ink } from '../lib/theme.js';

const CLIMATE_FEATURES = [
  'SPEI-3', 'Rainfall', 'ONI', 'Dry season', 'Temperature', 'SPI-3', 'Peat depth'
];

export default function ShapChart({ data = [], title = '' }) {
  const theme = useTheme();
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    async function build() {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      const P = palette();
      if (chartRef.current) chartRef.current.destroy();
      if (!data.length) return;

      const sorted = [...data].sort((a, b) => b.importance - a.importance);

      chartRef.current = new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels: sorted.map(d => d.feature),
          datasets: [{
            label: 'Mean |SHAP|',
            data: sorted.map(d => d.importance),
            backgroundColor: sorted.map(d =>
              CLIMATE_FEATURES.some(cf => d.feature.includes(cf))
                ? 'rgba(58,176,110,0.85)'
                : 'rgba(224,92,40,0.75)'
            ),
            borderColor: 'rgba(0,0,0,0)',
            borderRadius: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          scales: {
            x: {
              title: { display: true, text: 'Mean |SHAP value|', color: P.muted, font: { size: 11 } },
              ticks: { color: P.muted, font: { size: 10 } },
              grid:  { color: ink(0.04) },
            },
            y: {
              ticks: { color: P.bright, font: { size: 10 } },
              grid:  { color: ink(0.03) },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: P.pop,
              titleColor: P.bright,
              bodyColor: P.muted,
              borderColor: ink(0.07),
              borderWidth: 1,
              padding: 12,
              callbacks: {
                label: ctx => ` Mean |SHAP|: ${ctx.raw.toFixed(3)}`,
              },
            },
          },
        },
      });
    }
    build();
    return () => chartRef.current?.destroy();
  }, [data, theme]);

  return (
    <div style={{
      background: 'var(--bg-card, #121f16)',
      border: '1px solid var(--border, rgba(255,255,255,0.07))',
      borderRadius: '8px',
      padding: '1.5rem',
      margin: '2rem 0',
    }}>
      {title && (
        <h4 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.05rem',
          color: 'var(--text-bright)',
          marginBottom: '1.25rem',
        }}>{title}</h4>
      )}
      <div style={{ height: 380, position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.75rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(58,176,110,0.85)' }} /> Climate variable
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(224,92,40,0.75)' }} /> Non-climate variable
        </span>
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: 0 }}>
        Source: SHAP TreeExplainer (Lundberg &amp; Lee, 2017) · XGBoost · Bengkalis Regency
      </p>
    </div>
  );
}
