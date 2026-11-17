export const EVENT_DEFAULT_SVG = ("data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
  <rect width="300" height="200" fill="#f8fafc"/>
  <rect x="0.5" y="0.5" width="299" height="199" fill="none" stroke="#e2e8f0"/>
  <g fill="#94a3b8" transform="translate(136, 68) scale(2.2)">
    <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
    <path d="M11 7.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm-4 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm-4 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"/>
  </g>
  <text x="150" y="142" text-anchor="middle" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600">No Image Available</text>
</svg>
`)).replace(/'/g, "%27");

// Deprecated: No fake demo party photos used anywhere in the application
export const DEFAULT_FALLBACK_IMAGES = [];

const KNOWN_TAP_TO_UPLOAD_S3_IMAGES = [
  "1793172724910-753443171.jpg",
  "1791957430661-321613915.jpg",
  "1792057292236-150289979.jpg",
  "1768819662887-122274953.jpg",
  "1768815153715-802649822.jpg",
  "1792569481357-649301076.jpg",
  "1792585684510-755713266.jpg",
  "1762419577291-646505357.jpg",
  "1762419788482-142067365.jpg",
  "1762419914789-628613777.jpg",
  "1762420012735-780137869.jpg"
];

export const isBadEventImage = (rawImg) => {
  if (Array.isArray(rawImg)) rawImg = rawImg[0];
  if (rawImg && typeof rawImg === "object" && rawImg.url) rawImg = rawImg.url;
  if (!rawImg || typeof rawImg !== "string") return true;
  const trimmed = rawImg.trim();
  if (trimmed === "" || trimmed.endsWith("/event/") || trimmed.endsWith("/event")) return true;

  // If it's a data URI (such as the base64 'Tap to Upload Image' button saved during app testing)
  if (trimmed.startsWith("data:image")) {
    return true;
  }
  if (!trimmed.startsWith("http") && !trimmed.startsWith("/")) return true;
  const lower = trimmed.toLowerCase();

  // Check known mobile default upload button assets uploaded to S3
  if (KNOWN_TAP_TO_UPLOAD_S3_IMAGES.some((name) => lower.includes(name.toLowerCase()))) {
    return true;
  }

  return (
    lower.includes("tap to upload") ||
    lower.includes("placeholder") ||
    lower.includes("default_upload") ||
    lower.includes("encrypted-tbn0") ||
    lower.includes("depositphotos") ||
    lower.includes("via.placeholder") ||
    lower.includes("ui-avatars.com") ||
    lower.includes("and9gc")
  );
};

export const parseDateSafe = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) return dateVal;
  const str = String(dateVal).trim();
  if (!str) return null;
  const dmy = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (dmy) {
    const dt = new Date(parseInt(dmy[3]), parseInt(dmy[2]) - 1, parseInt(dmy[1]));
    if (!isNaN(dt.getTime())) return dt;
  }
  const ymd = str.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (ymd) {
    const dt = new Date(parseInt(ymd[1]), parseInt(ymd[2]) - 1, parseInt(ymd[3]));
    if (!isNaN(dt.getTime())) return dt;
  }
  const dt = new Date(str);
  return isNaN(dt.getTime()) ? null : dt;
};

export const formatEventDate = (dateStr, startTime, endTime) => {
  if (!dateStr) return { date: "TBA", time: startTime || "" };
  try {
    const dt = parseDateSafe(dateStr);
    if (!dt) return { date: dateStr, time: startTime || "" };
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayName = days[dt.getDay()];
    const formattedDate = `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
    const timeStr = startTime ? `${dayName}, ${startTime}${endTime ? ` - ${endTime}` : ""}` : dayName;
    return {
      date: formattedDate,
      time: timeStr,
      shortDate: `${String(dt.getDate()).padStart(2, "0")}-${months[dt.getMonth()].slice(0, 3)}-${dt.getFullYear()}`
    };
  } catch {
    return { date: dateStr, time: startTime || "", shortDate: dateStr };
  }
};

export const getDateCondition = (dateVal, statusStr = "") => {
  const s = String(statusStr || "").toLowerCase().trim();

  // 1. Explicit cancellation takes priority
  if (["cancelled", "canceled", "declined", "rejected"].includes(s)) {
    return {
      label: "Cancelled",
      type: "cancelled",
      badgeClass: "badge-soft-danger",
      dotClass: "status-dot status-dot-danger",
      icon: "bi-x-circle"
    };
  }

  // 2. Draft status
  if (s === "draft") {
    return {
      label: "Draft",
      type: "draft",
      badgeClass: "badge-soft-neutral",
      dotClass: "status-dot",
      icon: "bi-pencil"
    };
  }

  // 3. Explicitly completed
  if (["completed", "finished"].includes(s)) {
    return {
      label: "Completed",
      type: "past",
      badgeClass: "badge-soft-neutral",
      dotClass: "status-dot",
      icon: "bi-check-circle"
    };
  }

  // 4. Parse the event date to calculate real temporal status
  const dt = parseDateSafe(dateVal);
  if (!dt) {
    if (["ongoingevent", "ongoing"].includes(s)) {
      return {
        label: "Active",
        type: "upcoming",
        badgeClass: "badge-soft-success",
        dotClass: "status-dot status-dot-success",
        icon: "bi-check-circle"
      };
    }
    return {
      label: statusStr || "Scheduled",
      type: "upcoming",
      badgeClass: "badge-soft-primary",
      dotClass: "status-dot status-dot-primary",
      icon: "bi-calendar-event"
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dt);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // If the event date is before today, it has already passed
  if (diffDays < 0) {
    return {
      label: "Past Event",
      type: "past",
      badgeClass: "badge-soft-neutral",
      dotClass: "status-dot",
      icon: "bi-check-circle"
    };
  }

  // If the event date is today: it is happening right now / today
  if (diffDays === 0) {
    return {
      label: "Ongoing",
      type: "ongoing",
      badgeClass: "badge-soft-success",
      dotClass: "status-dot status-dot-success",
      icon: "bi-broadcast"
    };
  }

  // If the event is tomorrow
  if (diffDays === 1) {
    return {
      label: "Tomorrow",
      type: "upcoming",
      badgeClass: "badge-soft-primary",
      dotClass: "status-dot status-dot-primary",
      icon: "bi-clock"
    };
  }

  // Future dates
  return {
    label: "Upcoming",
    type: "upcoming",
    badgeClass: "badge-soft-primary",
    dotClass: "status-dot status-dot-primary",
    icon: "bi-calendar-check"
  };
};

export const getStatusInfo = (statusStr) => {
  const s = String(statusStr || "").toLowerCase().trim();
  if (s === "cancelled" || s === "rejected" || s === "decline" || s === "declined") {
    return { badgeClass: "badge-soft-danger", dotClass: "status-dot status-dot-danger", icon: "bi-x-circle", text: "Cancelled" };
  }
  if (["confirmed", "accepted", "accept", "activated", "active", "ongoingevent", "completed"].includes(s)) {
    return { badgeClass: "badge-soft-success", dotClass: "status-dot status-dot-success", icon: "bi-check-circle", text: "Accepted" };
  }
  return { badgeClass: "badge-soft-warning", dotClass: "status-dot status-dot-warning", icon: "bi-clock", text: "Reservation Received" };
};

export const getEventImg = (rawImg, fallback) => {
  if (isBadEventImage(rawImg)) return fallback || EVENT_DEFAULT_SVG;
  return rawImg;
};

export const getEntityId = (value) => {
  if (!value) return "";
  return typeof value === "string" ? value : (value._id || value.id || "");
};

