const AssetForm = () => {
  return (
    <form className="row g-3">
      <div className="col-md-6">
        <label className="form-label">Asset Name</label>
        <input className="form-control" placeholder="Laptop, phone, software" />
      </div>
      <div className="col-md-6">
        <label className="form-label">Category</label>
        <input className="form-control" placeholder="Hardware, software" />
      </div>
      <div className="col-12">
        <button className="btn btn-primary" type="button">
          Save Asset
        </button>
      </div>
    </form>
  );
};

export default AssetForm;
