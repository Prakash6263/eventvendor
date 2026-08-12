"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="legal-page flex-grow-1">
        <div className="container">
          <article className="legal-card mx-auto">
            <h1>Terms &amp; Conditions</h1>
            <p className="text-muted">Last updated: August 11, 2026</p>
            <p>Welcome to <strong>Event Una</strong>. By accessing or using our website and vendor services, you agree to these Terms and Conditions.</p>
            <h2>1. Use of the service</h2>
            <p>You must provide accurate information, protect your account credentials, and use the platform only for lawful event and reservation activities.</p>
            <h2>2. Reservations and services</h2>
            <p>Merchants are responsible for reviewing reservation details, availability, pricing, confirmations, cancellations, and communications with customers.</p>
            <h2>3. Acceptable conduct</h2>
            <p>You may not misuse the platform, interfere with its operation, attempt unauthorized access, or submit fraudulent or harmful content.</p>
            <h2>4. Intellectual property</h2>
            <p>Event Una content, branding, software, and platform features are protected by applicable intellectual-property laws.</p>
            <h2>5. Suspension and termination</h2>
            <p>We may restrict or terminate access when these Terms are violated, the platform is misused, or action is required to protect users and services.</p>
            <h2>6. Limitation of liability</h2>
            <p>To the extent permitted by law, Event Una is not liable for indirect or consequential losses arising from use or inability to use the service.</p>
            <h2>7. Contact</h2>
            <p className="mb-0">Questions may be sent to <strong>support@eventuna.com</strong>.</p>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
