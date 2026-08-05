import { useSelector } from "react-redux";
import { FaBuilding, FaEnvelope, FaIdBadge, FaShieldAlt } from "react-icons/fa";

export default function Profile() {
  const { user } = useSelector((state) => state.auth);
  const name = user?.name || user?.fullName || "Workspace member";
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <div className="page-content">
    <div className="page-header"><div><div className="eyebrow">Account</div><h1 className="page-title">Your profile</h1><p className="muted">Manage your identity and workspace access.</p></div></div>
    <div className="row g-4">
      <div className="col-xl-4"><section className="surface p-4 text-center h-100"><div className="profile-avatar mx-auto">{initials}</div><h3 className="mt-3 mb-1">{name}</h3><p className="muted mb-3">{user?.role?.replaceAll("_", " ") || "Workspace member"}</p><span className="status-pill success"><span />Active account</span></section></div>
      <div className="col-xl-8"><section className="surface p-4"><h3 className="h5 mb-4">Account details</h3><div className="row g-4"><div className="col-md-6"><label className="form-label">Full name</label><div className="profile-field"><FaIdBadge />{name}</div></div><div className="col-md-6"><label className="form-label">Email address</label><div className="profile-field"><FaEnvelope />{user?.email || "Not available"}</div></div><div className="col-md-6"><label className="form-label">Role</label><div className="profile-field"><FaShieldAlt />{user?.role?.replaceAll("_", " ") || "Member"}</div></div><div className="col-md-6"><label className="form-label">Workspace</label><div className="profile-field"><FaBuilding />{user?.company?.name || "AssetFlow workspace"}</div></div></div><div className="alert alert-light border mt-4 mb-0">Profile changes are managed by your company administrator.</div></section></div>
    </div>
  </div>;
}
