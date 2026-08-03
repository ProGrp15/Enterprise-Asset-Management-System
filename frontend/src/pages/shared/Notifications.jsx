/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import { FaBell, FaCheckDouble, FaSyncAlt } from 'react-icons/fa';
import { notifications } from '../../services/notificationService';

const rows = (value) => Array.isArray(value) ? value : value?.items || value?.content || [];

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try { setItems(rows(await notifications.list())); }
    catch (e) { setError(e.response?.data?.message || 'Unable to load notifications.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const unread = useMemo(() => items.filter((item) => !item.is_read).length, [items]);

  const markRead = async (id) => {
    try { await notifications.markRead(id); setItems((current) => current.map((item) => item.notification_id === id ? { ...item, is_read: true } : item)); }
    catch (e) { setError(e.response?.data?.message || 'Unable to update notification.'); }
  };

  const markAllRead = async () => {
    try { await notifications.markAllRead(); setItems((current) => current.map((item) => ({ ...item, is_read: true }))); }
    catch (e) { setError(e.response?.data?.message || 'Unable to update notifications.'); }
  };

  return <div className="page-heading">
    <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
      <div><div className="eyebrow">Workspace inbox</div><h1>Notifications</h1><p>Approvals, lifecycle events, maintenance updates, and security alerts.</p></div>
      <div className="d-flex gap-2"><button className="btn btn-ghost" onClick={load}><FaSyncAlt className="me-2"/>Refresh</button><button className="btn btn-primary" disabled={!unread} onClick={markAllRead}><FaCheckDouble className="me-2"/>Mark all read</button></div>
    </div>
    {error && <div className="alert alert-danger">{error}</div>}
    <section className="surface overflow-hidden">
      {loading ? <div className="p-5 text-center"><div className="spinner-border text-primary"/></div> : items.length === 0 ? <div className="empty-state p-5"><span className="empty-icon"><FaBell/></span><h5 className="mt-3">You’re all caught up</h5><p className="muted mb-0">New workspace events will appear here.</p></div> : <div className="list-group list-group-flush">{items.map((item) => <div className={`list-group-item p-4 d-flex gap-3 ${item.is_read ? '' : 'bg-light'}`} key={item.notification_id}>
        <span className="stat-icon flex-shrink-0"><FaBell/></span><div className="flex-grow-1"><div className="d-flex justify-content-between gap-3"><h5 className="mb-1">{item.title || 'AssetFlow update'}</h5><small className="muted">{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</small></div><p className="mb-0 muted">{item.message}</p></div>{!item.is_read && <button className="btn btn-sm btn-ghost align-self-center" onClick={() => markRead(item.notification_id)}>Mark read</button>}
      </div>)}</div>}
    </section>
  </div>;
}
