import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaBoxOpen, FaClipboardList, FaBell } from 'react-icons/fa';
import AnalyticsSuite from '../../components/analytics/AnalyticsCharts';
import { getEmployeeDashboard } from '../../services/dashboardService';

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { getEmployeeDashboard().then(setDashboard).catch((err) => setError(err?.response?.data?.message || 'Failed to load dashboard.')); }, []);
  const stats = dashboard?.stats || {};
  const employee = dashboard?.employee;
  const company = dashboard?.company;
  const cards = [[FaBoxOpen, 'Assigned assets', stats.assignedAssets ?? 0, 'Your active equipment'], [FaClipboardList, 'Open requests', stats.openRequests ?? 0, 'Awaiting action'], [FaBell, 'Notifications', stats.notifications ?? 0, 'Unread updates']];

  return <div className="employee-dashboard">
    <div className="dashboard-welcome mb-4"><div><div className="eyebrow">Personal workspace</div><h1>Welcome, {employee?.full_name || 'Employee'}</h1><p>{company?.company_name || 'Your company workspace'} · Everything assigned to you, in one view.</p></div><Link className="btn btn-primary" to="/employee/request-asset">Request an asset <FaArrowRight className="ms-2" /></Link></div>
    {error && <div className="alert alert-danger">{error}</div>}
    <div className="row g-3 mb-4">{cards.map(([Icon, label, value, copy], index) => <div className="col-md-4" key={label}><div className={`surface employee-stat employee-stat-${index + 1}`}><span className="stat-icon"><Icon /></span><span className="muted">{label}</span><strong>{value}</strong><small className="muted">{copy}</small></div></div>)}</div>
    <div className="row g-4"><div className="col-xl-7"><AnalyticsSuite compact /></div><div className="col-xl-5"><section className="surface p-4 h-100"><span className="eyebrow">My details</span><h3 className="mt-2">Keep your profile current</h3><p className="muted">Accurate details help your operations team route requests and equipment correctly.</p><div className="profile-detail-list mt-4"><div><span>Name</span><strong>{employee?.full_name || '—'}</strong></div><div><span>Email</span><strong>{employee?.email || '—'}</strong></div><div><span>Workspace</span><strong>{company?.company_name || '—'}</strong></div></div><Link className="btn btn-ghost border mt-4" to="/employee/profile">View profile <FaArrowRight className="ms-2" /></Link></section></div></div>
  </div>;
}
