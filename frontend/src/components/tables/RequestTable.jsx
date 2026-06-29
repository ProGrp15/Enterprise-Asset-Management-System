const RequestTable = ({ requests = [] }) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead>
          <tr>
            <th>Request</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {requests.length ? (
            requests.map((request) => (
              <tr key={request.id || request.title}>
                <td>{request.title}</td>
                <td>{request.status}</td>
                <td>{request.date}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="text-center text-secondary py-4">
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
