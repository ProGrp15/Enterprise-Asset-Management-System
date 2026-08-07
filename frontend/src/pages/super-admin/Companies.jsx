/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import { FaBuilding, FaSearch, FaSyncAlt, FaBan, FaCheckCircle } from 'react-icons/fa';
import { getPlatformCompanies, updatePlatformCompanyStatus } from '../../services/authService';

export default function Companies() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'suspended'

  const load = () => {
    setLoading(true);
    getPlatformCompanies()
      .then(d => setData(Array.isArray(d) ? d : d?.content || d?.items || []))
      .catch(e => setError(e.response?.data?.message || 'Unable to load companies.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggle = async (company) => {
    const action = company.active ? 'Suspend' : 'Activate';
    if (!window.confirm(`${action} "${company.name}"? ${company.active ? 'All users in this company will be blocked from logging in.' : 'Users will regain access immediately.'}`)) return;
    setToggling(company.id);
    setError('');
    setSuccess('');
    try {
      await updatePlatformCompanyStatus(company.id, !company.active);
      setSuccess(`"${company.name}" has been ${company.active ? 'suspended' : 'activated'} successfully.`);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to update company status.');
    } finally {
      setToggling(null);
    }
  };

  const filtered = useMemo(() => {
    let list = data;
    if (filter === 'active') list = list.filter(c => c.active);
    else if (filter === 'suspended') list = list.filter(c => !c.active);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(c => (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.industry || '').toLowerCase().includes(q));
    }
    return list;
  }, [data, query, filter]);

  const activeCount = data.filter(c => c.active).length;
  const suspendedCount = data.filter(c => !c.active).length;

  return (
    <div className="page-heading">
      <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
        <div>
          <div className="eyebrow">Platform control</div>
          <h1>Companies</h1>
          <p>Manage tenant activation and suspension from the central platform workspace.</p>
        </div>
        <button className="btn btn-ghost" onClick={load} disabled={loading}>
          <FaSyncAlt className="me-2" />Refresh
        </button>
      </div>

      {/* KPI Summary */}
      <div className="row g-3 mb-4">
        <div className="col-sm-4">
          <div className="surface p-4 text-center">
            <FaBuilding className="mb-2 fs-4 text-primary" />
            <div className="display-6 fw-bold">{data.length}</div>
            <div className="text-secondary small">Total Companies</div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="surface p-4 text-center">
            <FaCheckCircle className="mb-2 fs-4 text-success" />
            <div className="display-6 fw-bold text-success">{activeCount}</div>
            <div className="text-secondary small">Active</div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="surface p-4 text-center">
            <FaBan className="mb-2 fs-4 text-danger" />
            <div className="display-6 fw-bold text-danger">{suspendedCount}</div>
            <div className="text-secondary small">Suspended</div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger d-flex justify-content-between align-items-center mb-3"><span>{error}</span><button className="btn btn-sm btn-ghost" onClick={() => setError('')}>✕</button></div>}
      {success && <div className="alert alert-success d-flex justify-content-between align-items-center mb-3"><span>{success}</span><button className="btn btn-sm btn-ghost" onClick={() => setSuccess('')}>✕</button></div>}

      <section className="surface overflow-hidden">
        <div className="table-toolbar">
          {/* Filter tabs */}
          <div className="d-flex gap-2">
            {['all', 'active', 'suspended'].map(f => (
              <button
                key={f}
                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'all' && ` (${data.length})`}
                {f === 'active' && ` (${activeCount})`}
                {f === 'suspended' && ` (${suspendedCount})`}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="input-group table-search ms-auto" style={{ maxWidth: 280 }}>
            <span className="input-group-text"><FaSearch /></span>
            <input
              className="form-control"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search companies..."
            />
          </div>
          <span className="record-count">{filtered.length} companies</span>
        </div>

        {loading ? (
          <div className="p-5 text-center"><div className="spinner-border text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state py-5 text-center">
            <span className="empty-icon fs-1 text-muted"><FaBuilding /></span>
            <h5 className="mt-3">No companies found</h5>
            <p className="muted">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table workspace-table mb-0 align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Industry</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td className="text-muted small">{c.id}</td>
                    <td className="fw-semibold">{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.industry || '—'}</td>
                    <td>{c.organizationSize || c.company_size || '—'}</td>
                    <td>
                      <span className={`status-pill ${c.active ? 'success' : 'danger'}`}>
                        <span />
                        {c.active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        className={`btn btn-sm ${c.active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                        onClick={() => toggle(c)}
                        disabled={toggling === c.id}
                        title={c.active ? 'Suspend this company' : 'Activate this company'}
                      >
                        {toggling === c.id ? (
                          <span className="spinner-border spinner-border-sm" />
                        ) : c.active ? (
                          <><FaBan className="me-1" />Suspend</>
                        ) : (
                          <><FaCheckCircle className="me-1" />Activate</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
