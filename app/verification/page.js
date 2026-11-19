"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { authService } from "../services/authService";
import styles from "./verification.module.css";

function VerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const userIdFromQuery = searchParams.get("userId") || "";
  const mobileFromQuery = searchParams.get("mobile") || "";

  const [effectiveUserId, setEffectiveUserId] = useState(userIdFromQuery);
  const [effectiveMobile, setEffectiveMobile] = useState(mobileFromQuery);

  useEffect(() => {
    if (!effectiveUserId && typeof window !== "undefined") {
      const stored = localStorage.getItem("eventuna-signup-user-id");
      if (stored) setEffectiveUserId(stored);
    }
    if (!effectiveMobile && typeof window !== "undefined") {
      const stored = localStorage.getItem("eventuna-signup-mobile");
      if (stored) setEffectiveMobile(stored);
    }
  }, [effectiveUserId, effectiveMobile]);

  const [otp, setOtp] = useState(["", "", "", ""]);
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showIosAlert, setShowIosAlert] = useState(false);

  const handleOtpChange = (index, value) => {
    // Only accept numeric characters
    const cleanValue = value.replace(/[^0-9]/g, "");
    if (!cleanValue && value !== "") return;

    const newOtp = [...otp];
    newOtp[index] = cleanValue.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next box
    if (cleanValue !== "" && index < 3) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 4);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < 4; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);

    const targetIndex = Math.min(pasted.length, 3);
    otpRefs[targetIndex].current?.focus();
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const enteredCode = otp.join("");
    if (enteredCode.length < 4) {
      setErrorMsg("Please enter the complete 4-digit verification code.");
      return;
    }

    const activeUserId = effectiveUserId || userIdFromQuery;
    if (!activeUserId) {
      setErrorMsg("User ID missing. Please return to signup and register again.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        merchantId: activeUserId,
        userId: activeUserId,
        otp: enteredCode,
      };

      const res = await authService.verifyOtp(payload);

      if (res && res.status) {
        // Show the iOS Alert Modal popup matching iOS screenshot
        setShowIosAlert(true);
      } else {
        setErrorMsg(res?.message || "Invalid OTP code. Please try again.");
      }
    } catch (err) {
      setErrorMsg(err?.message || "An error occurred during verification. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAlertOk = () => {
    setShowIosAlert(false);
    router.push("/account-created");
  };

  const handleResend = async () => {
    const activeUserId = effectiveUserId || userIdFromQuery;
    if (!activeUserId) {
      setErrorMsg("User ID missing. Please return to signup and register again.");
      return;
    }

    setOtp(["", "", "", ""]);
    setErrorMsg("");
    setResending(true);

    try {
      const res = await authService.resendOtp({ merchantId: activeUserId, userId: activeUserId });
      if (res?.status) {
        setSuccessMsg(res.message || "Verification code has been re-sent to your mobile number.");
        if (otpRefs[0].current) {
          otpRefs[0].current.focus();
        }
        setTimeout(() => {
          setSuccessMsg("");
        }, 5000);
      } else {
        setErrorMsg(res?.message || "Failed to resend verification code. Please try again.");
      }
    } catch (err) {
      setErrorMsg(err?.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <>
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

        {/* Title */}
        <h1 className={styles.title}>Verification</h1>

        {/* Subtitle matching iOS screenshot */}
        <p className={styles.subtitle}>
          We&apos;ve send you the verification code on your mobile number
        </p>

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

        <form onSubmit={handleVerifySubmit} noValidate>
          {/* 4 OTP Digit Boxes */}
          <div className={styles.otpRow} onPaste={handleOtpPaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={otpRefs[idx]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                placeholder="-"
                className={styles.otpBox}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            <span className={styles.submitText}>
              {loading ? "VERIFYING..." : "SUBMIT"}
            </span>
            <span className={styles.arrowCircle}>
              {loading ? (
                <i className="fa-solid fa-spinner fa-spin" />
              ) : (
                <i className="fa-solid fa-arrow-right" />
              )}
            </span>
          </button>
        </form>

        {/* Re-send link in red matching iOS screenshot */}
        <div className={styles.resendContainer}>
          <button
            type="button"
            className={styles.resendButton}
            onClick={handleResend}
            disabled={resending || loading}
          >
            {resending ? "Re-sending code..." : "Re-send"}
          </button>
        </div>
      </section>

      {/* iOS Alert Modal Dialog */}
      {showIosAlert && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalDialog}>
            <div className={styles.modalTitle}>Event UNA</div>
            <div className={styles.modalMessage}>Verified successfully please login!</div>
            <div className={styles.modalDivider} />
            <button
              type="button"
              className={styles.modalAction}
              onClick={handleAlertOk}
            >
              Ok
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function VerificationPage() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        <Suspense fallback={<div>Loading verification...</div>}>
          <VerificationForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
