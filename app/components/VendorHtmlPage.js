"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import { authService } from "../services/authService";

const routeLinks = new Set([
  "/", "/vendor-profile", "/all-events", "/reservation-list",
  "/vendor-event-details", "/vendor-reservation-details", "/notifications",
  "/change-password", "/chat", "/login", "/signup", "/verification", "/reset-password",
  "/about", "/privacy", "/terms"
]);

// Module-level profile cache — persists across effect cleanup and tab switches.
// Once loaded from the API, the real profile is applied instantly on every
// subsequent page render without showing the loading spinner again.
let _cachedSidebarProfile = null;

export default function VendorHtmlPage({ markup }) {
  const router = useRouter();

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

      // If clicking the currently active page/tab, ignore it completely to prevent double-click / re-render bugs
      const currentPath = window.location.pathname;
      if (targetHref === currentPath || (currentPath === "/" && targetHref === "/")) {
        event.preventDefault();
        return;
      }

      // Handle internal SPA navigation without full page reload
      if (targetHref.startsWith("/")) {
        event.preventDefault();
        router.push(targetHref);
        return;
      }
    };
    document.addEventListener("click", onClick);
    return () => { document.removeEventListener("click", onClick); };
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    let selectedProfileImage = null;
    let previewUrl = "";
    let currentProfile = null;

    const getFieldByLabel = (form, labelText) => {
      const label = Array.from(form.querySelectorAll("label")).find(
        (item) => item.textContent?.trim().toLowerCase() === labelText.toLowerCase()
      );
      return label?.parentElement?.querySelector("input, select, textarea") || null;
    };

    const profileCard = window.location.pathname === "/vendor-profile"
      ? Array.from(document.querySelectorAll(".content-card")).find(
          (card) => card.querySelector("h5")?.textContent?.trim().toLowerCase() === "profile details"
        )
      : null;
    const profileForm = profileCard?.querySelector("form") || null;
    const imageInput = document.querySelector(".user-profile-sidebar .profile-img-file");
    const imageButton = document.querySelector(".user-profile-sidebar .profile-img-btn");
    const profileSaveButton = profileForm?.querySelector('button[type="submit"]');
    if (profileSaveButton) {
      profileSaveButton.type = "button";
      profileSaveButton.dataset.profileSave = "true";
    }
    const deleteAccountButton = profileForm
      ? Array.from(profileForm.querySelectorAll("button")).find(
          (button) => button.textContent?.trim().toLowerCase().includes("delete account")
        )
      : null;
    const sidebarList = document.querySelector(".user-profile-sidebar .user-profile-sidebar-list");
    if (deleteAccountButton && sidebarList) {
      const deleteItem = document.createElement("li");
      deleteItem.className = "sidebar-delete-account-item";
      deleteAccountButton.className = "btn btn-outline-danger sidebar-delete-account-btn";
      deleteAccountButton.type = "button";
      deleteItem.appendChild(deleteAccountButton);
      sidebarList.appendChild(deleteItem);
    }

    const userObj = authService.getUser();
    const cachedMerchantProfile = userObj?.userProfile || userObj?.merchantProfile || userObj || null;

    const applyProfile = (profile) => {
      if (!profile) return;
      currentProfile = profile;
      // Save to module-level cache so next render applies instantly
      if (profile.fullName || profile.profileImage || profile.profilePic) {
        _cachedSidebarProfile = profile;
      }
      const vendorName = profile.fullName || profile.name || profile.merchantName || profile.restaurantName || "Vendor";
      const rawImage = profile.profileImage || profile.profilePic || profile.image || profile.avatar || "";
      const fallbackImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(vendorName)}&background=5b6ef5&color=fff&size=128`;
      // Use stable cache buster (updatedAt or _id) — NOT Date.now() which breaks browser cache
      const stableBuster = profile.updatedAt || profile._id || "1";
      const imageSource = rawImage
        ? (rawImage.startsWith("blob:") || rawImage.startsWith("data:")
            ? rawImage
            : `${rawImage}${rawImage.includes("?") ? "&" : "?"}v=${stableBuster}`)
        : fallbackImage;

      document.querySelectorAll(".user-profile-sidebar-top").forEach((sidebarTop) => {
        const imgDiv = sidebarTop.querySelector(".user-profile-img");
        const image = sidebarTop.querySelector(".user-profile-img img");
        const name = sidebarTop.querySelector("h5");
        if (image) {
          image.onload = () => {
            if (imgDiv) imgDiv.classList.remove("profile-loading");
          };
          image.onerror = () => {
            image.src = fallbackImage;
            if (imgDiv) imgDiv.classList.remove("profile-loading");
          };
          image.src = imageSource;
          image.alt = vendorName;
        } else if (imgDiv) {
          imgDiv.classList.remove("profile-loading");
        }
        if (name) name.textContent = vendorName;
      });

      // Update active nav link on sidebar for the current route
      const currentPath = window.location.pathname;
      document.querySelectorAll(".user-profile-sidebar-list a").forEach((a) => {
        let href = a.getAttribute("href");
        if (href) {
          if (href.endsWith(".html")) href = "/" + href.replace(/\.html$/, "").replace(/^\/+/, "");
          else if (href.includes(".html?")) href = "/" + href.replace(/\.html\?/, "?").replace(/^\/+/, "");

          if (href === currentPath || (currentPath === "/" && href === "/")) {
            a.classList.add("active");
          } else if (href !== "#" && !href.startsWith("javascript:")) {
            a.classList.remove("active");
          }
        }
      });

      if (profileForm) {
        // Add edit profile icon next to the "Profile details" heading
        const card = profileForm.closest(".content-card");
        if (card) {
          const title = card.querySelector("h5");
          if (title && !title.querySelector(".fa-edit")) {
            title.innerHTML = `Profile details <i class="fa fa-edit ms-2 text-primary" style="font-size: 17px; cursor: pointer; transition: transform 0.15s ease-in-out;" onmouseover="this.style.transform='scale(1.15)';" onmouseout="this.style.transform='scale(1)';" title="Edit Profile"></i>`;
          }
        }

        const values = {
          "Vendor Name": vendorName,
          "Email Address": profile.email,
          "Date": profile.dob,
          "Gender": String(profile.gender || "").toUpperCase(),
          "Phone Number": `${profile.countryCode || ""} ${profile.mobile || ""}`.trim(),
        };
        Object.entries(values).forEach(([label, value]) => {
          const field = getFieldByLabel(profileForm, label);
          if (field && value !== undefined && value !== null) field.value = value;
        });
        const emailField = getFieldByLabel(profileForm, "Email Address");
        const phoneField = getFieldByLabel(profileForm, "Phone Number");
        if (emailField) emailField.readOnly = true;
        if (phoneField) phoneField.readOnly = true;
      }
    };

    async function loadMerchantProfile() {
      try {
        const response = await authService.getUserProfile();
        if (cancelled || !response?.status || !response?.data) return;
        applyProfile(response.data);
      } catch (error) {
        console.error("Failed to load merchant profile:", error);
      }
    }

    const showProfileMessage = (message, success, targetForm = profileForm) => {
      if (!targetForm) return;
      let alert = targetForm.querySelector("#profileUpdateMessage");
      if (!alert) {
        alert = document.createElement("div");
        alert.id = "profileUpdateMessage";
        targetForm.prepend(alert);
      }
      alert.className = `alert ${success ? "alert-success" : "alert-danger"} rounded-3`;
      alert.textContent = message;
    };

    const handleProfileClick = (event) => {
      const saveButton = event.target.closest('button[data-profile-save="true"], button[type="submit"]');
      const saveForm = saveButton?.closest("form");
      const isProfileSave = saveForm && Array.from(saveForm.querySelectorAll("label")).some(
        (label) => label.textContent?.trim().toLowerCase() === "vendor name"
      );
      if (isProfileSave && window.location.pathname === "/vendor-profile") {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        handleProfileSubmit({
          target: saveForm,
          preventDefault() {},
          stopPropagation() {},
        });
        return;
      }

      const button = event.target.closest(".profile-img-btn");
      if (!button || window.location.pathname !== "/vendor-profile") return;
      event.preventDefault();
      const input = button.parentElement?.querySelector(".profile-img-file") || imageInput;
      input?.click();
    };
    const handleImageChange = (event) => {
      if (!event.target.matches(".profile-img-file") || window.location.pathname !== "/vendor-profile") return;
      selectedProfileImage = event.target.files?.[0] || null;
      if (!selectedProfileImage) return;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(selectedProfileImage);
      document.querySelectorAll(".user-profile-sidebar .user-profile-img img").forEach((preview) => {
        preview.src = previewUrl;
      });
    };
    const handleProfileSubmit = async (event) => {
      if (window.location.pathname !== "/vendor-profile") return;
      const submittedForm = event.target;
      const isProfileForm = Array.from(submittedForm.querySelectorAll("label")).some(
        (label) => label.textContent?.trim().toLowerCase() === "vendor name"
      );
      if (!isProfileForm) return;
      event.preventDefault();
      event.stopPropagation();

      const submitButton = submittedForm.querySelector('button[data-profile-save="true"], button[type="submit"]');
      if (submitButton?.disabled) return;
      const payload = new FormData();
      const fullName = getFieldByLabel(submittedForm, "Vendor Name")?.value.trim() || "";
      const dob = getFieldByLabel(submittedForm, "Date")?.value.trim() || "";
      const gender = getFieldByLabel(submittedForm, "Gender")?.value || currentProfile?.gender || "";

      if (!fullName) {
        showProfileMessage("Vendor name is required.", false, submittedForm);
        return;
      }
      if (!gender) {
        showProfileMessage("Gender is required.", false, submittedForm);
        return;
      }

      payload.append("fullName", fullName);
      payload.append("dob", dob);
      payload.append("gender", gender.toLowerCase());
      if (selectedProfileImage) payload.append("profileImage", selectedProfileImage);

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Saving...`;
      }

      try {
        const response = await authService.updateProfile(payload);
        if (!response?.status) throw new Error(response?.message || "Failed to update profile.");
        showProfileMessage(response.message || "Profile updated successfully.", true, submittedForm);
        selectedProfileImage = null;
        const currentImageInput = document.querySelector(".user-profile-sidebar .profile-img-file");
        if (currentImageInput) currentImageInput.value = "";

        const updatedProfile = response.data?.data || response.data?.merchant || response.data;
        if (updatedProfile && typeof updatedProfile === "object") {
          applyProfile({ ...currentProfile, ...updatedProfile });
        }
        await loadMerchantProfile();
      } catch (error) {
        showProfileMessage(error.message || "Failed to update profile.", false, submittedForm);
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Save Changes";
        }
      }
    };

    document.addEventListener("click", handleProfileClick, true);
    document.addEventListener("change", handleImageChange, true);
    document.addEventListener("submit", handleProfileSubmit, true);

    if (_cachedSidebarProfile) {
      // Profile already loaded from a previous tab — apply instantly, no spinner needed
      applyProfile(_cachedSidebarProfile);
      // Silently refresh in background in case profile was updated
      loadMerchantProfile();
    } else {
      // First load — show loading spinner until API responds
      document.querySelectorAll(".user-profile-sidebar-top .user-profile-img").forEach((imgDiv) => {
        imgDiv.classList.add("profile-loading");
        const img = imgDiv.querySelector("img");
        if (img) img.removeAttribute("src");
      });
      if (cachedMerchantProfile) applyProfile(cachedMerchantProfile);
      loadMerchantProfile();
    }
    return () => {
      cancelled = true;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      document.removeEventListener("click", handleProfileClick, true);
      document.removeEventListener("change", handleImageChange, true);
      document.removeEventListener("submit", handleProfileSubmit, true);
    };
  }, [markup]);

  useEffect(() => {
    async function loadUpcomingEvents() {
      try {
        const path = window.location.pathname;
        const heroTitle = document.querySelector(".hero-banner-content h2");
        if (heroTitle) {
          if (window.location.pathname === "/all-events") heroTitle.textContent = "Upcoming Events";
          else if (window.location.pathname === "/vendor-profile") heroTitle.textContent = "Vendor Profile";
          else if (window.location.pathname === "/reservation-list") heroTitle.textContent = "Reservation List";
          else if (window.location.pathname === "/notifications") heroTitle.textContent = "Notifications";
          else if (window.location.pathname === "/vendor-reservation-details") heroTitle.textContent = "Reservation Detail";
          else if (window.location.pathname === "/vendor-event-details") heroTitle.textContent = "Event Detail";
        }

        if (!["/", "/all-events", "/vendor-event-details"].includes(path)) return;

        const res = await authService.getMerchantAllEvents();
        if (res && res.status && Array.isArray(res.data) && res.data.length > 0) {
          const eventsData = res.data;

          // Helper: parse date string "DD-MM-YYYY" and return formatted with day name
          const formatEventDate = (dateStr, startTime, endTime) => {
            if (!dateStr) return "TBA";
            try {
              const [d, m, y] = dateStr.split("-");
              const dateObj = new Date(`${y}-${m}-${d}`);
              const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
              const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
              const dayName = days[dateObj.getDay()];
              const formattedDate = `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
              const timeStr = startTime ? `${dayName}, ${startTime}${endTime ? ` - ${endTime}` : ""}` : dayName;
              return { date: formattedDate, time: timeStr };
            } catch { return { date: dateStr, time: startTime || "" }; }
          };

          // Draft events are kept for direct detail lookup but are not published in upcoming lists.
          const upcomingEvents = eventsData.filter((event) => String(event.status || "").toLowerCase() !== "draft");
          const defaultImgs = [
            "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=900&q=80"
          ];

          // ── EVENT LIST (dashboard and all-events page) ────────────────────
          if (path === "/" || path === "/all-events") {
            const containers = document.querySelectorAll(".content-card .row.g-3, .upcoming-events-grid");
            if (containers && containers.length > 0) {
              containers.forEach((container) => {
                const listToRender = path === "/" ? upcomingEvents.slice(0, 3) : upcomingEvents;
                container.innerHTML = listToRender.map((event, idx) => {
                  const fallbackImg = defaultImgs[idx % defaultImgs.length];
                  const eventImg = (event.image && event.image.startsWith("http")) ? event.image : fallbackImg;
                  const locationAddress = event.serviceLocationId?.address || event.serviceLocationId?.addressName || "Location not specified";
                  const userName = event.userId?.fullName || "Guest User";
                  const eventId = event._id || "";

                  return `
                    <div class="col-md-4 col-sm-6 mb-3">
                      <a href="/vendor-event-details?id=${eventId}" class="text-decoration-none" style="display:block;height:100%;">
                        <div class="item-list-card h-100 d-flex flex-column justify-content-between" style="cursor:pointer;transition:box-shadow 0.2s ease;" onmouseover="this.style.boxShadow='0 6px 20px rgba(91,110,245,0.15)'" onmouseout="this.style.boxShadow=''">
                          <div>
                            <div class="mb-3" style="height: 130px; overflow: hidden; border-radius: 10px; background: #f0f2f5;">
                              <img src="${eventImg}" class="evtimg" style="width:100%; height:100%; object-fit:cover;" onError="this.onerror=null;this.src='${fallbackImg}';" />
                            </div>
                            <div class="d-flex align-items-center justify-content-between mb-2">
                              <span class="badge bg-danger mb-0">${event.eventDate || 'TBA'}</span>
                              <span class="badge ${event.status === 'OngoingEvent' ? 'bg-success' : 'bg-secondary'}">${event.status === 'OngoingEvent' ? 'Ongoing' : (event.status || 'Scheduled')}</span>
                            </div>
                            <h6 class="fw-bold mb-1 text-dark" style="font-size: 15px;">${event.eventTitle || 'Untitled Event'}</h6>
                            ${event.eventStartTime ? `<small class="text-primary d-block mb-1"><i class="bi bi-clock me-1"></i>${event.eventStartTime}${event.eventEndTime ? ` - ${event.eventEndTime}` : ''}</small>` : ''}
                            ${event.description ? `<p class="text-muted small mb-2 text-truncate" style="font-size: 12px;">${event.description}</p>` : ''}
                          </div>
                          <div class="border-top pt-2 mt-2">
                            <small class="text-muted d-block mb-1 text-truncate" title="${locationAddress}"><i class="bi bi-geo-alt text-danger me-1"></i>${locationAddress}</small>
                            <small class="text-dark fw-semibold"><i class="bi bi-person me-1"></i>${userName}</small>
                          </div>
                        </div>
                      </a>
                    </div>
                  `;
                }).join("");
              });
            }
          }

          // ── EVENT DETAIL PAGE ─────────────────────────────────────────────
          if (path === "/vendor-event-details") {
            const params = new URLSearchParams(window.location.search);
            const eventId = params.get("id");
            const event = eventsData.find(e => e._id === eventId) || eventsData[0];
            if (!event) return;

            const fallbackImg = defaultImgs[0];
            const eventImg = (event.image && event.image.startsWith("http")) ? event.image : fallbackImg;
            const locationAddress = event.serviceLocationId?.address || event.serviceLocationId?.addressName || "Location not specified";
            const organizer = event.userId || {};
            const organizerPic = (organizer.profilePic && organizer.profilePic.startsWith("http") && !organizer.profilePic.includes("depositphotos")) ? organizer.profilePic : `https://ui-avatars.com/api/?name=${encodeURIComponent(organizer.fullName || "User")}&background=5b6ef5&color=fff&size=64`;
            const invitedCount = Array.isArray(event.invitedUsers) ? event.invitedUsers.length : 0;
            const visibleServices = (Array.isArray(event.additionalServices) ? event.additionalServices : [])
              .map((service) => {
                if (typeof service === "string") return /^[a-f\d]{24}$/i.test(service) ? "" : service;
                return service?.name || service?.serviceName || service?.title || service?.service?.name || "";
              })
              .filter(Boolean);
            const { date: formattedDate, time: formattedTime } = formatEventDate(event.eventDate, event.eventStartTime, event.eventEndTime);

            const statusBg = event.status === "draft" ? "#6c757d" : event.status === "OngoingEvent" ? "#27ae60" : "#5b6ef5";
            const statusLabel = event.status === "OngoingEvent" ? "Ongoing" : event.status === "draft" ? "Draft" : (event.status || "Scheduled");

            const detailContainer = document.querySelector(".col-lg-9 .content-card, .user-profile-wrapper .content-card");
            if (!detailContainer) return;

            detailContainer.innerHTML = `
              <div class="mb-3">
                <a href="/all-events" class="text-decoration-none text-muted d-inline-flex align-items-center gap-2 mb-3 fw-semibold" style="font-size:14px;">
                  <i class="bi bi-arrow-left"></i> Back to Events
                </a>
                <h5 class="fw-bold mb-0">New Event Detail</h5>
              </div>

              <!-- Event Image Banner -->
              <div class="mb-4" style="height:230px; overflow:hidden; border-radius:16px; background:#eef0ff; position:relative;">
                <img src="${eventImg}" style="width:100%;height:100%;object-fit:cover;" onError="this.onerror=null;this.src='${fallbackImg}';" />
                <div style="position:absolute;inset:0;background:linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.45));border-radius:16px;"></div>
                <div style="position:absolute;top:12px;right:12px;">
                  <span class="badge px-3 py-2 fw-semibold" style="font-size:12px;background:${statusBg};color:#fff;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,0.2);">
                    ${statusLabel}
                  </span>
                </div>
              </div>

              <!-- Title -->
              <h4 class="fw-bold text-dark mb-4">${event.eventTitle || "Event"}</h4>

              <!-- Info rows -->
              <div class="d-flex flex-column gap-3 mb-4">

                <!-- Date & Time -->
                <div class="d-flex align-items-center gap-3 p-3 rounded-3" style="background:#f0f4ff;">
                  <div style="width:44px;height:44px;background:linear-gradient(135deg,#5b6ef5,#7c8ef7);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="bi bi-calendar-event text-white" style="font-size:18px;"></i>
                  </div>
                  <div>
                    <div class="fw-semibold text-dark" style="font-size:15px;">${formattedDate}</div>
                    <small class="text-muted" style="font-size:13px;">${formattedTime}</small>
                  </div>
                </div>

                <!-- Invited Guests -->
                <div class="d-flex align-items-center gap-3 p-3 rounded-3" style="background:#f0f4ff;">
                  <div style="width:44px;height:44px;background:linear-gradient(135deg,#5b6ef5,#7c8ef7);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="bi bi-people text-white" style="font-size:18px;"></i>
                  </div>
                  <div>
                    <div class="fw-semibold text-dark" style="font-size:15px;">Invited Guest</div>
                    <small class="text-muted" style="font-size:13px;">${invitedCount}</small>
                  </div>
                </div>

                <!-- Location -->
                <div class="d-flex align-items-center gap-3 p-3 rounded-3" style="background:#f0f4ff;">
                  <div style="width:44px;height:44px;background:linear-gradient(135deg,#5b6ef5,#7c8ef7);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="bi bi-geo-alt text-white" style="font-size:18px;"></i>
                  </div>
                  <div class="overflow-hidden">
                    <div class="fw-semibold text-dark" style="font-size:15px;">Location</div>
                    <small class="text-muted d-block text-truncate" style="font-size:13px;" title="${locationAddress}">${locationAddress}</small>
                  </div>
                </div>

                <!-- Organizer with Chat -->
                <div class="d-flex align-items-center gap-3 p-3 rounded-3 justify-content-between" style="background:#f0f4ff;">
                  <div class="d-flex align-items-center gap-3">
                    <img src="${organizerPic}" class="rounded-circle flex-shrink-0" width="48" height="48" style="object-fit:cover;" onError="this.onerror=null;this.src='https://ui-avatars.com/api/?name=User&background=5b6ef5&color=fff&size=64';" />
                    <div>
                      <div class="fw-semibold text-dark" style="font-size:15px;">${organizer.fullName || "Organizer"}</div>
                      <small class="text-muted" style="font-size:12px;">Organizer</small>
                    </div>
                  </div>
                  <a href="/chat?eventId=${event._id || ''}&userId=${organizer._id || ''}" class="btn d-inline-flex align-items-center gap-1 fw-semibold" style="background:linear-gradient(135deg,#5b6ef5,#7c8ef7);color:white;border-radius:20px;padding:8px 18px;font-size:13px;text-decoration:none;">
                    <i class="bi bi-chat-dots"></i> Chat
                  </a>
                </div>
              </div>

              <!-- Special Notes / Description -->
              ${event.description ? `
              <div class="mb-4">
                <h6 class="fw-bold text-dark mb-2">Special Notes</h6>
                <div class="p-3 rounded-3" style="background:#f8f9fa; border-left:4px solid #5b6ef5; font-size:14px; color:#4a5568; line-height:1.6;">
                  ${event.description}
                </div>
              </div>` : ""}

              <!-- Additional Services -->
              ${visibleServices.length > 0 ? `
              <div class="mb-4">
                <h6 class="fw-bold text-dark mb-2">Additional Services</h6>
                <div class="d-flex gap-2 flex-wrap">
                  ${visibleServices.map(serviceName => `
                    <span class="badge fw-normal px-3 py-2" style="background:#eef0ff;color:#5b6ef5;border-radius:20px;font-size:12px;">
                      <i class="bi bi-check2-circle me-1"></i>${serviceName}
                    </span>
                  `).join("")}
                </div>
              </div>` : ""}

              <!-- Event Meta -->
              <div class="d-flex gap-3 flex-wrap mb-4">
                ${event.guestTypeEvent ? `<span class="badge fw-normal px-3 py-2" style="background:#e8f5e9;color:#2e7d32;border-radius:20px;font-size:12px;"><i class="bi bi-person-check me-1"></i>${event.guestTypeEvent}</span>` : ""}
                ${event.bringaLongGuest === "Yes" ? `<span class="badge fw-normal px-3 py-2" style="background:#fff3e0;color:#e65100;border-radius:20px;font-size:12px;"><i class="bi bi-people me-1"></i>Bring-a-long: ${event.bringaLongNumber || 0}</span>` : ""}
                ${event.rvsp === "Yes" ? `<span class="badge fw-normal px-3 py-2" style="background:#fce4ec;color:#c62828;border-radius:20px;font-size:12px;"><i class="bi bi-envelope me-1"></i>RSVP by ${event.rvspDate}</span>` : ""}
              </div>
            `;
          }
        }
      } catch (err) {
        console.error("Failed to inject live upcoming events:", err);
      }
    }
    loadUpcomingEvents();
  }, [markup]);

  useEffect(() => {
    const defaultImgs = [
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=80"
    ];

    const getEventImg = (rawImg, fallback) => {
      if (!rawImg || typeof rawImg !== "string" || !rawImg.startsWith("http")) return fallback;
      return rawImg; // Allow all valid http URLs including S3
    };

    const getEntityId = (value) => {
      if (!value) return "";
      return typeof value === "string" ? value : (value._id || value.id || "");
    };

    const getStatusInfo = (statusStr) => {
      const s = (statusStr || "").toLowerCase();
      if (s === "cancelled" || s === "rejected") return { badgeClass: "badge-rejected", icon: "bi-x-circle", text: "Cancelled" };
      if (["confirmed", "accepted", "accept", "activated", "active", "ongoingevent"].includes(s)) {
        return { badgeClass: "text-success fw-bold small", icon: "bi-check-circle", text: "Accepted" };
      }
      return { badgeClass: "badge-received", icon: "bi-gear-wide-connected", text: "Reservation Received" };
    };

    const buildListItemHtml = (item, idx) => {
      const event = item.eventId || {};
      const location = event.serviceLocationId || {};
      const fallbackImg = defaultImgs[idx % defaultImgs.length];
      const eventImg = getEventImg(event.image, fallbackImg);
      const addressStr = location.address || location.addressName || "Antagarh, North Bastar Kanker, Chhattisgarh, India";
      const eventTitle = event.eventTitle || "Reservation Request";
      const eventDateStr = event.eventDate || "";
      const { badgeClass, icon, text } = getStatusInfo(item.status);
      const resId = item._id || "";

      return `
        <a href="/vendor-reservation-details?id=${resId}" class="text-decoration-none" style="display:block;">
          <div class="item-list-card d-flex align-items-center gap-3 p-3 mb-3 rounded-3 border bg-white shadow-sm" style="cursor:pointer; transition: box-shadow 0.2s ease;" onmouseover="this.style.boxShadow='0 6px 20px rgba(91,110,245,0.15)'" onmouseout="this.style.boxShadow=''">
            <img src="${eventImg}" class="rounded flex-shrink-0" width="65" height="65" alt="${eventTitle}" style="object-fit:cover; border-radius:10px;" onError="this.onerror=null;this.src='${fallbackImg}';" />
            <div class="flex-grow-1 overflow-hidden">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <h6 class="fw-bold mb-0 text-dark text-truncate">${eventTitle}</h6>
                ${eventDateStr ? `<span class="badge bg-danger ms-2 flex-shrink-0" style="font-size: 11px;">${eventDateStr}</span>` : ""}
              </div>
              <p class="text-muted small mb-1 text-truncate" title="${addressStr}">
                <i class="bi bi-geo-alt me-1 text-danger"></i>${addressStr}
              </p>
              <div class="d-flex align-items-center justify-content-between">
                <span class="${badgeClass}"><i class="bi ${icon} me-1"></i>${text}</span>
                <small class="text-muted"><i class="bi bi-people me-1"></i>Guests: ${item.adultCount || 1} Adult(s)</small>
              </div>
            </div>
            <i class="bi bi-chevron-right text-muted ms-1 flex-shrink-0"></i>
          </div>
        </a>
      `;
    };

    async function loadReservationRequests() {
      try {
        const path = window.location.pathname;
        if (!["/", "/reservation-list", "/vendor-reservation-details"].includes(path)) return;

        const res = await authService.getMerchantEvents();
        if (!res || !res.status || !Array.isArray(res.data)) return;
        const data = res.data;

        if (path === "/") {
          // Find the Reservation Request Overview card — it's the second content-card on the dashboard
          const allContentCards = Array.from(document.querySelectorAll(".user-profile-wrapper .content-card, .col-lg-9 .content-card"));
          const overviewCard = allContentCards.find(c => c.innerHTML.includes("Reservation Request Overview")) ||
                               allContentCards.find((_, i) => i === 1) || // fallback: second card
                               allContentCards[allContentCards.length - 1]; // or last card
          if (overviewCard) {
            // Find the flex column container inside it
            const overviewContainer = overviewCard.querySelector(".d-flex.flex-column") ||
                                      overviewCard.querySelector('[class*="flex-column"]');
            if (overviewContainer) {
              overviewContainer.innerHTML = data.slice(0, 3).map((item, idx) => buildListItemHtml(item, idx)).join("");
            }
          }
        }

        if (path === "/reservation-list") {
          const mainCard = document.querySelector(".col-lg-9 .content-card, .user-profile-wrapper .content-card");
          if (mainCard) {
            mainCard.innerHTML = `
              <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <h5 class="fw-bold m-0">Reservation Requests</h5>
                <input type="text" id="resSearchInput" class="form-control form-control-sm" placeholder="Search Reservations..." style="max-width:220px;" oninput="(function(v){document.querySelectorAll('#reservationListContainer .item-list-card').forEach(function(el){var title=el.querySelector('h6');if(title)el.closest('a').style.display=title.textContent.toLowerCase().includes(v.toLowerCase())?'block':'none';});})(this.value)" />
              </div>
              <div id="reservationListContainer" class="d-flex flex-column">
                ${data.map((item, idx) => buildListItemHtml(item, idx)).join("")}
              </div>`;
          }
        }

        if (path === "/vendor-reservation-details") {
          const params = new URLSearchParams(window.location.search);
          const resId = params.get("id");
          const item = data.find(d => d._id === resId) || data[0];
          if (!item) return;

          const event = item.eventId || {};
          const location = event.serviceLocationId || {};
          const organizer = event.userId || {};
          const chatEventId = getEntityId(item.eventId) || getEntityId(event);
          const chatUserId = getEntityId(item.userId) || getEntityId(event.userId);
          const fallbackImg = defaultImgs[0];
          const eventImg = getEventImg(event.image, fallbackImg);
          const organizerPic = (organizer.profilePic && organizer.profilePic.startsWith("http") && !organizer.profilePic.includes("depositphotos")) ? organizer.profilePic : `https://ui-avatars.com/api/?name=${encodeURIComponent(organizer.fullName || "User")}&background=5b6ef5&color=fff&size=64`;
          const addressStr = location.address || location.addressName || "Location not specified";
          const { text: statusText } = getStatusInfo(item.status);
          const normalizedStatus = String(item.status || "").toLowerCase();
          const statusBg = normalizedStatus === "cancelled" || normalizedStatus === "rejected"
            ? "#e74c3c"
            : ["confirmed", "accepted", "accept", "activated", "active", "ongoingevent"].includes(normalizedStatus)
              ? "#27ae60"
              : "#f39c12";

          const detailContainer = document.querySelector(".col-lg-9 .content-card, .user-profile-wrapper .content-card");
          if (!detailContainer) return;

          detailContainer.innerHTML = `
            <div class="mb-4">
              <a href="/reservation-list" class="text-decoration-none text-muted d-inline-flex align-items-center gap-2 mb-3 fw-semibold" style="font-size:14px;">
                <i class="bi bi-arrow-left"></i> Back to Reservations
              </a>
              <h5 class="fw-bold mb-0">New Reservation Detail</h5>
            </div>
            <div class="mb-4" style="height:220px; overflow:hidden; border-radius:16px; background:#eef0ff; position:relative;">
              <img src="${eventImg}" style="width:100%;height:100%;object-fit:cover;" onError="this.onerror=null;this.src='${fallbackImg}';" />
              <div style="position:absolute;inset:0;background:linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.45));border-radius:16px;"></div>
              <div style="position:absolute;top:12px;right:12px;">
                <span class="badge px-3 py-2 fw-semibold" style="font-size:12px; background:${statusBg}; color:#fff; border-radius:20px; box-shadow:0 2px 8px rgba(0,0,0,0.2);">
                  ${statusText}
                </span>
              </div>
            </div>
            <h4 class="fw-bold text-dark mb-4">${event.eventTitle || "Reservation Request"}</h4>
            <div class="d-flex flex-column gap-3 mb-4">
              <div class="d-flex align-items-center gap-3 p-3 rounded-3" style="background:#f0f4ff;">
                <div style="width:44px;height:44px;background:linear-gradient(135deg,#5b6ef5,#7c8ef7);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <i class="bi bi-calendar-event text-white" style="font-size:18px;"></i>
                </div>
                <div>
                  <div class="fw-semibold text-dark" style="font-size:15px;">${event.eventDate || "TBA"}</div>
                  ${event.eventStartTime ? `<small class="text-muted" style="font-size:13px;">${event.eventStartTime}${event.eventEndTime ? ` - ${event.eventEndTime}` : ""}</small>` : ""}
                </div>
              </div>
              <div class="d-flex align-items-center gap-3 p-3 rounded-3" style="background:#f0f4ff;">
                <div style="width:44px;height:44px;background:linear-gradient(135deg,#5b6ef5,#7c8ef7);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <i class="bi bi-people text-white" style="font-size:18px;"></i>
                </div>
                <div>
                  <div class="fw-semibold text-dark" style="font-size:15px;">Adult Attendees</div>
                  <small class="text-muted" style="font-size:13px;">${item.adultCount || 1}${item.childCount && item.childCount !== "0" ? ` Adult(s) • ${item.childCount} Child(ren)` : " Adult(s)"}</small>
                </div>
              </div>
              <div class="d-flex align-items-center gap-3 p-3 rounded-3" style="background:#f0f4ff;">
                <div style="width:44px;height:44px;background:linear-gradient(135deg,#5b6ef5,#7c8ef7);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <i class="bi bi-geo-alt text-white" style="font-size:18px;"></i>
                </div>
                <div class="overflow-hidden">
                  <div class="fw-semibold text-dark" style="font-size:15px;">Location</div>
                  <small class="text-muted d-block text-truncate" style="font-size:13px;" title="${addressStr}">${addressStr}</small>
                </div>
              </div>
              <div class="d-flex align-items-center gap-3 p-3 rounded-3 justify-content-between" style="background:#f0f4ff;">
                <div class="d-flex align-items-center gap-3">
                  <img src="${organizerPic}" class="rounded-circle flex-shrink-0" width="48" height="48" style="object-fit:cover;" onError="this.onerror=null;this.src='https://ui-avatars.com/api/?name=User&background=5b6ef5&color=fff&size=64';" />
                  <div>
                    <div class="fw-semibold text-dark" style="font-size:15px;">${organizer.fullName || "Organizer"}</div>
                    <small class="text-muted" style="font-size:12px;">Organizer</small>
                  </div>
                </div>
                <a href="/chat?eventId=${encodeURIComponent(chatEventId)}&userId=${encodeURIComponent(chatUserId)}" class="btn d-inline-flex align-items-center gap-1 fw-semibold${chatEventId && chatUserId ? "" : " disabled"}" aria-disabled="${chatEventId && chatUserId ? "false" : "true"}" style="background:linear-gradient(135deg,#5b6ef5,#7c8ef7);color:white;border-radius:20px;padding:8px 18px;font-size:13px;text-decoration:none;">
                  <i class="bi bi-chat-dots"></i> Chat
                </a>
              </div>
            </div>
            ${item.instruction ? `<div class="mb-4"><h6 class="fw-bold text-dark mb-2">Special Notes</h6><div class="p-3 rounded-3" style="background:#f8f9fa; border-left: 4px solid #5b6ef5; font-size:14px; color:#4a5568;">${item.instruction}</div></div>` : ""}
            ${item.comment ? `<div class="mb-4"><h6 class="fw-bold text-dark mb-2">Comment</h6><div class="p-3 rounded-3" style="background:#fff9e6; border-left: 4px solid #f39c12; font-size:14px; color:#4a5568;">${item.comment}</div></div>` : ""}
            ${item.status === "pending" ? `
              <div id="confirmAlertMsg" class="mb-3" style="display:none;"></div>
              <div class="d-flex gap-3 mt-3">
                <button id="confirmResBtn" class="btn fw-bold flex-grow-1 py-3" style="background:linear-gradient(135deg,#5b6ef5,#7c8ef7);color:white;border-radius:12px;font-size:15px;border:none;">
                  <i class="bi bi-check-circle me-2"></i>Confirm Reservation
                </button>
                <button id="declineResBtn" class="btn fw-bold flex-grow-1 py-3" style="background:white;color:#e74c3c;border:2px solid #e74c3c;border-radius:12px;font-size:15px;">
                  <i class="bi bi-x-circle me-2"></i>Decline
                </button>
              </div>
              <div id="reservationActionModal" style="display:none;position:fixed;inset:0;z-index:1050;background:rgba(15,23,42,.5);align-items:center;justify-content:center;padding:20px;">
                <div style="background:white;border-radius:16px;width:min(520px,100%);padding:24px;box-shadow:0 20px 50px rgba(0,0,0,.2);">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 id="reservationModalTitle" class="fw-bold mb-0">Confirm Reservation</h5>
                    <button type="button" id="closeReservationModal" class="btn-close" aria-label="Close"></button>
                  </div>
                  <label for="confirmMessageInput" class="fw-bold text-dark mb-2" style="font-size:15px;">Type Confirmation Message</label>
                  <textarea id="confirmMessageInput" class="form-control" rows="4" placeholder="Type Confirmation Message..." style="border-radius:12px;border:1px solid #d1d5db;padding:12px 16px;font-size:14px;"></textarea>
                  <div id="reservationModalError" class="alert alert-danger rounded-3 mt-3" style="display:none;"></div>
                  <div class="d-flex gap-3 mt-4">
                    <button type="button" id="cancelReservationModal" class="btn btn-light flex-grow-1 py-2">Cancel</button>
                    <button type="button" id="submitReservationAction" class="btn flex-grow-1 py-2 fw-bold"></button>
                  </div>
                </div>
              </div>
            ` : `
              <div class="w-100 p-3 rounded-3 text-center fw-semibold mt-3" style="background:${item.status === "cancelled" ? "#fdf2f2" : "#f0fff4"};color:${item.status === "cancelled" ? "#e74c3c" : "#27ae60"};">
                <i class="bi ${item.status === "cancelled" ? "bi-x-circle" : "bi-check-circle"} me-2"></i>
                This reservation is ${statusText}
              </div>
            `}
          `;

          const confirmBtn = detailContainer.querySelector("#confirmResBtn");
          const declineBtn = detailContainer.querySelector("#declineResBtn");
          const actionModal = detailContainer.querySelector("#reservationActionModal");
          const modalTitle = detailContainer.querySelector("#reservationModalTitle");
          const modalInput = detailContainer.querySelector("#confirmMessageInput");
          const modalError = detailContainer.querySelector("#reservationModalError");
          const modalSubmit = detailContainer.querySelector("#submitReservationAction");
          let selectedAction = "confirm";
          const closeModal = () => {
            if (actionModal) actionModal.style.display = "none";
            if (modalError) modalError.style.display = "none";
          };
          const openModal = (action) => {
            selectedAction = action;
            if (modalError) modalError.style.display = "none";
            if (modalTitle) modalTitle.textContent = action === "confirm" ? "Confirm Reservation" : "Decline Reservation";
            if (modalSubmit) {
              modalSubmit.textContent = action === "confirm" ? "Confirm Reservation" : "Decline Reservation";
              modalSubmit.style.background = action === "confirm" ? "linear-gradient(135deg,#5b6ef5,#7c8ef7)" : "#e74c3c";
              modalSubmit.style.color = "white";
            }
            if (actionModal) actionModal.style.display = "flex";
            modalInput?.focus();
          };
          detailContainer.querySelector("#closeReservationModal")?.addEventListener("click", closeModal);
          detailContainer.querySelector("#cancelReservationModal")?.addEventListener("click", closeModal);
          actionModal?.addEventListener("click", (event) => { if (event.target === actionModal) closeModal(); });

          if (confirmBtn) {
            confirmBtn.addEventListener("click", () => openModal("confirm"));
          }
          if (declineBtn) {
            declineBtn.addEventListener("click", () => openModal("decline"));
          }
          if (modalSubmit) {
            modalSubmit.addEventListener("click", async () => {
              const cancelReason = modalInput?.value.trim() || (selectedAction === "confirm" ? "Reservation confirmed by merchant" : "Declined by merchant");
              const alertDiv = detailContainer.querySelector("#confirmAlertMsg");
              modalSubmit.disabled = true;
              modalSubmit.textContent = selectedAction === "confirm" ? "Confirming..." : "Declining...";

              try {
                const res = selectedAction === "confirm"
                  ? await authService.activateReservation({ reservationId: resId, cancelReason })
                  : await authService.cancelReservation({ reservationId: resId, cancelReason });
                if (res && res.status) {
                  closeModal();
                  if (alertDiv) {
                    alertDiv.style.display = "block";
                    alertDiv.className = "alert alert-success rounded-3";
                    alertDiv.textContent = res.message || (selectedAction === "confirm" ? "Reservation activated successfully." : "Reservation cancelled successfully.");
                  }
                  setTimeout(() => {
                    router.push("/reservation-list");
                  }, 1200);
                } else {
                  if (modalError) {
                    modalError.style.display = "block";
                    modalError.textContent = res?.message || (selectedAction === "confirm" ? "Failed to confirm reservation." : "Failed to decline reservation.");
                  }
                  modalSubmit.disabled = false;
                  modalSubmit.textContent = selectedAction === "confirm" ? "Confirm Reservation" : "Decline Reservation";
                }
              } catch (err) {
                if (modalError) {
                  modalError.style.display = "block";
                  modalError.textContent = err.message || (selectedAction === "confirm" ? "Failed to confirm reservation." : "Failed to decline reservation.");
                }
                modalSubmit.disabled = false;
                modalSubmit.textContent = selectedAction === "confirm" ? "Confirm Reservation" : "Decline Reservation";
              }
            });
          }
        }
      } catch (err) {
        console.error("Failed to load merchant reservation requests:", err);
      }
    }
    loadReservationRequests();
  }, [markup]);

  // ─── LIVE CHAT PAGE ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || window.location.pathname !== "/chat") return;

    const params = new URLSearchParams(window.location.search);
    const eventId = params.get("eventId");
    const userId = params.get("userId");

    const chatBody = document.querySelector("#chatBody");
    const chatHeader = document.querySelector(".chat-header");
    const chatForm = document.querySelector("#chatForm");
    const messageInput = document.querySelector("#messageInput");

    if (!eventId || !userId) {
      if (chatBody) chatBody.innerHTML = `<div class="text-center text-muted py-5">Chat details are missing. Please return to the reservation and try again.</div>`;
      if (messageInput) messageInput.disabled = true;
      return;
    }

    // Helper: build a message bubble
    const buildBubble = (msg, isOutgoing) => {
      const time = msg.timeAgo || new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const row = document.createElement("div");
      row.className = `message-row ${isOutgoing ? "outgoing" : "incoming"}`;
      const bubble = document.createElement("div");
      bubble.className = "message-bubble";
      bubble.textContent = msg.content || "";
      const timeLabel = document.createElement("span");
      timeLabel.className = "message-time";
      timeLabel.textContent = time;
      if (isOutgoing) {
        const check = document.createElement("i");
        check.className = "bi bi-check2-all text-white-50 ms-1";
        timeLabel.appendChild(check);
      }
      row.append(bubble, timeLabel);
      return row;
    };

    async function loadChat() {
      try {
        const res = await authService.getMerchantChat({ eventId, userId });
        if (!res || !res.status || !res.data) {
          throw new Error(res?.message || "Failed to load chat");
        }

        const { participants, messages } = res.data;
        const user = participants?.user || {};
        const userPic = (user.profilePic && user.profilePic.startsWith("http"))
          ? user.profilePic
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=5b6ef5&color=fff&size=64`;

        // ── Update header with user info ─────────────────────────────────────
        if (chatHeader) {
          chatHeader.innerHTML = `
            <div class="d-flex align-items-center gap-3">
              <button type="button" onclick="history.back()" class="btn btn-link text-muted me-1 p-0" style="font-size:18px; text-decoration:none;" aria-label="Go back">
                <i class="bi bi-arrow-left"></i>
              </button>
              <div class="avatar-wrapper">
                <img src="${userPic}" class="avatar-img" alt="${user.name || 'User'}" onError="this.onerror=null;this.src='https://ui-avatars.com/api/?name=User&background=5b6ef5&color=fff&size=64';" />
                <span class="status-indicator status-online"></span>
              </div>
              <div>
                <h6 class="fw-bold mb-0">${user.name || "User"}</h6>
                <small class="text-success fw-semibold"><i class="bi bi-circle-fill me-1" style="font-size:8px;"></i>Online</small>
              </div>
            </div>
          `;
        }

        // ── Render messages ──────────────────────────────────────────────────
        if (chatBody) {
          const currentCount = messages ? messages.length : 0;
          if (chatBody.getAttribute("data-msg-count") !== String(currentCount)) {
            chatBody.setAttribute("data-msg-count", String(currentCount));
            chatBody.innerHTML = "";
            if (!messages || messages.length === 0) {
              chatBody.innerHTML = `<div class="text-center text-muted py-5" style="font-size:14px;">
                <i class="bi bi-chat-dots" style="font-size:40px;opacity:0.3;"></i>
                <div class="mt-2">No messages yet. Say hello!</div>
              </div>`;
            } else {
              messages.forEach(msg => {
                const isOutgoing = msg.senderType === "merchant";
                chatBody.appendChild(buildBubble(msg, isOutgoing));
              });
              chatBody.scrollTop = chatBody.scrollHeight;
            }
          }
        }

        // ── Override send form to use real API ───────────────────────────────
      } catch (err) {
        console.error("Failed to load merchant chat:", err);
        if (chatBody) chatBody.innerHTML = `<div class="text-center text-muted py-5">Failed to load chat. Please try again.</div>`;
      }
    }

    const handleSubmit = async (submitEvent) => {
      submitEvent.preventDefault();
      const content = messageInput?.value.trim();
      if (!content || !chatBody) return;

      const submitButton = chatForm?.querySelector('button[type="submit"]');
      if (messageInput) messageInput.disabled = true;
      if (submitButton) submitButton.disabled = true;

      const optimistic = buildBubble({ content, timeAgo: "just now" }, true);
      chatBody.appendChild(optimistic);
      chatBody.scrollTop = chatBody.scrollHeight;
      if (messageInput) messageInput.value = "";

      try {
        const result = await authService.sendMerchantMessage({ eventId, userId, content });
        if (!result?.status) throw new Error(result?.message || "Failed to send message");
        chatBody.removeAttribute("data-msg-count");
        await loadChat();
      } catch (err) {
        optimistic.remove();
        if (messageInput) messageInput.value = content;
        console.error("Send message failed:", err);
      } finally {
        if (messageInput) {
          messageInput.disabled = false;
          messageInput.focus();
        }
        if (submitButton) submitButton.disabled = false;
      }
    };

    chatForm?.addEventListener("submit", handleSubmit);
    loadChat();
    const pollInterval = setInterval(loadChat, 3000);
    return () => {
      clearInterval(pollInterval);
      chatForm?.removeEventListener("submit", handleSubmit);
    };
  }, [markup]);

  // Strip static placeholders before rendering so they never flash:
  // 1. Remove src from the sidebar profile <img> (the unsplash placeholder)
  // 2. Remove "Vendor name" text from sidebar h5 — replaced by applyProfile
  const contentCleaned = markup
    ? markup
        .replace(/<header[\s\S]*?<\/header>/i, "")
        .replace(/<footer[\s\S]*?<\/footer>/i, "")
        .replace(
          /(<div[^>]*class="user-profile-img"[^>]*>[\s\S]{0,400}?<img[^>]*?)\s+src="[^"]*unsplash[^"]*"([^>]*>)/gi,
          '$1$2'
        )
        .replace(
          /(<div[^>]*class="user-profile-img"[^>]*>[\s\S]{0,400}?<img[^>]*?)\s+src="https?:\/\/[^"]*photo[^"]*"([^>]*>)/gi,
          '$1$2'
        )
        .replace(
          /(<div[^>]*class="user-profile-sidebar-top"[\s\S]{0,600}?<h5[^>]*>)Vendor name(<\/h5>)/gi,
          '$1$2'
        )
    : "";


  return (
    <>
      <Header />
      <div dangerouslySetInnerHTML={{ __html: contentCleaned }} />
      <Footer />
    </>
  );
}
