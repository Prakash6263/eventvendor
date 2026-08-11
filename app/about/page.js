"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function AboutPage() {
  return (
    <>
      <Header />
      <div 
        className="bg-light" 
        style={{ 
          minHeight: "calc(100vh - 90px)", 
          paddingTop: "120px", 
          paddingBottom: "80px",
          background: "linear-gradient(135deg, #f8f9fc 0%, #f1f3f9 100%)" 
        }}
      >
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-9">
              <div 
                className="bg-white p-5 rounded-4 shadow-sm border border-light-subtle"
                style={{ borderRadius: "16px" }}
              >
                <div className="text-center mb-5">
                  <h1 className="fw-bold display-5 mb-3" style={{ color: "#0c1b33" }}>About Us</h1>
                  <div 
                    className="mx-auto" 
                    style={{ width: "60px", height: "4px", background: "linear-gradient(135deg, #5b6ef5, #7c8ef7)", borderRadius: "2px" }}
                  ></div>
                </div>

                <div className="content-body" style={{ color: "#4a5568", fontSize: "16px", lineHeight: "1.8" }}>
                  <p className="fs-5 mb-4" style={{ color: "#2d3748" }}>
                    <strong>Event Una</strong> is dedicated to making event management seamless, efficient, and enjoyable for everyone. Our platform connects organizers, merchants, and attendees, providing tools for event creation, promotion, and engagement.
                  </p>

                  <h3 className="fw-bold mt-5 mb-3 text-dark" style={{ fontSize: "22px" }}>Our Mission</h3>
                  <p className="mb-4">
                    To empower communities and businesses by simplifying the process of hosting and attending events, while fostering meaningful connections and memorable experiences.
                  </p>

                  <h3 className="fw-bold mt-5 mb-3 text-dark" style={{ fontSize: "22px" }}>What We Offer</h3>
                  <ul className="mb-4 ps-3" style={{ listStyleType: "none" }}>
                    <li className="mb-3 d-flex align-items-start gap-2">
                      <i className="bi bi-check-circle-fill text-primary mt-1" style={{ fontSize: "16px" }}></i>
                      <span>Easy event creation and management</span>
                    </li>
                    <li className="mb-3 d-flex align-items-start gap-2">
                      <i className="bi bi-check-circle-fill text-primary mt-1" style={{ fontSize: "16px" }}></i>
                      <span>Integrated merchant and product services</span>
                    </li>
                    <li className="mb-3 d-flex align-items-start gap-2">
                      <i className="bi bi-check-circle-fill text-primary mt-1" style={{ fontSize: "16px" }}></i>
                      <span>Real-time chat and notifications</span>
                    </li>
                    <li className="mb-3 d-flex align-items-start gap-2">
                      <i className="bi bi-check-circle-fill text-primary mt-1" style={{ fontSize: "16px" }}></i>
                      <span>Secure payment and reservation systems</span>
                    </li>
                    <li className="mb-3 d-flex align-items-start gap-2">
                      <i className="bi bi-check-circle-fill text-primary mt-1" style={{ fontSize: "16px" }}></i>
                      <span>Media sharing and community engagement</span>
                    </li>
                  </ul>

                  <h3 className="fw-bold mt-5 mb-3 text-dark" style={{ fontSize: "22px" }}>Contact Us</h3>
                  <p className="mb-0">
                    Have questions or want to partner with us? Reach out at: 
                    <strong className="ms-1 text-primary">support@eventuna.com</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
