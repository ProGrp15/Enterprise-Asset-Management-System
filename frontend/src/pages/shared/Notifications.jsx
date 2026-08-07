/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaCheckDouble, FaSyncAlt, FaExternalLinkAlt, FaTrash } from 'react-icons/fa';
import { notifications } from '../../services/notificationService';

const rows = (value) => Array.isArray(value) ? value : value?.items || value?.content || [];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function notifIcon(title) {
  const t = (title || '').toLowerCase();
  if (t.includes('request')) return '📋';
  if (t.includes('approved') || t.includes('approve')) return '✅';
  if (t.includes('rejected') || t.includes('deny') || t.includes('denied')) return '❌';
  if (t.includes('maintenance') || t.includes('repair')) return '🔧';
  if (t.includes('asset')) return '📦';
  if (t.includes('allocation')) return '🔗';
  return '🔔';
}

function notifLink(item) {
  const t = (item.title || '').toLowerCase();
  if (t.includes('request')) return 'asset-requests';
  if (t.includes('maintenance')) return 'maintenance';
  if (t.includes('asset')) return 'assets';
  if (t.includes('allocation')) return 'asset-allocation';
  return null;
}

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try { setItems(rows(await notifications.list())); }
    catch (e) { setError(e.response?.data?.message || 'Unable to load notifications.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const unread = useMemo(() => items.filter(item => !item.is_read).length, [items]);
  const filtered = useMemo(() => {
    if (filter === 'unread') return items.filter(item => !item.is_read);
    if (filter === 'read') return items.filter(item => item.is_read);
    return items;
  }, [items, filter]);

  const markRead = async (id) => {
    try {
      await notifications.markRead(id);
      setItems(current => current.map(item => item.notification_id === id ? { ...item, is_read: true } : item));
    } catch (e) { setError(e.response?.data?.message || 'Unable to update notification.'); }
  };

  const markAllRead = async () => {
    try {
      await notifications.markAllRead();
      setItems(current => current.map(item => ({ ...item, is_read: true })));
    } catch (e) { setError(e.response?.data?.message || 'Unable to update notifications.'); }
  };

  const remove = async (id) => {
    try {
      await notifications.remove(id);
      setItems(current => current.filter(item => item.notification_id !== id));
    } catch (e) { setError(e.response?.data?.message || 'Unable to delete notification.'); }
  };

  const handleLink = (item) => {
    const link = notifLink(item);
    if (!link) return;
    // Try to navigate to the relevant page (company-admin or employee context)
    const path = window.location.pathname;
    const base = path.startsWith('/company-admin') ? '/company-admin' : path.startsWith('/employee') ? '/employee' : '';
    if (base) navigate(`${base}/${link}`);
  };

  return (
    <div className="page-heading">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <div className="eyebrow">Workspace inbox</div>
          <h1>Notifications</h1>
          <p>Approvals, lifecycle events, maintenance updates, and security alerts.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-ghost" onClick={load}><FaSyncAlt className="me-2" />Refresh</button>
          <button className="btn btn-primary" disabled={!unread} onClick={markAllRead}>
            <FaCheckDouble className="me-2" />Mark all read
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filter tabs */}
      <div className="d-flex gap-2 mb-3">
        {[['all', 'All'], ['unread', 'Unread'], ['read', 'Read']].map(([val, label]) => (
          <button
            key={val}
            className={`btn btn-sm ${filter === val ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(val)}
          >
            {label}
            {val === 'all' && ` (${items.length})`}
            {val === 'unread' && ` (${unread})`}
            {val === 'read' && ` (${items.length - unread})`}
          </button>
        ))}
      </div>

      <section className="surface overflow-hidden">
        {loading ? (
          <div className="p-5 text-center"><div className="spinner-border text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state p-5 text-center">
            <span className="empty-icon"><FaBell /></span>
            <h5 className="mt-3">
              {filter === 'unread' ? "You're all caught up!" : filter === 'read' ? 'No read notifications' : "No notifications yet"}
            </h5>
            <p className="muted mb-0">New workspace events will appear here.</p>
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {filtered.map((item) => {
              const link = notifLink(item);
              return (
                <div
                  className={`list-group-item p-4 d-flex gap-3 align-items-start ${item.is_read ? '' : 'bg-light'}`}
                  key={item.notification_id}
                  style={{ borderLeft: item.is_read ? 'none' : '3px solid var(--color-primary)' }}
                >
                  {/* Icon */}
                  <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>
                    {notifIcon(item.title)}
                  </span>

                  {/* Content */}
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                      <h5 className="mb-1 d-flex align-items-center gap-2">
                        {item.title || 'AssetFlow update'}
                        {!item.is_read && (
                          <span className="badge rounded-pill bg-primary" style={{ fontSize: '0.65rem' }}>New</span>
                        )}
                      </h5>
                      <small className="text-muted flex-shrink-0">{timeAgo(item.created_at)}</small>
                    </div>
                    <p className="mb-2 text-secondary">{item.message}</p>
                    <div className="d-flex gap-2 flex-wrap">
                      {!item.is_read && (
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => markRead(item.notification_id)}
                        >
                          Mark read
                        </button>
                      )}
                      {link && (
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => handleLink(item)}
                          title="Go to related page"
                        >
                          <FaExternalLinkAlt className="me-1" />View
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-ghost text-danger"
                        onClick={() => remove(item.notification_id)}
                        title="Delete notification"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
