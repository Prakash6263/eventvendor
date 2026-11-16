"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { authService } from "../services/authService";
import styles from "./signup.module.css";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    countryCode: "+966",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    if (!form.email.trim()) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    if (!form.mobile.trim()) {
      setErrorMsg("Please enter your phone number.");
      return;
    }

    if (form.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        countryCode: form.countryCode.trim() || "+966",
        password: form.password,
        ios_register_id: "IOS123",
      };

      const response = await authService.signup(payload);

      if (response?.status) {
        setSuccessMsg(response.message || "OTP sent to mobile successfully.");
        const userId =
          response.userId ||
          response.merchantId ||
          response.data?._id ||
          response.data?.userId ||
          "";

        const fullMobile = `${payload.countryCode} ${payload.mobile}`;
        if (userId) {
          localStorage.setItem("eventuna-signup-user-id", userId);
          localStorage.setItem("eventuna-signup-mobile", fullMobile);
        }

        setTimeout(() => {
          router.push(
            `/verification?userId=${encodeURIComponent(userId)}&mobile=${encodeURIComponent(fullMobile)}`
          );
        }, 600);
      } else {
        setErrorMsg(response?.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setErrorMsg(err?.message || "Unable to create the account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className={styles.page}>
        <section className={styles.card}>
          {/* Top Bar with Back Arrow */}
          <div className={styles.topBar}>
            <button
              type="button"
              className={styles.backButton}
              onClick={() => router.back()}
              aria-label="Go back"
            >
              <i className="fa-solid fa-arrow-left" />
            </button>
          </div>

          <h1 className={styles.title}>Create Business Account</h1>

          {errorMsg && (
            <div className={styles.errorMessage} role="alert">
              <i className="fa-solid fa-circle-exclamation" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className={styles.successMessage} role="alert">
              <i className="fa-solid fa-circle-check" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className={styles.form} noValidate>
            {/* 1. Full Name */}
            <div className={styles.inputGroup}>
              <span className={styles.inputIcon}>
                <i className="fa-regular fa-user" />
              </span>
              <input
                className={styles.inputField}
                type="text"
                placeholder="Full Name"
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                required
              />
            </div>

            {/* 2. Email Address */}
            <div className={styles.inputGroup}>
              <span className={styles.inputIcon}>
                <i className="fa-regular fa-envelope" />
              </span>
              <input
                className={styles.inputField}
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
              />
            </div>

            {/* 3. Phone Number with Country Code */}
            <div className={styles.inputGroup}>
              <span className={styles.inputIcon}>
                <i className="fa-regular fa-envelope" />
              </span>
              <div className={styles.phoneGroup}>
                <span className={styles.phonePrefix}>{form.countryCode}</span>
                <input
                  className={styles.inputField}
                  type="tel"
                  inputMode="numeric"
                  placeholder="Phone Number"
                  value={form.mobile}
                  onChange={(e) => updateField("mobile", e.target.value.replace(/[^0-9]/g, ""))}
                  required
                />
              </div>
            </div>

            {/* 4. Password */}
            <div className={styles.inputGroup}>
              <span className={styles.inputIcon}>
                <i className="fa-solid fa-lock" />
              </span>
              <input
                className={styles.inputField}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label="Toggle password visibility"
              >
                <i className={`fa-regular ${showPassword ? "fa-eye" : "fa-eye-slash"}`} />
              </button>
            </div>

            {/* 5. Confirm Password */}
            <div className={styles.inputGroup}>
              <span className={styles.inputIcon}>
                <i className="fa-solid fa-lock" />
              </span>
              <input
                className={styles.inputField}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label="Toggle confirm password visibility"
              >
                <i className={`fa-regular ${showConfirmPassword ? "fa-eye" : "fa-eye-slash"}`} />
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              <span className={styles.submitText}>
                {loading ? "CREATING ACCOUNT..." : "SIGN UP"}
              </span>
              <span className={styles.arrowCircle}>
                {loading ? (
                  <i className="fa-solid fa-spinner fa-spin" />
                ) : (
                  <i className="fa-solid fa-arrow-right" />
                )}
              </span>
            </button>

            {/* Bottom Link */}
            <p className={styles.footerText}>
              Already have an account?{" "}
              <Link href="/login" className={styles.footerLink}>
                Sign In
              </Link>
            </p>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
