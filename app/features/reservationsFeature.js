import {
  formatEventDate,
  getStatusInfo,
  getEventImg,
  getEntityId,
  EVENT_DEFAULT_SVG,
  isBadEventImage
} from "../utils/formatters";
import {
  resolveItemEvent,
  resolveItemLocation,
  resolveCustomer,
  resolveProducts,
  buildListItemHtml,
  buildBookingRequestCardHtml
} from "../utils/reservationHelpers";
import { authService } from "../services/authService";

export function initReservationsFeature({ data = [], allEvents = [], path, router }) {
  // ── DASHBOARD RESERVATION OVERVIEW ─────────────────────────────────────────
  if (path === "/") {
    const allContentCards = Array.from(
      document.querySelectorAll(".user-profile-wrapper .content-card, .col-lg-9 .content-card")
    );
    const overviewCard =
      allContentCards.find((c) => c.innerHTML.includes("Reservation Request Overview") || c.innerHTML.includes("Reservation Request")) ||
      allContentCards.find((_, i) => i === 1) ||
      allContentCards[allContentCards.length - 1];
    if (overviewCard) {
      // Update heading to "Reservation Request" to match iOS Home
      const headingEl = overviewCard.querySelector("h5, h6");
      if (headingEl && headingEl.textContent.includes("Overview")) {
        headingEl.textContent = "Reservation Request";
      }

      const overviewContainer =
        overviewCard.querySelector(".d-flex.flex-column") || overviewCard.querySelector('[class*="flex-column"]');
      if (overviewContainer) {
        if (!data || data.length === 0) {
          overviewContainer.innerHTML = `
            <div class="text-center py-4">
              <i class="bi bi-inbox text-muted" style="font-size: 32px; opacity: 0.5;"></i>
              <p class="small text-muted mb-0 mt-2">No reservation requests yet</p>
            </div>
          `;
        } else {
          overviewContainer.innerHTML = data
            .slice(0, 3)
            .map((item, idx) => buildListItemHtml(item, idx, allEvents))
            .join("");
        }
      }
    }
  }

  // ── RESERVATION LIST PAGE (Matches iOS "Booking Request" Screen) ────────────
  if (path === "/reservation-list") {
    const mainCard = document.querySelector(".col-lg-9 .content-card, .user-profile-wrapper .content-card");
    if (mainCard) {
      if (!data || data.length === 0) {
        mainCard.innerHTML = `
          <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <h4 class="fw-bold m-0" style="font-size:22px; color:#0c1b33;">Booking Request</h4>
              <small class="text-muted">Manage your event service bookings and customer orders</small>
            </div>
          </div>
          <div class="text-center py-5">
            <i class="bi bi-calendar2-x text-primary" style="font-size: 42px; opacity: 0.6;"></i>
            <h6 class="fw-bold mt-3 mb-1 text-dark">No reservation requests yet</h6>
            <p class="small text-muted mb-0">Customer booking requests and reservations will appear here.</p>
          </div>`;
        return;
      }

      mainCard.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h4 class="fw-bold m-0" style="font-size:22px; color:#0c1b33;">Booking Request</h4>
            <small class="text-muted">Manage your event service bookings and customer orders</small>
          </div>
          <input type="text" id="resSearchInput" class="form-control form-control-sm rounded-pill px-3 py-1.5" placeholder="Search Bookings..." style="max-width:220px;" oninput="(function(v){document.querySelectorAll('#reservationListContainer > div').forEach(function(el){var t=el.textContent.toLowerCase();el.style.display=t.includes(v.toLowerCase())?'block':'none';});})(this.value)" />
        </div>
        <div id="reservationListContainer">
          ${data.map((item, idx) => buildBookingRequestCardHtml(item, idx, allEvents)).join("")}
        </div>`;
    }
  }

  // ── RESERVATION & ORDER DETAILS PAGE (Matches iOS "Booking Detail" Screen) ──
  if (path === "/vendor-reservation-details") {
    const params = new URLSearchParams(window.location.search);
    const resId = params.get("id");
    const detailContainer = document.querySelector(".col-lg-9 .content-card, .user-profile-wrapper .content-card");

    if (!resId) {
      if (detailContainer) {
        detailContainer.innerHTML = `
          <div class="text-center py-5">
            <i class="fa-solid fa-calendar-xmark text-muted mb-3" style="font-size: 42px;"></i>
            <h5 class="fw-bold text-dark mb-1">No Booking Selected</h5>
            <p class="text-muted small mb-4">Please select a booking from the reservations list to view details.</p>
            <a href="/reservation-list" class="btn btn-primary rounded-pill px-4 fw-semibold btn-sm">
              <i class="fa-solid fa-arrow-left me-1"></i> View Reservations
            </a>
          </div>
        `;
      }
      return;
    }

    const item = data.find((d) => String(d._id || d.id) === String(resId));
    if (!item) {
      if (detailContainer) {
        detailContainer.innerHTML = `
          <div class="text-center py-5">
            <i class="fa-solid fa-calendar-xmark text-muted mb-3" style="font-size: 42px;"></i>
            <h5 class="fw-bold text-dark mb-1">Booking Request Not Found</h5>
            <p class="text-muted small mb-4">We could not find the requested booking request or reservation. It may have been removed.</p>
            <a href="/reservation-list" class="btn btn-primary rounded-pill px-4 fw-semibold btn-sm">
              <i class="fa-solid fa-arrow-left me-1"></i> Back to Reservations
            </a>
          </div>
        `;
      }
      return;
    }

    const event = resolveItemEvent(item, allEvents);
    const location = resolveItemLocation(item, event);
    const organizer = resolveCustomer(item, event);
    const products = resolveProducts(item);

    const chatEventId = getEntityId(item.eventId) || getEntityId(event._id) || getEntityId(event);
    const chatUserId =
      getEntityId(organizer._id) || getEntityId(organizer.id) || getEntityId(item.userId) || getEntityId(event.userId);
    const eventImg = getEventImg(event.image || item.image);
    const organizerPic =
      organizer.profilePic && organizer.profilePic.startsWith("http") && !organizer.profilePic.includes("depositphotos")
        ? organizer.profilePic
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
            organizer.fullName || organizer.name || "Customer"
          )}&background=5b6ef5&color=fff&size=64`;
    const addressStr = location.address || location.addressName || location.name || event.address || item.address || "Location not specified";
    const resDateInfo = formatEventDate(event.eventDate || item.date || item.createdAt, event.eventStartTime, event.eventEndTime);
    const normalizedStatus = String(item.status || "").toLowerCase().trim();

    const isPaymentDone = Boolean(
      ["done", "completed", "paid", "yes", "success", "confirmed"].includes(String(item.paymentStatus || "").toLowerCase()) ||
      ["done", "completed", "confirmed"].includes(normalizedStatus) ||
      item.invoiceLink
    );
    const qrCodeSrc = item.eventAttendanceQr || event.eventAttendanceQr || item.attendanceQrToken || "";
    const eventTitle = event.eventTitle || item.eventTitle || item.title || "Booking Detail";
    const serviceName = item.additionalServiceId?.servicesName || item.serviceName || item.serviceTitle || "Service";
    const attendeesCount = item.adultCount || (Array.isArray(event.invitedUsers) ? event.invitedUsers.length : 0);
    const specialNotes = event.description || item.description || item.instruction || item.comment || "No special instructions provided.";

    const isPending = ["pending", "requested", "reservation received", "new"].includes(normalizedStatus);
    const isCancelled = ["cancelled", "rejected", "decline", "declined"].includes(normalizedStatus);

    const statusInfo = getStatusInfo(item.status);

    detailContainer.innerHTML = `
      <!-- Header with Clean Professional Back Navigation -->
      <div class="mb-4">
        <a href="/reservation-list" class="text-decoration-none text-muted d-inline-flex align-items-center gap-2 mb-2 fw-semibold" style="font-size:14px; transition:color 0.15s ease;">
          <i class="fa-solid fa-arrow-left"></i> Back to Reservations
        </a>
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h4 class="fw-bold m-0 text-dark" style="font-family:'Poppins', sans-serif;">Booking Detail</h4>
          <span class="badge ${statusInfo.badgeClass} rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-1.5" style="font-size:12px;">
            <i class="fa-solid ${String(item.status).toLowerCase().includes('cancel') ? 'fa-circle-xmark' : (['confirmed', 'accepted', 'completed'].includes(String(item.status).toLowerCase()) ? 'fa-circle-check' : 'fa-clock')}"></i>
            ${statusInfo.text}
          </span>
        </div>
      </div>

      <!-- Banner Image -->
      <div class="mb-4 overflow-hidden rounded-4 border bg-light position-relative" style="height: 230px;">
        <img src="${eventImg}" alt="${eventTitle}" style="width:100%; height:100%; object-fit:cover;" onError="this.onerror=null;this.src='${EVENT_DEFAULT_SVG}';" />
      </div>

      <!-- Event Title -->
      <h3 class="fw-bold text-dark mb-4" style="font-size: 22px; font-family:'Poppins', sans-serif;">${eventTitle}</h3>

      <!-- Core Info Tiles (Matches iOS Booking Detail layout) -->
      <div class="d-flex flex-column gap-3 mb-4">
        <!-- Date & Time -->
        <div class="modern-info-tile d-flex align-items-center gap-3 p-3 rounded-4 bg-light border-0">
          <div class="flex-shrink-0 d-flex align-items-center justify-content-center rounded-3" style="width:48px; height:48px; background:#eef2ff; color:#5b6ef5;">
            <i class="fa-regular fa-calendar-days fs-5"></i>
          </div>
          <div>
            <div class="fw-bold text-dark" style="font-size:15px;">${resDateInfo.date}</div>
            <small class="text-muted" style="font-size:13px;">${resDateInfo.time || ''}</small>
          </div>
        </div>

        <!-- Adult Attendees -->
        <div class="modern-info-tile d-flex align-items-center gap-3 p-3 rounded-4 bg-light border-0">
          <div class="flex-shrink-0 d-flex align-items-center justify-content-center rounded-3" style="width:48px; height:48px; background:#eef2ff; color:#5b6ef5;">
            <i class="fa-solid fa-users fs-5"></i>
          </div>
          <div>
            <div class="fw-bold text-dark" style="font-size:15px;">Adult Attendees</div>
            <small class="text-muted" style="font-size:13px;">${attendeesCount} Guest(s)</small>
          </div>
        </div>

        <!-- See All List Order -->
        <div class="modern-info-tile d-flex align-items-center justify-content-between p-3 rounded-4 bg-light border-0">
          <div>
            <div class="fw-bold text-dark" style="font-size:15px;">See All List Order</div>
            <small class="text-muted" style="font-size:13px;">${serviceName}</small>
          </div>
          <button type="button" id="toggleOrderItemsBtn" class="btn btn-sm btn-primary rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-2" style="background:#5b6ef5; border:none;">
            <span>Show</span> <i class="fa-solid fa-list-check"></i>
          </button>
        </div>

        <!-- Ordered Products Accordion/Dropdown -->
        <div id="orderItemsSection" style="display:none;" class="p-3 rounded-4 bg-white border mb-2">
          <h6 class="fw-bold text-dark mb-3 border-bottom pb-2">Order Items (${products.length})</h6>
          ${products.length > 0 ? products.map(prod => `
            <div class="d-flex align-items-center justify-content-between p-2 mb-2 rounded-3 bg-light">
              <div class="d-flex align-items-center gap-2">
                <img src="${prod.photoUrl || EVENT_DEFAULT_SVG}" alt="${prod.name}" width="40" height="40" class="rounded-2" style="object-fit:cover;" onError="this.onerror=null;this.src='${EVENT_DEFAULT_SVG}';" />
                <div>
                  <div class="fw-bold text-dark" style="font-size:13.5px;">${prod.name}</div>
                  <small class="text-muted">Qty: ${prod.quantity}</small>
                </div>
              </div>
              <span class="fw-bold text-dark" style="font-size:14px;">$${prod.total > 0 ? prod.total.toFixed(2) : (prod.price > 0 ? prod.price.toFixed(2) : '0.00')}</span>
            </div>
          `).join("") : `<p class="text-muted small mb-0">No items specified.</p>`}
          ${item.finalAmount ? `
            <div class="d-flex justify-content-between align-items-center pt-2 border-top mt-2">
              <span class="fw-bold text-dark">Total Amount:</span>
              <span class="fw-bold text-primary fs-6">$${item.finalAmount}</span>
            </div>
          ` : ''}
        </div>

        <!-- Organizer Tile with Chat -->
        <div class="modern-info-tile d-flex align-items-center justify-content-between p-3 rounded-4 bg-light border-0">
          <div class="d-flex align-items-center gap-3">
            <img src="${organizerPic}" alt="${organizer.fullName || 'Organizer'}" class="rounded-circle flex-shrink-0" width="46" height="46" style="object-fit:cover; border:2px solid #e2e8f0;" onError="this.onerror=null;this.src='https://ui-avatars.com/api/?name=User&background=5b6ef5&color=fff&size=64';" />
            <div>
              <div class="fw-bold text-dark" style="font-size:15px;">${organizer.fullName || organizer.name || "Organizer"}</div>
              <small class="text-muted" style="font-size:12px;">Organizer</small>
            </div>
          </div>
          <a href="/chat?eventId=${encodeURIComponent(chatEventId)}&userId=${encodeURIComponent(chatUserId)}" class="btn btn-sm btn-primary rounded-pill px-3 py-1.5 fw-semibold d-inline-flex align-items-center gap-2" style="background:#5b6ef5; border:none; text-decoration:none;">
            <span>Chat</span> <i class="fa-solid fa-comments"></i>
          </a>
        </div>
      </div>

      <!-- Special Notes -->
      <div class="mb-4">
        <h6 class="fw-bold text-dark mb-2" style="font-size:15px;">Special Notes</h6>
        <p class="text-muted mb-0" style="font-size:14px; line-height:1.6;">${specialNotes}</p>
      </div>

      <!-- Event QR Code -->
      <div class="mb-4">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <h6 class="fw-bold text-dark m-0" style="font-size:15px;">Event QR Code:</h6>
          <button type="button" id="printQrBtn" class="btn btn-sm btn-primary rounded-pill px-3 py-1.5 fw-semibold" style="background:#5b6ef5; border:none;">
            Print
          </button>
        </div>
        ${qrCodeSrc ? `
          <div class="text-center p-3 bg-white rounded-3 border w-100 shadow-xs" style="max-width:320px; margin:0 auto; display:block !important;">
            <img id="qrCodeImage" src="${qrCodeSrc.startsWith('http') || qrCodeSrc.startsWith('data:') ? qrCodeSrc : `data:image/png;base64,${qrCodeSrc}`}" alt="Event QR Code" style="width:100%; max-width:260px; height:auto; display:block; margin:0 auto;" />
          </div>
        ` : `
          <p class="text-muted small">QR code not available.</p>
        `}
      </div>

      <!-- Payment Status -->
      <div class="text-center py-3 my-2">
        <span class="fw-bold fs-6" style="color: ${isPaymentDone ? '#16a34a' : '#d97706'};">
          Payment Status: ${isPaymentDone ? 'Done' : 'Pending'}
        </span>
      </div>

      <!-- Action Buttons for Pending/Requested Bookings -->
      ${isPending ? `
        <div id="confirmAlertMsg" class="mb-3" style="display:none;"></div>
        <div class="d-flex gap-3 mt-3">
          <button id="confirmResBtn" class="btn btn-success fw-bold flex-grow-1 py-3 rounded-3" style="border:none; cursor:pointer;">
            <i class="fa-solid fa-circle-check me-2"></i>Confirm Reservation
          </button>
          <button id="declineResBtn" class="btn btn-outline-danger fw-bold flex-grow-1 py-3 rounded-3" style="cursor:pointer;">
            <i class="fa-solid fa-circle-xmark me-2"></i>Decline
          </button>
        </div>

        <!-- Action Confirmation / Decline Modal -->
        <div id="reservationActionModal" class="glass-modal-backdrop" style="display:none;position:fixed;inset:0;z-index:1050;align-items:center;justify-content:center;padding:20px;">
          <div class="glass-modal-box" style="width:min(520px,100%);">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 id="reservationModalTitle" class="fw-bold mb-0">Confirm Reservation</h5>
              <button type="button" id="closeReservationModal" class="btn-close" aria-label="Close"></button>
            </div>
            <label for="confirmMessageInput" class="fw-bold text-dark mb-2" style="font-size:14px;">Confirmation / Decline Note</label>
            <textarea id="confirmMessageInput" class="form-control" rows="4" placeholder="Enter message or reason..." style="border-radius:12px;border:1px solid #d1d5db;padding:12px 16px;font-size:14px;"></textarea>
            <div id="reservationModalError" class="alert alert-danger rounded-3 mt-3" style="display:none;"></div>
            <div class="d-flex gap-3 mt-4">
              <button type="button" id="cancelReservationModal" class="btn btn-light flex-grow-1 py-2 fw-semibold" style="border-radius:10px;">Cancel</button>
              <button type="button" id="submitReservationAction" class="btn flex-grow-1 py-2 fw-bold" style="border-radius:10px;"></button>
            </div>
          </div>
        </div>
      ` : ''}
    `;

    // Interactive event listeners
    const toggleBtn = detailContainer.querySelector("#toggleOrderItemsBtn");
    const orderSection = detailContainer.querySelector("#orderItemsSection");
    toggleBtn?.addEventListener("click", () => {
      if (orderSection) {
        const isHidden = orderSection.style.display === "none";
        orderSection.style.display = isHidden ? "block" : "none";
        const label = toggleBtn.querySelector("span");
        if (label) label.textContent = isHidden ? "Hide" : "Show";
      }
    });

    const printBtn = detailContainer.querySelector("#printQrBtn");
    printBtn?.addEventListener("click", () => {
      window.print();
    });

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
      if (modalInput) {
        modalInput.value =
          action === "confirm"
            ? "We are happy you selected our hall to have your party.Looking forwarded to seeing you"
            : "Sorry, we are fully booked on that date";
      }
      if (modalSubmit) {
        modalSubmit.textContent = action === "confirm" ? "Confirm Reservation" : "Decline Reservation";
        modalSubmit.style.background = action === "confirm" ? "linear-gradient(135deg,#5b6ef5,#7c8ef7)" : "#dc2626";
        modalSubmit.style.color = "white";
      }
      if (actionModal) actionModal.style.display = "flex";
      modalInput?.focus();
    };

    detailContainer.querySelector("#closeReservationModal")?.addEventListener("click", closeModal);
    detailContainer.querySelector("#cancelReservationModal")?.addEventListener("click", closeModal);
    actionModal?.addEventListener("click", (event) => {
      if (event.target === actionModal) closeModal();
    });

    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => openModal("confirm"));
    }
    if (declineBtn) {
      declineBtn.addEventListener("click", () => openModal("decline"));
    }

    if (modalSubmit) {
      modalSubmit.addEventListener("click", async () => {
        const cancelReason =
          modalInput?.value.trim() ||
          (selectedAction === "confirm" ? "Reservation confirmed by merchant" : "Declined by merchant");
        const alertDiv = detailContainer.querySelector("#confirmAlertMsg");
        modalSubmit.disabled = true;
        modalSubmit.textContent = selectedAction === "confirm" ? "Confirming..." : "Declining...";

        try {
          let res = null;
          const statusPayload = selectedAction === "confirm" ? "accepted" : "rejected";
          try {
            res = await authService.updateMerchantBookingRequestStatus({
              requestId: resId,
              bookingId: resId,
              id: resId,
              status: statusPayload,
              reason: cancelReason,
              cancelReason
            });
          } catch {
            res = null;
          }

          if (!res || !res.status) {
            res =
              selectedAction === "confirm"
                ? await authService.activateReservation({ reservationId: resId, cancelReason })
                : await authService.cancelReservation({ reservationId: resId, cancelReason });
          }

          if (res?.status) {
            closeModal();
            if (alertDiv) {
              alertDiv.style.display = "block";
              alertDiv.className = `alert alert-success rounded-3`;
              alertDiv.textContent =
                res.message ||
                (selectedAction === "confirm"
                  ? "Reservation confirmed successfully."
                  : "Reservation cancelled successfully.");
            }
            setTimeout(() => {
              router.push("/reservation-list");
            }, 1200);
          } else {
            if (modalError) {
              modalError.style.display = "block";
              modalError.textContent =
                res?.message ||
                (selectedAction === "confirm"
                  ? "Failed to confirm reservation."
                  : "Failed to decline reservation.");
            }
            modalSubmit.disabled = false;
            modalSubmit.textContent = selectedAction === "confirm" ? "Confirm Reservation" : "Decline Reservation";
          }
        } catch (err) {
          if (modalError) {
            modalError.style.display = "block";
            modalError.textContent =
              err.message ||
              (selectedAction === "confirm"
                ? "Failed to confirm reservation."
                : "Failed to decline reservation.");
          }
          modalSubmit.disabled = false;
          modalSubmit.textContent = selectedAction === "confirm" ? "Confirm Reservation" : "Decline Reservation";
        }
      });
    }
  }
}

