const AssetTable = ({ assets = [] }) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {assets.length ? (
            assets.map((asset) => (
              <tr key={asset.id || asset.name}>
                <td>{asset.name}</td>
                <td>{asset.category}</td>
                <td>{asset.status}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="text-center text-secondary py-4">
                No assets available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AssetTable;
