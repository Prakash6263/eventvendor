"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { authService } from "../services/authService";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!newPassword) {
      setErrorMsg("Please enter your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await authService.changePassword({ newPassword });

      if (res && res.status) {
        setSuccessMsg(res.message || "Password changed successfully!");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        setErrorMsg(res?.message || "Failed to change password. Please try again.");
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please try again.");
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
            <button
              onClick={() => router.back()}
              className="border-0 bg-transparent mb-4 p-0 text-dark fs-4"
              style={{ cursor: "pointer" }}
              aria-label="Go back"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </button>

            <h2 className="fw-bold mb-2" style={{ color: "#0c1b33", fontSize: "32px" }}>
              Change Password
            </h2>
            <p className="text-muted small mb-4" style={{ fontSize: "15px", lineHeight: "1.5" }}>
              Enter your new password below to update your account password.
            </p>

            {errorMsg && (
              <div className="alert alert-danger py-2 fs-6 rounded-3 mb-3" role="alert">
                <i className="fa-solid fa-circle-exclamation me-2"></i>
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="alert alert-success py-2 fs-6 rounded-3 mb-3" role="alert">
                <i className="fa-solid fa-circle-check me-2"></i>
                {successMsg}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              {/* New Password */}
              <div className="form-group mb-3 position-relative">
                <span
                  className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
                  style={{ zIndex: 10 }}
                >
                  <i className="fa-solid fa-lock"></i>
                </span>
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="form-control rounded-pill border-light-subtle h_50 ps-5 pe-5"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ background: "#f8f9fa", border: "1px solid #e9ecef" }}
                  required
                />
                <span
                  className="position-absolute top-50 end-0 translate-middle-y me-3 text-muted cursor-pointer"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{ zIndex: 10 }}
                >
                  <i className={`fa-solid ${showNewPassword ? "fa-eye" : "fa-eye-slash"}`}></i>
                </span>
              </div>

              {/* Confirm Password */}
              <div className="form-group mb-4 position-relative">
                <span
                  className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
                  style={{ zIndex: 10 }}
                >
                  <i className="fa-solid fa-lock"></i>
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control rounded-pill border-light-subtle h_50 ps-5 pe-5"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ background: "#f8f9fa", border: "1px solid #e9ecef" }}
                  required
                />
                <span
                  className="position-absolute top-50 end-0 translate-middle-y me-3 text-muted cursor-pointer"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ zIndex: 10 }}
                >
                  <i className={`fa-solid ${showConfirmPassword ? "fa-eye" : "fa-eye-slash"}`}></i>
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn w-100 rounded-pill d-flex align-items-center justify-content-between px-4 py-3 text-white border-0 shadow-sm transition-all"
                style={{
                  background: "#5b67f1",
                  fontSize: "16px",
                  fontWeight: "bold",
                  height: "55px",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <span className="mx-auto">{loading ? "CHANGING..." : "CHANGE PASSWORD"}</span>
                <span
                  className="bg-white rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: "30px", height: "30px", color: "#5b67f1" }}
                >
                  {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-arrow-right"></i>}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
