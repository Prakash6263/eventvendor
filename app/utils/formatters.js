export const EVENT_DEFAULT_SVG = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <defs>
    <linearGradient id="evtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5"/>
      <stop offset="50%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="16" fill="url(#evtGrad)"/>
  <g fill="#ffffff" opacity="0.95" transform="translate(36, 34) scale(2.2)">
    <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
    <path d="M11 7.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm-4 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm-4 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"/>
  </g>
</svg>
`);

export const DEFAULT_FALLBACK_IMAGES = [
  "/images/event-imgs/img-1.jpg",
  "/images/event-imgs/img-2.jpg",
  "/images/event-imgs/img-3.jpg",
  "/images/event-imgs/img-4.jpg",
  "/images/event-imgs/img-5.jpg",
  "/images/event-imgs/img-6.jpg",
  "/images/event-imgs/img-7.jpg",
  "/images/event-imgs/img-8.jpg"
];

export const isBadEventImage = (rawImg) => {
  if (!rawImg || typeof rawImg !== "string" || !rawImg.startsWith("http")) return true;
  const lower = rawImg.toLowerCase();
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
  if (["ongoingevent", "ongoing"].includes(s)) {
    return {
      label: "Ongoing",
      type: "ongoing",
      badgeClass: "badge-soft-success",
      dotClass: "status-dot status-dot-success",
      icon: "bi-broadcast"
    };
  }
  if (s === "draft") {
    return {
      label: "Draft",
      type: "draft",
      badgeClass: "badge-soft-neutral",
      dotClass: "status-dot",
      icon: "bi-pencil"
    };
  }
  if (["completed", "finished"].includes(s)) {
    return {
      label: "Completed",
      type: "past",
      badgeClass: "badge-soft-neutral",
      dotClass: "status-dot",
      icon: "bi-check2-all"
    };
  }
  if (["cancelled", "canceled", "declined", "rejected"].includes(s)) {
    return {
      label: "Cancelled",
      type: "cancelled",
      badgeClass: "badge-soft-danger",
      dotClass: "status-dot status-dot-danger",
      icon: "bi-x-circle"
    };
  }
  const dt = parseDateSafe(dateVal);
  if (!dt) {
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

  if (diffDays === 0) {
    return {
      label: "Today",
      type: "upcoming",
      badgeClass: "badge-soft-warning",
      dotClass: "status-dot status-dot-warning",
      icon: "bi-lightning-charge-fill"
    };
  }
  if (diffDays === 1) {
    return {
      label: "Tomorrow",
      type: "upcoming",
      badgeClass: "badge-soft-primary",
      dotClass: "status-dot status-dot-primary",
      icon: "bi-clock"
    };
  }
  if (diffDays < 0) {
    return {
      label: "Past Event",
      type: "past",
      badgeClass: "badge-soft-neutral",
      dotClass: "status-dot",
      icon: "bi-clock-history"
    };
  }
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
  return { badgeClass: "badge-soft-warning", dotClass: "status-dot status-dot-warning", icon: "bi-clock-history", text: "Reservation Received" };
};

export const getEventImg = (rawImg, fallback) => {
  if (isBadEventImage(rawImg)) return fallback || EVENT_DEFAULT_SVG;
  return rawImg;
};

export const getEntityId = (value) => {
  if (!value) return "";
  return typeof value === "string" ? value : (value._id || value.id || "");
};

