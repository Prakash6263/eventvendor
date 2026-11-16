"use client";

import Header from "./Header";
import Footer from "./Footer";
import VendorSidebar from "./VendorSidebar";

export default function VendorPortalLayout({ children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f8f9fc" }}>
      <Header />
      <main style={{ flex: 1, paddingTop: "96px", paddingBottom: "50px" }}>
        <div className="container">
          <div className="row" style={{ alignItems: "flex-start" }}>
            <aside
              className="col-lg-3 col-md-12 mb-4 mb-lg-0"
              style={{
                position: "sticky",
                top: "96px",
                zIndex: 100,
                alignSelf: "flex-start",
              }}
            >
              <VendorSidebar />
            </aside>
            <div className="col-lg-9 col-md-12">
              {children}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

