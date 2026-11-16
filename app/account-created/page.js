"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import styles from "./accountCreated.module.css";

export default function AccountCreatedPage() {
  const router = useRouter();

  return (
    <>
      <Header />
      <main className={styles.page}>
        <section className={styles.card}>
          {/* Top Bar with Back Link */}
          <div className={styles.topBar}>
            <button
              type="button"
              className={styles.backButton}
              onClick={() => router.push("/login")}
              aria-label="Back"
            >
              <i className="fa-solid fa-chevron-left" /> Back
            </button>
          </div>

          {/* Heading */}
          <h1 className={styles.title}>Create or Service Provider Account</h1>

          {/* Subtitle with colored "but inactive" */}
          <p className={styles.subtitle}>
            Awesome, Your account has been created,{" "}
            <span className={styles.inactiveHighlight}>but inactive</span>
          </p>

          {/* Description */}
          <p className={styles.description}>
            Complete your profile to be accepted and added into the APP
          </p>

          {/* Artwork: Scalloped Green Checkmark + Celebration Dots */}
          <div className={styles.artworkContainer} aria-hidden="true">
            <span className={`${styles.dot} ${styles.dot1}`} />
            <span className={`${styles.dot} ${styles.dot2}`} />
            <span className={`${styles.dot} ${styles.dot3}`} />
            <span className={`${styles.dot} ${styles.dot4}`} />
            <span className={`${styles.dot} ${styles.dot5}`} />
            <span className={`${styles.dot} ${styles.dot6}`} />
            <span className={`${styles.dot} ${styles.dot7}`} />
            <span className={`${styles.dot} ${styles.dot8}`} />

            <div className={styles.badgeShape}>
              <svg
                className={styles.svgBadge}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M50 0L61.8 8.8L76.5 5.1L84.3 18.2L98.5 23.5L99.2 38.6L108 50L99.2 61.4L98.5 76.5L84.3 81.8L76.5 94.9L61.8 91.2L50 100L38.2 91.2L23.5 94.9L15.7 81.8L1.5 76.5L0.8 61.4L-8 50L0.8 38.6L1.5 23.5L15.7 18.2L23.5 5.1L38.2 8.8L50 0Z"
                  fill="#2bd980"
                  transform="translate(4, 0) scale(0.92)"
                />
              </svg>
              <i className={`fa-solid fa-check ${styles.checkIcon}`} />
            </div>
          </div>

          {/* Action Buttons: HOME & PROFILE */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.actionButton}
              onClick={() => router.push("/login")}
            >
              HOME
            </button>
            <button
              type="button"
              className={styles.actionButton}
              onClick={() => router.push("/login")}
            >
              PROFILE
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

