"use client";

import { useRouter } from "next/navigation";
import { authService } from "../services/authService";
import Footer from "./Footer";
import styles from "./merchantStatus.module.css";

export default function MerchantStatusLayout({ children, wide = false }) {
  const router = useRouter();

  const handleLogout = async () => {
    await authService.logout();
    router.replace("/login");
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <img className={styles.logo} src="/images/logo.png" alt="Eventuna" />
          <button type="button" className={styles.logoutButton} onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket" />
            <span>Logout</span>
          </button>
        </div>
      </header>
      <main className={`${styles.main} ${wide ? styles.mainWide : ""}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

