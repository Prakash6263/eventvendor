"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <div 
        className="bg-light flex-grow-1" 
        style={{ 
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
                  <h1 className="fw-bold display-5 mb-2" style={{ color: "#0c1b33" }}>Privacy Policy</h1>
                  <p className="text-muted small mb-3">Effective Date: October 2025</p>
                  <div 
                    className="mx-auto" 
                    style={{ width: "60px", height: "4px", background: "linear-gradient(135deg, #5b6ef5, #7c8ef7)", borderRadius: "2px" }}
                  ></div>
                </div>

                <div className="content-body" style={{ color: "#4a5568", fontSize: "16px", lineHeight: "1.8" }}>
                  <p className="mb-4">
                    At <strong>Event Una</strong>, your privacy is very important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our services.
                  </p>

                  <h3 className="fw-bold mt-5 mb-3 text-dark" style={{ fontSize: "20px" }}>1. Information We Collect</h3>
                  <ul className="mb-4 ps-3">
                    <li className="mb-2"><strong>Personal Information:</strong> Name, email address, phone number, and other details you provide during registration or use of our services.</li>
                    <li className="mb-2"><strong>Usage Data:</strong> Information about how you interact with our app/website, including device details, IP address, and browser type.</li>
                    <li className="mb-2"><strong>Cookies & Tracking:</strong> We may use cookies to enhance user experience and analyze usage patterns.</li>
                  </ul>

                  <h3 className="fw-bold mt-5 mb-3 text-dark" style={{ fontSize: "20px" }}>2. How We Use Your Information</h3>
                  <ul className="mb-4 ps-3">
                    <li className="mb-2">To provide and improve our services.</li>
                    <li className="mb-2">To communicate with you regarding updates, events, or promotions.</li>
                    <li className="mb-2">To process payments and manage subscriptions.</li>
                    <li className="mb-2">To ensure security and prevent fraudulent activity.</li>
                  </ul>

                  <h3 className="fw-bold mt-5 mb-3 text-dark" style={{ fontSize: "20px" }}>3. Sharing of Information</h3>
                  <p className="mb-4">
                    We do not sell or rent your personal information. We may share your data only in the following cases:
                  </p>
                  <ul className="mb-4 ps-3">
                    <li className="mb-2">With service providers who assist us in delivering services (e.g., payment gateways).</li>
                    <li className="mb-2">If required by law or government authorities.</li>
                    <li className="mb-2">To protect our rights, safety, or property.</li>
                  </ul>

                  <h3 className="fw-bold mt-5 mb-3 text-dark" style={{ fontSize: "20px" }}>4. Data Security</h3>
                  <p className="mb-4">
                    We implement reasonable measures to protect your personal information. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
                  </p>

                  <h3 className="fw-bold mt-5 mb-3 text-dark" style={{ fontSize: "20px" }}>5. Your Rights</h3>
                  <ul className="mb-4 ps-3">
                    <li className="mb-2">You can request access, correction, or deletion of your personal information.</li>
                    <li className="mb-2">You may opt out of promotional communications at any time.</li>
                  </ul>

                  <h3 className="fw-bold mt-5 mb-3 text-dark" style={{ fontSize: "20px" }}>6. Third-Party Links</h3>
                  <p className="mb-4">
                    Our app may contain links to third-party websites. We are not responsible for their privacy practices and encourage you to review their policies.
                  </p>

                  <h3 className="fw-bold mt-5 mb-3 text-dark" style={{ fontSize: "20px" }}>7. Changes to This Policy</h3>
                  <p className="mb-4">
                    We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date.
                  </p>

                  <h3 className="fw-bold mt-5 mb-3 text-dark" style={{ fontSize: "20px" }}>8. Contact Us</h3>
                  <p className="mb-0">
                    If you have questions about this Privacy Policy, please contact us at: 
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
