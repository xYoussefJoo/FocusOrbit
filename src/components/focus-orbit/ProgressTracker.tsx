'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { day: 'Day 1', focus: 20 },
  { day: 'Day 15', focus: 35 },
  { day: 'Day 30', focus: 55 },
  { day: 'Day 45', focus: 45 },
  { day: 'Day 60', focus: 75 },
  { day: 'Day 75', focus: 85 },
  { day: 'Day 90', focus: 100 },
];

export function ProgressTracker() {
  return (
    <div className="w-full h-full min-h-[14rem] pt-6 pr-6 pb-2 pl-0 bg-surface/30 rounded-xl overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="day" stroke="#BBCABF" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1C1B1D', border: 'none', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ color: '#10b981' }}
          />
          <Area type="monotone" dataKey="focus" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorFocus)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
