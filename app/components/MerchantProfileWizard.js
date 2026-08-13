"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../services/authService";
import LocationMapPicker from "./LocationMapPicker";
import { getApplicationRoute, normalizeApplicationStatus } from "../lib/merchantStatus";
import statusStyles from "./merchantStatus.module.css";
import styles from "./MerchantProfileWizard.module.css";

const DRAFT_KEY = "eventuna-merchant-onboarding-draft";
const RESTAURANT_SERVICE_ID = "686fb6ced46e9740ee8277ec";

const STEPS = [
  { id: "types", label: "Restaurant Type", icon: "fa-utensils" },
  { id: "details", label: "Restaurant Details", icon: "fa-pen-to-square" },
  { id: "primary", label: "Primary Information", icon: "fa-address-card" },
  { id: "documents", label: "Documents", icon: "fa-file-shield" },
  { id: "banner", label: "Banner & Slogan", icon: "fa-image" },
  { id: "locations", label: "Locations", icon: "fa-location-dot" },
  { id: "menu", label: "Menu Category", icon: "fa-list" },
  { id: "coupons", label: "Coupons", icon: "fa-ticket" },
  { id: "review", label: "Review & Submit", icon: "fa-clipboard-check" },
];

const EMPTY_FORM = {
  serviceSubcategoryIds: [],
  serviceName: "",
  serviceDescription: "",
  webUrl: "",
  cuisineName: "",
  menuUrl: "",
  phone: "",
  onlineReservation: false,
  commercialPermitNumber: "",
  vatNumber: "",
  serviceSlogan: "",
  menuCategoryName: "",
  menuCategoryDescription: "",
};

const EMPTY_FILES = {
  businessRegistrationImage: null,
  vatRegistrationImage: null,
  otherImage: null,
  bannerImage: null,
};

const EMPTY_LOCATION = {
  addressName: "",
  address: "",
  lat: "",
  long: "",
  capacity: "",
  floorPlan: "",
  locationPhone: "",
  openTwoShifts: false,
};

const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const createEmptySchedule = () => WEEK_DAYS.map((day) => ({
  day,
  morning: { from: "00:00", to: "00:00" },
  evening: { from: "00:00", to: "00:00" },
}));

const EMPTY_COUPON = {
  _id: "",
  couponName: "",
  discount: "",
  validFrom: "",
  validTo: "",
  description: "",
};

const getId = (value) => (typeof value === "string" ? value : value?._id || "");

const normalizeArrayResponse = (response, possibleKeys) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  for (const key of possibleKeys) {
    if (Array.isArray(response?.[key])) return response[key];
    if (Array.isArray(response?.data?.[key])) return response.data[key];
  }
  return [];
};

const toDateInput = (value) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = String(value).match(/^(\d{2})-(\d{2})-(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
};

const toApiDate = (value) => {
  if (!value) return "";
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
};

function UploadField({ label, name, file, existingUrl, accept = "image/*", onChange }) {
  return (
    <label className={styles.uploadCard}>
      <input
        className={styles.hiddenInput}
        type="file"
        accept={accept}
        onChange={(event) => onChange(name, event.target.files?.[0] || null)}
      />
      <span className={styles.uploadLabel}>{label}</span>
      <span className={styles.uploadIcon}><i className="fa-solid fa-arrow-up-from-bracket" /></span>
      <span className={styles.uploadHint}>
        {file?.name || (existingUrl ? "Current file uploaded — click to replace" : "Click to choose a file")}
      </span>
    </label>
  );
}

function BannerUploadField({ file, existingUrl, onChange }) {
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : existingUrl || ""),
    [file, existingUrl]
  );

  useEffect(() => {
    return () => {
      if (file && previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [file, previewUrl]);

  return (
    <label className={`${styles.uploadCard} ${styles.bannerUploadCard}`}>
      <input
        className={styles.hiddenInput}
        type="file"
        accept="image/*"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
      <span className={styles.uploadLabel}>Upload Image</span>
      {previewUrl ? (
        <img className={styles.bannerUploadPreview} src={previewUrl} alt="Selected banner preview" />
      ) : (
        <span className={styles.uploadIcon}><i className="fa-solid fa-image" /></span>
      )}
      <span className={styles.uploadHint}>{file?.name || (existingUrl ? "Click to replace image" : "Click to choose an image")}</span>
    </label>
  );
}

export default function MerchantProfileWizard() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(null);
  const [selectedServiceName, setSelectedServiceName] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [files, setFiles] = useState(EMPTY_FILES);
  const [subServices, setSubServices] = useState([]);
  const [loadingSubServices, setLoadingSubServices] = useState(false);
  const [locations, setLocations] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [locationForm, setLocationForm] = useState(EMPTY_LOCATION);
  const [locationView, setLocationView] = useState("list");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [weeklySchedule, setWeeklySchedule] = useState(createEmptySchedule);
  const [locationSectionsCompleted, setLocationSectionsCompleted] = useState({
    details: false,
    hours: false,
    photos: false,
  });
  const [couponForm, setCouponForm] = useState(EMPTY_COUPON);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const existingFiles = useMemo(() => ({
    businessRegistrationImage: profile?.businessRegistrationImage || "",
    vatRegistrationImage: profile?.vatRegistrationImage || "",
    otherImage: profile?.otherImage || "",
    bannerImage: profile?.bannerImage || "",
  }), [profile]);

  const selectedTypeNames = useMemo(() => {
    const selected = new Set(form.serviceSubcategoryIds);
    return subServices
      .filter((service) => selected.has(service._id))
      .map((service) => service.subServicesName);
  }, [form.serviceSubcategoryIds, subServices]);

  const isRestaurantService = useMemo(() => {
    const serviceId = getId(profile?.serviceId)
      || getId(authService.getUser()?.serviceId)
      || (typeof window !== "undefined" ? localStorage.getItem("eventuna-signup-service-id") : "")
      || "";
    return serviceId === RESTAURANT_SERVICE_ID
      || selectedServiceName.trim().toLowerCase() === "restaurants"
      || selectedServiceName.trim().toLowerCase() === "restaurant";
  }, [profile, selectedServiceName]);

  const visibleSteps = useMemo(
    () => (isRestaurantService ? STEPS : STEPS.filter((item) => item.id !== "types")),
    [isRestaurantService]
  );

  const applyProfile = (merchantProfile, savedDraft = null) => {
    if (!merchantProfile) return;
    const backendForm = {
      serviceSubcategoryIds: Array.isArray(merchantProfile.serviceSubcategoryIds)
        ? merchantProfile.serviceSubcategoryIds.map(getId).filter(Boolean)
        : [],
      serviceName: merchantProfile.serviceName || "",
      serviceDescription: merchantProfile.serviceDescription || "",
      webUrl: merchantProfile.webUrl || "",
      cuisineName: merchantProfile.cuisineName || "",
      menuUrl: merchantProfile.menuUrl || "",
      phone: merchantProfile.phone || merchantProfile.mobile || "",
      onlineReservation: Boolean(merchantProfile.onlineReservation),
      commercialPermitNumber: merchantProfile.commercialPermitNumber || "",
      vatNumber: merchantProfile.vatNumber || "",
      serviceSlogan: merchantProfile.serviceSlogan || "",
      menuCategoryName: "",
      menuCategoryDescription: "",
    };

    const draftForm = savedDraft?.form || {};
    setForm({
      ...backendForm,
      ...draftForm,
      serviceSubcategoryIds: Array.isArray(draftForm.serviceSubcategoryIds)
        ? draftForm.serviceSubcategoryIds
        : backendForm.serviceSubcategoryIds,
    });
    setLocations(Array.isArray(merchantProfile.serviceLocationIds) ? merchantProfile.serviceLocationIds : []);
    setCoupons(Array.isArray(merchantProfile.allCoupons) ? merchantProfile.allCoupons : []);
    setProfile(merchantProfile);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadOnboarding() {
      setLoading(true);
      setError("");
      let savedDraft = null;
      try {
        const rawDraft = localStorage.getItem(DRAFT_KEY);
        savedDraft = rawDraft ? JSON.parse(rawDraft) : null;
      } catch {
        savedDraft = null;
      }

      try {
        // Always revalidate the full profile here. The cached login payload can
        // contain an older/incomplete serviceId, which would leave step one
        // with no subservice options after a refresh.
        let merchantProfile = null;
        const cachedProfile = authService.getUser()?.merchantProfile || null;
        const response = await authService.getMerchantProfile();
        if (response?.status && response?.data) {
          merchantProfile = response.data;
        } else if (cachedProfile) {
          merchantProfile = cachedProfile;
        } else {
          throw new Error(response?.message || "Unable to load your merchant profile.");
        }
        if (cancelled) return;

        applyProfile(merchantProfile, savedDraft);
        const serviceId = getId(merchantProfile.serviceId)
          || getId(authService.getUser()?.serviceId)
          || localStorage.getItem("eventuna-signup-service-id")
          || "";
        const serviceName = typeof merchantProfile.serviceId === "object"
          ? merchantProfile.serviceId?.servicesName || localStorage.getItem("eventuna-signup-service-name") || ""
          : localStorage.getItem("eventuna-signup-service-name") || "";
        const restaurantService = serviceId === RESTAURANT_SERVICE_ID
          || serviceName.trim().toLowerCase() === "restaurants"
          || serviceName.trim().toLowerCase() === "restaurant";
        setSelectedServiceName(serviceName);
        setStarted(Boolean(savedDraft?.started));
        const savedStep = Math.min(Number(savedDraft?.step || 0), STEPS.length - 1);
        setStep(restaurantService ? savedStep : Math.max(1, savedStep));

        if (serviceId && restaurantService) {
          authService.saveAuthData({ serviceId });
          setLoadingSubServices(true);
          const subServiceResponse = await authService.getSubServices({ id: serviceId });
          if (!cancelled) {
            if (subServiceResponse?.status) {
              setSubServices(normalizeArrayResponse(subServiceResponse, ["services", "subServices"]));
            } else {
              setError(subServiceResponse?.message || "Unable to load restaurant types.");
            }
            setLoadingSubServices(false);
          }
        } else if (!serviceId && !cancelled) {
          setError("Your service information is missing. Please contact support.");
        }

        const couponsResponse = await authService.getMerchantCoupons();
        if (!cancelled && couponsResponse?.status) {
          const couponList = normalizeArrayResponse(couponsResponse, ["coupons", "allCoupons"]);
          if (couponList.length || !merchantProfile.allCoupons?.length) setCoupons(couponList);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || "Unable to load profile completion.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOnboarding();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (loading) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ started, step, form }));
  }, [form, loading, started, step]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setMessage("");
  };

  const updateLocationField = (field, value) => {
    setLocationForm((current) => ({ ...current, [field]: value }));
  };

  const updateScheduleField = (dayIndex, shift, field, value) => {
    setWeeklySchedule((current) => current.map((day, index) => (
      index === dayIndex
        ? { ...day, [shift]: { ...day[shift], [field]: value } }
        : day
    )));
  };

  const updateCouponField = (field, value) => {
    setCouponForm((current) => ({ ...current, [field]: value }));
  };

  const toggleSubService = (id) => {
    setForm((current) => ({
      ...current,
      serviceSubcategoryIds: current.serviceSubcategoryIds.includes(id)
        ? current.serviceSubcategoryIds.filter((selectedId) => selectedId !== id)
        : [...current.serviceSubcategoryIds, id],
    }));
  };

  const validateStep = () => {
    if (step === 0 && form.serviceSubcategoryIds.length === 0) return "Select at least one restaurant type.";
    if (step === 1 && (!form.serviceName.trim() || !form.serviceDescription.trim())) {
      return isRestaurantService ? "Enter the restaurant name and description." : "Enter the title and description.";
    }
    if (step === 2 && (!form.cuisineName.trim() || !form.phone.trim())) return "Cuisine and phone number are required.";
    if (step === 3) {
      if (!form.commercialPermitNumber.trim()) return "Commercial permit number is required.";
      if (!form.vatNumber.trim()) return "VAT number is required.";
      if (!files.businessRegistrationImage && !existingFiles.businessRegistrationImage) return "Upload the business registration document.";
      if (!files.vatRegistrationImage && !existingFiles.vatRegistrationImage) return "Upload the VAT registration document.";
      if (!files.otherImage && !existingFiles.otherImage) return "Upload the other supporting document.";
    }
    if (step === 4) {
      if (!files.bannerImage && !existingFiles.bannerImage) return "Upload a restaurant banner image.";
      if (!form.serviceSlogan.trim()) return "Enter a restaurant slogan.";
    }
    if (step === 5 && locations.length === 0) return "Add at least one restaurant location.";
    if (step === 6 && (!form.menuCategoryName.trim() || !form.menuCategoryDescription.trim())) return "Enter the menu category name and description.";
    return "";
  };

  const handleContinue = () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setMessage("Saved in your profile draft.");
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setError("");
    setMessage("");
    if (step === 0 || (!isRestaurantService && step === 1)) {
      setStarted(false);
      return;
    }
    setStep((current) => Math.max(0, current - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Location access is not supported by this browser.");
      return;
    }
    setActionLoading("geolocation");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationForm((current) => ({
          ...current,
          lat: String(position.coords.latitude),
          long: String(position.coords.longitude),
        }));
        setActionLoading("");
      },
      () => {
        setError("Unable to read your current location. Enter latitude and longitude manually.");
        setActionLoading("");
      }
    );
  };

  const handleAddLocation = async () => {
    setError("");
    setMessage("");
    if (!locationForm.addressName.trim() || !locationForm.address.trim()) {
      setError("Location name and full address are required.");
      return;
    }
    if (locationForm.lat === "" || locationForm.long === "") {
      setError("Latitude and longitude are required for the restaurant location.");
      return;
    }

    setActionLoading("location");
    const payload = {
      addressName: locationForm.addressName.trim(),
      address: locationForm.address.trim(),
      lat: Number(locationForm.lat),
      long: Number(locationForm.long),
    };
    const response = await authService.addMerchantLocation(payload);
    if (!response?.status) {
      setError(response?.message || "Unable to add the restaurant location.");
      setActionLoading("");
      return;
    }

    const profileResponse = await authService.getMerchantProfile();
    if (profileResponse?.status && profileResponse?.data) {
      setProfile(profileResponse.data);
      setLocations(profileResponse.data.serviceLocationIds || []);
    } else {
      const newLocation = response.data?.location || response.data || response.location;
      if (newLocation && typeof newLocation === "object") {
        setLocations((current) => [...current, newLocation]);
      }
    }
    setLocationForm(EMPTY_LOCATION);
    setMessage(response.message || "Location added successfully.");
    setActionLoading("");
  };

  const openLocationDetails = async (location) => {
    const locationId = getId(location);
    if (!locationId) return;
    setActionLoading(`open-location-${locationId}`);
    setError("");
    const response = await authService.getMerchantLocations({ locationId });
    if (!response?.status || !response?.data) {
      setError(response?.message || "Unable to load the selected location.");
      setActionLoading("");
      return;
    }
    const detail = response.data;
    const detailsCompleted = detail.capacity !== null && detail.capacity !== undefined
      || Boolean(String(detail.floorPlan || "").trim())
      || Boolean(String(detail.locationPhone || "").trim());
    const hoursCompleted = Array.isArray(detail.weeklySchedule) && detail.weeklySchedule.length > 0;
    setSelectedLocationId(locationId);
    setLocationForm({
      addressName: detail.addressName || "",
      address: detail.address || "",
      lat: detail.lat ?? "",
      long: detail.long ?? "",
      capacity: detail.capacity ?? "",
      floorPlan: detail.floorPlan || "",
      locationPhone: detail.locationPhone || "",
      openTwoShifts: Boolean(detail.openTwoShifts),
    });
    const scheduleByDay = new Map((detail.weeklySchedule || []).map((item) => [item.day, item]));
    setWeeklySchedule(createEmptySchedule().map((item) => ({ ...item, ...(scheduleByDay.get(item.day) || {}) })));
    setLocationSectionsCompleted({
      details: detailsCompleted,
      hours: hoursCompleted,
      photos: Array.isArray(detail.locationPhotoVideoList) && detail.locationPhotoVideoList.length > 0,
    });
    setLocationView("address");
    setActionLoading("");
  };

  const openNewLocation = () => {
    setSelectedLocationId("");
    setLocationForm(EMPTY_LOCATION);
    setWeeklySchedule(createEmptySchedule());
    setLocationSectionsCompleted({ details: false, hours: false, photos: false });
    setLocationView("address");
    setError("");
  };

  const saveLocationDetails = async () => {
    if (!selectedLocationId) {
      await handleAddLocation();
      setLocationView("list");
      return;
    }
    setActionLoading("location-details");
    setError("");
    const payload = {
      locationPhone: String(locationForm.locationPhone || ""),
      locationId: selectedLocationId,
      capacity: String(locationForm.capacity ?? ""),
      weeklySchedule: [],
      floorPlan: String(locationForm.floorPlan || ""),
    };
    const response = await authService.updateMerchantLocation(payload);
    if (!response?.status) {
      setError(response?.message || "Unable to update location details.");
    } else {
      setLocations((current) => current.map((location) => (
        getId(location) === selectedLocationId ? { ...location, ...locationForm } : location
      )));
      setMessage(response.message || "Location details updated successfully.");
      setLocationSectionsCompleted((current) => ({ ...current, details: true }));
      setLocationView("address");
    }
    setActionLoading("");
  };

  const saveOpeningHours = async () => {
    if (!selectedLocationId) {
      setError("Save this location before adding opening hours.");
      return;
    }
    setActionLoading("opening-hours");
    setError("");
    const response = await authService.updateMerchantLocation({
      locationId: selectedLocationId,
      weeklySchedule,
      openTwoShifts: Boolean(locationForm.openTwoShifts),
    });
    if (!response?.status) {
      setError(response?.message || "Unable to update opening hours.");
    } else {
      setMessage(response.message || "Opening hours updated successfully.");
      setLocationSectionsCompleted((current) => ({ ...current, hours: true }));
      setLocationView("address");
    }
    setActionLoading("");
  };

  const openCouponEditor = (coupon = null) => {
    setCouponForm(coupon ? {
      _id: coupon._id || "",
      couponName: coupon.couponName || "",
      discount: coupon.discount || "",
      validFrom: toDateInput(coupon.validFrom),
      validTo: toDateInput(coupon.validTo),
      description: coupon.description || "",
    } : EMPTY_COUPON);
    setShowCouponForm(true);
    setError("");
  };

  const refreshCoupons = async () => {
    const response = await authService.getMerchantCoupons();
    if (response?.status) {
      setCoupons(normalizeArrayResponse(response, ["coupons", "allCoupons"]));
    }
  };

  const handleSaveCoupon = async () => {
    setError("");
    if (!couponForm.couponName.trim() || couponForm.discount === "" || !couponForm.validFrom || !couponForm.validTo) {
      setError("Coupon name, discount, valid-from date, and valid-to date are required.");
      return;
    }
    const discount = Number(couponForm.discount);
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
      setError("Discount must be between 0 and 100.");
      return;
    }

    setActionLoading("coupon");
    const payload = {
      couponName: couponForm.couponName.trim(),
      discount: String(discount),
      validFrom: toApiDate(couponForm.validFrom),
      validTo: toApiDate(couponForm.validTo),
      description: couponForm.description.trim(),
    };
    const response = couponForm._id
      ? await authService.updateMerchantCoupon({ couponId: couponForm._id, ...payload })
      : await authService.addMerchantCoupon(payload);

    if (!response?.status) {
      setError(response?.message || "Unable to save the coupon.");
      setActionLoading("");
      return;
    }
    await refreshCoupons();
    setCouponForm(EMPTY_COUPON);
    setShowCouponForm(false);
    setMessage(response.message || "Coupon saved successfully.");
    setActionLoading("");
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm("Delete this coupon?")) return;
    setActionLoading(`delete-${couponId}`);
    setError("");
    const response = await authService.deleteMerchantCoupon({ couponId });
    if (!response?.status) {
      setError(response?.message || "Unable to delete the coupon.");
    } else {
      setCoupons((current) => current.filter((coupon) => coupon._id !== couponId));
      setMessage(response.message || "Coupon deleted successfully.");
    }
    setActionLoading("");
  };

  const buildSubmission = () => {
    const payload = new FormData();
    payload.append("serviceSubcategoryIds", form.serviceSubcategoryIds.join(","));
    payload.append("serviceName", form.serviceName.trim());
    payload.append("serviceDescription", form.serviceDescription.trim());
    payload.append("webUrl", form.webUrl.trim());
    payload.append("cuisineName", form.cuisineName.trim());
    payload.append("menuUrl", form.menuUrl.trim());
    payload.append("phone", form.phone.trim());
    payload.append("onlineReservation", String(form.onlineReservation));
    payload.append("commercialPermitNumber", form.commercialPermitNumber.trim());
    payload.append("vatNumber", form.vatNumber.trim());
    payload.append("serviceSlogan", form.serviceSlogan.trim());
    payload.append("serviceLocationIds", locations.map(getId).filter(Boolean).join(","));
    payload.append("couponIds", coupons.map(getId).filter(Boolean).join(","));
    Object.entries(files).forEach(([key, file]) => {
      if (file) payload.append(key, file);
    });
    return payload;
  };

  const handleSubmitApplication = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await authService.updateMerchantProfile(buildSubmission());
      if (!response?.status) {
        throw new Error(response?.message || "Unable to submit your merchant profile.");
      }

      const profileResponse = await authService.getMerchantProfile();
      if (!profileResponse?.status || !profileResponse?.data) {
        throw new Error(profileResponse?.message || "Profile saved, but status could not be refreshed.");
      }

      const newStatus = normalizeApplicationStatus(profileResponse.data.applicationStatus);
      const destination = getApplicationRoute(newStatus);
      if (newStatus === "pending" || newStatus === "approved") {
        localStorage.removeItem(DRAFT_KEY);
        router.replace(destination);
        return;
      }

      applyProfile(profileResponse.data, { form });
      setError(
        profileResponse.data.rejectionReason ||
        "Your information was saved, but the application is still incomplete. Review the required fields and submit again."
      );
    } catch (submitError) {
      setError(submitError.message || "Unable to submit your merchant profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingCard}>
        <div className="spinner-border text-primary" role="status" />
        <span>Loading your merchant profile...</span>
      </div>
    );
  }

  if (!started) {
    const rejected = normalizeApplicationStatus(profile?.applicationStatus) === "rejected";
    return (
      <section className={statusStyles.statusCard}>
        <h1 className={statusStyles.statusTitle}>{rejected ? "Application Needs Changes" : "Inactive Account"}</h1>
        <div className={`${statusStyles.statusArtwork} ${statusStyles.inactiveArtwork}`} aria-hidden="true">
          <span className={`${statusStyles.dot} ${statusStyles.dot1}`} />
          <span className={`${statusStyles.dot} ${statusStyles.dot2}`} />
          <span className={`${statusStyles.dot} ${statusStyles.dot3}`} />
          <span className={`${statusStyles.dot} ${statusStyles.dot4}`} />
          <span className={`${statusStyles.dot} ${statusStyles.dot5}`} />
          <span className={`${statusStyles.dot} ${statusStyles.dot6}`} />
          <div className={statusStyles.inactiveBadge} />
        </div>
        <p className={statusStyles.statusText}>
          {rejected
            ? profile?.rejectionReason || "Please update the requested information and send your application again."
            : "Your account is not active yet. Please complete your profile and send your request again to be added to the application."}
        </p>
        {error && <p className={`${statusStyles.statusMessage} ${statusStyles.statusError}`}>{error}</p>}
        <button
          type="button"
          className={statusStyles.statusAction}
          onClick={() => { setStarted(true); setError(""); }}
        >
          {rejected ? "UPDATE PROFILE" : "CLICK TO COMPLETE PROFILE"}
        </button>
      </section>
    );
  }

  const currentStep = STEPS[step];
  const visibleStepIndex = Math.max(0, visibleSteps.findIndex((item) => item.id === currentStep.id));
  const detailsTitle = isRestaurantService
    ? currentStep.label
    : step === 1
      ? `Enter Detail ${selectedServiceName || "Service"}`
      : currentStep.label;
  const locationTitle = locationView === "list"
    ? `Add ${isRestaurantService ? "Restaurants" : selectedServiceName || "Service"} Locations`
    : locationView === "details"
      ? "Additional info"
      : locationView === "hours"
        ? "Add open Hours for this location"
        : "Type the address, or select it on the map";
  const contentTitle = step === 4 ? "Add banner and slogan" : step === 5 ? locationTitle : detailsTitle;

  return (
    <section className={styles.wizardCard}>
      <aside className={styles.stepSidebar}>
        <div className={styles.sidebarHeading}>
          <span className={styles.sidebarEyebrow}>Merchant onboarding</span>
          <h1>Complete your profile</h1>
          <p>Step {visibleStepIndex + 1} of {visibleSteps.length}</p>
        </div>
        <ol className={styles.stepList}>
          {visibleSteps.map((item, index) => (
            <li
              key={item.id}
              className={`${styles.stepItem} ${index === visibleStepIndex ? styles.stepActive : ""} ${index < visibleStepIndex ? styles.stepDone : ""}`}
            >
              <span className={styles.stepIcon}>
                <i className={`fa-solid ${index < visibleStepIndex ? "fa-check" : item.icon}`} />
              </span>
              <span>{!isRestaurantService && item.id === "details" ? `${selectedServiceName || "Service"} Details` : item.label}</span>
            </li>
          ))}
        </ol>
      </aside>

      <div className={styles.stepContent}>
        <div className={styles.mobileProgress}>
          <span>Step {visibleStepIndex + 1} of {visibleSteps.length}</span>
          <div><span style={{ width: `${((visibleStepIndex + 1) / visibleSteps.length) * 100}%` }} /></div>
        </div>

        <header className={styles.contentHeader}>
          <button type="button" className={styles.backIcon} onClick={handleBack} aria-label="Go back">
            <i className="fa-solid fa-arrow-left" />
          </button>
          <div>
            <span className={styles.contentEyebrow}>Profile completion</span>
            <h2>{contentTitle}</h2>
          </div>
        </header>

        {error && <div className={styles.errorAlert}><i className="fa-solid fa-circle-exclamation" /> {error}</div>}
        {message && !error && <div className={styles.successAlert}><i className="fa-solid fa-circle-check" /> {message}</div>}

        <div className={styles.stepBody}>
          {step === 0 && (
            <div>
              <p className={styles.helperText}>Select every restaurant type your business provides.</p>
               {loadingSubServices && <p className={styles.emptyState}>Loading restaurant types...</p>}
               {!loadingSubServices && <div className={styles.optionGrid}>
                {subServices.map((service) => {
                  const selected = form.serviceSubcategoryIds.includes(service._id);
                  return (
                    <button
                      type="button"
                      key={service._id}
                      className={`${styles.typeOption} ${selected ? styles.typeSelected : ""}`}
                      onClick={() => toggleSubService(service._id)}
                    >
                      <span>{service.subServicesName}</span>
                      <i className={`fa-solid ${selected ? "fa-square-check" : "fa-square"}`} />
                    </button>
                  );
                })}
              </div>}
              {!loadingSubServices && !subServices.length && !error && <p className={styles.emptyState}>No restaurant types are available for this service.</p>}
            </div>
          )}

          {step === 1 && (
            <div className={styles.formStack}>
              <label className={styles.fieldLabel}>
                {isRestaurantService ? "Restaurant name" : "Title"}
                <input className={styles.input} value={form.serviceName} onChange={(event) => updateField("serviceName", event.target.value)} placeholder={isRestaurantService ? "Enter restaurant name" : "A Title"} />
              </label>
              <label className={styles.fieldLabel}>
                Description
                <textarea className={styles.textarea} value={form.serviceDescription} onChange={(event) => updateField("serviceDescription", event.target.value)} placeholder={isRestaurantService ? "Tell customers about your restaurant" : "Enter Description"} />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className={styles.formGrid}>
              <label className={styles.fieldLabel}>Website<input className={styles.input} type="url" value={form.webUrl} onChange={(event) => updateField("webUrl", event.target.value)} placeholder="https://example.com" /></label>
              <label className={styles.fieldLabel}>Cuisine<input className={styles.input} value={form.cuisineName} onChange={(event) => updateField("cuisineName", event.target.value)} placeholder="e.g. Mediterranean" /></label>
              <label className={styles.fieldLabel}>Menu URL<input className={styles.input} type="url" value={form.menuUrl} onChange={(event) => updateField("menuUrl", event.target.value)} placeholder="https://example.com/menu" /></label>
              <label className={styles.fieldLabel}>Business phone<input className={styles.input} type="tel" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="Enter phone number" /></label>
              <label className={styles.switchRow}>
                <span><strong>Accept online reservations</strong><small>Allow customers to send reservation requests.</small></span>
                <input type="checkbox" checked={form.onlineReservation} onChange={(event) => updateField("onlineReservation", event.target.checked)} />
                <span className={styles.switchControl} />
              </label>
            </div>
          )}

          {step === 3 && (
            <div className={styles.formStack}>
              <div className={styles.uploadGrid}>
                <UploadField label="Business Registration" name="businessRegistrationImage" file={files.businessRegistrationImage} existingUrl={existingFiles.businessRegistrationImage} onChange={(name, file) => setFiles((current) => ({ ...current, [name]: file }))} />
                <UploadField label="VAT Registration" name="vatRegistrationImage" file={files.vatRegistrationImage} existingUrl={existingFiles.vatRegistrationImage} onChange={(name, file) => setFiles((current) => ({ ...current, [name]: file }))} />
                <UploadField label="Other Supporting Document" name="otherImage" file={files.otherImage} existingUrl={existingFiles.otherImage} onChange={(name, file) => setFiles((current) => ({ ...current, [name]: file }))} />
              </div>
              <div className={styles.formGrid}>
                <label className={styles.fieldLabel}>Commercial permit number<input className={styles.input} value={form.commercialPermitNumber} onChange={(event) => updateField("commercialPermitNumber", event.target.value)} placeholder="Enter permit number" /></label>
                <label className={styles.fieldLabel}>VAT number<input className={styles.input} value={form.vatNumber} onChange={(event) => updateField("vatNumber", event.target.value)} placeholder="Enter VAT number" /></label>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className={styles.formStack}>
              <BannerUploadField
                file={files.bannerImage}
                existingUrl={existingFiles.bannerImage}
                onChange={(file) => setFiles((current) => ({ ...current, bannerImage: file }))}
              />
              <label className={styles.fieldLabel}>Add Slogan<input className={styles.input} value={form.serviceSlogan} onChange={(event) => updateField("serviceSlogan", event.target.value)} placeholder="Enter slogan" /></label>
            </div>
          )}

          {step === 5 && (
            <div>
              {locationView === "list" && (
                <>
                  <div className={styles.cardList}>
                    {locations.map((location, index) => (
                      <button
                        type="button"
                        className={`${styles.listCard} ${styles.locationCardButton}`}
                        key={location._id || `${location.addressName}-${index}`}
                        onClick={() => openLocationDetails(location)}
                        disabled={actionLoading === `open-location-${getId(location)}`}
                      >
                        <span className={styles.listIcon}><i className="fa-solid fa-location-dot" /></span>
                        <div><strong>{location.addressName || `Location ${index + 1}`}</strong><p>{location.address || "Address not provided"}</p></div>
                        <i className="fa-solid fa-chevron-right" />
                      </button>
                    ))}
                    {!locations.length && <p className={styles.emptyState}>No locations added yet.</p>}
                  </div>
                  <div className={styles.locationAddRow}>
                    <button type="button" className={styles.floatingAddButton} onClick={openNewLocation} aria-label="Add location"><i className="fa-solid fa-plus" /></button>
                  </div>
                </>
              )}

              {locationView === "address" && (
                <div className={styles.formStack}>
                  <div className={styles.formGrid}>
                    <label className={styles.fieldLabel}>Location name<input className={styles.input} value={locationForm.addressName} onChange={(event) => updateLocationField("addressName", event.target.value)} placeholder="e.g. Downtown branch" /></label>
                  </div>
                  <LocationMapPicker
                    address={locationForm.address}
                    lat={locationForm.lat}
                    lng={locationForm.long}
                    onSelect={(selection) => setLocationForm((current) => ({ ...current, ...selection }))}
                  />
                  <button type="button" className={styles.secondaryButton} onClick={useCurrentLocation} disabled={actionLoading === "geolocation"}><i className="fa-solid fa-location-crosshairs" /> Use current location</button>
                  <button type="button" className={`${styles.locationMenuButton} ${locationSectionsCompleted.details ? styles.locationMenuCompleted : ""}`} onClick={() => setLocationView("details")}>Add more details for this location <i className={`fa-solid ${locationSectionsCompleted.details ? "fa-check" : "fa-chevron-right"}`} /></button>
                  <button type="button" className={`${styles.locationMenuButton} ${locationSectionsCompleted.hours ? styles.locationMenuCompleted : ""}`} onClick={() => setLocationView("hours")}>Add open hours for this location <i className={`fa-solid ${locationSectionsCompleted.hours ? "fa-check" : "fa-chevron-right"}`} /></button>
                  <button
                    type="button"
                    className={`${styles.locationMenuButton} ${locationSectionsCompleted.photos ? styles.locationMenuCompleted : ""}`}
                    onClick={() => setError("Photo upload will be available when the location media API is connected.")}
                  >
                    Add photos for this location <i className={`fa-solid ${locationSectionsCompleted.photos ? "fa-check" : "fa-chevron-right"}`} />
                  </button>
                  <div className={styles.editorActions}>
                    <button type="button" className={styles.secondaryButton} onClick={() => setLocationView("list")}>Cancel</button>
                    {!selectedLocationId && <button type="button" className={styles.primaryButton} onClick={saveLocationDetails} disabled={actionLoading === "location"}>{actionLoading === "location" ? "Saving..." : "Save location"}</button>}
                    {selectedLocationId && <button type="button" className={styles.primaryButton} onClick={() => setLocationView("list")}>Save</button>}
                  </div>
                </div>
              )}

              {locationView === "details" && (
                <div className={styles.formStack}>
                  <label className={styles.fieldLabel}>Capacity<input className={styles.input} type="number" min="0" value={locationForm.capacity} onChange={(event) => updateLocationField("capacity", event.target.value)} placeholder="200" /></label>
                  <label className={styles.fieldLabel}>Floorplan<input className={styles.input} value={locationForm.floorPlan} onChange={(event) => updateLocationField("floorPlan", event.target.value)} placeholder="Link to floorplan" /></label>
                  <label className={styles.fieldLabel}>Phone<input className={styles.input} value={locationForm.locationPhone} onChange={(event) => updateLocationField("locationPhone", event.target.value)} placeholder="884763546" /></label>
                  <div className={styles.editorActions}>
                    <button type="button" className={styles.secondaryButton} onClick={() => setLocationView("address")}>Back</button>
                    <button type="button" className={styles.primaryButton} onClick={saveLocationDetails} disabled={actionLoading === "location-details"}>{actionLoading === "location-details" ? "Saving..." : "Save"}</button>
                  </div>
                </div>
              )}

              {locationView === "hours" && (
                <div className={styles.formStack}>
                  <label className={styles.switchRow}>
                    <span><strong>Open two shifts</strong><small>Configure morning and evening hours.</small></span>
                    <input type="checkbox" checked={locationForm.openTwoShifts} onChange={(event) => updateLocationField("openTwoShifts", event.target.checked)} />
                    <span className={styles.switchControl} />
                  </label>
                  <div className={styles.scheduleTable}>
                    {weeklySchedule.map((schedule, index) => (
                      <div className={styles.scheduleRow} key={schedule.day}>
                        <strong>{schedule.day}</strong>
                        <label>Morning from<input type="time" value={schedule.morning.from} onChange={(event) => updateScheduleField(index, "morning", "from", event.target.value)} /></label>
                        <label>Morning to<input type="time" value={schedule.morning.to} onChange={(event) => updateScheduleField(index, "morning", "to", event.target.value)} /></label>
                        <label>Evening from<input type="time" value={schedule.evening.from} onChange={(event) => updateScheduleField(index, "evening", "from", event.target.value)} /></label>
                        <label>Evening to<input type="time" value={schedule.evening.to} onChange={(event) => updateScheduleField(index, "evening", "to", event.target.value)} /></label>
                      </div>
                    ))}
                  </div>
                  <div className={styles.editorActions}>
                    <button type="button" className={styles.secondaryButton} onClick={() => setLocationView("address")}>Cancel</button>
                    <button type="button" className={styles.primaryButton} onClick={saveOpeningHours} disabled={actionLoading === "opening-hours"}>{actionLoading === "opening-hours" ? "Saving..." : "Submit"}</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 6 && (
            <div className={styles.formStack}>
              <p className={styles.helperText}>Add the main menu category customers should see for this restaurant.</p>
              <label className={styles.fieldLabel}>Category name<input className={styles.input} value={form.menuCategoryName} onChange={(event) => updateField("menuCategoryName", event.target.value)} placeholder="Enter category name" /></label>
              <label className={styles.fieldLabel}>Description<textarea className={styles.smallTextarea} value={form.menuCategoryDescription} onChange={(event) => updateField("menuCategoryDescription", event.target.value)} placeholder="Enter category description" /></label>
            </div>
          )}

          {step === 7 && (
            <div>
              <div className={styles.sectionToolbar}>
                <p className={styles.helperText}>Create optional launch offers for your customers.</p>
                {!showCouponForm && <button type="button" className={styles.addButton} onClick={() => openCouponEditor()}><i className="fa-solid fa-plus" /> Add coupon</button>}
              </div>
              {showCouponForm ? (
                <div className={styles.inlineEditor}>
                  <h3>{couponForm._id ? "Edit Coupon" : "Add Coupon"}</h3>
                  <div className={styles.formGrid}>
                    <label className={styles.fieldLabel}>Name<input className={styles.input} value={couponForm.couponName} onChange={(event) => updateCouponField("couponName", event.target.value)} placeholder="Coupon name" /></label>
                    <label className={styles.fieldLabel}>Discount %<input className={styles.input} type="number" min="0" max="100" value={couponForm.discount} onChange={(event) => updateCouponField("discount", event.target.value)} placeholder="Discount percentage" /></label>
                    <label className={styles.fieldLabel}>Valid from<input className={styles.input} type="date" value={couponForm.validFrom} onChange={(event) => updateCouponField("validFrom", event.target.value)} /></label>
                    <label className={styles.fieldLabel}>Valid to<input className={styles.input} type="date" value={couponForm.validTo} onChange={(event) => updateCouponField("validTo", event.target.value)} /></label>
                    <label className={`${styles.fieldLabel} ${styles.fullWidth}`}>Description<textarea className={styles.smallTextarea} value={couponForm.description} onChange={(event) => updateCouponField("description", event.target.value)} placeholder="Coupon description" /></label>
                  </div>
                  <div className={styles.editorActions}>
                    <button type="button" className={styles.secondaryButton} onClick={() => { setShowCouponForm(false); setCouponForm(EMPTY_COUPON); }}>Cancel</button>
                    <button type="button" className={styles.primaryButton} onClick={handleSaveCoupon} disabled={actionLoading === "coupon"}>{actionLoading === "coupon" ? "Saving..." : "Save coupon"}</button>
                  </div>
                </div>
              ) : (
                <div className={styles.cardList}>
                  {coupons.map((coupon) => (
                    <article className={styles.listCard} key={coupon._id}>
                      <span className={styles.listIcon}><i className="fa-solid fa-ticket" /></span>
                      <div><strong>{coupon.couponName}</strong><p>{coupon.discount}% discount · {coupon.validFrom} to {coupon.validTo}</p>{coupon.description && <small>{coupon.description}</small>}</div>
                      <div className={styles.rowActions}>
                        <button type="button" onClick={() => openCouponEditor(coupon)} aria-label="Edit coupon"><i className="fa-solid fa-pen-to-square" /></button>
                        <button type="button" onClick={() => handleDeleteCoupon(coupon._id)} disabled={actionLoading === `delete-${coupon._id}`} aria-label="Delete coupon"><i className="fa-solid fa-trash" /></button>
                      </div>
                    </article>
                  ))}
                  {!coupons.length && <p className={styles.emptyState}>No coupons added. Coupons are optional.</p>}
                </div>
              )}
            </div>
          )}

          {step === 8 && (
            <div>
              <p className={styles.helperText}>Review your restaurant profile before sending it for approval.</p>
              <div className={styles.reviewGrid}>
                <div className={styles.reviewItem}><span>Restaurant types</span><strong>{selectedTypeNames.join(", ") || "Not selected"}</strong></div>
                <div className={styles.reviewItem}><span>Name</span><strong>{form.serviceName || "Not entered"}</strong></div>
                <div className={`${styles.reviewItem} ${styles.reviewWide}`}><span>Description</span><strong>{form.serviceDescription || "Not entered"}</strong></div>
                <div className={styles.reviewItem}><span>Cuisine</span><strong>{form.cuisineName || "Not entered"}</strong></div>
                <div className={styles.reviewItem}><span>Slogan</span><strong>{form.serviceSlogan || "Not entered"}</strong></div>
                <div className={styles.reviewItem}><span>Locations</span><strong>{locations.length}</strong></div>
                <div className={styles.reviewItem}><span>Coupons</span><strong>{coupons.length}</strong></div>
              </div>
              <div className={styles.reviewNotice}><i className="fa-solid fa-circle-info" /><span>Submitting sends your application to Eventuna for review. You can check its status from the next screen.</span></div>
            </div>
          )}
        </div>

        <footer className={styles.navigation}>
          <button type="button" className={styles.secondaryButton} onClick={handleBack}>Back</button>
          {step < STEPS.length - 1 ? (
            <button type="button" className={styles.primaryButton} onClick={handleContinue} disabled={step === 7 && showCouponForm}>Save & Continue <i className="fa-solid fa-arrow-right" /></button>
          ) : (
            <button type="button" className={styles.primaryButton} onClick={handleSubmitApplication} disabled={saving}>{saving ? <><i className="fa-solid fa-spinner fa-spin" /> Submitting...</> : <>Submit for Review <i className="fa-solid fa-paper-plane" /></>}</button>
          )}
        </footer>
      </div>
    </section>
  );
}
