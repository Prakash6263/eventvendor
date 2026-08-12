"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authService } from "../services/authService";
import {
  getApplicationRoute,
  normalizeApplicationStatus,
  STATUS_ONLY_PATHS,
} from "../lib/merchantStatus";

const authEntryPaths = new Set(["/login", "/signup", "/verification", "/reset-password"]);
const publicPaths = new Set([...authEntryPaths, "/about", "/privacy", "/terms"]);
export default function MerchantAuthProvider({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  // Render the static page immediately on a hard refresh. The client guard
  // still redirects unauthenticated/status-mismatched sessions after mount,
  // but a slow network or dev-server hydration must not leave a blank spinner.
  const [checking, setChecking] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const validatedTokenRef = useRef("");

  useEffect(() => {
    let cancelled = false;

    const redirect = (path) => {
      if (cancelled) return;
      setChecking(true);
      router.replace(path);
    };

    const enforceStatusRoute = (applicationStatus) => {
      const destination = getApplicationRoute(applicationStatus);
      if (!destination) return false;

      if (authEntryPaths.has(pathname)) {
        redirect(destination);
        return true;
      }

      if (applicationStatus === "approved" && STATUS_ONLY_PATHS.has(pathname)) {
        redirect("/");
        return true;
      }
      if (applicationStatus === "pending" && pathname !== "/application-pending") {
        redirect("/application-pending");
        return true;
      }
      if ((applicationStatus === "incomplete" || applicationStatus === "rejected") && pathname !== "/complete-profile") {
        redirect("/complete-profile");
        return true;
      }

      return false;
    };

    const enforceAccess = async () => {
      const loggedIn = authService.isLoggedIn();
      const publicPage = publicPaths.has(pathname);

      if (!loggedIn) {
        setStatusError("");
        if (!publicPage) {
          redirect("/login");
          return;
        }
        if (!cancelled) setChecking(false);
        return;
      }

      // Legal pages remain available regardless of application status.
      if (publicPage && !authEntryPaths.has(pathname)) {
        setStatusError("");
        if (!cancelled) setChecking(false);
        return;
      }

      setStatusError("");

      let storedUser = authService.getUser() || {};
      let merchantProfile = storedUser.merchantProfile || null;
      const cachedStatus = normalizeApplicationStatus(
        merchantProfile?.applicationStatus || storedUser.applicationStatus
      );

      // A profile is fetched immediately after login. Reuse that cached status on
      // hard refresh so the current page can render without waiting on the network.
      if (getApplicationRoute(cachedStatus)) {
        if (enforceStatusRoute(cachedStatus)) return;
        if (!cancelled) setChecking(false);

        const token = authService.getToken();
        if (validatedTokenRef.current === token) return;
        validatedTokenRef.current = token;

        const response = await authService.getMerchantProfile();
        if (cancelled) return;
        if (!authService.isLoggedIn()) {
          redirect("/login");
          return;
        }
        if (!response?.status || !response?.data) return;

        const refreshedStatus = normalizeApplicationStatus(response.data.applicationStatus);
        enforceStatusRoute(refreshedStatus);
        return;
      }

      // Older sessions may not have a cached application status yet. Only those
      // sessions need to wait for the first full-profile request.
      setChecking(true);
      const response = await authService.getMerchantProfile();
      if (cancelled) return;
      if (!authService.isLoggedIn()) {
        redirect("/login");
        return;
      }
      if (!response?.status || !response?.data) {
        setStatusError(response?.message || "Unable to load your merchant application status.");
        setChecking(false);
        return;
      }

      validatedTokenRef.current = authService.getToken();
      const fetchedStatus = normalizeApplicationStatus(response.data.applicationStatus);
      if (!getApplicationRoute(fetchedStatus)) {
        setStatusError("Your merchant application status is unavailable. Please retry or contact support.");
        setChecking(false);
        return;
      }
      if (!enforceStatusRoute(fetchedStatus) && !cancelled) setChecking(false);
    };

    const recheckAccess = () => setRetryKey((key) => key + 1);

    enforceAccess();
    window.addEventListener("storage", recheckAccess);
    window.addEventListener("merchant-auth-change", recheckAccess);
    window.addEventListener("merchant-auth-expired", recheckAccess);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", recheckAccess);
      window.removeEventListener("merchant-auth-change", recheckAccess);
      window.removeEventListener("merchant-auth-expired", recheckAccess);
    };
  }, [pathname, retryKey, router]);

  const handleLogout = async () => {
    await authService.logout();
    router.replace("/login");
  };

  const handleRetry = () => {
    authService.saveAuthData({ merchantProfileFetchedAt: 0 });
    validatedTokenRef.current = "";
    setRetryKey((key) => key + 1);
  };

  if (statusError) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light px-3">
        <div className="bg-white border rounded-4 shadow-sm p-4 p-md-5 text-center" style={{ maxWidth: "520px" }}>
          <div className="text-danger mb-3" style={{ fontSize: "48px" }}>
            <i className="fa-solid fa-circle-exclamation" />
          </div>
          <h2 className="h4 fw-bold mb-3">Unable to verify your account</h2>
          <p className="text-muted mb-4">{statusError}</p>
          <div className="d-flex flex-column flex-sm-row justify-content-center gap-2">
            <button className="btn btn-primary px-4" onClick={handleRetry}>
              Retry
            </button>
            <button className="btn btn-outline-secondary px-4" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Checking merchant status...</span>
        </div>
      </div>
    );
  }

  return children;
}
