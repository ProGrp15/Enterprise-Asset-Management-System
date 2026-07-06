import { useSelector } from "react-redux";

const Profile = () => {
  const user = useSelector((state) => state.auth.user);

  return (
    <div>
      <h1 className="h3 fw-bold mb-3">Profile</h1>
      <section className="bg-white border rounded p-4">
        <div className="text-secondary">Name</div>
        <div className="fw-semibold mb-3">{user?.fullName || "-"}</div>
        <div className="text-secondary">Email</div>
        <div className="fw-semibold">{user?.email || "-"}</div>
      </section>
    </div>
  );
};

export default Profile;
