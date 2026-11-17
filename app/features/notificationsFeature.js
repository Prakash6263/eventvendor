import { formatEventDate } from "../utils/formatters";
import { resolveItemEvent, resolveCustomer } from "../utils/reservationHelpers";

export function initNotificationsFeature({ data = [], allEvents = [], pendingCount = 0 }) {
  // 1. Clean up any legacy raw badge elements and broadcast count to React components
  if (typeof window !== "undefined") {
    window.__merchantPendingCount = pendingCount;
    window.dispatchEvent(new CustomEvent("merchant-pending-count", { detail: { pendingCount } }));
    document.querySelectorAll(".nav-notif-count-badge").forEach((el) => el.remove());
  }

  // 2. If on /notifications, populate the live notification list
  if (typeof window !== "undefined" && window.location.pathname === "/notifications") {
    const notifRow = document.querySelector("#notificationsContainer, .user-profile-card .user-profile-form .row, .user-profile-card .row.g-4, .user-profile-card");
    if (!notifRow) return;

    const notifs = [];

    // Booking requests & Reservations notifications
    data.forEach((item) => {
      const event = resolveItemEvent(item, allEvents);
      const customer = resolveCustomer(item, event);
      const title = event.eventTitle || item.eventTitle || "Restaurant Reservation";
      const customerName = customer.fullName || customer.name || "Customer";
      const { shortDate } = formatEventDate(event.eventDate || item.date || item.createdAt);
      const isPending = ["pending", "requested", "reservation received", "new"].includes(String(item.status || "").toLowerCase().trim());
      const isAccepted = ["confirmed", "accepted", "activated"].includes(String(item.status || "").toLowerCase().trim());
      const isCancelled = ["cancelled", "rejected"].includes(String(item.status || "").toLowerCase().trim());

      let notifTitle = "New Reservation need attentions";
      let notifBg = "#fffbeb";
      let icon = "bi-bell-fill";
      let iconColor = "#d97706";
      let timeText = shortDate ? `${shortDate}` : "Recent";

      if (isPending) {
        notifTitle = "New Reservation need attentions";
        notifBg = "#fffbeb";
        icon = "bi-bell-fill";
        iconColor = "#d97706";
      } else if (isAccepted) {
        notifTitle = "Reservation Confirmed";
        notifBg = "#f0fdf4";
        icon = "bi-check-circle-fill";
        iconColor = "#16a34a";
      } else if (isCancelled) {
        notifTitle = "Reservation Cancelled";
        notifBg = "#fef2f2";
        icon = "bi-x-circle-fill";
        iconColor = "#dc2626";
      }

      notifs.push({
        id: item._id,
        link: `/vendor-reservation-details?id=${item._id}`,
        title: notifTitle,
        desc: `${customerName} booked table for ${item.adultCount || 1} guest(s) at ${title}.`,
        time: timeText,
        bg: notifBg,
        icon,
        iconColor,
        badgeClass: isPending ? "badge-soft-warning" : isAccepted ? "badge-soft-success" : "badge-soft-danger",
        badgeText: isPending ? "Needs Attention" : isAccepted ? "Confirmed" : "Cancelled"
      });
    });

    if (notifs.length > 0) {
      notifRow.innerHTML = `
        <div class="col-12 mb-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h5 class="fw-bold m-0 text-dark">Live Activity & Notifications</h5>
            <small class="text-muted">Real-time alerts for booking requests, table reservations & event updates</small>
          </div>
          ${pendingCount > 0 ? `<span class="badge-soft-danger"><span class="status-dot status-dot-danger"></span>${pendingCount} Needs Attention</span>` : `<span class="badge-soft-success"><span class="status-dot status-dot-success"></span>All Caught Up</span>`}
        </div>
        ${notifs.map(n => `
          <div class="col-12">
            <a href="${n.link}" class="text-decoration-none" style="display:block;">
              <div class="notification-item p-3 rounded-3 d-flex align-items-center gap-3 bg-white" style="border:1px solid #e2e8f0; border-left:4px solid ${n.iconColor}; transition:transform 0.15s ease, box-shadow 0.15s ease;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 14px rgba(0,0,0,0.06)';" onmouseout="this.style.transform='none';this.style.boxShadow='none';">
                <div class="notification-icon flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle" style="width:44px; height:44px; background:${n.bg}; color:${n.iconColor}; font-size:18px;">
                  <i class="bi ${n.icon}"></i>
                </div>
                <div class="flex-grow-1 overflow-hidden">
                  <div class="d-flex align-items-center justify-content-between gap-2 mb-1 flex-wrap">
                    <h6 class="fw-bold mb-0 text-dark text-truncate" style="font-size:14.5px;">${n.title}</h6>
                    <span class="${n.badgeClass}" style="font-size:11px;">${n.badgeText}</span>
                  </div>
                  <p class="text-muted small mb-0 text-truncate" style="font-size:12.5px;">${n.desc}</p>
                </div>
                <div class="flex-shrink-0 text-muted ps-1">
                  <i class="bi bi-chevron-right" style="font-size:13px;"></i>
                </div>
              </div>
            </a>
          </div>
        `).join("")}
      `;
    } else {
      notifRow.innerHTML = `
        <div class="col-12 text-center text-muted py-5 w-100" style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:16px;">
          <i class="bi bi-bell-slash text-muted" style="font-size:38px; opacity:0.6;"></i>
          <h6 class="fw-bold mt-2 mb-1 text-dark">No Task or Notification Found</h6>
          <p class="small text-muted mb-0">You're all caught up! New customer bookings and reservations will appear here.</p>
        </div>
      `;
    }
  }
}

