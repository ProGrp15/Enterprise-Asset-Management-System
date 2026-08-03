import Navbar from "../components/navbar/Navbar";
import Footer from "../components/common/Footer";

const MainLayout = ({ children }) => {
  return (
    <>
      <Navbar />

      <main
        style={{
          minHeight: "80vh",
          backgroundColor: "#f8fafc",
        }}
      >
        {children}
      </main>

      <Footer />
    </>
  );
};

export default MainLayout;