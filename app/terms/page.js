"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function TermsPage() {
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
                  <h1 className="fw-bold display-5 mb-2" style={{ color: "#0c1b33" }}>Terms and Conditions</h1>
                  <p className="text-muted small mb-3">Last updated: September 25, 2025</p>
                  <div 
                    className="mx-auto" 
                    style={{ width: "60px", height: "4px", background: "linear-gradient(135deg, #5b6ef5, #7c8ef7)", borderRadius: "2px" }}
                  ></div>
                </div>

                <div className="content-body" style={{ color: "#4a5568", fontSize: "16px", lineHeight: "1.8" }}>
                  <p className="mb-4">
                    Welcome to <strong>Kiddo Loom</strong>! Please read these Terms and Conditions ("Terms", "Terms and Conditions") carefully before using our mobile application or website operated by Kiddo Loom (“we”, “our”, or “us”).
                  </p>

                  <h3 className="fw-bold mt-5 mb-3 text-dark" style={{ fontSize: "20px" }}>1. Acceptance of Terms</h3>
                  <p className="mb-4">
                    By accessing or using <strong>Kiddo Loom</strong>, you agree to be bound by these Terms. If you do not agree with any part of the Terms, you may not access or use our services.
                  </p>

                  <h3 className="fw-bold mt-5 mb-3 text-dark" style={{ fontSize: "20px" }}>2. Use of Service</h3>
                  <ul className="mb-4 ps-3">
                    <li className="mb-2">You must be at least 18 years old or have parental consent to use Kiddo Loom.</li>
                    <li className="mb-2">You agree not to misuse our platform or assist others in doing so.</li>
                    <li className="mb-2">All information you provide must be accurate and up to date.</li>
                  </ul>

                  <h3 className="fw-bold mt-5 mb-3 text-dark" style={{ fontSize: "20px" }}>3. Intellectual Property</h3>
                  <p className="mb-4">
                    All content, features, and functionality of <strong>Kiddo Loom</strong> — including but not limited to text, images, logos, and software — are the exclusive property of Kiddo Loom and its licensors, protected under copyright, trademark, and other laws.
                  </p>

                  <h3 className="fw-bold mt-5 mb-3 text-dark" style={{ fontSize: "20px" }}>4. Termination</h3>
                  <p className="mb-4">
                    We may suspend or terminate access to <strong>Kiddo Loom</strong> immediately, without prior notice, for any reason, including violation of these Terms.
                  </p>

                  <h3 className="fw-bold mt-5 mb-3 text-dark" style={{ fontSize: "20px" }}>5. Changes to Terms</h3>
                  <p className="mb-4">
                    We reserve the right to modify or replace these Terms at any time. Updated Terms will be posted within the app or on our website and will become effective immediately upon posting.
                  </p>

                  <h3 className="fw-bold mt-5 mb-3 text-dark" style={{ fontSize: "20px" }}>6. Limitation of Liability</h3>
                  <p className="mb-4">
                    <strong>Kiddo Loom</strong> shall not be held liable for any indirect, incidental, special, or consequential damages arising from the use or inability to use our services.
                  </p>

                  <h3 className="fw-bold mt-5 mb-3 text-dark" style={{ fontSize: "20px" }}>7. Contact Us</h3>
                  <p className="mb-0">
                    If you have any questions about these Terms and Conditions, please contact us at:
                  </p>
                  <p className="mt-2 mb-0">
                    <strong>Email:</strong> <span className="text-primary">support@kiddoloom.com</span>
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
