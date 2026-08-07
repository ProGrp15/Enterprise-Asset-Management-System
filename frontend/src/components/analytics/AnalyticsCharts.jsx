import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const palette = ['#7c3aed', '#06b6d4', '#22c55e', '#f59e0b', '#f43f5e'];
const tooltipStyle = { background: '#111827', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, color: '#f8fafc' };

const ChartCard = ({ eyebrow, title, copy, children, className = '' }) => (
  <section className={`analytics-card ${className}`}>
    <div className="analytics-card-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h3>{title}</h3>
        {copy && <p>{copy}</p>}
      </div>
      <span className="chart-pulse" aria-hidden="true" />
    </div>
    <div className="analytics-chart">{children}</div>
  </section>
);

const EmptyChart = ({ message = 'No data available yet' }) => <div className="chart-empty"><span>{message}</span></div>;

export function AnalyticsSuite({ assetStatus, trendData, requestData, scatterData, compact = false }) {
  const status = assetStatus?.length ? assetStatus : [
    { name: 'Assigned', value: 48 }, { name: 'Available', value: 29 }, { name: 'Maintenance', value: 14 }, { name: 'Retired', value: 9 },
  ];
  const trend = trendData?.length ? trendData : [
    { month: 'Jan', utilization: 58, requests: 18 }, { month: 'Feb', utilization: 65, requests: 24 }, { month: 'Mar', utilization: 61, requests: 21 },
    { month: 'Apr', utilization: 74, requests: 32 }, { month: 'May', utilization: 79, requests: 28 }, { month: 'Jun', utilization: 86, requests: 39 },
  ];
  const requests = requestData?.length ? requestData : [
    { name: 'Pending', count: 18 }, { name: 'Approved', count: 34 }, { name: 'In progress', count: 12 }, { name: 'Completed', count: 46 },
  ];
  const scatter = scatterData?.length ? scatterData : [
    { x: 12, y: 28, z: 9, label: 'Laptop' }, { x: 24, y: 42, z: 14, label: 'Monitor' }, { x: 38, y: 35, z: 18, label: 'Network' },
    { x: 52, y: 66, z: 24, label: 'Printer' }, { x: 68, y: 55, z: 20, label: 'Server' }, { x: 82, y: 78, z: 27, label: 'Vehicle' },
  ];

  return <div className={`analytics-grid ${compact ? 'analytics-grid-compact' : ''}`}>
    <ChartCard eyebrow="Portfolio mix" title="Asset health" copy="A live view of how inventory is being used.">
      {status.length ? <ResponsiveContainer width="100%" height="100%"><PieChart>
        <Pie data={status} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="78%" paddingAngle={4} stroke="none">
          {status.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={palette[index % palette.length]} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" verticalAlign="bottom" height={28} />
      </PieChart></ResponsiveContainer> : <EmptyChart />}
    </ChartCard>

    <ChartCard eyebrow="Momentum" title="Utilization trend" copy="Six-month operational efficiency trajectory.">
      <ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
        <defs><linearGradient id="utilizationFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" stopOpacity={.42} /><stop offset="100%" stopColor="#7c3aed" stopOpacity={0} /></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,.2)" /><XAxis dataKey="month" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} unit="%" /><Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="utilization" stroke="#7c3aed" strokeWidth={3} fill="url(#utilizationFill)" />
      </AreaChart></ResponsiveContainer>
    </ChartCard>

    <ChartCard eyebrow="Workflow" title="Request throughput" copy="Requests by current lifecycle stage.">
      <ResponsiveContainer width="100%" height="100%"><BarChart data={requests} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,.2)" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: 'rgba(124,58,237,.08)' }} contentStyle={tooltipStyle} /><Bar dataKey="count" radius={[8, 8, 2, 2]} fill="#06b6d4" />
      </BarChart></ResponsiveContainer>
    </ChartCard>

    {!compact && <ChartCard eyebrow="Risk map" title="Cost vs. utilization" copy="Find high-value assets that need attention.">
      <ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 8, right: 14, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.2)" /><XAxis type="number" dataKey="x" name="cost" unit="k" axisLine={false} tickLine={false} /><YAxis type="number" dataKey="y" name="utilization" unit="%" axisLine={false} tickLine={false} /><Tooltip cursor={{ strokeDasharray: '4 4' }} contentStyle={tooltipStyle} /><Scatter name="Assets" data={scatter} fill="#f43f5e" />
      </ScatterChart></ResponsiveContainer>
    </ChartCard>}

    {!compact && <ChartCard eyebrow="Demand" title="Requests vs utilization" copy="Compare demand signals across the reporting window.">
      <ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,.2)" /><XAxis dataKey="month" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Legend iconType="circle" /><Line type="monotone" dataKey="utilization" name="Utilization" stroke="#7c3aed" strokeWidth={3} dot={false} /><Line type="monotone" dataKey="requests" name="Requests" stroke="#f59e0b" strokeWidth={3} dot={false} />
      </LineChart></ResponsiveContainer>
    </ChartCard>}
  </div>;
}

export default AnalyticsSuite;
