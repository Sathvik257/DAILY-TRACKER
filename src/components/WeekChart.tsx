import { format, parseISO } from 'date-fns';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMoney } from '../utils/currency';

interface WeekChartProps {
  data: { date: string; tasks: number; done: number; spent: number }[];
  currency: string;
}

export function WeekChart({ data, currency }: WeekChartProps) {
  const chartData = data.map((d) => ({
    day: format(parseISO(d.date), 'EEE'),
    progress: d.tasks > 0 ? Math.round((d.done / d.tasks) * 100) : 0,
    spent: d.spent,
  }));

  const tipStyle = {
    background: '#fff',
    border: '1px solid #E5DFD6',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#2C2825',
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Last 7 days</h2>
      </div>

      <div className="charts">
        <div className="chart-wrap">
          <p className="chart-label">Tasks completed</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE8E1" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#7A7268', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#7A7268', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={tipStyle} />
              <Bar dataKey="progress" fill="#2D5A4A" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-wrap">
          <p className="chart-label">Daily spending</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE8E1" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#7A7268', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#7A7268', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip formatter={(v) => [formatMoney(Number(v), currency), 'Spent']} contentStyle={tipStyle} />
              <Bar dataKey="spent" fill="#B85C38" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
