import { apiRequest, getToken, saveAuthData, clearAuthData } from "./apiClient";

const MERCHANT_LOGIN_URL = "https://eventuna.com/api/merchant/login";

// 0. Get Services API
export const getServicesApi = async () => {
  return await apiRequest("https://eventuna.com/api/merchant/services", {
    method: "GET",
  });
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
    });
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
  const data = await apiRequest("/auth/user-profile", {
    method: "GET",
  });

  if (data && data.status && data.user) {
    saveAuthData({ userProfile: data.user });
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

  const data = await apiRequest("/auth/update-profile", {
    method: "PUT",
    body,
  });

  return data;
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
  signup: signupApi,
  verifyOtp: verifyOtpApi,
  login: loginApi,
  logout: logoutApi,
  deleteUser: deleteUserApi,
  forgotPassword: forgotPasswordApi,
  resetPassword: resetPasswordApi,
  changePassword: changePasswordApi,
  getUserProfile: getUserProfileApi,
  updateProfile: updateProfileApi,
  syncContacts: syncContactsApi,
  getAllUsers: getAllUsersApi,
  getAddresses: getAddressesApi,
  addAddress: addAddressApi,
};
