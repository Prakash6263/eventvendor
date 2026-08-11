"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authService } from "../services/authService";

const publicPaths = new Set(["/login", "/signup", "/verification", "/reset-password"]);

export default function MerchantAuthProvider({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const enforceAccess = () => {
      const loggedIn = authService.isLoggedIn();
      const publicPage = publicPaths.has(pathname);

      if (!loggedIn && !publicPage) {
        setChecking(true);
        router.replace("/login");
        return;
      }

      if (loggedIn && publicPage) {
        setChecking(true);
        router.replace("/");
        return;
      }

      setChecking(false);
    };

    enforceAccess();
    window.addEventListener("storage", enforceAccess);
    window.addEventListener("merchant-auth-change", enforceAccess);
    window.addEventListener("merchant-auth-expired", enforceAccess);
    return () => {
      window.removeEventListener("storage", enforceAccess);
      window.removeEventListener("merchant-auth-change", enforceAccess);
      window.removeEventListener("merchant-auth-expired", enforceAccess);
    };
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Checking session...</span>
        </div>
      </div>
    );
  }

  return children;
}
