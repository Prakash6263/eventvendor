"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { authService } from "../services/authService";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [offcanvasOpen, setOffcanvasOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(authService.isLoggedIn());
      setUserInfo(authService.getUser());
    };
    checkAuth();

    window.addEventListener("merchant-auth-change", checkAuth);
    window.addEventListener("merchant-auth-expired", checkAuth);
    return () => {
      window.removeEventListener("merchant-auth-change", checkAuth);
      window.removeEventListener("merchant-auth-expired", checkAuth);
    };
  }, [pathname]);

  const toggleOffcanvas = () => {
    setOffcanvasOpen(!offcanvasOpen);
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsLoggedIn(false);
    setUserInfo(null);
    router.replace("/login");
  };

  const isActive = (path) => pathname === path;

  return (
    <header className="header">
      <div className="header-inner">
        <nav className="navbar navbar-expand-lg bg-barren barren-head navbar fixed-top justify-content-sm-start pt-0 pb-0">
          <div className="container">
            <button
              className="navbar-toggler"
              type="button"
              onClick={toggleOffcanvas}
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon">
                <i className="fa-solid fa-bars"></i>
              </span>
            </button>
            <Link className="navbar-brand order-1 order-lg-0 ml-lg-0 ml-2 me-auto" href="/">
              <div className="res-main-logo">
                <img src="/images/logo.png" alt="Logo" />
              </div>
              <div className="main-logo" id="logo">
                <img src="/images/logo.png" alt="Logo" />
                <img className="logo-inverse" src="/images/logo.png" alt="Logo" />
              </div>
            </Link>
            
            {/* Offcanvas Navbar */}
            <div
              className={`offcanvas offcanvas-start ${offcanvasOpen ? "show" : ""}`}
              tabIndex="-1"
              id="offcanvasNavbar"
              aria-labelledby="offcanvasNavbarLabel"
              style={{ visibility: offcanvasOpen ? "visible" : "hidden" }}
            >
              <div className="offcanvas-header">
                <div className="offcanvas-logo" id="offcanvasNavbarLabel">
                  <img src="/images/logo.png" alt="Logo" />
                </div>
                <button
                  type="button"
                  className="close-btn"
                  onClick={toggleOffcanvas}
                  aria-label="Close"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div className="offcanvas-body">
                <ul className="navbar-nav justify-content-end flex-grow-1 pe_5">
                  <li className="nav-item">
                    <Link
                      className={`nav-link ${isActive("/") ? "active" : ""}`}
                      href="/"
                      onClick={() => setOffcanvasOpen(false)}
                    >
                      Home
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className={`nav-link ${isActive("/all-events") ? "active" : ""}`}
                      href="/all-events"
                      onClick={() => setOffcanvasOpen(false)}
                    >
                      Upcoming
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className={`nav-link ${isActive("/reservation-list") ? "active" : ""}`}
                      href="/reservation-list"
                      onClick={() => setOffcanvasOpen(false)}
                    >
                      Reservations
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className={`nav-link ${isActive("/notifications") ? "active" : ""}`}
                      href="/notifications"
                      onClick={() => setOffcanvasOpen(false)}
                    >
                      Notifications
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="offcanvas-footer">
                <div className="offcanvas-social">
                  <h5>Follow Us</h5>
                  <ul className="social-links">
                    <li>
                      <a href="#" className="social-link">
                        <i className="fab fa-facebook-square"></i>
                      </a>
                    </li>
                    <li>
                      <a href="#" className="social-link">
                        <i className="fab fa-instagram"></i>
                      </a>
                    </li>
                    <li>
                      <a href="#" className="social-link">
                        <i className="fab fa-twitter"></i>
                      </a>
                    </li>
                    <li>
                      <a href="#" className="social-link">
                        <i className="fab fa-linkedin-in"></i>
                      </a>
                    </li>
                    <li>
                      <a href="#" className="social-link">
                        <i className="fab fa-youtube"></i>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {offcanvasOpen && (
              <div
                className="offcanvas-backdrop fade show"
                onClick={toggleOffcanvas}
                style={{ zIndex: 1040 }}
              ></div>
            )}

            <div className="right-header order-2">
              <ul className="align-self-stretch d-flex align-items-center m-0">
                {isLoggedIn ? (
                  <li className="d-flex align-items-center gap-2">
                    <Link href="/vendor-profile" className="create-btn btn-hover">
                      <i className="fa-solid fa-user me-1"></i>
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="create-btn btn-hover border-0"
                      style={{ cursor: "pointer" }}
                    >
                      <i className="fa-solid fa-right-from-bracket me-1"></i>
                      <span>Logout</span>
                    </button>
                  </li>
                ) : (
                  <li>
                    <Link href="/login" className="create-btn btn-hover">
                      <i className="fa-solid fa-user me-1"></i>
                      <span>Login</span>
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </nav>
        <div className={`overlay ${offcanvasOpen ? "active" : ""}`} onClick={toggleOffcanvas}></div>
      </div>
    </header>
  );
}
