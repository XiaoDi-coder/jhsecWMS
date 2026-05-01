import { useState } from 'react';

export const BITrendChart = ({ data, yMax }) => {
  const [hoverIdx, setHoverIdx] = useState(null);
  const padX = 40, padY = 30, w = 800, h = 300;
  const innerW = w - padX * 2, innerH = h - padY * 2;
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="relative w-full h-full min-h-[250px]">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible">
        {gridLines.map((ratio, i) => {
          const y = h - padY - ratio * innerH;
          const val = Math.round(yMax * ratio);
          return (
            <g key={i}>
              <line x1={padX} y1={y} x2={w - padX} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <text x={padX - 10} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="12">{val}</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const x = padX + (innerW / (data.length - 1)) * i;
          const barH = (d.sales / yMax) * innerH;
          const barY = h - padY - barH;
          return (
            <g key={d.month}>
              <text x={x} y={h - padY + 20} textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="500">{d.month}</text>
              <rect x={x - 12} y={barY} width="24" height={barH} fill="url(#blueGrad)" rx="4" className="transition-all duration-300" opacity={hoverIdx === null || hoverIdx === i ? 1 : 0.4} />
              <rect x={x - 30} y={padY} width="60" height={innerH} fill="transparent" onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)} className="cursor-pointer" />
            </g>
          );
        })}
        <path fill="none" stroke="#10b981" strokeWidth="3" d={`M ${data.map((d, i) => `${padX + (innerW / (data.length - 1)) * i} ${h - padY - (d.stock / yMax) * innerH}`).join(' L ')}`} />
        {data.map((d, i) => {
          const x = padX + (innerW / (data.length - 1)) * i;
          const lineY = h - padY - (d.stock / yMax) * innerH;
          return <circle key={`pt-${i}`} cx={x} cy={lineY} r="4" fill="#fff" stroke="#10b981" strokeWidth="2" className="transition-all duration-300" opacity={hoverIdx === null || hoverIdx === i ? 1 : 0.4} />;
        })}
        <defs>
          <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>
      {hoverIdx !== null && (
        <div className="absolute z-50 bg-slate-900/90 text-white p-3 rounded-xl shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all whitespace-nowrap" style={{ left: `calc(${padX}px + ${(innerW / (data.length - 1)) * hoverIdx} * (100% - ${padX*2}px) / ${innerW})`, top: '50%' }}>
          <div className="font-bold text-sm mb-2">{data[hoverIdx].month} 分析</div>
          <div className="text-xs flex gap-4"><span className="text-slate-300">销售</span><span className="font-bold text-blue-400">{data[hoverIdx].sales} w</span></div>
          <div className="text-xs flex gap-4 mt-1"><span className="text-slate-300">采购</span><span className="font-bold text-emerald-400">{data[hoverIdx].stock} w</span></div>
        </div>
      )}
    </div>
  );
};

export const BIPieChart = ({ data }) => {
  const [hoverInfo, setHoverInfo] = useState(null); 
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const segments = total === 0
    ? []
    : data.reduce(
        (acc, d, i) => {
          const angle = (d.value / total) * Math.PI * 2;
          if (angle === 0) return acc;
          const startAngle = acc.currentAngle;
          const endAngle = startAngle + angle;
          return {
            currentAngle: endAngle,
            segments: [
              ...acc.segments,
              { i, d, angle, startAngle, endAngle },
            ],
          };
        },
        { currentAngle: -Math.PI / 2, segments: [] }
      ).segments;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {total === 0 ? <div className="text-slate-400 text-sm">暂无资产数据</div> : (
        <svg viewBox="-130 -130 260 260" className="w-full h-full max-h-[200px] overflow-visible">
          {segments.map(({ i, d, startAngle, endAngle }) => {
            const x1 = Math.cos(startAngle) * 100; const y1 = Math.sin(startAngle) * 100;
            const x2 = Math.cos(endAngle) * 100; const y2 = Math.sin(endAngle) * 100;
            const angle = endAngle - startAngle;
            const largeArc = angle > Math.PI ? 1 : 0;
            const innerR = 60, outerR = 100;
            const ix1 = Math.cos(startAngle) * innerR, iy1 = Math.sin(startAngle) * innerR;
            const ix2 = Math.cos(endAngle) * innerR, iy2 = Math.sin(endAngle) * innerR;

            const isHovered = hoverInfo?.idx === i;
            const midAngle = (startAngle + endAngle) / 2;
            const translateX = isHovered ? Math.cos(midAngle) * 8 : 0;
            const translateY = isHovered ? Math.sin(midAngle) * 8 : 0;

            const pathData = `M ${ix1} ${iy1} L ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;

            return (
              <path
                key={d.name}
                d={pathData}
                fill={d.color}
                stroke="#fff"
                strokeWidth="2"
                style={{ transform: `translate(${translateX}px, ${translateY}px)`, transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                onMouseMove={(e) => setHoverInfo({ idx: i, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setHoverInfo(null)}
                className="cursor-pointer"
              />
            );
          })}
          <text x="0" y="-5" textAnchor="middle" fontSize="12" fill="#94a3b8" fontWeight="500">总资产估值</text>
          <text x="0" y="15" textAnchor="middle" fontSize="16" fill="#1e293b" fontWeight="800">¥{total > 10000 ? (total/10000).toFixed(1)+'w' : total}</text>
        </svg>
      )}
      {hoverInfo !== null && (
         <div className="fixed z-[9999] bg-slate-900/90 text-white px-3 py-2 rounded-xl shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full text-sm flex items-center gap-2 whitespace-nowrap"
              style={{ left: hoverInfo.x, top: hoverInfo.y - 15, transition: 'opacity 0.2s' }}>
           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data[hoverInfo.idx].color }}></div>
           <span>{data[hoverInfo.idx].name}</span>
           <span className="font-bold">¥{data[hoverInfo.idx].value.toLocaleString()}</span>
           <span className="text-slate-400 text-xs ml-1">({((data[hoverInfo.idx].value/total)*100).toFixed(1)}%)</span>
         </div>
      )}
    </div>
  );
};