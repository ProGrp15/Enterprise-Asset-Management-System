const RequestTable = ({ requests = [] }) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Category / Asset</th>
            <th>Request Type</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {requests.length ? (
            requests.map((request) => (
              <tr key={request.request_id || request.id || request.title}>
                <td className="fw-semibold">{request.employee_name || request.employee || "—"}</td>
                <td>{request.category_name || request.asset_name || request.title || "—"}</td>
                <td>{String(request.request_type || request.type || "NEW_ASSET").replaceAll("_", " ")}</td>
                <td>{request.reason || "—"}</td>
                <td>
                  <span className={`badge ${request.status === "APPROVED" ? "text-bg-success" : request.status === "REJECTED" ? "text-bg-danger" : "text-bg-warning"}`}>
                    {String(request.status || "PENDING").replaceAll("_", " ")}
                  </span>
                </td>
                <td>{request.created_at ? new Date(request.created_at).toLocaleDateString() : request.date || "—"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center text-secondary py-4">
                No requests available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RequestTable;
