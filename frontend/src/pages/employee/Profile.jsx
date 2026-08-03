import { useSelector } from "react-redux";

const Profile = () => {
  const user = useSelector((state) => state.auth.user);

  return (
    <div>
      <h1 className="h3 fw-bold mb-3">Profile</h1>
      <section className="bg-white border rounded p-4">
        <div className="row g-3">
          <div className="col-md-6">
            <div className="text-secondary">Name</div>
            <div className="fw-semibold">{user?.fullName || "-"}</div>
          </div>
          <div className="col-md-6">
            <div className="text-secondary">Email</div>
            <div className="fw-semibold">{user?.email || "-"}</div>
          </div>
          <div className="col-md-6">
            <div className="text-secondary">Role</div>
            <div className="fw-semibold">{user?.role || "-"}</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;
