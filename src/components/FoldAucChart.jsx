import { useEffect, useRef } from 'react';
import { useTheme, palette, ink } from '../lib/theme.js';

export default function FoldAucChart({ data = {}, title = '' }) {
  const theme = useTheme();
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    async function build() {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      const P = palette();
      if (chartRef.current) chartRef.current.destroy();
      if (!data.folds?.length) return;

      chartRef.current = new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels: data.folds,
          datasets: [
            {
              label: 'XGBoost (GBM)',
              data: data.gbm,
              backgroundColor: 'rgba(58,176,110,0.85)',
              borderColor: 'rgba(0,0,0,0)',
              borderRadius: 2,
            },
            {
              label: 'Random Forest',
              data: data.rf,
              backgroundColor: 'rgba(55,138,221,0.75)',
              borderColor: 'rgba(0,0,0,0)',
              borderRadius: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              ticks: { color: P.muted, font: { size: 9 }, maxRotation: 55 },
              grid:  { color: ink(0.03) },
            },
            y: {
              title: { display: true, text: 'AUC', color: P.muted, font: { size: 11 } },
              ticks: { color: P.muted, font: { size: 10 } },
              grid:  { color: ink(0.04) },
              min: 0.75,
              max: 0.87,
            },
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: P.muted,
                font: { family: "'Source Sans 3', sans-serif", size: 11 },
                boxWidth: 12,
                padding: 14,
              },
            },
            tooltip: {
              backgroundColor: P.pop,
              titleColor: P.bright,
              bodyColor: P.muted,
              borderColor: ink(0.07),
              borderWidth: 1,
              padding: 12,
              callbacks: {
                label: ctx => ` ${ctx.dataset.label}: AUC = ${ctx.raw.toFixed(3)}`,
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
      <div style={{ height: 320, position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: 0 }}>
        Source: XGBoost vs RandomForest · GroupKFold (k=11, leave-one-kecamatan-out) · Bengkalis Regency
      </p>
    </div>
  );
}
