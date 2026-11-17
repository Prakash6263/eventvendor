"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "../services/authService";
import styles from "./congratulations.module.css";

export default function CongratulationsPage() {
  const router = useRouter();

  // Mark as seen so this screen only ever appears the first time after approval
  useEffect(() => {
    const user = authService.getUser() || {};
    const merchantId = user?._id || user?.id || user?.email || "default";
    localStorage.setItem(`eventuna_congrats_seen_${merchantId}`, "true");
  }, []);

  const handleDismiss = (destination) => {
    const user = authService.getUser() || {};
    const merchantId = user?._id || user?.id || user?.email || "default";
    localStorage.setItem(`eventuna_congrats_seen_${merchantId}`, "true");
    router.push(destination);
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.cardContainer}>
        {/* Top Back Navigation */}
        <div className={styles.topNav}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => handleDismiss("/")}
            aria-label="Back"
          >
            <i className="bi bi-arrow-left"></i>
          </button>
        </div>

        {/* Green Title */}
        <h2 className={styles.congratsTitle}>Congratulations</h2>

        {/* Celebration Artwork with Animated Dots */}
        <div className={styles.artworkWrapper} aria-hidden="true">
          <span className={`${styles.dot} ${styles.dot1}`}></span>
          <span className={`${styles.dot} ${styles.dot2}`}></span>
          <span className={`${styles.dot} ${styles.dot3}`}></span>
          <span className={`${styles.dot} ${styles.dot4}`}></span>
          <span className={`${styles.dot} ${styles.dot5}`}></span>
          <span className={`${styles.dot} ${styles.dot6}`}></span>
          <span className={`${styles.dot} ${styles.dot7}`}></span>
          <span className={`${styles.dot} ${styles.dot8}`}></span>

          <div className={styles.checkmarkBadge}>
            <svg
              className={styles.badgeShape}
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Scalloped badge polygon */}
              <path
                d="M50 0L61.8 8.8L76.5 5.1L84.3 18.2L98.5 23.5L99.2 38.6L108 50L99.2 61.4L98.5 76.5L84.3 81.8L76.5 94.9L61.8 91.2L50 100L38.2 91.2L23.5 94.9L15.7 81.8L1.5 76.5L0.8 61.4L-8 50L0.8 38.6L1.5 23.5L15.7 18.2L23.5 5.1L38.2 8.8L50 0Z"
                fill="#2bd980"
                transform="translate(4, 0) scale(0.92)"
              />
            </svg>
            <i className="bi bi-check2 text-white" style={{ fontSize: "52px", fontWeight: "900", position: "relative", zIndex: 2 }}></i>
          </div>
        </div>

        {/* Notification Text */}
        <div className={styles.textBlock}>
          <h5 className="fw-bold mb-2 text-dark">Congratulations</h5>
          <p className="text-muted" style={{ fontSize: "14.5px", lineHeight: "1.6", maxWidth: "340px", margin: "0 auto" }}>
            Your application has been approved. Users of this application can now see your facility in the list of available facilities
          </p>
        </div>

        {/* View Profile Action Button */}
        <div className={styles.actionWrapper}>
          <button
            type="button"
            className={styles.viewProfileBtn}
            onClick={() => handleDismiss("/vendor-profile")}
          >
            VIEW PROFILE
          </button>
        </div>
      </div>
    </div>
  );
}

