const AssetTable = ({ assets = [] }) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead>
          <tr>
            <th>Asset Name</th>
            <th>Tag / Serial</th>
            <th>Category</th>
            <th>Vendor</th>
            <th>Location</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {assets.length ? (
            assets.map((asset) => (
              <tr key={asset.asset_id || asset.id || asset.assetName || asset.name}>
                <td className="fw-semibold">{asset.asset_name || asset.assetName || asset.name}</td>
                <td>{asset.asset_tag || asset.assetTag || asset.serial_number || "—"}</td>
                <td>{asset.category_name || asset.category || "—"}</td>
                <td>{asset.vendor_name || asset.vendor || "—"}</td>
                <td>{asset.location_name || asset.location || "—"}</td>
                <td>
                  <span className="badge text-bg-success">{String(asset.status || "AVAILABLE").replaceAll("_", " ")}</span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center text-secondary py-4">
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
