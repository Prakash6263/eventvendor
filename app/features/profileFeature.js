import React from "react";
import Swal from "sweetalert2";
import { authService } from "../services/authService";

export function initProfileFeature({ rootEl, reactRootRef, onProfileUpdate }) {
  let cancelled = false;
  let selectedProfileImage = null;
  let previewUrl = "";
  let currentProfile = null;

  const getFieldByLabel = (form, ...labelTexts) => {
    if (!form) return null;
    const label = Array.from(form.querySelectorAll("label")).find((item) => {
      const text = item.textContent?.trim().toLowerCase() || "";
      return labelTexts.some((lt) => {
        const target = lt.toLowerCase().trim();
        return text === target || text.includes(target);
      });
    });
    return label?.parentElement?.querySelector("input, select, textarea") || null;
  };

  const profileCard =
    typeof window !== "undefined" && window.location.pathname === "/vendor-profile"
      ? Array.from(rootEl.querySelectorAll(".content-card")).find(
          (card) => card.querySelector("h5")?.textContent?.trim().toLowerCase() === "profile details"
        )
      : null;
  const profileForm = profileCard?.querySelector("form") || null;
  const imageInput = rootEl.querySelector(".user-profile-sidebar .profile-img-file");
  const profileSaveButton = profileForm?.querySelector('button[type="submit"]');
  if (profileSaveButton) {
    profileSaveButton.type = "button";
    profileSaveButton.dataset.profileSave = "true";
  }

  const deleteAccountButton = profileForm
    ? Array.from(profileForm.querySelectorAll("button")).find((button) =>
        button.textContent?.trim().toLowerCase().includes("delete account")
      )
    : null;
  const sidebarList = rootEl.querySelector(".user-profile-sidebar .user-profile-sidebar-list");
  if (sidebarList) {
    const existingHrefs = Array.from(sidebarList.querySelectorAll("a")).map((a) => a.getAttribute("href") || "");
    if (!existingHrefs.some((h) => h.includes("/services"))) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "/services";
      a.className = "user-profile-sidebar-link";
      a.innerHTML = `<i class="fa-solid fa-bell-concierge"></i> My Services`;
      li.appendChild(a);

      // Insert directly after Profile link ("profile k pass rakho" matching iOS Add Update Services)
      const profileLi = Array.from(sidebarList.children).find((childLi) => {
        const aTag = childLi.querySelector("a");
        const h = (aTag?.getAttribute("href") || "").toLowerCase();
        return h.includes("profile");
      });

      if (profileLi && profileLi.nextSibling) {
        sidebarList.insertBefore(li, profileLi.nextSibling);
      } else {
        sidebarList.appendChild(li);
      }
    }
  }

  if (deleteAccountButton && sidebarList) {
    const deleteItem = document.createElement("li");
    deleteItem.className = "sidebar-delete-account-item";
    deleteAccountButton.className = "btn btn-outline-danger sidebar-delete-account-btn";
    deleteAccountButton.type = "button";

    deleteAccountButton.addEventListener("click", () => {
      Swal.fire({
        title: "Are you sure?",
        text: "Do you want to permanently delete your merchant account? This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel"
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const res = await authService.deleteUser();
            if (res?.status) {
              Swal.fire({
                title: "Deleted!",
                text: "Your account has been deleted.",
                icon: "success",
                confirmButtonColor: "#5b6ef5"
              }).then(() => {
                window.location.href = "/login";
              });
            } else {
              Swal.fire({
                title: "Error!",
                text: res?.message || "Failed to delete account.",
                icon: "error",
                confirmButtonColor: "#5b6ef5"
              });
            }
          } catch (err) {
            Swal.fire({
              title: "Error!",
              text: err.message || "Failed to delete account.",
              icon: "error",
              confirmButtonColor: "#5b6ef5"
            });
          }
        }
      });
    });

    deleteItem.appendChild(deleteAccountButton);
    sidebarList.appendChild(deleteItem);

    // Deactivate / Pause Account Request Button
    const deactItem = document.createElement("li");
    deactItem.className = "sidebar-deactivate-account-item mt-2";
    const deactButton = document.createElement("button");
    deactButton.className = "btn btn-outline-warning sidebar-deactivate-btn w-100 rounded-pill py-2 fw-semibold";
    deactButton.type = "button";
    deactButton.innerHTML = `<i class="fa-solid fa-pause me-2"></i> Pause Operations`;

    deactButton.addEventListener("click", () => {
      Swal.fire({
        title: "Pause / Deactivate Account",
        text: "Temporarily pause your vendor business operations. Please provide a reason:",
        input: "textarea",
        inputPlaceholder: "Reason for pausing operations...",
        showCancelButton: true,
        confirmButtonColor: "#f59e0b",
        cancelButtonColor: "#64748b",
        confirmButtonText: "Submit Request",
        inputValidator: (value) => {
          if (!value || !value.trim()) {
            return "Please provide a reason for pausing your account.";
          }
        }
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const res = await authService.requestDeactivation(result.value.trim());
            if (res?.status) {
              Swal.fire({
                title: "Request Submitted!",
                text: res.message || "Your deactivation request has been sent to administration.",
                icon: "success",
                confirmButtonColor: "#5b6ef5"
              });
            } else {
              Swal.fire({
                title: "Request Failed",
                text: res?.message || "Could not submit deactivation request.",
                icon: "error",
                confirmButtonColor: "#5b6ef5"
              });
            }
          } catch (err) {
            Swal.fire({
              title: "Error!",
              text: err.message || "Network error submitting request.",
              icon: "error",
              confirmButtonColor: "#5b6ef5"
            });
          }
        }
      });
    });

    deactItem.appendChild(deactButton);
    sidebarList.appendChild(deactItem);
  }

  const applyProfile = (profile) => {
    if (!profile) return;
    currentProfile = profile;
    if (onProfileUpdate) onProfileUpdate(profile);

    const vendorName = profile.fullName || profile.name || profile.merchantName || profile.restaurantName || "Vendor";
    const rawImage = profile.profileImage || profile.profilePic || profile.image || profile.avatar || "";
    const fallbackImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(vendorName)}&background=5b6ef5&color=fff&size=128`;
    const stableBuster = profile.updatedAt || profile._id || "1";
    const imageSource = rawImage
      ? rawImage.startsWith("blob:") || rawImage.startsWith("data:")
        ? rawImage
        : `${rawImage}${rawImage.includes("?") ? "&" : "?"}v=${stableBuster}`
      : fallbackImage;

    rootEl.querySelectorAll(".user-profile-sidebar-top").forEach((sidebarTop) => {
      const imgDiv = sidebarTop.querySelector(".user-profile-img");
      const image = sidebarTop.querySelector(".user-profile-img img");
      const name = sidebarTop.querySelector("h5");
      if (image) {
        image.onload = () => {
          if (imgDiv) imgDiv.classList.remove("profile-loading");
        };
        image.onerror = () => {
          image.src = fallbackImage;
          if (imgDiv) imgDiv.classList.remove("profile-loading");
        };
        image.src = imageSource;
        image.alt = vendorName;
        if (image.complete && imgDiv) {
          imgDiv.classList.remove("profile-loading");
        }
      } else if (imgDiv) {
        imgDiv.classList.remove("profile-loading");
      }
      if (name) {
        name.textContent = vendorName;
        if (!sidebarTop.querySelector(".verified-merchant-badge")) {
          const badge = document.createElement("div");
          badge.className = "verified-merchant-badge";
          badge.innerHTML = `<i class="fa-solid fa-circle-check" style="font-size:11px;"></i><span>Verified Merchant</span>`;
          name.insertAdjacentElement("afterend", badge);
        }
      }
    });

    // Update active nav link on sidebar for current route
    const currentPath = window.location.pathname;
    rootEl.querySelectorAll(".user-profile-sidebar-list a").forEach((a) => {
      let href = a.getAttribute("href");
      if (href) {
        if (href.endsWith(".html")) {
          href = "/" + href.replace(/\.html$/, "").replace(/^\/+/, "");
        } else if (href.includes(".html?")) {
          href = "/" + href.replace(/\.html\?/, "?").replace(/^\/+/, "");
        }
        if (href === currentPath || (currentPath === "/" && href === "/")) {
          a.classList.add("active");
        } else {
          a.classList.remove("active");
        }
      }
    });

    if (profileForm) {
      const nameField = getFieldByLabel(profileForm, "Vendor Name", "Full Name", "Name");
      const emailField = getFieldByLabel(profileForm, "Email Address", "Email");
      const phoneField = getFieldByLabel(profileForm, "Phone Number", "Phone", "Mobile");
      const dateField = getFieldByLabel(profileForm, "Date", "DOB");
      const genderField = getFieldByLabel(profileForm, "Gender");

      if (nameField) nameField.value = profile.fullName || "";
      if (emailField) {
        emailField.value = profile.email || authService.getUser()?.email || "";
        emailField.readOnly = true;
      }
      if (phoneField) {
        const ph = profile.mobile || profile.phoneNumber || "";
        phoneField.value = ph ? `${profile.countryCode ? profile.countryCode + " " : ""}${ph}` : "";
        phoneField.readOnly = true;
      }
      if (dateField) {
        dateField.value = profile.dob ? String(profile.dob).split("T")[0] : "";
      }
      if (genderField) {
        const genVal = profile.gender ? String(profile.gender).toUpperCase() : "";
        if (genVal) {
          genderField.value = genVal;
        }
      }
    }

    // In accordance with iOS build flow, Service Details are managed exclusively in "My Services" (/services)
    // Remove legacy type card or react mount if present in DOM so Profile only holds personal Profile Details
    const legacyMount = rootEl.querySelector("#vendor-profile-react-root");
    if (legacyMount) legacyMount.remove();

    const typeCard = Array.from(rootEl.querySelectorAll(".content-card")).find((card) =>
      card.querySelector("h5")?.textContent?.trim().toLowerCase().includes("type")
    );
    if (typeCard) typeCard.remove();
  };

  async function loadMerchantProfile() {
    try {
      const response = await authService.getMerchantProfile();
      if (cancelled || !response?.status || !response?.data) return;
      applyProfile(response.data);
    } catch (error) {
      console.error("Failed to load merchant profile:", error);
    }
  }

  const showProfileMessage = (message, success, targetForm = profileForm) => {
    if (!targetForm) return;
    let alert = targetForm.querySelector("#profileUpdateMessage");
    if (!alert) {
      alert = document.createElement("div");
      alert.id = "profileUpdateMessage";
      targetForm.prepend(alert);
    }
    alert.className = `alert ${success ? "alert-success" : "alert-danger"} rounded-3`;
    alert.textContent = message;
  };

  const handleProfileClick = (event) => {
    const saveButton = event.target.closest('button[data-profile-save="true"], button[type="submit"]');
    const saveForm = saveButton?.closest("form");
    const isProfileSave =
      saveForm &&
      Array.from(saveForm.querySelectorAll("label")).some(
        (label) => label.textContent?.trim().toLowerCase() === "vendor name"
      );
    if (isProfileSave && window.location.pathname === "/vendor-profile") {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      handleProfileSubmit({
        target: saveForm,
        preventDefault() {},
        stopPropagation() {}
      });
      return;
    }

    const button = event.target.closest(".profile-img-btn");
    if (!button || window.location.pathname !== "/vendor-profile") return;
    event.preventDefault();
    const input = button.parentElement?.querySelector(".profile-img-file") || imageInput;
    input?.click();
  };

  const handleImageChange = (event) => {
    if (!event.target.matches(".profile-img-file") || window.location.pathname !== "/vendor-profile") return;
    selectedProfileImage = event.target.files?.[0] || null;
    if (!selectedProfileImage) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(selectedProfileImage);
    document.querySelectorAll(".user-profile-sidebar .user-profile-img img").forEach((preview) => {
      preview.src = previewUrl;
    });
  };

  const handleProfileSubmit = async (event) => {
    if (window.location.pathname !== "/vendor-profile") return;
    const submittedForm = event.target;
    const isProfileForm = Array.from(submittedForm.querySelectorAll("label")).some(
      (label) => label.textContent?.trim().toLowerCase() === "vendor name"
    );
    if (!isProfileForm) return;
    event.preventDefault();
    event.stopPropagation();

    const submitButton = submittedForm.querySelector('button[data-profile-save="true"], button[type="submit"]');
    if (submitButton?.disabled) return;
    const payload = new FormData();
    const fullName = getFieldByLabel(submittedForm, "Vendor Name", "Full Name", "Name")?.value.trim() || "";
    const dob = getFieldByLabel(submittedForm, "Date", "DOB")?.value.trim() || "";
    const gender = getFieldByLabel(submittedForm, "Gender")?.value || currentProfile?.gender || "";

    if (!fullName) {
      showProfileMessage("Vendor name is required.", false, submittedForm);
      return;
    }
    if (!gender) {
      showProfileMessage("Gender is required.", false, submittedForm);
      return;
    }

    payload.append("fullName", fullName);
    payload.append("dob", dob);
    payload.append("gender", gender.toLowerCase());
    if (selectedProfileImage) payload.append("profileImage", selectedProfileImage);

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Saving...`;
    }

    try {
      const response = await authService.updateProfile(payload);
      if (!response?.status) throw new Error(response?.message || "Failed to update profile.");
      showProfileMessage(response.message || "Profile updated successfully.", true, submittedForm);
      selectedProfileImage = null;
      const currentImageInput = rootEl.querySelector(".user-profile-sidebar .profile-img-file");
      if (currentImageInput) currentImageInput.value = "";
      if (response.data) applyProfile(response.data);
    } catch (error) {
      showProfileMessage(error.message || "Failed to update profile.", false, submittedForm);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Save Changes";
      }
    }
  };

  rootEl.addEventListener("click", handleProfileClick);
  rootEl.addEventListener("change", handleImageChange);
  rootEl.addEventListener("submit", handleProfileSubmit);

  return {
    applyProfile,
    loadMerchantProfile,
    cleanup: () => {
      cancelled = true;
      rootEl.removeEventListener("click", handleProfileClick);
      rootEl.removeEventListener("change", handleImageChange);
      rootEl.removeEventListener("submit", handleProfileSubmit);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    }
  };
}

