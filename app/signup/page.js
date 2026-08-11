"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { authService } from "../services/authService";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import styles from "./signup.module.css";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryOptions = getCountries()
  .map((iso) => ({
    iso,
    country: regionNames.of(iso) || iso,
    code: `+${getCountryCallingCode(iso)}`,
  }))
  .sort((first, second) => first.country.localeCompare(second.country));

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    countryCode: "+966",
    mobile: "",
    password: "",
    confirmPassword: "",
    serviceId: "",
  });
  const [servicesList, setServicesList] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function loadServices() {
      setLoadingServices(true);
      try {
        const response = await authService.getServices();
        if (response && response.status && Array.isArray(response.services)) {
          setServicesList(response.services);
        } else {
          console.warn("Could not load services list", response);
        }
      } catch (err) {
        console.error("Failed to load services:", err);
      } finally {
        setLoadingServices(false);
      }
    }
    loadServices();
  }, []);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (form.password !== form.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (!form.serviceId) {
      setErrorMsg("Please select the service you provide.");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.signup({
        fullName: form.fullName,
        email: form.email,
        mobile: form.mobile,
        countryCode: form.countryCode,
        password: form.password,
        serviceId: form.serviceId,
        ios_register_id: "IOS123",
      });

      if (response?.status) {
        setSuccessMsg(response.message || "OTP sent successfully.");
        const userId = response.userId || "";
        setTimeout(() => {
          router.push(`/verification?userId=${encodeURIComponent(userId)}&mobile=${encodeURIComponent(`${form.countryCode} ${form.mobile}`)}`);
        }, 900);
      } else {
        setErrorMsg(response?.message || "Registration failed. Please try again.");
      }
    } catch {
      setErrorMsg("Unable to create the account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className={`${styles.page} form-wrapper bg-light`}>
        <section className={`${styles.phonePanel} registration border bg-white`}>
        <button type="button" className={styles.backButton} onClick={() => router.back()} aria-label="Go back">
          <i className="fa-solid fa-arrow-left" />
        </button>

        <h1 className={`${styles.title} registration-title`}>Create Business Account</h1>

        {errorMsg && <div className={styles.errorMessage}>{errorMsg}</div>}
        {successMsg && <div className={styles.successMessage}>{successMsg}</div>}

          <form onSubmit={handleSignup} className={styles.form}>
            <div className={styles.detailsColumn}>
              <label className={`${styles.field} form-control h_50`}>
            <i className="fa-regular fa-user" />
            <input
              type="text"
              placeholder="Full Name"
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              required
            />
              </label>

              <label className={`${styles.field} form-control h_50`}>
            <i className="fa-regular fa-envelope" />
            <input
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
            />
              </label>

              <div className={`${styles.field} ${styles.phoneField} form-control h_50`}>
                <i className="fa-solid fa-phone" />
                <select
                  aria-label="Country code"
                  value={form.countryCode}
                  onChange={(event) => updateField("countryCode", event.target.value)}
                >
                  {countryOptions.map((country) => (
                    <option key={country.iso} value={country.code}>
                      {country.code} - {country.country}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Phone Number"
                  value={form.mobile}
                  onChange={(event) => updateField("mobile", event.target.value.replace(/[^0-9]/g, ""))}
                  required
                />
              </div>

              <label className={`${styles.field} form-control h_50`}>
            <i className="fa-solid fa-lock" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              required
            />
            <button type="button" className={styles.eyeButton} onClick={() => setShowPassword((visible) => !visible)} aria-label="Toggle password visibility">
              <i className={`fa-regular ${showPassword ? "fa-eye" : "fa-eye-slash"}`} />
            </button>
              </label>

              <label className={`${styles.field} form-control h_50`}>
            <i className="fa-solid fa-lock" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
              required
            />
            <button type="button" className={styles.eyeButton} onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label="Toggle confirm password visibility">
              <i className={`fa-regular ${showConfirmPassword ? "fa-eye" : "fa-eye-slash"}`} />
            </button>
              </label>
            </div>

            <fieldset className={styles.services}>
              <legend>Select the service you provide</legend>
              {loadingServices ? (
                <div style={{ padding: "10px 0", color: "#666", fontSize: "14px" }}>
                  <i className="fa-solid fa-spinner fa-spin me-2" /> Loading services...
                </div>
              ) : (
                <div className={styles.serviceGrid}>
                  {servicesList.map((service) => (
                    <label className={styles.serviceOption} key={service._id}>
                      <span>{service.servicesName}</span>
                      <input
                        type="radio"
                        name="serviceId"
                        value={service._id}
                        checked={form.serviceId === service._id}
                        onChange={(event) => updateField("serviceId", event.target.value)}
                      />
                      <span className={styles.radioMark} aria-hidden="true" />
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            <div className={styles.formActions}>
              <button className={`${styles.submitButton} main-btn btn-hover`} type="submit" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
                {!loading && <i className="fa-solid fa-arrow-right" />}
              </button>
              <p className={styles.loginLink}>
                Already have an account? <Link className="signup-link" href="/login">Login</Link>
              </p>
            </div>
          </form>

        </section>
      </main>
      <Footer />
    </>
  );
}
