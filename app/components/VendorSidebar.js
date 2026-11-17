"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { authService } from "../services/authService";

export default function VendorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleCount = (e) => {
      setPendingCount(e.detail?.pendingCount || 0);
    };
    if (typeof window !== "undefined") {
      setPendingCount(window.__merchantPendingCount || 0);
      window.addEventListener("merchant-pending-count", handleCount);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("merchant-pending-count", handleCount);
      }
    };
  }, []);

  useEffect(() => {
    // 1. Initial seed from localStorage cache for instant render
    const user = authService.getUser();
    const initial = user?.userProfile || user?.merchantProfile || user || null;
    if (initial) {
      setProfile(initial);
    }

    // 2. Fetch fresh profile from API
    authService
      .getMerchantProfile()
      .then((res) => {
        if (res?.data) {
          setProfile(res.data);
          setImageError(false);
        }
      })
      .catch(() => {});
  }, []);

  const vendorName =
    profile?.fullName ||
    profile?.name ||
    profile?.merchantName ||
    profile?.restaurantName ||
    "Prakash Mishra";

  const rawImage =
    profile?.profileImage ||
    profile?.profilePic ||
    profile?.image ||
    profile?.avatar ||
    "";

  const hasValidImage = Boolean(
    rawImage &&
    !imageError &&
    String(rawImage).trim().length > 5 &&
    !String(rawImage).includes("ui-avatars.com")
  );

  const getInitials = (name) => {
    if (!name) return "PM";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(vendorName);

  const handleLogout = async (e) => {
    e.preventDefault();
    await authService.logout();
    router.replace("/login");
  };

  const handleDeleteAccount = async () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to permanently delete your merchant account? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await authService.deleteUser();
          if (res?.status) {
            Swal.fire({
              title: "Deleted!",
              text: "Your account has been deleted.",
              icon: "success",
              confirmButtonColor: "#5b6ef5",
            }).then(() => {
              router.replace("/login");
            });
          } else {
            Swal.fire("Error!", res?.message || "Failed to delete account.", "error");
          }
        } catch (err) {
          Swal.fire("Error!", err.message || "Failed to delete account.", "error");
        }
      }
    });
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: "fa-solid fa-gauge" },
    { href: "/vendor-profile", label: "Profile", icon: "fa-solid fa-user" },
    { href: "/services", label: "My Services", icon: "fa-solid fa-bell-concierge" },
    { href: "/all-events", label: "All Events", icon: "fa-solid fa-layer-group" },
    { href: "/reservation-list", label: "Reservation list", icon: "fa-solid fa-calendar-check" },
    { href: "/notifications", label: "Notifications", icon: "fa-solid fa-bell" },
    { href: "/change-password", label: "Change Password", icon: "fa-solid fa-key" },
  ];

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "16px",
        padding: "20px 16px",
        border: "1px solid #e8ecf4",
        boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
      }}
    >
      {/* Profile Header Block */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          paddingBottom: "20px",
          marginBottom: "18px",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "92px",
            height: "92px",
            margin: "0 auto 12px",
          }}
        >
          {hasValidImage ? (
            <img
              src={rawImage}
              alt={vendorName}
              onError={() => setImageError(true)}
              style={{
                width: "92px",
                height: "92px",
                objectFit: "cover",
                borderRadius: "50%",
                border: "3px solid #ffffff",
                boxShadow: "0 8px 24px -4px rgba(79, 70, 229, 0.25), 0 0 0 2px #e0e7ff",
              }}
            />
          ) : (
            <div
              style={{
                width: "92px",
                height: "92px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #4f46e5 0%, #2563eb 50%, #38bdf8 100%)",
                display: "grid",
                placeItems: "center",
                color: "#ffffff",
                fontSize: "28px",
                fontWeight: "800",
                letterSpacing: "1px",
                border: "3px solid #ffffff",
                boxShadow: "0 8px 24px -4px rgba(79, 70, 229, 0.35), 0 0 0 2px #e0e7ff",
                userSelect: "none",
              }}
            >
              {initials}
            </div>
          )}

          {/* Quick Edit Profile Button */}
          <button
            type="button"
            title="Update Profile Photo"
            onClick={() => router.push("/vendor-profile")}
            style={{
              position: "absolute",
              bottom: "0px",
              right: "0px",
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: "#4f46e5",
              color: "#ffffff",
              border: "2px solid #ffffff",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              fontSize: "12px",
              transition: "transform 0.15s ease, background 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.background = "#3730a3";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.background = "#4f46e5";
            }}
          >
            <i className="fa-solid fa-camera" />
          </button>
        </div>

        <h5
          style={{
            fontSize: "16px",
            fontWeight: "700",
            color: "#0f172a",
            margin: "0 0 6px 0",
            lineHeight: "1.3",
          }}
        >
          {vendorName}
        </h5>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 10px",
            background: "#ecfdf5",
            color: "#059669",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "0.2px",
          }}
        >
          <i className="fa-solid fa-circle-check" style={{ fontSize: "11px" }} />
          <span>Verified Merchant</span>
        </div>
      </div>

      {/* Nav List */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: isActive ? "700" : "500",
                  color: isActive ? "#ffffff" : "#475569",
                  background: isActive ? "#3e56f0" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "#f1f5f9";
                    e.currentTarget.style.color = "#0f172a";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#475569";
                  }
                }}
              >
                <i
                  className={item.icon}
                  style={{
                    width: "18px",
                    textAlign: "center",
                    fontSize: "14px",
                    color: isActive ? "#ffffff" : "#64748b",
                  }}
                />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.href === "/notifications" && pendingCount > 0 && (
                  <span
                    style={{
                      marginLeft: "auto",
                      padding: "2px 7px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: "700",
                      background: isActive ? "rgba(255, 255, 255, 0.25)" : "#fee2e2",
                      color: isActive ? "#ffffff" : "#dc2626",
                      lineHeight: "1",
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </Link>
            </li>
          );
        })}

        <li>
          <a
            href="#"
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 14px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#475569",
              textDecoration: "none",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fef2f2";
              e.currentTarget.style.color = "#dc2626";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#475569";
            }}
          >
            <i
              className="fa-solid fa-right-from-bracket"
              style={{
                width: "18px",
                textAlign: "center",
                fontSize: "14px",
                color: "#64748b",
              }}
            />
            <span>Logout</span>
          </a>
        </li>

        <li style={{ marginTop: "18px", paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
          <button
            type="button"
            onClick={handleDeleteAccount}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "9px 12px",
              borderRadius: "10px",
              border: "1px solid #fee2e2",
              background: "#fff5f5",
              color: "#dc2626",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#dc2626";
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.borderColor = "#dc2626";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff5f5";
              e.currentTarget.style.color = "#dc2626";
              e.currentTarget.style.borderColor = "#fee2e2";
            }}
          >
            <i className="fa-regular fa-trash-can" />
            <span>Delete Account</span>
          </button>
        </li>
      </ul>
    </div>
  );
}

