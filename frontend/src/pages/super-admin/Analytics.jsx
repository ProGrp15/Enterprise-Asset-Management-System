import { useEffect, useMemo, useState } from 'react';
import { FaArrowUp, FaChartLine, FaDatabase, FaDownload, FaUsers } from 'react-icons/fa';
import { getSuperAdminDashboard } from '../../services/dashboardService';
import AnalyticsSuite from '../../components/analytics/AnalyticsCharts';

export default function Analytics() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getSuperAdminDashboard().then(setDashboard).catch(() => setError('Live metrics are unavailable. Showing the workspace preview.'));
  }, []);

  const assetStatus = useMemo(() => Object.entries((dashboard?.assets || []).reduce((result, asset) => {
    const key = String(asset.status || 'Available').replaceAll('_', ' ');
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {})).map(([name, value]) => ({ name, value })), [dashboard]);

  const stats = dashboard?.stats || {};
  return <div className="analytics-page">
    <div className="page-heading analytics-heading d-flex flex-wrap justify-content-between align-items-end gap-3">
      <div><div className="eyebrow">Platform intelligence</div><h1>Analytics command center</h1><p>See the signals behind every workspace, asset, and request.</p></div>
      <button className="btn btn-primary"><FaDownload className="me-2" /> Export insight pack</button>
    </div>
    {error && <div className="alert alert-warning border-0 shadow-sm">{error}</div>}
    <div className="row g-3 mb-4 analytics-kpis">
      {[[FaDatabase, 'Companies', stats.companies ?? 0, 'Across the platform'], [FaUsers, 'Users', stats.users ?? 0, 'Active workspace members'], [FaChartLine, 'Assets', stats.assets ?? 0, 'Tracked inventory'], [FaArrowUp, 'Momentum', '+18.4%', 'vs. previous period']].map(([Icon, label, value, copy], index) => <div className="col-sm-6 col-xl-3" key={label}><div className={`surface analytics-kpi kpi-${index + 1}`}><span className="analytics-kpi-icon"><Icon /></span><span className="muted">{label}</span><strong>{value}</strong><small><FaArrowUp className="me-1" />{copy}</small></div></div>)}
    </div>
    <AnalyticsSuite assetStatus={assetStatus} />
  </div>;
}
