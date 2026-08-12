export const APPLICATION_ROUTES = {
  approved: "/",
  pending: "/application-pending",
  incomplete: "/complete-profile",
  rejected: "/complete-profile",
};

export const STATUS_ONLY_PATHS = new Set([
  "/application-pending",
  "/complete-profile",
]);

export const normalizeApplicationStatus = (value) =>
  String(value || "").trim().toLowerCase();

export const getApplicationRoute = (profileOrStatus) => {
  const status = normalizeApplicationStatus(
    typeof profileOrStatus === "string"
      ? profileOrStatus
      : profileOrStatus?.applicationStatus
  );

  return APPLICATION_ROUTES[status] || null;
};

