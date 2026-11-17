import { apiRequest, getToken, getUser, saveAuthData, clearAuthData } from "./apiClient";

const MERCHANT_LOGIN_URL = "https://eventuna.com/api/merchant/login";
const MERCHANT_PROFILE_URL = "https://eventuna.com/api/merchant/profile";

// 0. Get Services API
export const getServicesApi = async () => {
  return await apiRequest("https://eventuna.com/api/merchant/services", {
    method: "GET",
  });
};

// Get service-specific subcategories (for example restaurant types)
export const getSubServicesApi = async ({ id }) => {
  const query = new URLSearchParams({ id });
  return await apiRequest(
    `https://eventuna.com/api/merchant/sub-services?${query.toString()}`,
    { method: "GET" }
  );
};

// 1. Signup API
export const signupApi = async ({
  fullName,
  email,
  mobile,
  countryCode = "+966",
  password,
  serviceId,
  ios_register_id = "IOS123",
}) => {
  const body = {
    ios_register_id,
    mobile,
    password,
    fullName,
    email,
    countryCode,
  };
  if (serviceId) {
    body.serviceId = serviceId;
  }
  return await apiRequest("https://eventuna.com/api/merchant/signup", {
    method: "POST",
    body,
  });
};

// 2. Verify OTP API
export const verifyOtpApi = async ({ merchantId, userId, otp }) => {
  return await apiRequest("https://eventuna.com/api/merchant/verify-otp", {
    method: "POST",
    body: {
      merchantId: merchantId || userId,
      otp,
    },
  });
};

// 3. Login API
export const loginApi = async ({ email, password }) => {
  const iosRegisterId = process.env.NEXT_PUBLIC_IOS_REGISTER_ID || "IOS123";
  const data = await apiRequest(MERCHANT_LOGIN_URL, {
    method: "POST",
    body: JSON.stringify({
      password,
      email,
      ios_register_id: iosRegisterId,
    }),
  });

  if (data && data.status && data.token) {
    saveAuthData({
      token: data.token,
      userId: data.userId,
      role: data.role,
      isActive: data.isActive,
      applicationStatus: data.applicationStatus,
      ios_register_id: data.ios_register_id,
      serviceId: data.serviceId,
      email,
      userProfile: data.user || data.merchantProfile || data.data || null,
    });
    // Async prefetch of full merchant profile to seed local storage for immediate render
    try {
      getUserProfileApi().catch(() => {});
    } catch (e) {}
  }

  return data;
};

// 4. Logout API
export const logoutApi = async (credentials = null) => {
  clearAuthData();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("merchant-auth-change"));
  }
  return { status: true, message: "Logout successful" };
};

// 5. Delete User API
export const deleteUserApi = async () => {
  try {
    const data = await apiRequest("https://eventuna.com/api/merchant/delete-merchant", {
      method: "POST",
    });

    clearAuthData();
    return data;
  } catch (error) {
    clearAuthData();
    return { status: false, message: error.message || "Failed to delete user" };
  }
};

// 6. Forgot Password API
export const forgotPasswordApi = async ({ email }) => {
  return await apiRequest("/auth/forgot-password", {
    method: "POST",
    body: {
      email,
    },
  });
};

// 7. Reset Password API
export const resetPasswordApi = async ({ userId, otp, newPassword }) => {
  return await apiRequest("/auth/reset-password", {
    method: "POST",
    body: {
      userId,
      otp,
      newPassword,
    },
  });
};

// 8. Change Password API
export const changePasswordApi = async ({ newPassword }) => {
  return await apiRequest("https://eventuna.com/api/merchant/change-password", {
    method: "POST",
    body: {
      newPassword,
    },
  });
};

// 9. Get User Profile API
export const getUserProfileApi = async () => {
  const data = await apiRequest("https://eventuna.com/api/merchant/get-merchant-profiles", {
    method: "GET",
  });

  if (data && data.status && data.data) {
    saveAuthData({ userProfile: data.data });
  }

  return data;
};

// Full merchant profile used for application-status routing and onboarding.
export const getMerchantProfileApi = async () => {
  const data = await apiRequest(MERCHANT_PROFILE_URL, {
    method: "GET",
  });

  if (data?.status && data?.data) {
    saveAuthData({
      merchantProfile: data.data,
      applicationStatus: data.data.applicationStatus,
      isActive: data.data.isActive,
      merchantProfileFetchedAt: Date.now(),
    });
  }

  return data;
};

// 10. Update Profile API (Supports FormData for profilePic, dob, gender, etc.)
export const updateProfileApi = async (payload) => {
  const body = toMerchantProfileFormData(payload);

  const data = await apiRequest("https://eventuna.com/api/merchant/update-merchant-getMerchantProfileFields", {
    method: "PUT",
    body,
  });

  if (data && data.status) {
    const updated = data.data?.data || data.data?.merchant || data.data;
    if (updated && typeof updated === "object") {
      saveAuthData({ userProfile: updated });
    }
  }

  return data;
};

const toMerchantProfileFormData = (payload) => {
  if (payload instanceof FormData) return payload;

  const formData = new FormData();
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    const isBlob = typeof Blob !== "undefined" && value instanceof Blob;
    if (isBlob || typeof value === "string") {
      formData.append(key, value);
      return;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      formData.append(key, String(value));
      return;
    }

    formData.append(key, JSON.stringify(value));
  });

  return formData;
};

// Full merchant application/profile submission, including documents and banner.
export const updateMerchantProfileApi = async (payload) => {
  return await apiRequest("https://eventuna.com/api/merchant/update-profile", {
    method: "PUT",
    body: toMerchantProfileFormData(payload),
  });
};

export const getMerchantLocationsApi = async ({ locationId } = {}) => {
  if (locationId) {
    const query = `?${new URLSearchParams({ locationId }).toString()}`;
    return await apiRequest(`https://eventuna.com/api/merchant/location${query}`, {
      method: "GET",
    });
  }
  return await apiRequest("https://eventuna.com/api/merchant/alllocations", {
    method: "GET",
  });
};

export const addMerchantLocationApi = async (payload) => {
  const cleanPayload = { ...payload };

  // Backend requires the merchant's real serviceId (not categoryId)
  if (!cleanPayload.serviceId && cleanPayload.merchantServiceId) {
    cleanPayload.serviceId = cleanPayload.merchantServiceId;
  }

  const KNOWN_CATEGORY_IDS = [
    "686fb6ced46e9740ee8277ec", // Restaurants
    "686fb6dcd46e9740ee8277ee", // Facility
    "686fb6edd46e9740ee8277f0", // Catering
    "686fb714d46e9740ee8277f2", // Decoration & Lighting
    "686fb723d46e9740ee8277f4", // Photography
    "686fb788d46e9740ee8277f6", // Music Band and DJ
    "686fb7bad46e9740ee8277f8", // Furniture Rentals
    "686fb7e8d46e9740ee8277fa", // Servants and Cleaning
    "686fb80bd46e9740ee8277fc", // Entertainment & clown
  ];

  // If serviceId is missing OR is a Category ID, resolve the real merchant service instance
  if (!cleanPayload.serviceId || KNOWN_CATEGORY_IDS.includes(cleanPayload.serviceId)) {
    try {
      const targetCatId = cleanPayload.serviceId || KNOWN_CATEGORY_IDS[0];
      const mList = await getMerchantServicesListApi();
      let matchedService = null;
      if (Array.isArray(mList?.data)) {
        for (const catGroup of mList.data) {
          if (Array.isArray(catGroup.services)) {
            for (const s of catGroup.services) {
              const sCatId = typeof s.categoryId === "object" ? s.categoryId?._id : s.categoryId;
              if (sCatId === targetCatId || s._id === targetCatId) {
                matchedService = s;
                break;
              }
              if (!matchedService) matchedService = s;
            }
          }
          if (
            matchedService &&
            (typeof matchedService.categoryId === "object"
              ? matchedService.categoryId?._id
              : matchedService.categoryId) === targetCatId
          ) {
            break;
          }
        }
      }

      if (matchedService?._id) {
        cleanPayload.serviceId = matchedService._id;
      } else {
        const created = await addMerchantServiceApi({
          categoryId: targetCatId,
          serviceName: "Business Service",
          serviceDescription: "Service Location",
        });
        if (created?.data?._id) {
          cleanPayload.serviceId = created.data._id;
        }
      }
    } catch (e) {
      console.warn("Could not auto-resolve merchant serviceId for location:", e);
    }
  }

  // Remove fields that backend Joi validator strictly rejects on /add-location
  // (capacity, locationPhone, floorPlan, schedule belong to /update-location)
  delete cleanPayload.capacity;
  delete cleanPayload.locationPhone;
  delete cleanPayload.floorPlan;
  delete cleanPayload.weeklySchedule;
  delete cleanPayload.onlineReservationLocation;
  delete cleanPayload.acceptPreorder;

  return await apiRequest("https://eventuna.com/api/merchant/add-location", {
    method: "POST",
    body: cleanPayload,
  });
};

export const updateMerchantLocationApi = async (payload) => {
  const cleanPayload = { ...payload };
  if (!cleanPayload.locationId && cleanPayload._id) {
    cleanPayload.locationId = cleanPayload._id;
  }
  if (!payload?.serviceId) {
    delete cleanPayload.serviceId;
  }

  // Backend Joi schema strictly forbids "isOpen" inside weeklySchedule items
  if (Array.isArray(cleanPayload.weeklySchedule)) {
    cleanPayload.weeklySchedule = cleanPayload.weeklySchedule.map((s) => ({
      day: s.day || "Monday",
      morning: {
        from: s.morning?.from || "09:00",
        to: s.morning?.to || "14:00",
      },
      evening: {
        from: s.evening?.from || "17:00",
        to: s.evening?.to || "23:00",
      },
    }));
  }

  if (cleanPayload.capacity !== undefined && cleanPayload.capacity !== "") {
    cleanPayload.capacity = Number(cleanPayload.capacity) || 100;
  }
  if (cleanPayload.onlineReservationLocation !== undefined) {
    cleanPayload.onlineReservationLocation = Boolean(cleanPayload.onlineReservationLocation);
  }
  if (cleanPayload.acceptPreorder !== undefined) {
    cleanPayload.acceptPreorder = Boolean(cleanPayload.acceptPreorder);
  }
  if (cleanPayload.openTwoShifts !== undefined) {
    cleanPayload.openTwoShifts = Boolean(cleanPayload.openTwoShifts);
  }

  return await apiRequest("https://eventuna.com/api/merchant/update-location", {
    method: "POST",
    body: cleanPayload,
  });
};

export const getMerchantLocationMediaApi = async ({ locationId }) => {
  const query = new URLSearchParams({ locationId });
  return await apiRequest(`https://eventuna.com/api/merchant/location-media?${query.toString()}`, {
    method: "GET",
  });
};

export const addMerchantLocationMediaApi = async (payload) => {
  const formData = payload instanceof FormData ? payload : new FormData();
  if (!(payload instanceof FormData)) {
    Object.entries(payload || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") formData.append(key, value);
    });
  }
  return await apiRequest("https://eventuna.com/api/merchant/add-location-media", {
    method: "POST",
    body: formData,
  });
};

export const getProductCategoriesApi = async () => {
  return await apiRequest("https://eventuna.com/api/products/categories", {
    method: "GET",
  });
};

export const addProductCategoryApi = async ({ name, description, serviceId }) => {
  const sId =
    serviceId ||
    (typeof window !== "undefined"
      ? localStorage.getItem("active_service_id") || localStorage.getItem("selected_service_id")
      : "");

  const queryParams = new URLSearchParams();
  if (sId) queryParams.append("serviceId", sId);
  if (name) queryParams.append("name", name);
  if (description) queryParams.append("description", description);

  const url = `https://eventuna.com/api/products/category?${queryParams.toString()}`;
  return await apiRequest(url, {
    method: "POST",
    body: { name, description, ...(sId ? { serviceId: sId } : {}) },
  });
};

export const addProductApi = async (payload) => {
  let body;
  if (payload instanceof FormData) {
    payload.delete("serviceId");
    body = payload;
  } else {
    const clean = { ...payload };
    delete clean.serviceId;
    body = toMerchantProfileFormData(clean);
  }
  return await apiRequest("https://eventuna.com/api/products/product", {
    method: "POST",
    body,
  });
};

export const getProductsByCategoryApi = async ({ categoryId }) => {
  const query = new URLSearchParams({ categoryId });
  return await apiRequest(`https://eventuna.com/api/products/productby/category?${query.toString()}`, {
    method: "GET",
  });
};

export const deleteProductApi = async ({ productId, id }) => {
  return await apiRequest("https://eventuna.com/api/products/deleteproduct", {
    method: "POST",
    body: { productId: productId || id, id: productId || id },
  });
};

export const getMerchantCouponsApi = async () => {
  return await apiRequest("https://eventuna.com/api/merchant/all-coupons", {
    method: "GET",
  });
};

export const addMerchantCouponApi = async (payload) => {
  let sId =
    payload.serviceId ||
    (typeof window !== "undefined"
      ? localStorage.getItem("active_service_id") || localStorage.getItem("selected_service_id")
      : "");

  // Auto-resolve merchant serviceId if not provided
  if (!sId) {
    try {
      const mList = await getMerchantServicesListApi();
      if (Array.isArray(mList?.data)) {
        for (const g of mList.data) {
          if (Array.isArray(g.services) && g.services.length > 0) {
            sId = g.services[0]._id;
            break;
          }
        }
      }
    } catch (e) {
      console.warn("Could not auto-resolve serviceId for coupon:", e);
    }
  }

  const formatDateToDDMMYYYY = (val, fallback) => {
    if (!val) return fallback;
    if (/^\d{2}-\d{2}-\d{4}$/.test(val)) return val;
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [yyyy, mm, dd] = val.split("-");
      return `${dd}-${mm}-${yyyy}`;
    }
    return fallback;
  };

  const today = new Date();
  const ninetyDays = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  const defFrom = `${String(today.getDate()).padStart(2, "0")}-${String(today.getMonth() + 1).padStart(2, "0")}-${today.getFullYear()}`;
  const defTo = `${String(ninetyDays.getDate()).padStart(2, "0")}-${String(ninetyDays.getMonth() + 1).padStart(2, "0")}-${ninetyDays.getFullYear()}`;

  const cleanCoupon = {
    ...payload,
    serviceId: sId,
    couponName: String(payload.couponName || "PROMO").toUpperCase().trim(),
    discount: String(payload.discount || "10").replace(/[^0-9]/g, "") || "10",
    validFrom: formatDateToDDMMYYYY(payload.validFrom, defFrom),
    validTo: formatDateToDDMMYYYY(payload.validTo, defTo),
    description: (payload.description || "Promotional Discount Voucher").trim(),
  };

  const queryParams = new URLSearchParams();
  Object.entries(cleanCoupon).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") queryParams.append(k, String(v));
  });

  return await apiRequest(`https://eventuna.com/api/merchant/add-coupon?${queryParams.toString()}`, {
    method: "POST",
    body: cleanCoupon,
  });
};

export const updateMerchantCouponApi = async (payload) => {
  return await apiRequest("https://eventuna.com/api/merchant/update-coupon", {
    method: "POST",
    body: payload,
  });
};

export const deleteMerchantCouponApi = async ({ couponId }) => {
  return await apiRequest("https://eventuna.com/api/merchant/delete-coupon", {
    method: "POST",
    body: { couponId },
  });
};

// 11. Sync Contacts API
export const syncContactsApi = async ({ contacts }) => {
  return await apiRequest("/auth/sync-contacts", {
    method: "POST",
    body: JSON.stringify({ contacts }),
  });
};

// Get Merchant All Events API
export const getMerchantAllEventsApi = async () => {
  return await apiRequest("https://eventuna.com/api/merchant/all-events", {
    method: "GET",
  });
};

// Get Merchant Only Events API (from iOS build)
export const getMerchantOnlyEventsApi = async () => {
  return await apiRequest("https://eventuna.com/api/merchant/only-events", {
    method: "GET",
  });
};

// Get Merchant Reservations List API
export const getMerchantEventsApi = async () => {
  return await apiRequest("https://eventuna.com/api/merchant/events", {
    method: "GET",
  });
};

// Get Merchant Service Booking Requests (from iOS build)
export const getMerchantBookingRequestsApi = async () => {
  return await apiRequest("https://eventuna.com/api/merchant/merchant-service-booking-requests", {
    method: "GET",
  });
};

// Update Merchant Booking Request Status (from iOS build & Postman specs)
export const updateMerchantBookingRequestStatusApi = async ({ requestId, bookingId, id, status, reason, cancelReason }) => {
  const reqId = requestId || bookingId || id;
  const payloadReason = reason || cancelReason || "";
  return await apiRequest("https://eventuna.com/api/merchant/merchant-service-booking-request/status", {
    method: "POST",
    body: {
      requestId: reqId,
      bookingId: reqId,
      id: reqId,
      status,
      reason: payloadReason,
      cancelReason: payloadReason,
    },
  });
};

// Get All Locations (from iOS build)
export const getMerchantAllLocationsApi = async () => {
  return await apiRequest("https://eventuna.com/api/merchant/alllocations", {
    method: "GET",
  });
};

// Get Merchant Chat API
export const getMerchantChatApi = async ({ eventId, userId }) => {
  const query = new URLSearchParams({ eventId, userId });
  return await apiRequest(
    `https://eventuna.com/api/chat/merchant-chat?${query.toString()}`,
    { method: "GET" }
  );
};

// Send Merchant Chat Message API
export const sendMerchantMessageApi = async ({ eventId, userId, content }) => {
  return await apiRequest("https://eventuna.com/api/chat/merchant-chat/send", {
    method: "POST",
    body: { eventId, userId, content },
  });
};

// Activate / Confirm Reservation API
export const activateReservationApi = async ({ reservationId, cancelReason }) => {
  return await apiRequest("https://eventuna.com/api/merchant/activate-reservation", {
    method: "POST",
    body: { reservationId, cancelReason },
  });
};

// Cancel / Decline Reservation API
export const cancelReservationApi = async ({ reservationId, cancelReason }) => {
  return await apiRequest("https://eventuna.com/api/merchant/cancel-reservation", {
    method: "POST",
    body: { reservationId, cancelReason },
  });
};

// 12. Get All Users API
export const getAllUsersApi = async () => {
  return await apiRequest("/auth/all-users", {
    method: "GET",
  });
};

// 13. Get Addresses API
export const getAddressesApi = async () => {
  return await apiRequest("/auth/address", {
    method: "GET",
  });
};

// 14. Add Address API
export const addAddressApi = async ({ addressName, address1, address2, postcode }) => {
  return await apiRequest("/auth/add-address", {
    method: "POST",
    body: JSON.stringify({ addressName, address1, address2, postcode }),
  });
};

// 15. Merchant Services CRUD APIs (from Event.postman.json)
export const getMerchantServicesListApi = async () => {
  return await apiRequest("https://eventuna.com/api/merchant/merchant-services", {
    method: "GET",
  });
};

export const addMerchantServiceApi = async (payload) => {
  const body = toMerchantProfileFormData(payload);
  return await apiRequest("https://eventuna.com/api/merchant/merchant-services", {
    method: "POST",
    body,
  });
};

export const updateMerchantServiceDetailApi = async (payload) => {
  const body = toMerchantProfileFormData(payload);
  return await apiRequest("https://eventuna.com/api/merchant/merchant-services", {
    method: "PUT",
    body,
  });
};

export const toggleMerchantServiceStatusApi = async (serviceId) => {
  return await apiRequest(`https://eventuna.com/api/merchant/merchant-services/${serviceId}/status`, {
    method: "PATCH",
  });
};

export const deleteMerchantServiceApi = async (serviceId) => {
  return await apiRequest(`https://eventuna.com/api/merchant/merchant-services/${serviceId}`, {
    method: "DELETE",
  });
};

// 16. Pending / Cancelled Event Notifications API (from updated Postman collection)
export const getPendingCancelledEventsApi = async () => {
  return await apiRequest("https://eventuna.com/api/merchant/pending-cancelled-events", {
    method: "GET",
  });
};

// 17. Merchant Rating API (from updated Postman collection)
export const rateMerchantApi = async ({ merchantId, rating, comment }) => {
  return await apiRequest("https://eventuna.com/api/merchant/rate", {
    method: "POST",
    body: { merchantId, rating, comment },
  });
};

export const authApi = {
  getMerchantAllEvents: getMerchantAllEventsApi,
  getMerchantOnlyEvents: getMerchantOnlyEventsApi,
  getMerchantEvents: getMerchantEventsApi,
  getMerchantBookingRequests: getMerchantBookingRequestsApi,
  updateMerchantBookingRequestStatus: updateMerchantBookingRequestStatusApi,
  getMerchantAllLocations: getMerchantAllLocationsApi,
  getMerchantChat: getMerchantChatApi,
  sendMerchantMessage: sendMerchantMessageApi,
  activateReservation: activateReservationApi,
  cancelReservation: cancelReservationApi,
  getServices: getServicesApi,
  getSubServices: getSubServicesApi,
  signup: signupApi,
  verifyOtp: verifyOtpApi,
  login: loginApi,
  logout: logoutApi,
  deleteUser: deleteUserApi,
  forgotPassword: forgotPasswordApi,
  resetPassword: resetPasswordApi,
  changePassword: changePasswordApi,
  getUserProfile: getUserProfileApi,
  getMerchantProfile: getMerchantProfileApi,
  updateProfile: updateProfileApi,
  updateMerchantProfile: updateMerchantProfileApi,
  getMerchantServicesList: getMerchantServicesListApi,
  addMerchantService: addMerchantServiceApi,
  updateMerchantServiceDetail: updateMerchantServiceDetailApi,
  toggleMerchantServiceStatus: toggleMerchantServiceStatusApi,
  deleteMerchantService: deleteMerchantServiceApi,
  getMerchantLocations: getMerchantLocationsApi,
  addMerchantLocation: addMerchantLocationApi,
  updateMerchantLocation: updateMerchantLocationApi,
  getMerchantLocationMedia: getMerchantLocationMediaApi,
  addMerchantLocationMedia: addMerchantLocationMediaApi,
  getProductCategories: getProductCategoriesApi,
  addProductCategory: addProductCategoryApi,
  addProduct: addProductApi,
  getProductsByCategory: getProductsByCategoryApi,
  deleteProduct: deleteProductApi,
  getMerchantCoupons: getMerchantCouponsApi,
  addMerchantCoupon: addMerchantCouponApi,
  updateMerchantCoupon: updateMerchantCouponApi,
  deleteMerchantCoupon: deleteMerchantCouponApi,
  getPendingCancelledEvents: getPendingCancelledEventsApi,
  rateMerchant: rateMerchantApi,
  syncContacts: syncContactsApi,
  getAllUsers: getAllUsersApi,
  getAddresses: getAddressesApi,
  addAddress: addAddressApi,
};
