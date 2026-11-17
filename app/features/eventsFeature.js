import { formatEventDate, getDateCondition, DEFAULT_FALLBACK_IMAGES, EVENT_DEFAULT_SVG, isBadEventImage } from "../utils/formatters";

function resolveEventImage(rawImg, idx) {
  const fallbackImg = DEFAULT_FALLBACK_IMAGES[idx % DEFAULT_FALLBACK_IMAGES.length];
  const isBad = isBadEventImage(rawImg);
  return {
    src: isBad ? fallbackImg : rawImg,
    fallback: EVENT_DEFAULT_SVG
  };
}

// ── Horizontal List Row View (Matching Reservation-List style) ─────────────
function renderEventListHtml(eventsList) {
  return eventsList
    .map((event, idx) => {
      const { src: eventImg, fallback: fallbackImg } = resolveEventImage(event.image, idx);
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
                <img src="${eventImg}" alt="${event.eventTitle || 'Event'}" style="width:100%; height:100%; object-fit:cover;" onError="this.onerror=null;this.src='${fallbackImg}';" />
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
    const event = eventsData.find((e) => e._id === eventId) || eventsData[0];
    if (!event) return;

    const fallbackImg = DEFAULT_FALLBACK_IMAGES[0];
    const rawEvtImg = event.image || "";
    const isBadEvtImg = isBadEventImage(rawEvtImg);
    const eventImg = isBadEvtImg ? fallbackImg : rawEvtImg;
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

    const detailContainer = document.querySelector(".col-lg-9 .content-card, .user-profile-wrapper .content-card");
    if (!detailContainer) return;

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
        <img src="${eventImg}" alt="${event.eventTitle || 'Event'}" style="width:100%; height:100%; object-fit:cover;" onError="this.onerror=null;this.src='${EVENT_DEFAULT_SVG}';" />
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
          <a href="/chat?eventId=${event._id || ''}&userId=${organizer._id || ''}" class="btn-modern-primary d-inline-flex align-items-center gap-2" style="font-size:13px; text-decoration:none; padding:7px 16px; border-radius:9999px;">
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
