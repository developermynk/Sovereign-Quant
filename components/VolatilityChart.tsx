
import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { VolatilityForecast } from '../types';

interface Props {
  data: VolatilityForecast[];
}

const VolatilityChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-all shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Risk Intelligence Forecast</h2>
          <p className="text-xs text-slate-500 font-mono mt-1">Model Instance: og-vol-ethusdt-v1-prod</p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold">RECURRENT NN</div>
          <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold uppercase">1H Interval</div>
        </div>
      </div>

      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.03)" />
            <XAxis 
              dataKey="timestamp" 
              stroke="#475569" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#475569" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '12px',
                padding: '12px',
                fontSize: '12px',
                color: '#f8fafc' 
              }}
              cursor={{ stroke: '#06b6d4', strokeWidth: 1 }}
            />
            <Area 
              type="monotone" 
              dataKey="volatility" 
              stroke="#06b6d4" 
              strokeWidth={3}
              fill="url(#chartGradient)"
              animationDuration={1500}
            />
            <ReferenceLine y={0.1} stroke="#ef4444" strokeDasharray="8 8" label={{ value: 'Risk Threshold', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VolatilityChart;
