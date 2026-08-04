const AssetCard = ({ asset }) => {
  return (
    <div className="bg-white border rounded p-4 h-100">
      <h3 className="h6 fw-semibold mb-2">{asset?.name || "Asset"}</h3>
      <p className="text-secondary mb-2">{asset?.category || "Uncategorized"}</p>
      <span className="badge text-bg-primary">{asset?.status || "Available"}</span>
    </div>
  );
};

export default AssetCard;
