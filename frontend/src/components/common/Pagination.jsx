const Pagination = ({ page = 1, totalPages = 1, onPageChange }) => {
  return (
    <div className="d-flex align-items-center justify-content-between gap-3">
      <button
        className="btn btn-outline-secondary btn-sm"
        disabled={page <= 1}
        onClick={() => onPageChange?.(page - 1)}
      >
        Previous
      </button>
      <span className="text-secondary">
        Page {page} of {totalPages}
      </span>
      <button
        className="btn btn-outline-secondary btn-sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange?.(page + 1)}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
