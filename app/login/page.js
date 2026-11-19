"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { authService } from "../services/authService";
import { getApplicationRoute } from "../lib/merchantStatus";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [unverifiedUserId, setUnverifiedUserId] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setUnverifiedUserId("");
    setLoading(true);

    try {
      const res = await authService.login({ email, password });

      if (res && res.status) {
        let destination = null;
        try {
          const profileResponse = await authService.getMerchantProfile();
          if (profileResponse?.status && profileResponse?.data) {
            destination = getApplicationRoute(profileResponse.data);
          }
        } catch (e) {
          console.warn("Could not fetch profile during login, falling back to login payload status", e);
        }

        if (!destination) {
          destination = getApplicationRoute(res) || getApplicationRoute(res?.data) || "/";
        }

        // Route to Congratulations screen ONLY the first time after approval
        if (destination === "/") {
          const user = authService.getUser() || res?.data || res || {};
          const merchantId = user?._id || user?.id || user?.email || "default";
          const hasSeenCongrats = typeof window !== "undefined" && localStorage.getItem(`eventuna_congrats_seen_${merchantId}`);
          if (!hasSeenCongrats) {
            destination = "/congratulations";
          } else {
            destination = "/";
          }
        }

        setSuccessMsg(res.message || "Login successful!");
        router.replace(destination);
      } else {
        const msg = res?.message || "Invalid credentials. Please try again.";
        setErrorMsg(msg);
        if (res?.userId && msg.toLowerCase().includes("not verified")) {
          setUnverifiedUserId(res.userId);
        }
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="form-wrapper bg-light d-flex align-items-center justify-content-center" style={{ minHeight: "calc(100vh - 90px)", paddingTop: "100px", paddingBottom: "100px" }}>
        <div className="container d-flex justify-content-center align-items-center">
          <div
            className="registration border p-5 rounded-4 bg-white shadow-lg position-relative"
            style={{ maxWidth: "450px", width: "100%" }}
          >
            <form onSubmit={handleLogin}>
              <h2 className="fw-bold mb-4" style={{ color: "#0c1b33", fontSize: "32px", textAlign: "center" }}>Login</h2>

              {errorMsg && (
                <div className="alert alert-danger py-2 fs-6 rounded-3 mb-3" role="alert">
                  <i className="fa-solid fa-circle-exclamation me-2"></i>
                  {errorMsg}
                  {unverifiedUserId && (
                    <div className="mt-2 pt-2 border-top border-danger-subtle">
                      <Link
                        href={`/verification?userId=${encodeURIComponent(unverifiedUserId)}`}
                        className="btn btn-sm btn-danger text-white w-100 fw-semibold"
                      >
                        <i className="fa-solid fa-shield-halved me-1"></i> Verify Account Now
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {successMsg && (
                <div className="alert alert-success py-2 fs-6 rounded-3 mb-3" role="alert">
                  <i className="fa-solid fa-circle-check me-2"></i>
                  {successMsg}
                </div>
              )}
                      
              <div className="form-group mb-3">
                <label className="form-label fw-semibold">Your Email*</label>
                <input
                  className="form-control h_50"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group mb-4">
                <div className="field-password d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label fw-semibold mb-0">Password*</label>
                  <Link href="/reset-password" className="forgot-pass-link small text-decoration-none" style={{ color: "#5b67f1" }}>
                    Forgot Password?
                  </Link>
                </div>
                <div className="loc-group position-relative">
                  <input
                    className="form-control h_50 pe-5"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span
                    className="pass-show-eye position-absolute top-50 translate-middle-y me-3 end-0 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ zIndex: 10 }}
                  >
                    <i className={`fas ${showPassword ? "fa-eye" : "fa-eye-slash"} text-muted`}></i>
                  </span>
                </div>
              </div>

              <button
                className="main-btn btn-hover w-100 mt-2 border-0 d-flex align-items-center justify-content-center"
                type="submit"
                disabled={loading}
                style={{ height: "50px", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? (
                  <span><i className="fa-solid fa-spinner fa-spin me-2"></i> Logging in...</span>
                ) : (
                  <span>Login <i className="fas fa-sign-in-alt ms-2"></i></span>
                )}
              </button>
            </form>

            <div className="text-center mt-4" style={{ display: "block" }}>
              <span className="text-muted">New User? </span>
              <Link href="/signup" className="signup-link text-decoration-none fw-bold" style={{ color: "#5b67f1" }}>
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
