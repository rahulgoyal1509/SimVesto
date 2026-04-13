import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../services/api';
import useStore from '../../store/useStore';

export default function FearHistoryChart() {
  const [data, setData] = useState([]);
  const user = useStore(s => s.user);

  useEffect(() => {
    if (!user?._id) return;
    api.getFearHistory(user._id).then(res => {
      // Format chart data
      if (Array.isArray(res)) {
        const d = res.map((item, idx) => {
           let classification = 'LOW';
           if (item.score >= 67) classification = 'HIGH';
           else if (item.score >= 34) classification = 'MEDIUM';

           return {
             name: new Date(item.timestamp).toLocaleDateString(),
             score: item.score,
             classification,
             action: item.action
           }
        });
        setData(d);
      }
    });
  }, [user?._id]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ backgroundColor: '#fff', padding: '12px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>{data.name}</p>
          <p style={{ margin: '4px 0', color: payload[0].color }}>Score: {data.score} ({data.classification})</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Action: {data.action}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '300px', padding: '24px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #eee' }}>
       <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Fear Score Progression</h3>
       <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFA500" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#4CAF50" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="score" stroke="#FFA500" fillOpacity={1} fill="url(#colorScore)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
