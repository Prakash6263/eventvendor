import { formatEventDate, getDateCondition, EVENT_DEFAULT_SVG, isBadEventImage } from "../utils/formatters";
import { authService } from "../services/authService";

function resolveEventImage(rawImg) {
  const isBad = isBadEventImage(rawImg);
  return {
    src: isBad ? EVENT_DEFAULT_SVG : rawImg,
    fallback: EVENT_DEFAULT_SVG
  };
}

// ── Horizontal List Row View (Matching Reservation-List style) ─────────────
function renderEventListHtml(eventsList) {
  return eventsList
    .map((event) => {
      const { src: eventImg, fallback: fallbackImg } = resolveEventImage(event.image);
      const locationAddress = event.serviceLocationId?.address || event.serviceLocationId?.addressName || "Location not specified";
      const userName = event.userId?.fullName || "Guest User";
      const eventId = event._id || "";
      const { shortDate } = formatEventDate(event.eventDate, event.eventStartTime, event.eventEndTime);
      const cond = getDateCondition(event.eventDate, event.status);
      const invitedCount = Array.isArray(event.invitedUsers) ? event.invitedUsers.length : (event.guestCount || 0);

      // Status pill styling
      let statusBadgeHtml = "";
      if (cond.type === "ongoing") {
        statusBadgeHtml = `
          <span class="badge ${cond.badgeClass} rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1.5 fw-semibold" style="font-size:11.5px;">
            <span class="status-dot status-dot-success"></span>
            <span>Ongoing</span>
          </span>`;
      } else if (cond.type === "upcoming") {
        statusBadgeHtml = `
          <span class="badge ${cond.badgeClass} rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1.5 fw-semibold" style="font-size:11.5px;">
            <i class="fa-regular fa-calendar-check" style="font-size:11px;"></i>
            <span>${cond.label}</span>
          </span>`;
      } else if (cond.type === "past") {
        statusBadgeHtml = `
          <span class="badge ${cond.badgeClass} rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1.5 fw-semibold" style="font-size:11.5px;">
            <i class="fa-solid fa-circle-check" style="color:#64748b; font-size:11px;"></i>
            <span>${cond.label || "Completed"}</span>
          </span>`;
      } else if (cond.type === "cancelled") {
        statusBadgeHtml = `
          <span class="badge ${cond.badgeClass} rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1.5 fw-semibold" style="font-size:11.5px;">
            <i class="fa-regular fa-circle-xmark" style="font-size:11px;"></i>
            <span>Cancelled</span>
          </span>`;
      } else {
        statusBadgeHtml = `
          <span class="badge ${cond.badgeClass || 'badge-soft-neutral'} rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1.5 fw-semibold" style="font-size:11.5px;">
            <span>${cond.label}</span>
          </span>`;
      }

      return `
        <div class="col-12 mb-3">
          <a href="/vendor-event-details?id=${eventId}" class="text-decoration-none" style="display:block;">
            <div class="modern-card d-flex align-items-center gap-3 p-3">
              <div class="card-image-wrap flex-shrink-0" style="width:72px; height:72px; border-radius:14px; position:relative; overflow:hidden; background:#f1f5f9; border:1px solid #e2e8f0;">
                <img src="${eventImg}" alt="${event.eventTitle || 'Event'}" style="width:100%; height:100%; object-fit:cover;" onError="this.onerror=null;this.src='${fallbackImg}';" onLoad="if(this.naturalWidth && this.naturalWidth<=160 && this.naturalHeight<=120){this.src='${fallbackImg}';}" />
              </div>
              <div class="flex-grow-1 overflow-hidden">
                <div class="d-flex align-items-center justify-content-between mb-1 gap-2">
                  <h6 class="fw-bold mb-0 text-dark text-truncate" style="font-size:15px; letter-spacing:-0.2px; font-family:'Poppins', sans-serif;">${event.eventTitle || 'Untitled Event'}</h6>
                  ${shortDate ? `
                    <span class="badge ${cond.type === 'upcoming' ? 'badge-soft-primary' : 'badge-soft-neutral'} flex-shrink-0 px-2.5 py-1 rounded-pill fw-semibold" style="font-size:11.5px;">
                      <i class="fa-regular fa-calendar-days me-1 ${cond.type === 'upcoming' ? 'text-primary' : 'text-muted'}"></i>${shortDate}
                    </span>` : ""}
                </div>
                <p class="text-muted small mb-2 text-truncate" title="${locationAddress}" style="font-size:12.5px;">
                  <i class="fa-solid fa-location-dot me-1.5 text-danger"></i>${locationAddress}
                </p>
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  ${statusBadgeHtml}
                  <div class="d-flex align-items-center gap-3">
                    ${event.eventStartTime ? `
                      <small class="text-muted fw-medium"><i class="fa-regular fa-clock me-1 text-primary"></i>${event.eventStartTime}${event.eventEndTime ? ` - ${event.eventEndTime}` : ''}</small>
                    ` : ''}
                    ${invitedCount > 0 ? `
                      <small class="text-muted fw-medium"><i class="fa-solid fa-user-group me-1 text-primary"></i>${invitedCount} Guest(s)</small>
                    ` : `
                      <small class="text-muted fw-medium"><i class="fa-regular fa-user me-1 text-primary"></i>${userName}</small>
                    `}
                  </div>
                </div>
              </div>
              <div class="flex-shrink-0 ms-1 d-flex align-items-center justify-content-center" style="width:34px; height:34px; border-radius:50%; background:#f8fafc; border:1px solid #edf2f7; color:#64748b; transition:all 0.2s ease;">
                <i class="fa-solid fa-chevron-right" style="font-size:12px;"></i>
              </div>
            </div>
          </a>
        </div>
      `;
    })
    .join("");
}

export function initEventsFeature(eventsData = [], path) {
  const safeEvents = Array.isArray(eventsData) ? eventsData : [];
  const nonDraftEvents = safeEvents.filter((event) => String(event.status || "").toLowerCase() !== "draft");

  // Separate events by timing/condition
  const upcomingEvents = nonDraftEvents.filter(e => getDateCondition(e.eventDate, e.status).type === "upcoming");
  const ongoingEvents = nonDraftEvents.filter(e => getDateCondition(e.eventDate, e.status).type === "ongoing");
  const pastEvents = nonDraftEvents.filter(e => getDateCondition(e.eventDate, e.status).type === "past");
  const allEvents = nonDraftEvents;

  // ── DASHBOARD (path === "/") ─────────────────────────────────────────────
  if (path === "/") {
    const cardParent = document.querySelector(".content-card:has(.row.g-3)") || document.querySelector(".content-card");
    const container = document.querySelector(".content-card .row.g-3, .upcoming-events-grid");

    if (cardParent && container) {
      const userProfileWrapper = cardParent.closest(".user-profile-wrapper") || cardParent.parentElement;

      // 1. Inject or update the Top Executive Overview (Welcome Header, KPI Cards, and Quick Hub)
      if (userProfileWrapper && !document.getElementById("dash-overview-hub")) {
        const merchantInfo = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("merchant_info") || "{}") : {};
        const vendorName = merchantInfo?.fullName || merchantInfo?.name || merchantInfo?.merchantName || document.querySelector(".user-profile-sidebar-top h5, .user-profile-sidebar-top h4")?.textContent?.trim() || "Thakus Restaurant";
        
        const now = new Date();
        const dateFormatted = now.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
        const pendingCount = (typeof window !== "undefined" && window.__merchantPendingCount != null) ? window.__merchantPendingCount : 0;
        const activeServicesCount = (typeof window !== "undefined" && window.__merchantServicesCount != null) ? window.__merchantServicesCount : 4;

        const overviewHubHtml = `
          <div id="dash-overview-hub" class="mb-4">
            <!-- 1. Executive Welcome Header -->
            <div class="dash-welcome-section mb-4 p-4 rounded-4" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08);">
              <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
                <div>
                  <div class="d-flex align-items-center gap-2 mb-1.5 flex-wrap">
                    <span class="badge rounded-pill px-2.5 py-1 text-white fw-medium" style="background: rgba(255,255,255,0.15); font-size: 11.5px; backdrop-filter: blur(4px);">
                      <i class="fa-solid fa-circle-check text-success me-1"></i> Verified Merchant Portal
                    </span>
                    <span class="text-white-50" style="font-size: 12px;"><i class="fa-regular fa-calendar me-1"></i>${dateFormatted}</span>
                  </div>
                  <h3 class="fw-bold text-white mb-1" style="font-family: 'Poppins', sans-serif; letter-spacing: -0.3px;">
                    Welcome back, <span id="dash-vendor-name">${vendorName}</span> 👋
                  </h3>
                  <p class="text-white-50 small mb-0" style="font-size: 13px;">Manage your business performance, customer bookings, and active menu services.</p>
                </div>
                <div class="d-flex align-items-center gap-2 flex-wrap">
                  <a href="/services" class="btn btn-primary rounded-pill px-3.5 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm" style="font-size: 13px; background: #4361ee; border: none;">
                    <i class="fa-solid fa-plus"></i> Add Service
                  </a>
                  <a href="/reservation-list" class="btn btn-light rounded-pill px-3.5 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm text-dark" style="font-size: 13px; background: #ffffff; border: 1px solid #e2e8f0;">
                    <i class="fa-solid fa-calendar-check text-primary"></i> Booking Requests
                  </a>
                </div>
              </div>
            </div>

            <!-- 2. KPI Metrics / Executive Stat Cards -->
            <div class="row g-3 mb-4" id="dash-kpi-cards">
              <!-- Total Bookings -->
              <div class="col-sm-6 col-lg-3">
                <div class="dash-stat-card h-100">
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <span class="text-muted fw-semibold text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">Total Bookings</span>
                    <div class="d-flex align-items-center justify-content-center rounded-3" style="width: 38px; height: 38px; background: #eff6ff; color: #3b82f6;">
                      <i class="fa-regular fa-calendar-days" style="font-size: 16px;"></i>
                    </div>
                  </div>
                  <div class="d-flex align-items-baseline gap-2">
                    <h3 class="fw-bold text-dark mb-0" style="font-family: 'Poppins', sans-serif; font-size: 26px;" id="dash-stat-total-events">${allEvents.length}</h3>
                    <span class="badge rounded-pill px-2 py-0.5 fw-medium" style="background: #eef2ff; color: #4f46e5; font-size: 11px;">All Time</span>
                  </div>
                  <div class="text-muted small mt-2 d-flex align-items-center gap-1" style="font-size: 11.5px;">
                    <i class="fa-solid fa-arrow-trend-up text-success"></i> Customer bookings
                  </div>
                </div>
              </div>

              <!-- Pending Requests -->
              <div class="col-sm-6 col-lg-3">
                <a href="/reservation-list" class="text-decoration-none d-block h-100">
                  <div class="dash-stat-card h-100">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <span class="text-muted fw-semibold text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">Pending Requests</span>
                      <div class="d-flex align-items-center justify-content-center rounded-3" style="width: 38px; height: 38px; background: #fffbeb; color: #f59e0b;">
                        <i class="fa-regular fa-clock" style="font-size: 16px;"></i>
                      </div>
                    </div>
                    <div class="d-flex align-items-baseline gap-2">
                      <h3 class="fw-bold text-dark mb-0" style="font-family: 'Poppins', sans-serif; font-size: 26px;" id="dash-stat-pending-count">${pendingCount}</h3>
                      <span class="badge rounded-pill px-2 py-0.5 fw-medium" style="background: #fef3c7; color: #b45309; font-size: 11px;">Action Req.</span>
                    </div>
                    <div class="text-primary small mt-2 d-flex align-items-center gap-1 fw-medium" style="font-size: 11.5px;">
                      <span>Review now</span> <i class="fa-solid fa-arrow-right" style="font-size: 10px;"></i>
                    </div>
                  </div>
                </a>
              </div>

              <!-- Active Services -->
              <div class="col-sm-6 col-lg-3">
                <a href="/services" class="text-decoration-none d-block h-100">
                  <div class="dash-stat-card h-100">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <span class="text-muted fw-semibold text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">Active Services</span>
                      <div class="d-flex align-items-center justify-content-center rounded-3" style="width: 38px; height: 38px; background: #ecfdf5; color: #10b981;">
                        <i class="fa-solid fa-utensils" style="font-size: 16px;"></i>
                      </div>
                    </div>
                    <div class="d-flex align-items-baseline gap-2">
                      <h3 class="fw-bold text-dark mb-0" style="font-family: 'Poppins', sans-serif; font-size: 26px;" id="dash-stat-active-services">${activeServicesCount}</h3>
                      <span class="badge rounded-pill px-2 py-0.5 fw-medium" style="background: #d1fae5; color: #047857; font-size: 11px;">Live</span>
                    </div>
                    <div class="text-muted small mt-2 d-flex align-items-center gap-1" style="font-size: 11.5px;">
                      <i class="fa-solid fa-check text-success"></i> Published on Eventuna
                    </div>
                  </div>
                </a>
              </div>

              <!-- Completed Events -->
              <div class="col-sm-6 col-lg-3">
                <div class="dash-stat-card h-100">
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <span class="text-muted fw-semibold text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">Completed</span>
                    <div class="d-flex align-items-center justify-content-center rounded-3" style="width: 38px; height: 38px; background: #f5f3ff; color: #8b5cf6;">
                      <i class="fa-solid fa-circle-check" style="font-size: 16px;"></i>
                    </div>
                  </div>
                  <div class="d-flex align-items-baseline gap-2">
                    <h3 class="fw-bold text-dark mb-0" style="font-family: 'Poppins', sans-serif; font-size: 26px;" id="dash-stat-completed">${pastEvents.length}</h3>
                    <span class="badge rounded-pill px-2 py-0.5 fw-medium" style="background: #ede9fe; color: #6d28d9; font-size: 11px;">Fulfilled</span>
                  </div>
                  <div class="text-muted small mt-2 d-flex align-items-center gap-1" style="font-size: 11.5px;">
                    <i class="fa-solid fa-circle-check" style="color: #8b5cf6;"></i> Successfully concluded
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. Quick Business Management Hub -->
            <div class="mb-4">
              <div class="d-flex align-items-center justify-content-between mb-2.5">
                <h6 class="fw-bold text-dark mb-0" style="font-family: 'Poppins', sans-serif; font-size: 15px;">Quick Business Hub</h6>
                <span class="text-muted small" style="font-size: 12px;">Manage operations & settings</span>
              </div>
              <div class="row g-3">
                <!-- Tile 1: Services -->
                <div class="col-sm-6 col-lg-3">
                  <a href="/services" class="text-decoration-none d-block h-100">
                    <div class="dash-quick-hub-card">
                      <div class="d-flex align-items-center gap-2.5 mb-2">
                        <div class="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style="width: 34px; height: 34px; background: #eff6ff; color: #3b82f6;">
                          <i class="fa-solid fa-utensils" style="font-size: 14px;"></i>
                        </div>
                        <h6 class="fw-bold text-dark mb-0" style="font-size: 13.5px;">My Services</h6>
                      </div>
                      <p class="text-muted mb-2 small line-clamp-2" style="font-size: 12px; line-height: 1.4;">Manage dining menus, branches, and active categories.</p>
                      <div class="text-primary fw-semibold small d-inline-flex align-items-center gap-1" style="font-size: 12px;">
                        <span>Manage</span> <i class="fa-solid fa-arrow-right quick-hub-arrow" style="font-size: 10px;"></i>
                      </div>
                    </div>
                  </a>
                </div>

                <!-- Tile 2: Reservations -->
                <div class="col-sm-6 col-lg-3">
                  <a href="/reservation-list" class="text-decoration-none d-block h-100">
                    <div class="dash-quick-hub-card">
                      <div class="d-flex align-items-center gap-2.5 mb-2">
                        <div class="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style="width: 34px; height: 34px; background: #fffbeb; color: #f59e0b;">
                          <i class="fa-solid fa-calendar-check" style="font-size: 14px;"></i>
                        </div>
                        <h6 class="fw-bold text-dark mb-0" style="font-size: 13.5px;">Reservations</h6>
                      </div>
                      <p class="text-muted mb-2 small line-clamp-2" style="font-size: 12px; line-height: 1.4;">Review and confirm customer table booking requests.</p>
                      <div class="text-primary fw-semibold small d-inline-flex align-items-center gap-1" style="font-size: 12px;">
                        <span>View list</span> <i class="fa-solid fa-arrow-right quick-hub-arrow" style="font-size: 10px;"></i>
                      </div>
                    </div>
                  </a>
                </div>

                <!-- Tile 3: Locations -->
                <div class="col-sm-6 col-lg-3">
                  <a href="/locations" class="text-decoration-none d-block h-100">
                    <div class="dash-quick-hub-card">
                      <div class="d-flex align-items-center gap-2.5 mb-2">
                        <div class="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style="width: 34px; height: 34px; background: #ecfdf5; color: #10b981;">
                          <i class="fa-solid fa-location-dot" style="font-size: 14px;"></i>
                        </div>
                        <h6 class="fw-bold text-dark mb-0" style="font-size: 13.5px;">Locations</h6>
                      </div>
                      <p class="text-muted mb-2 small line-clamp-2" style="font-size: 12px; line-height: 1.4;">Configure branch addresses, maps, and schedules.</p>
                      <div class="text-primary fw-semibold small d-inline-flex align-items-center gap-1" style="font-size: 12px;">
                        <span>Branches</span> <i class="fa-solid fa-arrow-right quick-hub-arrow" style="font-size: 10px;"></i>
                      </div>
                    </div>
                  </a>
                </div>

                <!-- Tile 4: Coupons -->
                <div class="col-sm-6 col-lg-3">
                  <a href="/coupons" class="text-decoration-none d-block h-100">
                    <div class="dash-quick-hub-card">
                      <div class="d-flex align-items-center gap-2.5 mb-2">
                        <div class="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style="width: 34px; height: 34px; background: #fdf2f8; color: #ec4899;">
                          <i class="fa-solid fa-tags" style="font-size: 14px;"></i>
                        </div>
                        <h6 class="fw-bold text-dark mb-0" style="font-size: 13.5px;">Coupons & Deals</h6>
                      </div>
                      <p class="text-muted mb-2 small line-clamp-2" style="font-size: 12px; line-height: 1.4;">Create special discount codes and promotional vouchers.</p>
                      <div class="text-primary fw-semibold small d-inline-flex align-items-center gap-1" style="font-size: 12px;">
                        <span>Promotions</span> <i class="fa-solid fa-arrow-right quick-hub-arrow" style="font-size: 10px;"></i>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        `;

        cardParent.insertAdjacentHTML("beforebegin", overviewHubHtml);

        // Fetch live services count asynchronously in background
        if (typeof authService?.getMerchantServicesList === "function") {
          authService.getMerchantServicesList().then((res) => {
            if (Array.isArray(res?.data)) {
              let count = 0;
              res.data.forEach((g) => {
                if (Array.isArray(g.services)) count += g.services.length;
              });
              if (count > 0) {
                if (typeof window !== "undefined") window.__merchantServicesCount = count;
                const servEl = document.getElementById("dash-stat-active-services");
                if (servEl) servEl.textContent = count;
              }
            }
          }).catch(() => {});
        }
      } else {
        // Update stats if hub is already mounted
        const totalEventsEl = document.getElementById("dash-stat-total-events");
        if (totalEventsEl) totalEventsEl.textContent = allEvents.length;
        const completedEventsEl = document.getElementById("dash-stat-completed");
        if (completedEventsEl) completedEventsEl.textContent = pastEvents.length;
        const vendorNameEl = document.getElementById("dash-vendor-name");
        if (vendorNameEl) {
          const sidebarName = document.querySelector(".user-profile-sidebar-top h5, .user-profile-sidebar-top h4")?.textContent?.trim();
          if (sidebarName && sidebarName !== "Vendor Name") {
            vendorNameEl.textContent = sidebarName;
          }
        }
      }

      // Determine initial active tab:
      // If there are upcoming events, default to 'upcoming'
      // Else if there are ongoing events, default to 'ongoing'
      // Else if there are past/all events, default to 'all' so dashboard isn't blank, but with accurate title
      let activeTab = upcomingEvents.length > 0 ? "upcoming" : (ongoingEvents.length > 0 ? "ongoing" : (allEvents.length > 0 ? "all" : "upcoming"));

      // Clean/Replace the header to have dynamic title & modern interactive filter tabs
      const existingHeader = cardParent.querySelector(".d-flex.justify-content-between.align-items-center.mb-3") || cardParent.querySelector("#dash-events-header");
      
      const headerHtml = `
        <div id="dash-events-header" class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div>
            <h5 class="fw-bold m-0 text-dark" id="dash-event-heading">
              ${activeTab === "upcoming" ? "Upcoming Events" : (activeTab === "ongoing" ? "Ongoing Events" : (activeTab === "past" ? "Past Events" : "Events & Bookings"))}
            </h5>
            <small class="text-muted" id="dash-event-subheading" style="font-size:12px;">
              ${activeTab === "upcoming" ? "Scheduled bookings on your calendar" : (activeTab === "ongoing" ? "Events currently in progress" : (activeTab === "past" ? "Past completed events" : "All customer events and bookings"))}
            </small>
          </div>
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <div class="btn-group btn-group-sm p-1 bg-light rounded-pill border" role="group" id="dash-event-tab-group">
              <button type="button" class="btn btn-sm rounded-pill fw-semibold dash-event-filter-btn ${activeTab === 'upcoming' ? 'active btn-primary text-white shadow-xs' : 'btn-light text-secondary'}" data-tab="upcoming" style="font-size:12px; padding:3px 12px; transition:all 0.15s ease;">
                Upcoming (${upcomingEvents.length})
              </button>
              ${ongoingEvents.length > 0 ? `
                <button type="button" class="btn btn-sm rounded-pill fw-semibold dash-event-filter-btn ${activeTab === 'ongoing' ? 'active btn-primary text-white shadow-xs' : 'btn-light text-secondary'}" data-tab="ongoing" style="font-size:12px; padding:3px 12px; transition:all 0.15s ease;">
                  Ongoing (${ongoingEvents.length})
                </button>
              ` : ''}
              <button type="button" class="btn btn-sm rounded-pill fw-semibold dash-event-filter-btn ${activeTab === 'past' ? 'active btn-primary text-white shadow-xs' : 'btn-light text-secondary'}" data-tab="past" style="font-size:12px; padding:3px 12px; transition:all 0.15s ease;">
                Past (${pastEvents.length})
              </button>
              <button type="button" class="btn btn-sm rounded-pill fw-semibold dash-event-filter-btn ${activeTab === 'all' ? 'active btn-primary text-white shadow-xs' : 'btn-light text-secondary'}" data-tab="all" style="font-size:12px; padding:3px 12px; transition:all 0.15s ease;">
                All (${allEvents.length})
              </button>
            </div>
            <a href="/all-events" class="text-decoration-none text-primary fw-semibold small ms-1 d-inline-flex align-items-center gap-1">
              See All <i class="fa-solid fa-angle-right" style="font-size:11px;"></i>
            </a>
          </div>
        </div>
      `;

      if (existingHeader) {
        existingHeader.outerHTML = headerHtml;
      } else {
        cardParent.insertAdjacentHTML("afterbegin", headerHtml);
      }

      const renderCurrentTab = (tab) => {
        let targetList = [];
        let headingText = "Upcoming Events";
        let subText = "Scheduled bookings on your calendar";

        if (tab === "upcoming") {
          targetList = upcomingEvents;
          headingText = "Upcoming Events";
          subText = "Scheduled bookings on your calendar";
        } else if (tab === "ongoing") {
          targetList = ongoingEvents;
          headingText = "Ongoing Events";
          subText = "Events currently in progress";
        } else if (tab === "past") {
          targetList = pastEvents;
          headingText = "Past Events";
          subText = "Archived & completed events";
        } else {
          targetList = allEvents;
          headingText = "Events & Bookings";
          subText = "All customer events and bookings";
        }

        const headingEl = document.getElementById("dash-event-heading");
        const subHeadingEl = document.getElementById("dash-event-subheading");
        if (headingEl) headingEl.textContent = headingText;
        if (subHeadingEl) subHeadingEl.textContent = subText;

        if (targetList.length === 0) {
          container.innerHTML = `
            <div class="col-12">
              <div class="text-center text-muted py-4 w-100" style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:14px;">
                <div class="mx-auto mb-2 d-inline-flex align-items-center justify-content-center" style="width:48px;height:48px;border-radius:50%;background:#eef2ff;color:#4f46e5;">
                  <i class="fa-regular fa-calendar-check fs-4"></i>
                </div>
                <h6 class="fw-bold mt-1 mb-1 text-dark" style="font-family:'Poppins', sans-serif;">No ${tab === 'upcoming' ? 'Upcoming' : (tab === 'ongoing' ? 'Ongoing' : 'Past')} Events</h6>
                <p class="small text-muted mb-3">${tab === 'upcoming' ? "You don't have any upcoming bookings scheduled on your calendar." : "No records found under this section."}</p>
                ${(tab === 'upcoming' && pastEvents.length > 0) ? `
                  <button type="button" class="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold" id="view-past-events-btn">
                    <i class="fa-solid fa-clock-rotate-left me-1"></i> View Past Events (${pastEvents.length})
                  </button>
                ` : ''}
              </div>
            </div>`;

          const viewPastBtn = document.getElementById("view-past-events-btn");
          if (viewPastBtn) {
            viewPastBtn.addEventListener("click", () => {
              const pastTabBtn = document.querySelector(".dash-event-filter-btn[data-tab='past']");
              if (pastTabBtn) pastTabBtn.click();
            });
          }
          return;
        }

        container.innerHTML = renderEventListHtml(targetList.slice(0, 4));
      };

      // Initial render
      renderCurrentTab(activeTab);

      // Tab switcher clicks
      const tabButtons = cardParent.querySelectorAll(".dash-event-filter-btn");
      tabButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          tabButtons.forEach(b => {
            b.classList.remove("active", "btn-primary", "text-white", "shadow-xs");
            b.classList.add("btn-light", "text-secondary");
          });
          btn.classList.add("active", "btn-primary", "text-white", "shadow-xs");
          btn.classList.remove("btn-light", "text-secondary");
          const selectedTab = btn.getAttribute("data-tab");
          renderCurrentTab(selectedTab);
        });
      });
    }
  }

  // ── ALL EVENTS PAGE (path === "/all-events") ─────────────────────────────
  if (path === "/all-events") {
    const containers = document.querySelectorAll(".content-card .row.g-3, .upcoming-events-grid");
    if (containers && containers.length > 0) {
      containers.forEach((container) => {
        const cardParent = container.closest(".content-card") || container.parentElement;

        if (cardParent) {
          const existingControls = cardParent.querySelector("#all-events-controls");
          if (existingControls) existingControls.remove();

          const controlsHtml = `
            <div id="all-events-controls" class="mb-4">
              <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                <div class="btn-group btn-group-sm p-1 bg-light rounded-pill border" role="group" id="all-events-tab-group">
                  <button type="button" class="btn btn-sm rounded-pill fw-semibold all-event-filter-btn active btn-primary text-white shadow-xs" data-tab="all" style="font-size:12.5px; padding:4px 14px;">
                    All Events (${allEvents.length})
                  </button>
                  <button type="button" class="btn btn-sm rounded-pill fw-semibold all-event-filter-btn btn-light text-secondary" data-tab="upcoming" style="font-size:12.5px; padding:4px 14px;">
                    Upcoming (${upcomingEvents.length})
                  </button>
                  ${ongoingEvents.length > 0 ? `
                    <button type="button" class="btn btn-sm rounded-pill fw-semibold all-event-filter-btn btn-light text-secondary" data-tab="ongoing" style="font-size:12.5px; padding:4px 14px;">
                      Ongoing (${ongoingEvents.length})
                    </button>
                  ` : ''}
                  <button type="button" class="btn btn-sm rounded-pill fw-semibold all-event-filter-btn btn-light text-secondary" data-tab="past" style="font-size:12.5px; padding:4px 14px;">
                    Past (${pastEvents.length})
                  </button>
                </div>
                <div style="min-width: 260px; max-width: 340px;" class="flex-grow-1 flex-sm-grow-0">
                  <div class="input-group input-group-sm">
                    <span class="input-group-text bg-white border-end-0 text-muted"><i class="bi bi-search"></i></span>
                    <input type="text" id="all-events-search" class="form-control border-start-0" placeholder="Search events..." />
                  </div>
                </div>
              </div>
            </div>
          `;
          container.insertAdjacentHTML("beforebegin", controlsHtml);

          let currentFilterTab = "all";
          let searchQuery = "";

          const renderAllEventsList = () => {
            let baseList = allEvents;
            if (currentFilterTab === "upcoming") baseList = upcomingEvents;
            else if (currentFilterTab === "ongoing") baseList = ongoingEvents;
            else if (currentFilterTab === "past") baseList = pastEvents;

            if (searchQuery) {
              const q = searchQuery.toLowerCase().trim();
              baseList = baseList.filter(e => {
                const title = String(e.eventTitle || "").toLowerCase();
                const loc = String(e.serviceLocationId?.address || "").toLowerCase();
                const user = String(e.userId?.fullName || "").toLowerCase();
                return title.includes(q) || loc.includes(q) || user.includes(q);
              });
            }

            if (baseList.length === 0) {
              container.innerHTML = `
                <div class="col-12">
                  <div class="text-center text-muted py-5 w-100" style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:16px;">
                    <i class="bi bi-calendar2-x text-primary" style="font-size: 36px; opacity: 0.7;"></i>
                    <h6 class="fw-bold mt-2 mb-1 text-dark">No events found</h6>
                    <p class="small text-muted mb-0">${searchQuery ? "No events match your search query." : "No events available for this category."}</p>
                  </div>
                </div>`;
              return;
            }

            container.innerHTML = renderEventListHtml(baseList);
          };

          renderAllEventsList();

          const allTabButtons = cardParent.querySelectorAll(".all-event-filter-btn");
          allTabButtons.forEach(btn => {
            btn.addEventListener("click", (e) => {
              e.preventDefault();
              allTabButtons.forEach(b => {
                b.classList.remove("active", "btn-primary", "text-white", "shadow-xs");
                b.classList.add("btn-light", "text-secondary");
              });
              btn.classList.add("active", "btn-primary", "text-white", "shadow-xs");
              btn.classList.remove("btn-light", "text-secondary");
              currentFilterTab = btn.getAttribute("data-tab");
              renderAllEventsList();
            });
          });

          const searchInput = cardParent.querySelector("#all-events-search");
          if (searchInput) {
            searchInput.addEventListener("input", (e) => {
              searchQuery = e.target.value;
              renderAllEventsList();
            });
          }
        }
      });
    }
  }

  // ── EVENT DETAIL PAGE ────────────────────────────────────────────────────
  if (path === "/vendor-event-details") {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get("id");
    const detailContainer = document.querySelector(".col-lg-9 .content-card, .user-profile-wrapper .content-card");

    if (!eventId) {
      if (detailContainer) {
        detailContainer.innerHTML = `
          <div class="text-center py-5">
            <i class="fa-solid fa-calendar-xmark text-muted mb-3" style="font-size: 42px;"></i>
            <h5 class="fw-bold text-dark mb-1">No Event Selected</h5>
            <p class="text-muted small mb-4">Please select an event from the events list to view details.</p>
            <a href="/all-events" class="btn btn-primary rounded-pill px-4 fw-semibold btn-sm">
              <i class="fa-solid fa-arrow-left me-1"></i> View All Events
            </a>
          </div>
        `;
      }
      return;
    }

    const event = eventsData.find((e) => String(e._id) === String(eventId) || String(e.id) === String(eventId));
    if (!event) {
      if (detailContainer) {
        detailContainer.innerHTML = `
          <div class="text-center py-5">
            <i class="fa-solid fa-calendar-xmark text-muted mb-3" style="font-size: 42px;"></i>
            <h5 class="fw-bold text-dark mb-1">Event Not Found</h5>
            <p class="text-muted small mb-4">We could not find an event with the requested ID. It may have been removed or does not exist.</p>
            <a href="/all-events" class="btn btn-primary rounded-pill px-4 fw-semibold btn-sm">
              <i class="fa-solid fa-arrow-left me-1"></i> Back to All Events
            </a>
          </div>
        `;
      }
      return;
    }

    const rawEvtImg = event.image || "";
    const isBadEvtImg = isBadEventImage(rawEvtImg);
    const eventImg = isBadEvtImg ? EVENT_DEFAULT_SVG : rawEvtImg;
    const locationAddress = event.serviceLocationId?.address || event.serviceLocationId?.addressName || "Location not specified";
    const organizer =
      event.userId && typeof event.userId === "object"
        ? event.userId
        : event.eventcreator && typeof event.eventcreator === "object"
        ? event.eventcreator
        : {};
    const organizerPic =
      organizer.profilePic && organizer.profilePic.startsWith("http") && !organizer.profilePic.includes("depositphotos")
        ? organizer.profilePic
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(organizer.fullName || "User")}&background=5b6ef5&color=fff&size=64`;
    const invitedCount = Array.isArray(event.invitedUsers) ? event.invitedUsers.length : 0;
    const visibleServices = (Array.isArray(event.additionalServices) ? event.additionalServices : [])
      .map((service) => {
        if (typeof service === "string") return /^[a-f\d]{24}$/i.test(service) ? "" : service;
        return service?.name || service?.serviceName || service?.title || service?.service?.name || "";
      })
      .filter(Boolean);
    const { date: formattedDate, time: formattedTime } = formatEventDate(event.eventDate, event.eventStartTime, event.eventEndTime);
    const cond = getDateCondition(event.eventDate, event.status);

    detailContainer.innerHTML = `
      <!-- Header with Clean Professional Back Navigation & Status Badge -->
      <div class="mb-4">
        <a href="/all-events" class="text-decoration-none text-muted d-inline-flex align-items-center gap-2 mb-2 fw-semibold" style="font-size:14px; transition:color 0.15s ease;">
          <i class="fa-solid fa-arrow-left"></i> Back to Events
        </a>
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h4 class="fw-bold m-0 text-dark" style="font-family:'Poppins', sans-serif;">Event Detail</h4>
          <span class="badge ${cond.badgeClass} rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5" style="font-size:12px;">
            <i class="fa-solid ${cond.type === 'cancelled' ? 'fa-circle-xmark' : (cond.type === 'past' ? 'fa-circle-check' : (cond.type === 'ongoing' ? 'fa-circle-dot' : 'fa-calendar-check'))}"></i>
            ${cond.label}
          </span>
        </div>
      </div>

      <!-- Event Image Banner -->
      <div class="mb-4 overflow-hidden rounded-4 border bg-light position-relative" style="height: 230px;">
        <img src="${eventImg}" alt="${event.eventTitle || 'Event'}" style="width:100%; height:100%; object-fit:cover;" onError="this.onerror=null;this.src='${EVENT_DEFAULT_SVG}';" onLoad="if(this.naturalWidth && this.naturalWidth<=160 && this.naturalHeight<=120){this.src='${EVENT_DEFAULT_SVG}';}" />
      </div>

      <!-- Title -->
      <h3 class="fw-bold text-dark mb-4" style="font-size:22px; font-family:'Poppins', sans-serif;">${event.eventTitle || "Event"}</h3>

      <!-- Info rows -->
      <div class="d-flex flex-column gap-3 mb-4">
        <!-- Date & Time -->
        <div class="modern-info-tile d-flex align-items-center gap-3">
          <div class="icon-box-primary flex-shrink-0">
            <i class="fa-solid fa-calendar-days" style="font-size:18px;"></i>
          </div>
          <div>
            <div class="fw-semibold text-dark" style="font-size:15px;">${formattedDate}</div>
            <small class="text-muted" style="font-size:13px;">${formattedTime}</small>
          </div>
        </div>

        <!-- Invited Guests -->
        <div class="modern-info-tile d-flex align-items-center gap-3">
          <div class="icon-box-primary flex-shrink-0">
            <i class="fa-solid fa-users" style="font-size:18px;"></i>
          </div>
          <div>
            <div class="fw-semibold text-dark" style="font-size:15px;">Invited Guests</div>
            <small class="text-muted" style="font-size:13px;">${invitedCount} Attendees</small>
          </div>
        </div>

        <!-- Location -->
        <div class="modern-info-tile d-flex align-items-center gap-3">
          <div class="icon-box-primary flex-shrink-0">
            <i class="fa-solid fa-location-dot" style="font-size:18px;"></i>
          </div>
          <div class="overflow-hidden">
            <div class="fw-semibold text-dark" style="font-size:15px;">Location</div>
            <small class="text-muted d-block text-truncate" style="font-size:13px;" title="${locationAddress}">${locationAddress}</small>
          </div>
        </div>

        <!-- Organizer with Chat -->
        <div class="modern-info-tile d-flex align-items-center gap-3 justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <img src="${organizerPic}" class="rounded-circle flex-shrink-0" width="46" height="46" style="object-fit:cover; border:2px solid #e2e8f0;" onError="this.onerror=null;this.src='https://ui-avatars.com/api/?name=User&background=5b6ef5&color=fff&size=64';" />
            <div>
              <div class="fw-semibold text-dark" style="font-size:15px;">${organizer.fullName || "Organizer"}</div>
              <small class="text-muted" style="font-size:12px;">Event Organizer</small>
            </div>
          </div>
          <a href="/chat?eventId=${event._id || ''}&userId=${organizer._id || ''}&userName=${encodeURIComponent(organizer.fullName || organizer.name || '')}" class="btn-modern-primary d-inline-flex align-items-center gap-2" style="font-size:13px; text-decoration:none; padding:7px 16px; border-radius:9999px;">
            <i class="fa-solid fa-comments"></i> Chat
          </a>
        </div>
      </div>

      <!-- Special Notes / Description -->
      ${event.description ? `
      <div class="mb-4">
        <h6 class="fw-bold text-dark mb-2" style="font-family:'Poppins', sans-serif;">Special Notes</h6>
        <div class="p-3 rounded-3" style="background:#f8fafc; border-left:4px solid #5b6ef5; font-size:14px; color:#4a5568; line-height:1.6; border:1px solid #edf2f7; border-left-width:4px;">
          ${event.description}
        </div>
      </div>` : ""}

      <!-- Additional Services -->
      ${visibleServices.length > 0 ? `
      <div class="mb-4">
        <h6 class="fw-bold text-dark mb-2" style="font-family:'Poppins', sans-serif;">Additional Services</h6>
        <div class="d-flex gap-2 flex-wrap">
          ${visibleServices.map(serviceName => `
            <span class="badge-soft-primary">
              <i class="fa-solid fa-check me-1"></i>${serviceName}
            </span>
          `).join("")}
        </div>
      </div>` : ""}

      <!-- Event Meta -->
      <div class="d-flex gap-2 flex-wrap mb-4">
        ${event.guestTypeEvent ? `<span class="badge-soft-success"><i class="fa-solid fa-user-check me-1"></i>${event.guestTypeEvent}</span>` : ""}
        ${event.bringaLongGuest === "Yes" ? `<span class="badge-soft-warning"><i class="fa-solid fa-users me-1"></i>Bring-a-long: ${event.bringaLongNumber || 0}</span>` : ""}
        ${event.rvsp === "Yes" ? `<span class="badge-soft-danger"><i class="fa-regular fa-envelope me-1"></i>RSVP: ${event.rvspDate}</span>` : ""}
      </div>
    `;
  }
}
