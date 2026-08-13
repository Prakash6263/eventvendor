import { apiRequest, getToken, saveAuthData, clearAuthData } from "./apiClient";

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
  return await apiRequest("https://eventuna.com/api/merchant/signup", {
    method: "POST",
    body: {
      ios_register_id,
      mobile,
      serviceId,
      password,
      fullName,
      email,
      countryCode,
    },
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
    const data = await apiRequest("/auth/delete-user", {
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
    body: JSON.stringify({
      email,
    }),
  });
};

// 7. Reset Password API
export const resetPasswordApi = async ({ userId, otp, newPassword }) => {
  return await apiRequest("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      userId,
      otp,
      newPassword,
    }),
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
  let body;
  if (payload instanceof FormData) {
    body = payload;
  } else {
    const formData = new FormData();
    Object.keys(payload).forEach((key) => {
      if (payload[key] !== undefined && payload[key] !== null) {
        formData.append(key, payload[key]);
      }
    });
    body = formData;
  }

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
  const query = locationId ? `?${new URLSearchParams({ locationId }).toString()}` : "";
  return await apiRequest(`https://eventuna.com/api/merchant/location${query}`, {
    method: "GET",
  });
};

export const addMerchantLocationApi = async (payload) => {
  return await apiRequest("https://eventuna.com/api/merchant/add-location", {
    method: "POST",
    body: payload,
  });
};

export const updateMerchantLocationApi = async (payload) => {
  return await apiRequest("https://eventuna.com/api/merchant/update-location", {
    method: "POST",
    body: payload,
  });
};

export const getMerchantCouponsApi = async () => {
  return await apiRequest("https://eventuna.com/api/merchant/all-coupons", {
    method: "GET",
  });
};

export const addMerchantCouponApi = async (payload) => {
  return await apiRequest("https://eventuna.com/api/merchant/add-coupon", {
    method: "POST",
    body: payload,
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

// Get Merchant Reservations List API
export const getMerchantEventsApi = async () => {
  return await apiRequest("https://eventuna.com/api/merchant/events", {
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

export const authApi = {
  getMerchantAllEvents: getMerchantAllEventsApi,
  getMerchantEvents: getMerchantEventsApi,
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
  getMerchantLocations: getMerchantLocationsApi,
  addMerchantLocation: addMerchantLocationApi,
  updateMerchantLocation: updateMerchantLocationApi,
  getMerchantCoupons: getMerchantCouponsApi,
  addMerchantCoupon: addMerchantCouponApi,
  updateMerchantCoupon: updateMerchantCouponApi,
  deleteMerchantCoupon: deleteMerchantCouponApi,
  syncContacts: syncContactsApi,
  getAllUsers: getAllUsersApi,
  getAddresses: getAddressesApi,
  addAddress: addAddressApi,
};
