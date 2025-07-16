import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string;
  value: number;
}

interface UserStatusChartProps {
  data: ChartData[];
  title: string;
  total: number;
}

const COLORS = ['#10B981', '#EF4444', '#F59E0B']; // Green, Red, Amber

const UserStatusChart: React.FC<UserStatusChartProps> = ({ data, title, total }) => {
  return (
    <div>
      <ResponsiveContainer width="100%" height={150}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={60}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value} (${((value as number / total) * 100).toFixed(0)}%)`} />
          <Legend iconSize={10} />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center mt-2">
        <p className="text-2xl font-bold">{total}</p>
        <p className="text-sm text-muted-foreground">Total {title}</p>
      </div>
    </div>
  );
};

export default UserStatusChart;
