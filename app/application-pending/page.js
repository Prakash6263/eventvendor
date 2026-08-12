"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MerchantStatusLayout from "../components/MerchantStatusLayout";
import styles from "../components/merchantStatus.module.css";
import { authService } from "../services/authService";
import { getApplicationRoute } from "../lib/merchantStatus";

export default function ApplicationPendingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleHome = async () => {
    setChecking(true);
    setMessage("");
    setError("");
    try {
      const response = await authService.getMerchantProfile();
      if (!response?.status || !response?.data) {
        setError(response?.message || "Unable to check your application status.");
        return;
      }

      const destination = getApplicationRoute(response.data);
      if (destination && destination !== "/application-pending") {
        router.replace(destination);
        return;
      }
      setMessage("Your application is still under review. We will notify you when it is approved.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <MerchantStatusLayout>
      <section className={styles.statusCard}>
        <h1 className={styles.statusTitle}>Request to Add Restaurants</h1>
        <div className={styles.statusArtwork} aria-hidden="true">
          <span className={`${styles.dot} ${styles.dot1}`} />
          <span className={`${styles.dot} ${styles.dot2}`} />
          <span className={`${styles.dot} ${styles.dot3}`} />
          <span className={`${styles.dot} ${styles.dot4}`} />
          <span className={`${styles.dot} ${styles.dot5}`} />
          <span className={`${styles.dot} ${styles.dot6}`} />
          <div className={styles.successBadge}>
            <i className="fa-solid fa-check" />
          </div>
        </div>
        <p className={styles.statusText}>
          Your application has been submitted. Normally, it takes two days for applications to be approved.
          You will receive a notification when your account is reviewed. You can also return here to check
          whether your account has been activated or is still pending.
        </p>
        {message && <p className={`${styles.statusMessage} ${styles.statusInfo}`}>{message}</p>}
        {error && <p className={`${styles.statusMessage} ${styles.statusError}`}>{error}</p>}
        <button type="button" className={styles.statusAction} onClick={handleHome} disabled={checking}>
          {checking ? <><i className="fa-solid fa-spinner fa-spin" /> Checking status...</> : "HOME"}
        </button>
      </section>
    </MerchantStatusLayout>
  );
}

