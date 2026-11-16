export const DEFAULT_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80"
];

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
  const s = String(statusStr || "").toLowerCase();
  if (["ongoingevent", "ongoing"].includes(s)) {
    return { label: "Ongoing", badgeClass: "badge-soft-success", dotClass: "status-dot status-dot-success" };
  }
  if (s === "draft") {
    return { label: "Draft", badgeClass: "badge-soft-neutral", dotClass: "status-dot" };
  }
  if (["completed", "finished"].includes(s)) {
    return { label: "Completed", badgeClass: "badge-soft-neutral", dotClass: "status-dot" };
  }
  const dt = parseDateSafe(dateVal);
  if (!dt) return { label: statusStr || "Scheduled", badgeClass: "badge-soft-primary", dotClass: "status-dot status-dot-primary" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dt);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { label: "Today", badgeClass: "badge-soft-warning", dotClass: "status-dot status-dot-warning" };
  if (diffDays === 1) return { label: "Tomorrow", badgeClass: "badge-soft-primary", dotClass: "status-dot status-dot-primary" };
  if (diffDays < 0) return { label: "Past Event", badgeClass: "badge-soft-neutral", dotClass: "status-dot" };
  return { label: "Upcoming", badgeClass: "badge-soft-primary", dotClass: "status-dot status-dot-primary" };
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
  if (!rawImg || typeof rawImg !== "string" || !rawImg.startsWith("http")) return fallback;
  const lower = rawImg.toLowerCase();
  if (lower.includes("tap to upload") || lower.includes("placeholder") || lower.includes("default_upload")) return fallback;
  return rawImg;
};

export const getEntityId = (value) => {
  if (!value) return "";
  return typeof value === "string" ? value : (value._id || value.id || "");
};

