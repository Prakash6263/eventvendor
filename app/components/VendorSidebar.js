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
        }
      })
      .catch(() => {});
  }, []);

  const vendorName =
    profile?.fullName ||
    profile?.name ||
    profile?.merchantName ||
    profile?.restaurantName ||
    "Vendor";

  const rawImage =
    profile?.profileImage ||
    profile?.profilePic ||
    profile?.image ||
    profile?.avatar ||
    "";

  const fallbackImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    vendorName
  )}&background=3e56f0&color=fff&size=128&bold=true`;

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
      className="user-profile-sidebar"
      style={{
        background: "#ffffff",
        borderRadius: "10px",
        padding: "20px",
        boxShadow: "0 0 40px 5px rgba(0, 0, 0, 0.05)",
        maxHeight: "calc(100vh - 120px)",
        overflowY: "auto",
      }}
    >
      <div className="user-profile-sidebar-top">
        <div className="user-profile-img">
          <img
            src={rawImage || fallbackImage}
            alt={vendorName}
            onError={(e) => {
              e.currentTarget.src = fallbackImage;
            }}
            style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "50%" }}
          />
          <button
            className="profile-img-btn"
            type="button"
            title="Edit Profile"
            onClick={() => router.push("/vendor-profile")}
          >
            <i className="fa fa-camera" />
          </button>
        </div>
        <h5>{vendorName}</h5>
      </div>

      <ul className="user-profile-sidebar-list" style={{ listStyle: "none", padding: 0 }}>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <li key={item.href}>
              <Link href={item.href} className={isActive ? "active" : ""}>
                <i className={`${item.icon} me-2`} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}

        <li>
          <a href="#" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket me-2" />
            <span>Logout</span>
          </a>
        </li>

        <li style={{ marginTop: "24px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
          <button
            type="button"
            className="btn btn-outline-danger w-100"
            style={{ borderRadius: "8px", padding: "10px", fontWeight: "600", fontSize: "14px" }}
            onClick={handleDeleteAccount}
          >
            <i className="fa-regular fa-trash-can me-2" />
            <span>Delete Account</span>
          </button>
        </li>
      </ul>
    </div>
  );
}

