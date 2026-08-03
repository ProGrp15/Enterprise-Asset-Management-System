import AppShell from '../components/layout/AppShell';

const EmployeeLayout = ({ children }) => {
  return <AppShell role="employee">{children}</AppShell>;
};

export default EmployeeLayout;
