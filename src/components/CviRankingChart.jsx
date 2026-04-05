import { useEffect, useRef } from 'react';

export default function CviRankingChart({ data = [], title = '' }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    async function build() {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      if (chartRef.current) chartRef.current.destroy();
      if (!data.length) return;

      // Sort by CVI descending (already sorted, but ensure)
      const sorted = [...data].sort((a, b) => b.cvi - a.cvi);

      const tierColors = {
        CRITICAL: 'rgba(224,92,40,0.85)',
        HIGH:     'rgba(244,160,35,0.85)',
        MODERATE: 'rgba(55,138,221,0.75)',
        LOW:      'rgba(138,158,143,0.6)',
      };

      chartRef.current = new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels: sorted.map(d => d.kecamatan),
          datasets: [{
            label: 'Composite Vulnerability Index',
            data: sorted.map(d => d.cvi),
            backgroundColor: sorted.map(d => tierColors[d.tier] || 'rgba(138,158,143,0.6)'),
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
              title: { display: true, text: 'CVI', color: '#4a5e50', font: { size: 11 } },
              ticks: { color: '#4a5e50', font: { size: 10 } },
              grid:  { color: 'rgba(255,255,255,0.04)' },
              min: 0,
              max: 0.8,
            },
            y: {
              ticks: { color: '#f0ece0', font: { size: 10 } },
              grid:  { color: 'rgba(255,255,255,0.03)' },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(12,26,16,0.95)',
              titleColor:      '#f0ece0',
              bodyColor:       '#8a9e8f',
              borderColor:     'rgba(255,255,255,0.07)',
              borderWidth:     1,
              padding:         12,
              callbacks: {
                label: ctx => ` CVI: ${ctx.raw.toFixed(3)} (${sorted[ctx.dataIndex].tier})`,
              },
            },
          },
        },
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
        <h4 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.05rem',
          color: '#f0ece0',
          marginBottom: '1.25rem',
        }}>{title}</h4>
      )}
      <div style={{ height: 340, position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>
      <p style={{ fontSize: '0.72rem', color: '#4a5e50', marginTop: '0.75rem', marginBottom: 0 }}>
        Source: CHIRPS v2.0 · ERA5-Land · GEE · MODIS hotspot archive · Bengkalis Regency, 2015–2024
      </p>
    </div>
  );
}
