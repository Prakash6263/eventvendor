"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import { authService } from "../services/authService";
import { initProfileFeature } from "../features/profileFeature";
import { initEventsFeature } from "../features/eventsFeature";
import { initReservationsFeature } from "../features/reservationsFeature";
import { initNotificationsFeature } from "../features/notificationsFeature";
import { initChatFeature } from "../features/chatFeature";

// Module-level profile cache — persists across tab switches
let _cachedSidebarProfile = null;

export default function VendorHtmlPage({ markup }) {
  const router = useRouter();
  const containerRef = useRef(null);
  const reactRootRef = useRef(null);

  // 1. SPA Link Interceptor
  useEffect(() => {
    const onClick = (event) => {
      const anchor = event.target.closest("a");
      if (!anchor) return;
      if (anchor.textContent?.trim().toLowerCase() === "logout" || anchor.querySelector(".fa-sign-out")) {
        event.preventDefault();
        authService.logout().then(() => router.replace("/login"));
        return;
      }
      let href = anchor.getAttribute("href");
      if (!href || href === "#" || href.startsWith("javascript:")) {
        event.preventDefault();
        return;
      }

      // Handle legacy .html links from injected markup
      let targetHref = href;
      if (targetHref.endsWith(".html")) {
        targetHref = "/" + targetHref.replace(/\.html$/, "").replace(/^\/+/, "");
      } else if (targetHref.includes(".html?")) {
        targetHref = "/" + targetHref.replace(/\.html\?/, "?").replace(/^\/+/, "");
      }

      const currentPath = window.location.pathname;
      if (targetHref === currentPath || (currentPath === "/" && targetHref === "/")) {
        event.preventDefault();
        return;
      }

      if (targetHref.startsWith("/")) {
        event.preventDefault();
        router.push(targetHref);
        return;
      }
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
    };
  }, [router]);

  // 2. Profile Management Feature
  useEffect(() => {
    const rootEl = containerRef.current || document;
    const userObj = authService.getUser();
    const cachedMerchantProfile = userObj?.userProfile || userObj?.merchantProfile || userObj || null;

    const profileController = initProfileFeature({
      rootEl,
      reactRootRef,
      onProfileUpdate: (profile) => {
        if (profile?.fullName || profile?.profileImage || profile?.profilePic) {
          _cachedSidebarProfile = profile;
        }
      }
    });

    if (_cachedSidebarProfile) {
      profileController.applyProfile(_cachedSidebarProfile);
      profileController.loadMerchantProfile();
    } else {
      rootEl.querySelectorAll(".user-profile-sidebar-top .user-profile-img").forEach((imgDiv) => {
        imgDiv.classList.add("profile-loading");
        const img = imgDiv.querySelector("img");
        if (img) img.removeAttribute("src");
      });
      if (cachedMerchantProfile) profileController.applyProfile(cachedMerchantProfile);
      profileController.loadMerchantProfile();
    }

    return () => {
      profileController.cleanup();
      if (reactRootRef.current) {
        const rootToUnmount = reactRootRef.current;
        reactRootRef.current = null;
        setTimeout(() => {
          try {
            rootToUnmount.unmount();
          } catch (e) {}
        }, 0);
      }
    };
  }, [markup]);

  // 3. Events Feature & Hero Title
  useEffect(() => {
    async function loadEvents() {
      try {
        const path = window.location.pathname;
        const heroTitle = document.querySelector(".hero-banner-content h2");
        if (heroTitle) {
          if (path === "/all-events") heroTitle.textContent = "All Events";
          else if (path === "/vendor-profile") heroTitle.textContent = "Vendor Profile";
          else if (path === "/reservation-list") heroTitle.textContent = "Booking Request";
          else if (path === "/notifications") heroTitle.textContent = "Notifications";
          else if (path === "/vendor-reservation-details") heroTitle.textContent = "Booking Detail";
          else if (path === "/vendor-event-details") heroTitle.textContent = "Event Detail";
        }

        if (path === "/vendor-event-details") {
          const detailContainer = document.querySelector(".col-lg-9 .content-card, .user-profile-wrapper .content-card");
          if (detailContainer && !detailContainer.querySelector(".placeholder-glow")) {
            detailContainer.innerHTML = `
              <div class="p-3" style="min-height: 480px;">
                <div class="d-flex align-items-center gap-2 mb-4">
                  <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                  <span class="text-muted fw-semibold small">Loading event details...</span>
                </div>
                <div class="placeholder-glow">
                  <div class="placeholder col-12 mb-4 rounded-4" style="height: 230px; background:#e2e8f0;"></div>
                  <div class="placeholder col-6 mb-3 rounded-2" style="height: 28px; background:#e2e8f0;"></div>
                  <div class="placeholder col-4 mb-4 rounded-2" style="height: 18px; background:#e2e8f0;"></div>
                  <div class="d-flex flex-column gap-3">
                    <div class="placeholder col-12 rounded-3" style="height: 56px; background:#f1f5f9;"></div>
                    <div class="placeholder col-12 rounded-3" style="height: 56px; background:#f1f5f9;"></div>
                  </div>
                </div>
              </div>
            `;
          }
        }

        if (!["/", "/all-events", "/vendor-event-details"].includes(path)) return;

        const res = await authService.getMerchantAllEvents().catch(() => null);
        const eventsList = (res && res.status && Array.isArray(res.data)) ? res.data : [];
        initEventsFeature(eventsList, path);
      } catch (err) {
        console.error("Failed to load upcoming events:", err);
      }
    }
    loadEvents();
  }, [markup]);

  // 4. Reservations & Notifications Feature
  useEffect(() => {
    async function loadReservationsAndNotifications() {
      try {
        const path = window.location.pathname;

        if (path === "/vendor-reservation-details") {
          const detailContainer = document.querySelector(".col-lg-9 .content-card, .user-profile-wrapper .content-card");
          if (detailContainer && !detailContainer.querySelector(".placeholder-glow")) {
            detailContainer.innerHTML = `
              <div class="p-3" style="min-height: 480px;">
                <div class="d-flex align-items-center gap-2 mb-4">
                  <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                  <span class="text-muted fw-semibold small">Loading booking details...</span>
                </div>
                <div class="placeholder-glow">
                  <div class="placeholder col-12 mb-4 rounded-4" style="height: 230px; background:#e2e8f0;"></div>
                  <div class="placeholder col-6 mb-3 rounded-2" style="height: 28px; background:#e2e8f0;"></div>
                  <div class="placeholder col-4 mb-4 rounded-2" style="height: 18px; background:#e2e8f0;"></div>
                  <div class="d-flex flex-column gap-3">
                    <div class="placeholder col-12 rounded-3" style="height: 56px; background:#f1f5f9;"></div>
                    <div class="placeholder col-12 rounded-3" style="height: 56px; background:#f1f5f9;"></div>
                  </div>
                </div>
              </div>
            `;
          }
        }

        const [bookingRequestsRes, reservationsRes, allEventsRes] = await Promise.all([
          authService.getMerchantBookingRequests().catch(() => null),
          authService.getMerchantEvents().catch(() => null),
          authService.getMerchantAllEvents().catch(() => null)
        ]);

        const bookingRequests = Array.isArray(bookingRequestsRes?.data) ? bookingRequestsRes.data : [];
        const reservations = Array.isArray(reservationsRes?.data) ? reservationsRes.data : [];
        const allEvents = Array.isArray(allEventsRes?.data) ? allEventsRes.data : [];

        // Combine unique booking requests and reservations
        const itemMap = new Map();
        bookingRequests.forEach((it) => {
          const id = String(it._id || it.id || it.requestId || "");
          if (id) itemMap.set(id, { ...it, _id: id, isBookingRequest: true });
        });
        reservations.forEach((it) => {
          const id = String(it._id || it.id || it.reservationId || "");
          if (id && !itemMap.has(id)) itemMap.set(id, { ...it, _id: id });
        });
        const data = Array.from(itemMap.values());

        const pendingItems = data.filter((d) =>
          ["pending", "requested", "reservation received", "new"].includes(String(d.status || "").toLowerCase().trim())
        );
        const pendingCount = pendingItems.length;

        // Initialize Notifications (badges and /notifications page)
        initNotificationsFeature({ data, allEvents, pendingCount });

        // Initialize Reservations (dashboard, list, and details)
        initReservationsFeature({ data, allEvents, path, router });
      } catch (err) {
        console.error("Failed to load reservations & notifications:", err);
        if (typeof window !== "undefined" && window.location.pathname === "/notifications") {
          initNotificationsFeature({ data: [], allEvents: [], pendingCount: 0 });
        }
      }
    }

    loadReservationsAndNotifications();
  }, [markup, router]);

  // 5. Live Chat Feature
  useEffect(() => {
    const cleanupChat = initChatFeature();
    return () => {
      if (typeof cleanupChat === "function") cleanupChat();
    };
  }, [markup]);

  // Strip static placeholders before rendering so they never flash
  const contentCleaned = markup
    ? markup
        .replace(/\r\n/g, "\n")
        .replace(/<header[\s\S]*?<\/header>/i, "")
        .replace(/<footer[\s\S]*?<\/footer>/i, "")
        .replace(
          /(<div[^>]*class="user-profile-img"[^>]*>[\s\S]{0,400}?<img[^>]*?)\s+src="[^"]*unsplash[^"]*"([^>]*>)/gi,
          "$1$2"
        )
        .replace(
          /(<div[^>]*class="user-profile-img"[^>]*>[\s\S]{0,400}?<img[^>]*?)\s+src="https?:\/\/[^"]*photo[^"]*"([^>]*>)/gi,
          "$1$2"
        )
        .replace(
          /(<div[^>]*class="user-profile-sidebar-top"[\s\S]{0,600}?<h5[^>]*>)Vendor name(<\/h5>)/gi,
          "$1$2"
        )
    : "";

  // Ensure balanced div tags in cleaned HTML to prevent hydration DOM mismatches
  let balancedContent = contentCleaned;
  if (balancedContent) {
    const openCount = (balancedContent.match(/<div\b[^>]*>/gi) || []).length;
    const closeCount = (balancedContent.match(/<\/div>/gi) || []).length;
    if (openCount > closeCount) {
      balancedContent += "</div>".repeat(openCount - closeCount);
    }
  }

  return (
    <>
      <Header />
      <div ref={containerRef} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: balancedContent }} />
      <Footer />
    </>
  );
}
