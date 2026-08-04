/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { FaBoxOpen, FaClipboardList, FaPlus, FaSyncAlt } from 'react-icons/fa';
import { assets, categories, requests } from '../../services/assetService';

const rows = value => Array.isArray(value) ? value : value?.items || value?.content || [];
const value = (row, ...keys) => keys.map(k => row?.[k]).find(v => v !== undefined && v !== null && v !== '') ?? '—';
const label = row => value(row, 'asset_name', 'assetName', 'name', 'asset_tag', 'assetTag');

function Shell({ eyebrow, title, description, children, action }) {
  return <div className="page-heading"><div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p className="muted mb-0">{description}</p></div>{action}</div>{children}</div>;
}

export function MyAssets() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = () => { setLoading(true); assets.list({ page: 0, size: 50 }).then(v => setItems(rows(v))).catch(e => setError(e.response?.data?.message || 'Unable to load your assigned assets.')).finally(() => setLoading(false)); };
  useEffect(load, []);
  return <Shell eyebrow="Employee workspace" title="My assets" description="Everything currently assigned to you, with its current lifecycle status." action={<button className="btn btn-ghost" onClick={load}><FaSyncAlt className="me-2"/>Refresh</button>}>
    {error && <div className="alert alert-danger">{error}</div>}
    <section className="surface overflow-hidden">{loading ? <div className="p-5 text-center"><div className="spinner-border text-primary"/></div> : items.length === 0 ? <div className="empty-state"><span className="empty-icon"><FaBoxOpen/></span><h5 className="mt-3">No assets assigned yet</h5><p className="muted">Approved allocations will appear here automatically.</p></div> : <div className="table-responsive"><table className="table workspace-table mb-0"><thead><tr><th>Asset</th><th>Tag</th><th>Serial number</th><th>Status</th><th>Location</th></tr></thead><tbody>{items.map((item, i) => <tr key={item.id || item.asset_id || i}><td className="fw-semibold">{label(item)}</td><td>{value(item, 'asset_tag', 'assetTag')}</td><td>{value(item, 'serial_number', 'serialNumber')}</td><td><span className="status-pill success"><span/>{value(item, 'status')}</span></td><td>{value(item, 'location_name', 'locationName')}</td></tr>)}</tbody></table></div>}</section>
  </Shell>;
}

export function RequestAsset() {
  const [cats, setCats] = useState([]); const [form, setForm] = useState({ categoryId: '', requestType: 'NEW_ASSET', reason: '' }); const [saving, setSaving] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  useEffect(() => { categories.list({ page: 0, size: 100 }).then(v => setCats(rows(v))).catch(() => setCats([])); }, []);
  const submit = async e => { e.preventDefault(); setSaving(true); setMessage(''); setError(''); try { await requests.create(form); setForm({ categoryId: '', requestType: 'NEW_ASSET', reason: '' }); setMessage('Request submitted. Your administrator will review it shortly.'); } catch (err) { setError(err.response?.data?.message || 'Unable to submit the request.'); } finally { setSaving(false); } };
  return <Shell eyebrow="Self-service" title="Request an asset" description="Tell your administrator what you need and why." action={<div className="feature-icon"><FaClipboardList/></div>}>
    {message && <div className="alert alert-success">{message}</div>}{error && <div className="alert alert-danger">{error}</div>}
    <section className="surface p-4 p-lg-5"><form onSubmit={submit}><div className="row g-4"><div className="col-md-6"><label className="form-label">Asset category</label><select className="form-select" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} required><option value="">Select a category</option>{cats.map(c => <option key={c.id || c.category_id} value={c.id || c.category_id}>{value(c, 'category_name', 'categoryName', 'name')}</option>)}</select></div><div className="col-md-6"><label className="form-label">Request type</label><select className="form-select" value={form.requestType} onChange={e => setForm({ ...form, requestType: e.target.value })}><option value="NEW_ASSET">New asset</option><option value="REPLACEMENT">Replacement</option><option value="UPGRADE">Upgrade</option></select></div><div className="col-12"><label className="form-label">Business reason</label><textarea className="form-control" rows="5" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Explain how this asset will help you work..." required minLength="5"/></div></div><button className="btn btn-primary mt-4" disabled={saving}><FaPlus className="me-2"/>{saving ? 'Submitting…' : 'Submit request'}</button></form></section>
  </Shell>;
}

export function RequestHistory() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = () => { setLoading(true); requests.list({ page: 0, size: 50 }).then(v => setItems(rows(v))).catch(e => setError(e.response?.data?.message || 'Unable to load request history.')).finally(() => setLoading(false)); };
  useEffect(load, []);
  return <Shell eyebrow="Self-service" title="Request history" description="Track every request you have submitted and its approval status." action={<button className="btn btn-ghost" onClick={load}><FaSyncAlt className="me-2"/>Refresh</button>}>
    {error && <div className="alert alert-danger">{error}</div>}<section className="surface overflow-hidden">{loading ? <div className="p-5 text-center"><div className="spinner-border text-primary"/></div> : items.length === 0 ? <div className="empty-state"><span className="empty-icon"><FaClipboardList/></span><h5 className="mt-3">No requests yet</h5><p className="muted">Your submitted requests will appear here.</p></div> : <div className="table-responsive"><table className="table workspace-table mb-0"><thead><tr><th>Category</th><th>Request type</th><th>Reason</th><th>Status</th><th>Submitted</th></tr></thead><tbody>{items.map((item, i) => <tr key={item.id || item.request_id || i}><td>{value(item, 'category_name', 'categoryName', 'category_id')}</td><td>{value(item, 'request_type', 'requestType')}</td><td>{value(item, 'reason')}</td><td><span className="status-pill success"><span/>{value(item, 'status')}</span></td><td>{value(item, 'created_at', 'createdAt')}</td></tr>)}</tbody></table></div>}</section>
  </Shell>;
}
