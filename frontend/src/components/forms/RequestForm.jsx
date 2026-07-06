const RequestForm = () => {
  return (
    <form className="row g-3">
      <div className="col-12">
        <label className="form-label">Request Details</label>
        <textarea className="form-control" rows="3" placeholder="Describe the request" />
      </div>
      <div className="col-12">
        <button className="btn btn-primary" type="button">
          Submit Request
        </button>
      </div>
    </form>
  );
};

export default RequestForm;
