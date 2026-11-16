import { formatEventDate, getDateCondition, DEFAULT_FALLBACK_IMAGES } from "../utils/formatters";

function resolveEventImage(rawImg, idx) {
  const fallbackImg = DEFAULT_FALLBACK_IMAGES[idx % DEFAULT_FALLBACK_IMAGES.length];
  const isBadImg =
    !rawImg ||
    typeof rawImg !== "string" ||
    !rawImg.startsWith("http") ||
    rawImg.toLowerCase().includes("tap to upload") ||
    rawImg.toLowerCase().includes("placeholder");
  return {
    src: isBadImg ? fallbackImg : rawImg,
    fallback: fallbackImg
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

      return `
        <div class="col-12 mb-3">
          <a href="/vendor-event-details?id=${eventId}" class="text-decoration-none" style="display:block;">
            <div class="modern-card d-flex align-items-center gap-3 p-3">
              <div class="card-image-wrap flex-shrink-0" style="width:68px; height:68px; border-radius:12px;">
                <img src="${eventImg}" alt="${event.eventTitle || 'Event'}" style="width:100%; height:100%; object-fit:cover;" onError="this.onerror=null;this.src='${fallbackImg}';" />
              </div>
              <div class="flex-grow-1 overflow-hidden">
                <div class="d-flex align-items-center justify-content-between mb-1 gap-2">
                  <h6 class="fw-bold mb-0 text-dark text-truncate" style="font-size:15px;">${event.eventTitle || 'Untitled Event'}</h6>
                  ${shortDate ? `<span class="badge-soft-neutral flex-shrink-0"><i class="bi bi-calendar3 me-1 text-danger"></i>${shortDate}</span>` : ""}
                </div>
                <p class="text-muted small mb-2 text-truncate" title="${locationAddress}" style="font-size:12.5px;">
                  <i class="bi bi-geo-alt me-1 text-danger"></i>${locationAddress}
                </p>
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <span class="${cond.badgeClass}"><span class="${cond.dotClass}"></span>${cond.label}</span>
                  <div class="d-flex align-items-center gap-3">
                    ${event.eventStartTime ? `
                      <small class="text-muted fw-medium"><i class="bi bi-clock me-1 text-primary"></i>${event.eventStartTime}${event.eventEndTime ? ` - ${event.eventEndTime}` : ''}</small>
                    ` : ''}
                    ${invitedCount > 0 ? `
                      <small class="text-muted fw-medium"><i class="bi bi-people me-1 text-primary"></i>${invitedCount} Guest(s)</small>
                    ` : `
                      <small class="text-muted fw-medium"><i class="bi bi-person me-1 text-primary"></i>${userName}</small>
                    `}
                  </div>
                </div>
              </div>
              <div class="flex-shrink-0 ms-1 d-flex align-items-center justify-content-center" style="width:32px; height:32px; border-radius:50%; background:#f1f5f9; color:#64748b;">
                <i class="bi bi-chevron-right" style="font-size:13px;"></i>
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
  const upcomingEvents = safeEvents.filter((event) => String(event.status || "").toLowerCase() !== "draft");

  // ── EVENT LIST (dashboard and all-events page) ───────────────────────────
  if (path === "/" || path === "/all-events") {
    const containers = document.querySelectorAll(".content-card .row.g-3, .upcoming-events-grid");
    if (containers && containers.length > 0) {
      containers.forEach((container) => {
        const cardParent = container.closest(".content-card") || container.parentElement;

        // Clean up any switcher element if present
        if (cardParent) {
          const existingSwitcher = cardParent.querySelector(".events-view-switcher");
          if (existingSwitcher) existingSwitcher.remove();
        }

        if (upcomingEvents.length === 0) {
          container.innerHTML = `
            <div class="col-12">
              <div class="text-center text-muted py-5 w-100" style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:16px;">
                <i class="bi bi-calendar2-x text-primary" style="font-size: 36px; opacity: 0.7;"></i>
                <h6 class="fw-bold mt-2 mb-1 text-dark">No upcoming events found</h6>
                <p class="small text-muted mb-0">Scheduled customer events will appear here.</p>
              </div>
            </div>`;
          return;
        }

        const listToRender = path === "/" ? upcomingEvents.slice(0, 3) : upcomingEvents;
        container.innerHTML = renderEventListHtml(listToRender);
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
    const isBadEvtImg =
      !rawEvtImg ||
      typeof rawEvtImg !== "string" ||
      !rawEvtImg.startsWith("http") ||
      rawEvtImg.toLowerCase().includes("tap to upload") ||
      rawEvtImg.toLowerCase().includes("placeholder");
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

    const statusBg = event.status === "draft" ? "#6c757d" : event.status === "OngoingEvent" ? "#27ae60" : "#5b6ef5";
    const statusLabel = event.status === "OngoingEvent" ? "Ongoing" : event.status === "draft" ? "Draft" : event.status || "Scheduled";

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
        <div class="modern-info-tile d-flex align-items-center gap-3">
          <div class="icon-box-primary flex-shrink-0">
            <i class="bi bi-calendar-event" style="font-size:18px;"></i>
          </div>
          <div>
            <div class="fw-semibold text-dark" style="font-size:15px;">${formattedDate}</div>
            <small class="text-muted" style="font-size:13px;">${formattedTime}</small>
          </div>
        </div>

        <!-- Invited Guests -->
        <div class="modern-info-tile d-flex align-items-center gap-3">
          <div class="icon-box-primary flex-shrink-0">
            <i class="bi bi-people" style="font-size:18px;"></i>
          </div>
          <div>
            <div class="fw-semibold text-dark" style="font-size:15px;">Invited Guests</div>
            <small class="text-muted" style="font-size:13px;">${invitedCount} Attendees</small>
          </div>
        </div>

        <!-- Location -->
        <div class="modern-info-tile d-flex align-items-center gap-3">
          <div class="icon-box-primary flex-shrink-0">
            <i class="bi bi-geo-alt" style="font-size:18px;"></i>
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
            <i class="bi bi-chat-dots-fill"></i> Chat
          </a>
        </div>
      </div>

      <!-- Special Notes / Description -->
      ${event.description ? `
      <div class="mb-4">
        <h6 class="fw-bold text-dark mb-2">Special Notes</h6>
        <div class="p-3 rounded-3" style="background:#f8fafc; border-left:4px solid #5b6ef5; font-size:14px; color:#4a5568; line-height:1.6; border:1px solid #edf2f7; border-left-width:4px;">
          ${event.description}
        </div>
      </div>` : ""}

      <!-- Additional Services -->
      ${visibleServices.length > 0 ? `
      <div class="mb-4">
        <h6 class="fw-bold text-dark mb-2">Additional Services</h6>
        <div class="d-flex gap-2 flex-wrap">
          ${visibleServices.map(serviceName => `
            <span class="badge-soft-primary">
              <i class="bi bi-check2-circle me-1"></i>${serviceName}
            </span>
          `).join("")}
        </div>
      </div>` : ""}

      <!-- Event Meta -->
      <div class="d-flex gap-2 flex-wrap mb-4">
        ${event.guestTypeEvent ? `<span class="badge-soft-success"><i class="bi bi-person-check me-1"></i>${event.guestTypeEvent}</span>` : ""}
        ${event.bringaLongGuest === "Yes" ? `<span class="badge-soft-warning"><i class="bi bi-people me-1"></i>Bring-a-long: ${event.bringaLongNumber || 0}</span>` : ""}
        ${event.rvsp === "Yes" ? `<span class="badge-soft-danger"><i class="bi bi-envelope me-1"></i>RSVP: ${event.rvspDate}</span>` : ""}
      </div>
    `;
  }
}

