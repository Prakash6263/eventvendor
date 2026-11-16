import { formatEventDate, getStatusInfo, getEventImg, DEFAULT_FALLBACK_IMAGES } from "./formatters";

export const resolveItemEvent = (item, allEvents = []) => {
  if (item?.eventId && typeof item.eventId === "object") return item.eventId;
  if (typeof item?.eventId === "string") {
    const found = allEvents.find((e) => String(e._id) === item.eventId || String(e.id) === item.eventId);
    if (found) return found;
  }
  if (item?.event && typeof item.event === "object") return item.event;
  return {};
};

export const resolveItemLocation = (item, event) => {
  if (event?.serviceLocationId && typeof event.serviceLocationId === "object") return event.serviceLocationId;
  if (item?.serviceLocationId && typeof item.serviceLocationId === "object") return item.serviceLocationId;
  if (event?.location && typeof event.location === "object") return event.location;
  if (item?.location && typeof item.location === "object") return item.location;
  return {};
};

export const resolveCustomer = (item, event) => {
  if (item?.userId && typeof item.userId === "object") return item.userId;
  if (item?.user && typeof item.user === "object") return item.user;
  if (event?.userId && typeof event.userId === "object") return event.userId;
  if (event?.eventcreator && typeof event.eventcreator === "object") return event.eventcreator;
  return {};
};

export const resolveProducts = (item) => {
  const prods = Array.isArray(item?.products)
    ? item.products
    : (Array.isArray(item?.orderItems) ? item.orderItems : (Array.isArray(item?.items) ? item.items : []));
  return prods.map((p) => {
    const prod = (p?.productId && typeof p.productId === "object") ? p.productId : p;
    const name = prod?.name || prod?.productName || prod?.title || "Menu Item";
    const quantity = Number(p?.quantity || prod?.quantity || 1);
    const price = Number(prod?.price || p?.price || 0);
    const photoRaw = (Array.isArray(prod?.photo) && prod.photo[0])
      ? (prod.photo[0].fileName || prod.photo[0].name || prod.photo[0])
      : (prod?.image || "");
    let photoUrl = "";
    if (photoRaw && String(photoRaw).startsWith("http")) photoUrl = photoRaw;
    else if (photoRaw) photoUrl = `https://event-una-image-bucket.s3.amazonaws.com/merchant/products/${photoRaw}`;
    else photoUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80";
    return { name, quantity, price, total: price * quantity, photoUrl, description: prod?.description || "" };
  });
};

export const getIosStatusBadge = (status) => {
  const s = String(status || "").toLowerCase().trim();
  if (["confirmed", "accepted", "accept", "activated", "active", "done"].includes(s)) {
    return `
      <span class="d-inline-flex align-items-center gap-1 fw-bold" style="color:#16a34a; font-size:13px;">
        <i class="bi bi-patch-check-fill"></i> Confirmed You
      </span>
    `;
  }
  if (["requested", "pending", "new", "reservation received"].includes(s)) {
    return `
      <span class="d-inline-flex align-items-center gap-1 fw-bold" style="color:#f59e0b; font-size:13px;">
        <i class="bi bi-hourglass-split"></i> New Request
      </span>
    `;
  }
  if (["cancelled", "rejected", "decline", "declined"].includes(s)) {
    return `
      <span class="d-inline-flex align-items-center gap-1 fw-bold" style="color:#ef4444; font-size:13px;">
        <i class="bi bi-x-circle-fill"></i> Cancelled
      </span>
    `;
  }
  return `
    <span class="d-inline-flex align-items-center gap-1 fw-bold text-primary" style="font-size:13px;">
      <i class="bi bi-info-circle-fill"></i> ${status || "Scheduled"}
    </span>
  `;
};

// ── Booking Request Card for /reservation-list (Matches iOS "Booking Request" Screen)
export const buildBookingRequestCardHtml = (item, idx, allEvents = []) => {
  const event = resolveItemEvent(item, allEvents);
  const location = resolveItemLocation(item, event);
  const fallbackImg = DEFAULT_FALLBACK_IMAGES[idx % DEFAULT_FALLBACK_IMAGES.length];
  const eventImg = getEventImg(event.image || item.image, fallbackImg);
  const addressStr = location.address || location.addressName || location.name || event.address || item.address || "Kanadia, Indore, Madhya Pradesh, India";
  const eventTitle = event.eventTitle || item.eventTitle || item.title || item.name || "Event Booking";
  const rawDate = event.eventDate || item.date || item.createdAt || "";
  const { shortDate } = formatEventDate(rawDate);
  const statusBadge = getIosStatusBadge(item.status);
  const resId = item._id || item.id || "";

  return `
    <div class="modern-card p-3 mb-3 bg-white border rounded-4 shadow-xs" style="transition: all 0.2s ease;">
      <div class="d-flex align-items-start gap-3 mb-3">
        <div class="card-image-wrap flex-shrink-0" style="width:68px; height:68px; border-radius:14px; overflow:hidden; background:#f1f5f9;">
          <img src="${eventImg}" alt="${eventTitle}" style="width:100%; height:100%; object-fit:cover;" onError="this.onerror=null;this.src='${fallbackImg}';" />
        </div>
        <div class="flex-grow-1 overflow-hidden">
          <h6 class="fw-bold mb-1 text-dark text-truncate" style="font-size:16px;">${eventTitle}</h6>
          <p class="text-muted small mb-1 text-truncate" title="${addressStr}" style="font-size:12.5px;">
            <i class="bi bi-geo-alt-fill text-muted me-1"></i>${addressStr}
          </p>
          <div class="d-flex align-items-center gap-2 mb-1">
            <small class="text-muted fw-medium" style="font-size:12.5px;">
              <i class="bi bi-calendar3 text-muted me-1"></i>${rawDate || shortDate}
            </small>
          </div>
          <div>
            ${statusBadge}
          </div>
        </div>
      </div>
      <a href="/vendor-reservation-details?id=${resId}" class="btn btn-outline-primary w-100 rounded-3 py-2 fw-semibold d-block text-center" style="font-size:14px; border-width:1.5px;">
        Show Detail
      </a>
    </div>
  `;
};

// ── Dashboard Overview Item (Matches iOS Home "Reservation Request" list) ─────
export const buildListItemHtml = (item, idx, allEvents = []) => {
  const event = resolveItemEvent(item, allEvents);
  const location = resolveItemLocation(item, event);
  const fallbackImg = DEFAULT_FALLBACK_IMAGES[idx % DEFAULT_FALLBACK_IMAGES.length];
  const eventImg = getEventImg(event.image || item.image, fallbackImg);
  const addressStr = location.address || location.addressName || location.name || event.address || item.address || "Kanadia, Indore, Madhya Pradesh, India";
  const eventTitle = event.eventTitle || item.eventTitle || item.title || item.name || "Restaurant Reservation";
  const resId = item._id || item.id || "";

  return `
    <a href="/vendor-reservation-details?id=${resId}" class="text-decoration-none" style="display:block;">
      <div class="modern-card d-flex align-items-center gap-3 p-3 mb-3 bg-white border rounded-3 shadow-xs">
        <div class="card-image-wrap flex-shrink-0" style="width:64px; height:64px; border-radius:12px; overflow:hidden;">
          <img src="${eventImg}" alt="${eventTitle}" style="width:100%; height:100%; object-fit:cover;" onError="this.onerror=null;this.src='${fallbackImg}';" />
        </div>
        <div class="flex-grow-1 overflow-hidden">
          <h6 class="fw-bold mb-1 text-dark text-truncate" style="font-size:15px;">${eventTitle}</h6>
          <p class="text-muted small mb-1 text-truncate" title="${addressStr}" style="font-size:12px;">
            <i class="bi bi-geo-alt-fill text-muted me-1"></i>${addressStr}
          </p>
          <div>
            <span class="d-inline-flex align-items-center gap-1 fw-semibold" style="font-size:12.5px; color:#f59e0b;">
              <i class="bi bi-clock-history"></i> Reservation Received
            </span>
          </div>
        </div>
        <div class="flex-shrink-0 ms-1 d-flex align-items-center justify-content-center" style="width:30px; height:30px; border-radius:50%; background:#f1f5f9; color:#64748b;">
          <i class="bi bi-chevron-right" style="font-size:12px;"></i>
        </div>
      </div>
    </a>
  `;
};


