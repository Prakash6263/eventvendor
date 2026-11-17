"use client";

import Header from "./Header";
import VendorSidebar from "./VendorSidebar";

export default function VendorPortalLayout({ children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "#f8f9fc" }}>
      <Header />
      <div style={{ display: "flex", flex: 1, overflow: "hidden", paddingTop: "96px" }}>
        {/* Fixed Sidebar — single sleek container, no double scrollbar */}
        <aside
          className="vendor-portal-sidebar"
          style={{
            width: "275px",
            flexShrink: 0,
            height: "100%",
            overflowY: "auto",
            borderRight: "1px solid #e8ecf4",
            padding: "16px 12px 24px 12px",
            background: "#fff",
          }}
        >
          <VendorSidebar />
        </aside>
        {/* Main content — scrolls independently */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 32px 60px 32px",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

