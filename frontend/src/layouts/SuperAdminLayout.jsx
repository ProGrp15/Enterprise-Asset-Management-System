import AppShell from '../components/layout/AppShell';

const SuperAdminLayout = ({ children }) => {
  return <AppShell role="super">{children}</AppShell>;
};

export default SuperAdminLayout;
