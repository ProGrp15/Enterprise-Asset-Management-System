import { FaBoxOpen, FaCodeBranch, FaDatabase, FaFileExport, FaPlus, FaSearch } from 'react-icons/fa';

const WorkspacePage = ({ title, description, action = 'Create', columns = [] }) => {
  return (
    <div className="page-heading">
      <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
        <div>
          <div className="eyebrow mb-2">Workspace Module</div>
          <h1>{title}</h1>
          <p className="text-muted">{description}</p>
        </div>
        <button className="btn btn-primary hover-lift"><FaPlus className="me-2"/>{action}</button>
      </div>

      <section className="surface overflow-hidden">
        <div className="p-3 border-bottom d-flex gap-2 flex-wrap align-items-center bg-light" style={{ backgroundColor: 'var(--canvas) !important' }}>
          <div className="input-group" style={{ maxWidth: 330, background: 'var(--surface)' }}>
            <span className="input-group-text border-end-0 bg-transparent">
              <FaSearch className="text-secondary" />
            </span>
            <input 
              className="form-control border-start-0 shadow-none bg-transparent" 
              placeholder={`Search ${title.toLowerCase()}...`}
            />
          </div>
          <button className="btn btn-ghost border ms-2">Filters</button>
          <button className="btn btn-ghost border ms-auto"><FaFileExport className="me-2"/>Export</button>
        </div>

        {columns.length ? (
          <div className="table-responsive">
            <table className="table workspace-table mb-0">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}><input type="checkbox" className="form-check-input" /></th>
                  {columns.map(c => <th key={c}>{c}</th>)}
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={columns.length + 2}>
                    <div className="empty-state">
                      <span className="empty-icon hover-lift mb-3"><FaDatabase /></span>
                      <h5 className="fw-bold mt-2">No {title.toLowerCase()} yet</h5>
                      <p className="text-muted mb-4 mx-auto" style={{ maxWidth: 400 }}>
                        This module is ready for data. Connect the backend endpoint or create a new record to start populating this table.
                      </p>
                      <button className="btn btn-primary hover-lift"><FaPlus className="me-2"/>{action}</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon hover-lift mb-3"><FaCodeBranch /></span>
            <h5 className="fw-bold mt-2">Module Under Construction</h5>
            <p className="text-muted mx-auto" style={{ maxWidth: 400 }}>
              The backend does not expose this resource yet. Your workspace is ready when it does.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default WorkspacePage;
