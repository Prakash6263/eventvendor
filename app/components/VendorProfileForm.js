"use client";

import { useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import Swal from "sweetalert2";
import LocationMapPicker from "./LocationMapPicker";
import styles from "./MerchantProfileWizard.module.css";

// ── Helpers ────────────────────────────────────────────────────────────────────
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

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const createEmptySchedule = () => DAYS.map((day) => ({
  day,
  morning: { from: "08:00", to: "12:00" },
  evening: { from: "16:00", to: "22:00" },
}));

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

const EMPTY_CATEGORY = { name: "", description: "" };
const EMPTY_COUPON = { _id: "", couponName: "", discount: "", validFrom: "", validTo: "", description: "" };

// ── Upload Components ──────────────────────────────────────────────────────────
function UploadField({ label, name, file, existingUrl, accept = "image/*", onChange }) {
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : existingUrl || ""),
    [file, existingUrl]
  );
  useEffect(() => {
    return () => { if (file && previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [file, previewUrl]);

  return (
    <label className={styles.uploadCard}>
      <input
        className={styles.hiddenInput}
        type="file"
        accept={accept}
        onChange={(e) => onChange(name, e.target.files?.[0] || null)}
      />
      <span className={styles.uploadLabel}>{label}</span>
      {previewUrl ? (
        <img 
          src={previewUrl} 
          alt={`${label} preview`} 
          style={{ width: "100%", height: "64px", objectFit: "contain", margin: "10px 0", borderRadius: "8px" }} 
        />
      ) : (
        <span className={styles.uploadIcon}>
          <i className="fa-solid fa-arrow-up-from-bracket" />
        </span>
      )}
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
    return () => { if (file && previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [file, previewUrl]);

  return (
    <label className={`${styles.uploadCard} ${styles.bannerUploadCard}`}>
      <input
        className={styles.hiddenInput}
        type="file"
        accept="image/*"
        onChange={(e) => onChange(event.target.files?.[0] || null)}
      />
      <span className={styles.uploadLabel}>Upload Banner Image</span>
      {previewUrl ? (
        <img className={styles.bannerUploadPreview} src={previewUrl} alt="Banner preview" />
      ) : (
        <span className={styles.uploadIcon}><i className="fa-solid fa-image" /></span>
      )}
      <span className={styles.uploadHint}>
        {file?.name || (existingUrl ? "Click to replace image" : "Click to choose an image")}
      </span>
    </label>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function VendorProfileForm({ profile, onUpdate }) {
  const [activeStep, setActiveStep] = useState(0);

  // Core Form State
  const [form, setForm] = useState({
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
    companyLegalName: "",
    registrationNumber: "",
    registeredAddress: "",
    countryOfIncorporation: "",
    taxIdentificationNumber: "",
    accountsPayableContact: "",
    billingStreetAddress: "",
    billingCity: "",
    billingStateProvince: "",
    billingCountry: "",
    paymentMethod: "Bank",
    bankName: "",
    accountNumber: "",
    routingIfscNumber: "",
    cardNumber: "",
    cardExpiryDate: "",
    nameOnCard: "",
    primaryAccountOwner: "",
    technicalContact: "",
    signatory: "",
    agreedToTerms: false,
    dataProcessingAgreementAccepted: false,
  });

  const [files, setFiles] = useState({
    businessRegistrationImage: null,
    vatRegistrationImage: null,
    otherImage: null,
    bannerImage: null,
    taxExemptionCertificate: null,
  });

  const [existingFiles, setExistingFiles] = useState({
    businessRegistrationImage: "",
    vatRegistrationImage: "",
    otherImage: "",
    bannerImage: "",
    taxExemptionCertificate: "",
  });

  // Locations State
  const [locations, setLocations] = useState([]);
  const [locationForm, setLocationForm] = useState(EMPTY_LOCATION);
  const [locationView, setLocationView] = useState("list"); // "list", "address", "details", "hours", "photos"
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [locationSectionsCompleted, setLocationSectionsCompleted] = useState({
    details: false,
    hours: false,
    photos: false,
  });
  const [weeklySchedule, setWeeklySchedule] = useState(createEmptySchedule());
  const [locationMedia, setLocationMedia] = useState([]);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaThumbnail, setMediaThumbnail] = useState(null);
  const [mediaDescription, setMediaDescription] = useState("");

  // Categories State
  const [categories, setCategories] = useState([]);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // Coupons State
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState(EMPTY_COUPON);
  const [showCouponForm, setShowCouponForm] = useState(false);

  const [subServices, setSubServices] = useState([]);
  const [loadingSubServices, setLoadingSubServices] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const serviceId = useMemo(() => getId(profile?.serviceId), [profile]);
  const serviceName = useMemo(() => {
    if (typeof profile?.serviceId === "object") {
      return profile.serviceId?.servicesName || "Service";
    }
    return "Service";
  }, [profile]);

  const isRestaurant = useMemo(() => {
    const n = serviceName.trim().toLowerCase();
    return n === "restaurants" || n === "restaurant";
  }, [serviceName]);

  const steps = useMemo(() => {
    const list = [];
    if (isRestaurant) {
      list.push({ key: "preferences", label: `${serviceName} Type`, icon: "fa-solid fa-list-check" });
    }
    list.push(
      { key: "details", label: `${serviceName} Details`, icon: "fa-solid fa-circle-info" },
      { key: "primary-info", label: "Primary Info", icon: "fa-solid fa-address-card" },
      { key: "legal-billing", label: "Legal & Billing", icon: "fa-solid fa-file-invoice-dollar" },
      { key: "documents", label: "Documents", icon: "fa-solid fa-file-shield" },
      { key: "locations", label: "Locations", icon: "fa-solid fa-location-dot" },
      { key: "categories", label: "Categories", icon: "fa-solid fa-list" },
      { key: "coupons", label: "Coupons", icon: "fa-solid fa-ticket" },
      { key: "banner-slogan", label: "Banner & Slogan", icon: "fa-solid fa-images" },
      { key: "review", label: "Review & Submit", icon: "fa-solid fa-clipboard-check" }
    );
    return list;
  }, [serviceName, isRestaurant]);

  const currentStepKey = useMemo(() => steps[activeStep]?.key, [steps, activeStep]);

  const selectedTypeNames = useMemo(() => {
    return subServices
      .filter((service) => form.serviceSubcategoryIds.includes(getId(service)))
      .map((service) => service.subServicesName);
  }, [form.serviceSubcategoryIds, subServices]);

  // ── Pre-fill core profile data ──────────────────────────────────────────────
  useEffect(() => {
    if (!profile) return;
    setForm({
      serviceSubcategoryIds: Array.isArray(profile.serviceSubcategoryIds)
        ? profile.serviceSubcategoryIds.map(getId)
        : [],
      serviceName: profile.serviceName || "",
      serviceDescription: profile.serviceDescription || "",
      webUrl: profile.webUrl || "",
      cuisineName: profile.cuisineName || "",
      menuUrl: profile.menuUrl || "",
      phone: profile.phone || "",
      onlineReservation: Boolean(profile.onlineReservation),
      commercialPermitNumber: profile.commercialPermitNumber || "",
      vatNumber: profile.vatNumber || "",
      serviceSlogan: profile.serviceSlogan || "",
      companyLegalName: profile.companyLegalName || "",
      registrationNumber: profile.registrationNumber || "",
      registeredAddress: profile.registeredAddress || "",
      countryOfIncorporation: profile.countryOfIncorporation || "",
      taxIdentificationNumber: profile.taxIdentificationNumber || "",
      accountsPayableContact: profile.accountsPayableContact || "",
      billingStreetAddress: profile.billingStreetAddress || "",
      billingCity: profile.billingCity || "",
      billingStateProvince: profile.billingStateProvince || "",
      billingCountry: profile.billingCountry || "",
      paymentMethod: profile.paymentMethod || "Bank",
      bankName: profile.bankName || "",
      accountNumber: profile.accountNumber || "",
      routingIfscNumber: profile.routingIfscNumber || "",
      cardNumber: profile.cardNumber || "",
      cardExpiryDate: profile.cardExpiryDate || "",
      nameOnCard: profile.nameOnCard || "",
      primaryAccountOwner: profile.primaryAccountOwner || "",
      technicalContact: profile.technicalContact || "",
      signatory: profile.signatory || "",
      agreedToTerms: Boolean(profile.agreedToTerms),
    });
    setExistingFiles({
      businessRegistrationImage: profile.businessRegistrationImage || "",
      vatRegistrationImage: profile.vatRegistrationImage || "",
      otherImage: profile.otherImage || "",
      bannerImage: profile.bannerImage || "",
      taxExemptionCertificate: profile.taxExemptionCertificate || "",
    });
    setLocations(Array.isArray(profile.serviceLocationIds) ? profile.serviceLocationIds : []);
  }, [profile]);

  // ── Load Sub-Services for Restaurant accounts ──────────────────────────────
  useEffect(() => {
    if (!serviceId || !isRestaurant) return;
    let cancelled = false;
    setLoadingSubServices(true);
    authService.getSubServices({ id: serviceId })
      .then((res) => {
        if (!cancelled && res?.status) {
          setSubServices(normalizeArrayResponse(res, ["services", "subServices"]));
        }
      })
      .catch((err) => console.error("Failed to load sub services:", err))
      .finally(() => { if (!cancelled) setLoadingSubServices(false); });
    return () => { cancelled = true; };
  }, [serviceId, isRestaurant]);

  // ── Load Categories and Coupons on mount ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadExtraData() {
      try {
        const couponsResponse = await authService.getMerchantCoupons();
        if (!cancelled && couponsResponse?.status) {
          setCoupons(normalizeArrayResponse(couponsResponse, ["coupons", "allCoupons"]));
        }
        const categoriesResponse = await authService.getProductCategories();
        if (!cancelled && categoriesResponse?.status) {
          setCategories(normalizeArrayResponse(categoriesResponse, ["categories"]));
        }
      } catch (err) {
        console.error("Failed to load category/coupon extra data:", err);
      }
    }
    loadExtraData();
    return () => { cancelled = true; };
  }, []);

  // ── Sub-service toggle ─────────────────────────────────────────────────────
  const toggleSubService = (id) => {
    setForm((c) => ({
      ...c,
      serviceSubcategoryIds: c.serviceSubcategoryIds.includes(id)
        ? c.serviceSubcategoryIds.filter((i) => i !== id)
        : [...c.serviceSubcategoryIds, id],
    }));
  };

  // ── Build FormData payload ─────────────────────────────────────────────────
  const buildFormData = () => {
    const fd = new FormData();
    fd.append("serviceName", form.serviceName.trim());
    fd.append("serviceDescription", form.serviceDescription.trim());
    fd.append("webUrl", form.webUrl.trim());
    fd.append("cuisineName", form.cuisineName.trim());
    fd.append("menuUrl", form.menuUrl.trim());
    fd.append("phone", form.phone.trim());
    fd.append("onlineReservation", String(form.onlineReservation));
    fd.append("commercialPermitNumber", form.commercialPermitNumber.trim());
    fd.append("vatNumber", form.vatNumber.trim());
    fd.append("serviceSlogan", form.serviceSlogan.trim());

    // New Fields
    fd.append("companyLegalName", (form.companyLegalName || "").trim());
    fd.append("registrationNumber", (form.registrationNumber || "").trim());
    fd.append("registeredAddress", (form.registeredAddress || "").trim());
    fd.append("countryOfIncorporation", (form.countryOfIncorporation || "").trim());
    fd.append("taxIdentificationNumber", (form.taxIdentificationNumber || "").trim());
    // New Billing & Payment
    const method = form.paymentMethod || "Bank";
    fd.append("accountsPayableContact", (form.accountsPayableContact || "").trim());
    fd.append("billingStreetAddress", (form.billingStreetAddress || "").trim());
    fd.append("billingCity", (form.billingCity || "").trim());
    fd.append("billingStateProvince", (form.billingStateProvince || "").trim());
    fd.append("billingCountry", (form.billingCountry || "").trim());
    fd.append("paymentMethod", method);
    if (method === "Credit Card") {
      fd.append("cardNumber", (form.cardNumber || "").trim());
      fd.append("cardExpiryDate", (form.cardExpiryDate || "").trim());
      fd.append("nameOnCard", (form.nameOnCard || "").trim());
    } else {
      fd.append("bankName", (form.bankName || "").trim());
      fd.append("accountNumber", (form.accountNumber || "").trim());
      fd.append("routingIfscNumber", (form.routingIfscNumber || "").trim());
    }
    fd.append("primaryAccountOwner", (form.primaryAccountOwner || "").trim());
    fd.append("technicalContact", (form.technicalContact || "").trim());
    fd.append("signatory", (form.signatory || "").trim());
    fd.append("agreedToTerms", String(Boolean(form.agreedToTerms)));
    fd.append("dataProcessingAgreementAccepted", String(Boolean(form.dataProcessingAgreementAccepted)));

    fd.append("serviceSubcategoryIds", form.serviceSubcategoryIds.join(","));

    const locationIds = locations.map(getId).filter(Boolean);
    fd.append("serviceLocationIds", locationIds.join(","));

    const couponIds = coupons.map(getId).filter(Boolean);
    fd.append("couponIds", couponIds.join(","));

    Object.entries(files).forEach(([key, file]) => {
      if (file) fd.append(key, file);
    });
    return fd;
  };

  const saveSection = async (sectionKey) => {
    setActionLoading(sectionKey);
    setError("");
    setMessage("");
    try {
      const formData = buildFormData();
      const [res1, res2] = await Promise.all([
        authService.updateProfile(formData),
        authService.updateMerchantProfile(formData),
      ]);
      const response = res1?.status ? res1 : res2;
      if (!response?.status) {
        setError(response?.message || "Failed to update. Please try again.");
        return false;
      }
      setMessage(response.message || "Saved successfully.");
      if (onUpdate) await onUpdate();
      return true;
    } catch {
      setError("An error occurred. Please try again.");
      return false;
    } finally {
      setActionLoading("");
    }
  };

  const handleNextStep = async (sectionKey) => {
    const ok = await saveSection(sectionKey);
    if (ok && activeStep < steps.length - 1) {
      setTimeout(() => {
        setActiveStep((p) => p + 1);
        setMessage("");
      }, 700);
    }
  };

  // ── Locations Step Handlers ────────────────────────────────────────────────
  const updateLocationField = (field, value) => {
    setLocationForm((c) => ({ ...c, [field]: value }));
  };

  const updateScheduleField = (dayIndex, shift, field, value) => {
    setWeeklySchedule((current) => current.map((day, index) => (
      index === dayIndex
        ? { ...day, [shift]: { ...day[shift], [field]: value } }
        : day
    )));
  };

  const openLocationDetails = async (location) => {
    const locId = getId(location);
    if (!locId) return;
    setActionLoading(`open-location-${locId}`);
    setError("");
    try {
      const response = await authService.getMerchantLocations({ locationId: locId });
      if (!response?.status || !response?.data) {
        setError(response?.message || "Unable to load location details.");
        return;
      }
      const detail = response.data;
      const detailsCompleted = detail.capacity !== null && detail.capacity !== undefined
        || Boolean(String(detail.floorPlan || "").trim())
        || Boolean(String(detail.locationPhone || "").trim());
      const hoursCompleted = Array.isArray(detail.weeklySchedule) && detail.weeklySchedule.length > 0;

      setSelectedLocationId(locId);
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

      const mediaResponse = await authService.getMerchantLocationMedia({ locationId: locId });
      setLocationMedia(mediaResponse?.status && Array.isArray(mediaResponse.data) ? mediaResponse.data : (detail.locationPhotoVideoList || []));
      setLocationView("address");
    } catch (err) {
      setError("Failed to load location details.");
    } finally {
      setActionLoading("");
    }
  };

  const openNewLocation = () => {
    setSelectedLocationId("");
    setLocationForm(EMPTY_LOCATION);
    setWeeklySchedule(createEmptySchedule());
    setLocationSectionsCompleted({ details: false, hours: false, photos: false });
    setLocationMedia([]);
    setMediaFile(null);
    setMediaThumbnail(null);
    setMediaDescription("");
    setLocationView("address");
    setError("");
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

  const findLocationInResponse = (response, expectedLocation = null) => {
    const arrays = [
      response?.data?.location,
      response?.data?.serviceLocation,
      response?.data?.serviceLocationId,
      response?.location,
      response?.serviceLocation,
      response?.serviceLocationId,
      response?.data?.locations,
      response?.data?.serviceLocationIds,
      response?.locations,
      response?.serviceLocationIds,
    ].filter(Array.isArray);

    for (const locs of arrays) {
      const match = expectedLocation
        ? [...locs].reverse().find((loc) => (
            loc?.addressName === expectedLocation.addressName
            && loc?.address === expectedLocation.address
          ))
        : locs.at(-1);
      if (match) return match;
    }

    const directId = response?.locationId
      || response?.data?.locationId
      || response?.serviceLocationId
      || response?.data?.serviceLocationId;
    if (directId) return { _id: directId };

    const firstObj = [
      response?.data?.location,
      response?.data?.serviceLocation,
      response?.location,
      response?.serviceLocation,
      response?.data,
    ].find((item) => item && typeof item === "object" && !Array.isArray(item));
    return firstObj || null;
  };

  const handleAddLocation = async () => {
    setError("");
    setMessage("");
    if (!locationForm.addressName.trim() || !locationForm.address.trim()) {
      setError("Location name and full address are required.");
      return null;
    }
    if (locationForm.lat === "" || locationForm.long === "") {
      setError("Latitude and longitude are required for the restaurant location.");
      return null;
    }

    setActionLoading("location");
    try {
      const payload = {
        addressName: locationForm.addressName.trim(),
        address: locationForm.address.trim(),
        lat: Number(locationForm.lat),
        long: Number(locationForm.long),
      };
      const response = await authService.addMerchantLocation(payload);
      if (!response?.status) {
        setError(response?.message || "Unable to add the restaurant location.");
        return null;
      }
      let newLocation = findLocationInResponse(response, payload);
      let newLocationId = getId(newLocation);

      if (!newLocationId) {
        for (let attempt = 0; attempt < 3 && !newLocationId; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 350));
          const profileResponse = await authService.getMerchantProfile();
          if (profileResponse?.status && profileResponse?.data) {
            newLocation = findLocationInResponse(profileResponse, payload);
            newLocationId = getId(newLocation);
          }
        }
      }

      const finalLocation = newLocation || {
        _id: newLocationId || String(Date.now()),
        ...payload,
      };

      setLocations((current) => {
        const id = getId(finalLocation);
        return id && current.some((loc) => getId(loc) === id) ? current : [...current, finalLocation];
      });
      return finalLocation;
    } catch {
      setError("An error occurred while adding the location.");
      return null;
    } finally {
      setActionLoading("");
    }
  };

  const saveLocationDetails = async () => {
    setError("");
    setMessage("");
    let locId = selectedLocationId;
    if (!locId) {
      const created = await handleAddLocation();
      locId = getId(created);
      if (!locId) return;
    }
    setActionLoading("location-details");
    try {
      const payload = {
        floorPlan: String(locationForm.floorPlan || ""),
        capacity: String(locationForm.capacity ?? ""),
        weeklySchedule: [],
        locationPhone: String(locationForm.locationPhone || ""),
        locationId: String(locId),
      };
      const response = await authService.updateMerchantLocation(payload);
      if (!response?.status) {
        setError(response?.message || "Unable to update location details.");
      } else {
        setLocations((current) => current.map((loc) => (
          getId(loc) === locId ? { ...loc, ...locationForm, _id: locId } : loc
        )));
        setMessage(response.message || "Location details updated successfully.");
        setLocationSectionsCompleted((current) => ({ ...current, details: true }));
        setSelectedLocationId(locId);
        setLocationView("address");
        if (onUpdate) await onUpdate();
      }
    } catch {
      setError("Failed to save location details.");
    } finally {
      setActionLoading("");
    }
  };

  const saveOpeningHours = async () => {
    if (!selectedLocationId) {
      setError("Save this location before adding opening hours.");
      return;
    }
    setActionLoading("opening-hours");
    setError("");
    try {
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
    } catch {
      setError("Failed to save hours.");
    } finally {
      setActionLoading("");
    }
  };

  const uploadLocationMedia = async () => {
    if (!selectedLocationId) {
      setError("Save this location before uploading media.");
      return;
    }
    if (!mediaFile) {
      setError("Select a photo or video to upload.");
      return;
    }
    setActionLoading("location-media");
    setError("");
    try {
      const payload = new FormData();
      payload.append("locationId", selectedLocationId);
      payload.append("media", mediaFile);
      payload.append("types", mediaFile.type.startsWith("video/") ? "video" : "photo");
      payload.append("photoDescription", mediaDescription.trim());
      if (mediaThumbnail) payload.append("thumbnails", mediaThumbnail);

      const response = await authService.addMerchantLocationMedia(payload);
      if (!response?.status) {
        setError(response?.message || "Unable to upload media.");
      } else {
        const uploaded = response.data?.locationPhotoVideoList || [];
        setLocationMedia(uploaded.length ? uploaded : (current) => [...current, response.data]);
        setLocationSectionsCompleted((current) => ({ ...current, photos: true }));
        setMediaFile(null);
        setMediaThumbnail(null);
        setMediaDescription("");
        setMessage(response.message || "Media uploaded successfully.");
        setLocationView("address");
      }
    } catch {
      setError("Media upload failed.");
    } finally {
      setActionLoading("");
    }
  };

  // ── Categories Step Handlers ──────────────────────────────────────────────
  const updateCategoryField = (field, value) => {
    setCategoryForm((c) => ({ ...c, [field]: value }));
  };

  const handleSaveCategory = async () => {
    const name = categoryForm.name.trim();
    const description = categoryForm.description.trim();
    if (!name || !description) {
      setError("Category name and description are required.");
      return;
    }
    setActionLoading("category");
    setError("");
    setMessage("");
    try {
      const response = await authService.addProductCategory({ name, description });
      if (!response?.status || !response?.data) {
        setError(response?.message || "Unable to create category.");
      } else {
        setCategories((current) => {
          const createdId = getId(response.data);
          return createdId && current.some((cat) => getId(cat) === createdId)
            ? current
            : [...current, response.data];
        });
        setCategoryForm(EMPTY_CATEGORY);
        setShowCategoryForm(false);
        setMessage(response.message || "Category created successfully.");
      }
    } catch {
      setError("Failed to save category.");
    } finally {
      setActionLoading("");
    }
  };

  // ── Coupons Step Handlers ─────────────────────────────────────────────────
  const updateCouponField = (field, value) => {
    setCouponForm((c) => ({ ...c, [field]: value }));
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
    setMessage("");
  };

  const handleSaveCoupon = async () => {
    setError("");
    if (!couponForm.couponName.trim() || couponForm.discount === "" || !couponForm.validFrom || !couponForm.validTo) {
      setError("Coupon name, discount, and validity dates are required.");
      return;
    }
    const discount = Number(couponForm.discount);
    if (!Number.isFinite(discount) || discount < 1 || discount > 99) {
      setError("Discount percentage must be between 1% and 99%.");
      return;
    }
    setActionLoading("coupon");
    try {
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
        setError(response?.message || "Unable to save coupon.");
      } else {
        const couponsResponse = await authService.getMerchantCoupons();
        if (couponsResponse?.status) {
          setCoupons(normalizeArrayResponse(couponsResponse, ["coupons", "allCoupons"]));
        }
        setCouponForm(EMPTY_COUPON);
        setShowCouponForm(false);
        setMessage(response.message || "Coupon saved successfully.");
      }
    } catch {
      setError("Failed to save coupon.");
    } finally {
      setActionLoading("");
    }
  };

  const handleDeleteCoupon = (couponId) => {
    Swal.fire({
      title: "Delete Coupon?",
      text: "Are you sure you want to delete this coupon? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    }).then(async (result) => {
      if (result.isConfirmed) {
        setActionLoading(`delete-${couponId}`);
        setError("");
        setMessage("");
        try {
          const response = await authService.deleteMerchantCoupon({ couponId });
          if (!response?.status) {
            setError(response?.message || "Unable to delete coupon.");
            Swal.fire({
              title: "Error!",
              text: response?.message || "Unable to delete coupon.",
              icon: "error",
              confirmButtonColor: "#5b6ef5"
            });
          } else {
            setCoupons((current) => current.filter((c) => c._id !== couponId));
            setMessage(response.message || "Coupon deleted successfully.");
            Swal.fire({
              title: "Deleted!",
              text: response.message || "Coupon deleted successfully.",
              icon: "success",
              confirmButtonColor: "#5b6ef5"
            });
          }
        } catch {
          setError("Failed to delete coupon.");
          Swal.fire({
            title: "Error!",
            text: "Failed to delete coupon.",
            icon: "error",
            confirmButtonColor: "#5b6ef5"
          });
        } finally {
          setActionLoading("");
        }
      }
    });
  };

  // ── Review & Submit Application Handler ────────────────────────────────────
  const handleSubmitApplication = async () => {
    setActionLoading("review");
    setError("");
    setMessage("");
    try {
      const formData = buildFormData();
      const [res1, res2] = await Promise.all([
        authService.updateProfile(formData),
        authService.updateMerchantProfile(formData),
      ]);
      const response = res1?.status ? res1 : res2;
      if (!response?.status) {
        setError(response?.message || "Unable to submit your profile.");
        return;
      }
      setMessage("Profile submitted for review successfully!");
      if (onUpdate) await onUpdate();

      // Enforce status path checking (pending/approved redirect)
      const profileResponse = await authService.getMerchantProfile();
      if (profileResponse?.status && profileResponse?.data) {
        const newStatus = profileResponse.data.applicationStatus;
        if (newStatus === "pending") {
          window.location.href = "/application-pending";
        } else if (newStatus === "approved") {
          window.location.href = "/";
        }
      }
    } catch {
      setError("Submission failed. Please try again.");
    } finally {
      setActionLoading("");
    }
  };

  const busy = actionLoading !== "";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="content-card mb-4">
      {/* ── Step tab pills ── */}
      <div className="d-flex overflow-auto no-scrollbar gap-2 mb-4 border-bottom pb-3">
        {steps.map((step, idx) => (
          <button
            key={step.key}
            type="button"
            onClick={() => { setError(""); setMessage(""); setActiveStep(idx); }}
            disabled={busy}
            className={[
              "btn btn-sm py-2 px-3 rounded-pill d-flex align-items-center gap-2 flex-shrink-0",
              activeStep === idx ? "btn-primary shadow-sm" : "btn-light text-muted border",
            ].join(" ")}
            style={{ fontSize: "13px", fontWeight: 600 }}
          >
            <i className={step.icon} />
            {step.label}
          </button>
        ))}
      </div>

      {/* ── Alert messages ── */}
      {error && (
        <div className="alert alert-danger rounded-3 mb-4">
          <i className="fa-solid fa-circle-exclamation me-2" />{error}
        </div>
      )}
      {message && (
        <div className="alert alert-success rounded-3 mb-4">
          <i className="fa-solid fa-circle-check me-2" />{message}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STEP: Restaurants Type
      ═══════════════════════════════════════════════════════════════ */}
      {currentStepKey === "preferences" && (
        <div>
          <div className="mb-4">
            <h5 className="fw-bold mb-1">{serviceName} Type</h5>
            <small className="text-muted">Select every type that applies to your business</small>
          </div>
          {loadingSubServices ? (
            <p className={styles.emptyState}>Loading types...</p>
          ) : (
            <>
              <div className={styles.optionGrid}>
                {subServices.map((svc) => {
                  const id = getId(svc);
                  const checked = form.serviceSubcategoryIds.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`${styles.typeOption} ${checked ? styles.typeSelected : ""}`}
                      onClick={() => toggleSubService(id)}
                      disabled={busy}
                    >
                      <span>{svc.subServicesName}</span>
                      <i className={`fa-solid ${checked ? "fa-square-check" : "fa-square"}`} />
                    </button>
                  );
                })}
                {!loadingSubServices && !subServices.length && (
                  <p className={styles.emptyState}>No types available for this service.</p>
                )}
              </div>
              <div className="mt-4 pt-3 border-top">
                <button
                  type="button"
                  className="btn btn-primary w-100"
                  onClick={() => handleNextStep("preferences")}
                  disabled={busy}
                >
                  {busy ? <><i className="fa-solid fa-spinner fa-spin me-2" />Saving...</> : "Update Preferences & Next"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STEP: Details
      ═══════════════════════════════════════════════════════════════ */}
      {currentStepKey === "details" && (
        <div>
          <div className="mb-4">
            <h5 className="fw-bold mb-1">{serviceName} Details</h5>
            <small className="text-muted">Edit business title and description</small>
          </div>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label fw-semibold small text-muted">Business Name / Title</label>
              <input
                type="text"
                className="form-control"
                value={form.serviceName}
                onChange={(e) => setForm((c) => ({ ...c, serviceName: e.target.value }))}
                placeholder="Business title"
                disabled={busy}
              />
            </div>
            <div className="col-12">
              <label className="form-label fw-semibold small text-muted">Description</label>
              <textarea
                className="form-control"
                rows={4}
                value={form.serviceDescription}
                onChange={(e) => setForm((c) => ({ ...c, serviceDescription: e.target.value }))}
                placeholder="Tell customers about your business..."
                disabled={busy}
              />
            </div>
          </div>
          <div className="mt-4 pt-3 border-top">
            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={() => handleNextStep("details")}
              disabled={busy}
            >
              {busy ? <><i className="fa-solid fa-spinner fa-spin me-2" />Saving...</> : "Save Details & Next"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STEP: Primary Info
      ═══════════════════════════════════════════════════════════════ */}
      {currentStepKey === "primary-info" && (
        <div>
          <div className="mb-4">
            <h5 className="fw-bold mb-1">Primary Information</h5>
            <small className="text-muted">Edit contact, website, and cuisine details</small>
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">Website URL</label>
              <input
                type="url"
                className="form-control"
                value={form.webUrl}
                onChange={(e) => setForm((c) => ({ ...c, webUrl: e.target.value }))}
                placeholder="https://example.com"
                disabled={busy}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">Cuisine</label>
              <input
                type="text"
                className="form-control"
                value={form.cuisineName}
                onChange={(e) => setForm((c) => ({ ...c, cuisineName: e.target.value }))}
                placeholder="e.g. Indian, Italian"
                disabled={busy}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">Menu URL</label>
              <input
                type="url"
                className="form-control"
                value={form.menuUrl}
                onChange={(e) => setForm((c) => ({ ...c, menuUrl: e.target.value }))}
                placeholder="https://example.com/menu"
                disabled={busy}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">Business Phone</label>
              <input
                type="tel"
                className="form-control"
                value={form.phone}
                onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
                placeholder="Phone number"
                disabled={busy}
              />
            </div>
            <div className="col-12">
              <div className="form-check form-switch p-3 border rounded-3 bg-light d-flex justify-content-between align-items-center">
                <label className="form-check-label fw-semibold text-dark mb-0">
                  Accept Online Reservations
                </label>
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  checked={form.onlineReservation}
                  onChange={(e) => setForm((c) => ({ ...c, onlineReservation: e.target.checked }))}
                  style={{ cursor: "pointer", width: 45, height: 24 }}
                  disabled={busy}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-top">
            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={() => handleNextStep("primary-info")}
              disabled={busy}
            >
              {busy ? <><i className="fa-solid fa-spinner fa-spin me-2" />Saving...</> : "Save Info & Next"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STEP: Legal & Billing
      ═══════════════════════════════════════════════════════════════ */}
      {currentStepKey === "legal-billing" && (
        <div>
          <div className="mb-4">
            <h5 className="fw-bold mb-1">Legal, Tax & Billing Details</h5>
            <small className="text-muted">Edit legal entity names, tax information, contacts, and billing info</small>
          </div>
          <div className="row g-3">
            <div className="col-12"><h6 className="fw-bold text-dark mb-0">Legal & Business Details</h6></div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">Company Legal Name</label>
              <input type="text" className="form-control" value={form.companyLegalName} onChange={(e) => setForm((c) => ({ ...c, companyLegalName: e.target.value }))} placeholder="EventUna Global LLC" disabled={busy} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">Registration Number</label>
              <input type="text" className="form-control" value={form.registrationNumber} onChange={(e) => setForm((c) => ({ ...c, registrationNumber: e.target.value }))} placeholder="CR-12345678" disabled={busy} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">Registered Address</label>
              <input type="text" className="form-control" value={form.registeredAddress} onChange={(e) => setForm((c) => ({ ...c, registeredAddress: e.target.value }))} placeholder="123 Main Street, Suite 500" disabled={busy} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">Country of Incorporation</label>
              <input type="text" className="form-control" value={form.countryOfIncorporation} onChange={(e) => setForm((c) => ({ ...c, countryOfIncorporation: e.target.value }))} placeholder="United Arab Emirates" disabled={busy} />
            </div>

            <div className="col-12 mt-4"><h6 className="fw-bold text-dark mb-0">Tax Information</h6></div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">Tax Identification Number</label>
              <input type="text" className="form-control" value={form.taxIdentificationNumber} onChange={(e) => setForm((c) => ({ ...c, taxIdentificationNumber: e.target.value }))} placeholder="TIN-9876543210" disabled={busy} />
            </div>

            <div className="col-12 mt-4"><h6 className="fw-bold text-dark mb-0">Contact Persons</h6></div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">Primary Account Owner</label>
              <input type="text" className="form-control" value={form.primaryAccountOwner} onChange={(e) => setForm((c) => ({ ...c, primaryAccountOwner: e.target.value }))} placeholder="John Doe" disabled={busy} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">Technical Contact</label>
              <input type="text" className="form-control" value={form.technicalContact} onChange={(e) => setForm((c) => ({ ...c, technicalContact: e.target.value }))} placeholder="Jane Smith" disabled={busy} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">Signatory</label>
              <input type="text" className="form-control" value={form.signatory} onChange={(e) => setForm((c) => ({ ...c, signatory: e.target.value }))} placeholder="John Doe" disabled={busy} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">Accounts Payable Contact</label>
              <input type="text" className="form-control" value={form.accountsPayableContact} onChange={(e) => setForm((c) => ({ ...c, accountsPayableContact: e.target.value }))} placeholder="Finance Team" disabled={busy} />
            </div>

            <div className="col-12 mt-4"><h6 className="fw-bold text-dark mb-0">Billing & Payment Information</h6></div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">Billing Street Address</label>
              <input type="text" className="form-control" value={form.billingStreetAddress} onChange={(e) => setForm((c) => ({ ...c, billingStreetAddress: e.target.value }))} placeholder="123 Main Street, Suite 500" disabled={busy} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">Billing City</label>
              <input type="text" className="form-control" value={form.billingCity} onChange={(e) => setForm((c) => ({ ...c, billingCity: e.target.value }))} placeholder="Dubai" disabled={busy} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">Billing State / Province</label>
              <input type="text" className="form-control" value={form.billingStateProvince} onChange={(e) => setForm((c) => ({ ...c, billingStateProvince: e.target.value }))} placeholder="Dubai" disabled={busy} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">Billing Country</label>
              <input type="text" className="form-control" value={form.billingCountry} onChange={(e) => setForm((c) => ({ ...c, billingCountry: e.target.value }))} placeholder="UAE" disabled={busy} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">Payment Method</label>
              <select className="form-select" value={form.paymentMethod} onChange={(e) => setForm((c) => ({ ...c, paymentMethod: e.target.value }))} disabled={busy}>
                <option value="Bank">Bank</option>
                <option value="Credit Card">Credit Card</option>
              </select>
            </div>

            {form.paymentMethod === "Credit Card" ? (
              <>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted">Card Number</label>
                  <input type="text" className="form-control" value={form.cardNumber} onChange={(e) => setForm((c) => ({ ...c, cardNumber: e.target.value }))} placeholder="1234567890123456" disabled={busy} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted">Card Expiry Date</label>
                  <input type="text" className="form-control" value={form.cardExpiryDate} onChange={(e) => setForm((c) => ({ ...c, cardExpiryDate: e.target.value }))} placeholder="12/28" disabled={busy} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted">Name On Card</label>
                  <input type="text" className="form-control" value={form.nameOnCard} onChange={(e) => setForm((c) => ({ ...c, nameOnCard: e.target.value }))} placeholder="John Doe" disabled={busy} />
                </div>
              </>
            ) : (
              <>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted">Bank Name</label>
                  <input type="text" className="form-control" value={form.bankName} onChange={(e) => setForm((c) => ({ ...c, bankName: e.target.value }))} placeholder="Emirates NBD" disabled={busy} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted">Account Number</label>
                  <input type="text" className="form-control" value={form.accountNumber} onChange={(e) => setForm((c) => ({ ...c, accountNumber: e.target.value }))} placeholder="AE123456789012345678" disabled={busy} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted">Routing / IFSC Number</label>
                  <input type="text" className="form-control" value={form.routingIfscNumber} onChange={(e) => setForm((c) => ({ ...c, routingIfscNumber: e.target.value }))} placeholder="EBIQAEA" disabled={busy} />
                </div>
              </>
            )}

            <div className="col-12 mt-3">
              <div className="form-check form-switch p-3 border rounded-3 bg-light d-flex justify-content-between align-items-center">
                <label className="form-check-label fw-semibold text-dark mb-0">
                  Agreed to Terms & Conditions
                </label>
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  checked={form.agreedToTerms}
                  onChange={(e) => setForm((c) => ({ ...c, agreedToTerms: e.target.checked }))}
                  style={{ cursor: "pointer", width: 45, height: 24 }}
                  disabled={busy}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-top">
            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={() => handleNextStep("legal-billing")}
              disabled={busy}
            >
              {busy ? <><i className="fa-solid fa-spinner fa-spin me-2" />Saving...</> : "Save Legal & Billing & Next"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STEP: Documents
      ═══════════════════════════════════════════════════════════════ */}
      {currentStepKey === "documents" && (
        <div>
          <div className="mb-4">
            <h5 className="fw-bold mb-1">Documents</h5>
            <small className="text-muted">Update permits, VAT, Tax Exemption and registration files</small>
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">Commercial Permit Number</label>
              <input
                type="text"
                className="form-control"
                value={form.commercialPermitNumber}
                onChange={(e) => setForm((c) => ({ ...c, commercialPermitNumber: e.target.value }))}
                placeholder="e.g. CP123456789"
                disabled={busy}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small text-muted">VAT Number</label>
              <input
                type="text"
                className="form-control"
                value={form.vatNumber}
                onChange={(e) => setForm((c) => ({ ...c, vatNumber: e.target.value }))}
                placeholder="e.g. VAT987654321"
                disabled={busy}
              />
            </div>
            <div className="col-12 mt-3">
              <div className={styles.uploadGrid}>
                <UploadField
                  label="Business Registration"
                  name="businessRegistrationImage"
                  file={files.businessRegistrationImage}
                  existingUrl={existingFiles.businessRegistrationImage}
                  onChange={(name, file) => setFiles((c) => ({ ...c, [name]: file }))}
                />
                <UploadField
                  label="VAT Registration"
                  name="vatRegistrationImage"
                  file={files.vatRegistrationImage}
                  existingUrl={existingFiles.vatRegistrationImage}
                  onChange={(name, file) => setFiles((c) => ({ ...c, [name]: file }))}
                />
                <UploadField
                  label="Other Document"
                  name="otherImage"
                  file={files.otherImage}
                  existingUrl={existingFiles.otherImage}
                  onChange={(name, file) => setFiles((c) => ({ ...c, [name]: file }))}
                />
                <UploadField
                  label="Tax Exemption Certificate"
                  name="taxExemptionCertificate"
                  accept="image/*,application/pdf"
                  file={files.taxExemptionCertificate}
                  existingUrl={existingFiles.taxExemptionCertificate}
                  onChange={(name, file) => setFiles((c) => ({ ...c, [name]: file }))}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-top">
            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={() => handleNextStep("documents")}
              disabled={busy}
            >
              {busy ? <><i className="fa-solid fa-spinner fa-spin me-2" />Saving...</> : "Save Documents & Next"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STEP: Locations
      ═══════════════════════════════════════════════════════════════ */}
      {currentStepKey === "locations" && (
        <div>
          <div className="mb-4">
            <h5 className="fw-bold mb-1">Locations</h5>
            <small className="text-muted">Manage your restaurant locations</small>
          </div>

          {locationView === "list" && (
            <>
              <div className={styles.cardList}>
                {locations.map((loc, index) => (
                  <button
                    type="button"
                    className={`${styles.listCard} ${styles.locationCardButton}`}
                    key={loc._id || `${loc.addressName}-${index}`}
                    onClick={() => openLocationDetails(loc)}
                    disabled={actionLoading === `open-location-${getId(loc)}`}
                  >
                    <span className={styles.listIcon}><i className="fa-solid fa-location-dot" /></span>
                    <div>
                      <strong>{loc.addressName || `Location ${index + 1}`}</strong>
                      <p>{loc.address || "Address not provided"}</p>
                    </div>
                    <i className="fa-solid fa-chevron-right" />
                  </button>
                ))}
                {!locations.length && <p className={styles.emptyState}>No locations added yet.</p>}
              </div>
              <div className="mt-4 pt-3 border-top d-flex gap-3">
                <button type="button" className="btn btn-outline-primary" onClick={openNewLocation}>
                  <i className="fa-solid fa-plus me-2" />Add Location
                </button>
                <button type="button" className="btn btn-primary flex-grow-1" onClick={() => { setActiveStep((p) => p + 1); setError(""); setMessage(""); }}>
                  Continue & Next
                </button>
              </div>
            </>
          )}

          {locationView === "address" && (
            <div className={styles.formStack}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold small text-muted">Location Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={locationForm.addressName}
                    onChange={(e) => updateLocationField("addressName", e.target.value)}
                    placeholder="e.g. Downtown branch"
                  />
                </div>
              </div>

              <div className="my-3">
                <LocationMapPicker
                  address={locationForm.address}
                  lat={locationForm.lat}
                  lng={locationForm.long}
                  onSelect={(selection) => setLocationForm((current) => ({ ...current, ...selection }))}
                />
              </div>

              <button type="button" className="btn btn-light border w-100 mb-3" onClick={useCurrentLocation} disabled={actionLoading === "geolocation"}>
                <i className="fa-solid fa-location-crosshairs me-2" />Use current location
              </button>

              <button type="button" className={`${styles.locationMenuButton} ${locationSectionsCompleted.details ? styles.locationMenuCompleted : ""}`} onClick={() => setLocationView("details")}>
                Add more details for this location <i className={`fa-solid ${locationSectionsCompleted.details ? "fa-check" : "fa-chevron-right"}`} />
              </button>
              <button type="button" className={`${styles.locationMenuButton} ${locationSectionsCompleted.hours ? styles.locationMenuCompleted : ""}`} onClick={() => setLocationView("hours")}>
                Add open hours for this location <i className={`fa-solid ${locationSectionsCompleted.hours ? "fa-check" : "fa-chevron-right"}`} />
              </button>
              <button type="button" className={`${styles.locationMenuButton} ${locationSectionsCompleted.photos ? styles.locationMenuCompleted : ""}`} onClick={() => setLocationView("photos")}>
                Add photos for this location <i className={`fa-solid ${locationSectionsCompleted.photos ? "fa-check" : "fa-chevron-right"}`} />
              </button>

              <div className="mt-4 pt-3 border-top d-flex gap-2">
                <button type="button" className="btn btn-light border flex-grow-1" onClick={() => setLocationView("list")}>Cancel</button>
                {!selectedLocationId && (
                  <button type="button" className="btn btn-primary flex-grow-1" onClick={saveLocationDetails} disabled={actionLoading === "location"}>
                    {actionLoading === "location" ? "Saving..." : "Save Location"}
                  </button>
                )}
                {selectedLocationId && (
                  <button type="button" className="btn btn-primary flex-grow-1" onClick={() => setLocationView("list")}>Save & Close</button>
                )}
              </div>
            </div>
          )}

          {locationView === "details" && (
            <div className={styles.formStack}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted">Capacity</label>
                  <input
                    type="number"
                    className="form-control"
                    value={locationForm.capacity}
                    onChange={(e) => updateLocationField("capacity", e.target.value)}
                    placeholder="e.g. 200"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted">Floorplan Link</label>
                  <input
                    type="text"
                    className="form-control"
                    value={locationForm.floorPlan}
                    onChange={(e) => updateLocationField("floorPlan", e.target.value)}
                    placeholder="Link to floorplan"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold small text-muted">Location Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    value={locationForm.locationPhone}
                    onChange={(e) => updateLocationField("locationPhone", e.target.value)}
                    placeholder="e.g. 884763546"
                  />
                </div>
              </div>
              <div className="mt-4 pt-3 border-top d-flex gap-2">
                <button type="button" className="btn btn-light border flex-grow-1" onClick={() => setLocationView("address")}>Back</button>
                <button type="button" className="btn btn-primary flex-grow-1" onClick={saveLocationDetails} disabled={actionLoading === "location-details"}>
                  {actionLoading === "location-details" ? "Saving..." : "Save Details"}
                </button>
              </div>
            </div>
          )}

          {locationView === "hours" && (
            <div className={styles.formStack}>
              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={locationForm.openTwoShifts}
                  onChange={(e) => updateLocationField("openTwoShifts", e.target.checked)}
                />
                <label className="form-check-label fw-semibold">Open two shifts (Morning and Evening)</label>
              </div>

              <div className={styles.scheduleTable} style={{ maxHeight: "300px", overflowY: "auto" }}>
                {weeklySchedule.map((schedule, idx) => (
                  <div className={styles.scheduleRow} key={schedule.day}>
                    <strong style={{ minWidth: "90px", display: "inline-block" }}>{schedule.day}</strong>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      <label className="small text-muted">Morning from: <input type="time" value={schedule.morning.from} onChange={(e) => updateScheduleField(idx, "morning", "from", e.target.value)} /></label>
                      <label className="small text-muted">to: <input type="time" value={schedule.morning.to} onChange={(e) => updateScheduleField(idx, "morning", "to", e.target.value)} /></label>
                      {locationForm.openTwoShifts && (
                        <>
                          <label className="small text-muted ms-2">Evening from: <input type="time" value={schedule.evening.from} onChange={(e) => updateScheduleField(idx, "evening", "from", e.target.value)} /></label>
                          <label className="small text-muted">to: <input type="time" value={schedule.evening.to} onChange={(e) => updateScheduleField(idx, "evening", "to", e.target.value)} /></label>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-top d-flex gap-2">
                <button type="button" className="btn btn-light border flex-grow-1" onClick={() => setLocationView("address")}>Cancel</button>
                <button type="button" className="btn btn-primary flex-grow-1" onClick={saveOpeningHours} disabled={actionLoading === "opening-hours"}>
                  {actionLoading === "opening-hours" ? "Saving..." : "Save Hours"}
                </button>
              </div>
            </div>
          )}

          {locationView === "photos" && (
            <div className={styles.formStack}>
              <div className={styles.mediaGrid}>
                {locationMedia.map((media) => (
                  <article className={styles.mediaCard} key={media._id || media.url || media.file}>
                    {media.mediaType === "video" ? (
                      <video controls poster={media.thumbnailUrl || undefined} src={media.url} style={{ width: "100%", height: "120px", objectFit: "cover" }} />
                    ) : (
                      <img src={media.url || media.thumbnailUrl} alt={media.description || "Location media"} style={{ width: "100%", height: "120px", objectFit: "cover" }} />
                    )}
                    {media.description && <p className="small text-truncate m-0 px-2 py-1">{media.description}</p>}
                  </article>
                ))}
              </div>

              <label className={styles.uploadCard}>
                <input
                  className={styles.hiddenInput}
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                />
                <span className={styles.uploadLabel}>{mediaFile ? mediaFile.name : "ADD PHOTOS OR VIDEOS"}</span>
                <span className={styles.uploadIcon}><i className="fa-solid fa-photo-film" /></span>
                <span className={styles.uploadHint}>Choose photo/video file</span>
              </label>

              {mediaFile?.type.startsWith("video/") && (
                <div className="mb-3">
                  <label className="form-label fw-semibold small text-muted">Video Thumbnail</label>
                  <input type="file" accept="image/*" className="form-control" onChange={(e) => setMediaThumbnail(e.target.files?.[0] || null)} />
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-semibold small text-muted">Media Description</label>
                <textarea className="form-control" rows={2} value={mediaDescription} onChange={(e) => setMediaDescription(e.target.value)} placeholder="Photo or video description..." />
              </div>

              <div className="mt-4 pt-3 border-top d-flex gap-2">
                <button type="button" className="btn btn-light border flex-grow-1" onClick={() => setLocationView("address")}>Cancel</button>
                <button type="button" className="btn btn-primary flex-grow-1" onClick={uploadLocationMedia} disabled={actionLoading === "location-media"}>
                  {actionLoading === "location-media" ? "Uploading..." : "Upload File"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STEP: Categories
      ═══════════════════════════════════════════════════════════════ */}
      {currentStepKey === "categories" && (
        <div>
          <div className="mb-4">
            <h5 className="fw-bold mb-1">Product Categories</h5>
            <small className="text-muted">Manage product or menu categories</small>
          </div>

          {!showCategoryForm ? (
            <>
              <div className={styles.cardList}>
                {categories.map((category) => (
                  <article className={styles.listCard} key={category._id || category.name}>
                    <span className={styles.listIcon}><i className="fa-solid fa-layer-group" /></span>
                    <div className="flex-grow-1">
                      <strong>{category.name}</strong>
                      {category.description && <p>{category.description}</p>}
                    </div>
                    <span className={styles.metaBadge}>{Number(category.productCount || 0)} items</span>
                  </article>
                ))}
                {!categories.length && <p className={styles.emptyState}>No categories added yet.</p>}
              </div>

              <div className="mt-4 pt-3 border-top d-flex gap-3">
                <button type="button" className="btn btn-outline-primary" onClick={() => { setShowCategoryForm(true); setError(""); setMessage(""); }}>
                  <i className="fa-solid fa-plus me-2" />Add Category
                </button>
                <button type="button" className="btn btn-primary flex-grow-1" onClick={() => { setActiveStep((p) => p + 1); setError(""); setMessage(""); }}>
                  Continue & Next
                </button>
              </div>
            </>
          ) : (
            <div className={styles.inlineEditor}>
              <h3>Add Category</h3>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold small text-muted">Category Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={categoryForm.name}
                    onChange={(e) => updateCategoryField("name", e.target.value)}
                    placeholder="Enter category name"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold small text-muted">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={categoryForm.description}
                    onChange={(e) => updateCategoryField("description", e.target.value)}
                    placeholder="Category description..."
                  />
                </div>
              </div>
              <div className="mt-4 pt-3 border-top d-flex gap-2">
                <button type="button" className="btn btn-light border flex-grow-1" onClick={() => { setShowCategoryForm(false); setCategoryForm(EMPTY_CATEGORY); }}>Cancel</button>
                <button type="button" className="btn btn-primary flex-grow-1" onClick={handleSaveCategory} disabled={actionLoading === "category"}>
                  {actionLoading === "category" ? "Saving..." : "Save Category"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STEP: Coupons
      ═══════════════════════════════════════════════════════════════ */}
      {currentStepKey === "coupons" && (
        <div>
          <div className="mb-4">
            <h5 className="fw-bold mb-1">Launch Coupons</h5>
            <small className="text-muted">Manage promotional codes</small>
          </div>

          {!showCouponForm ? (
            <>
              <div className={styles.cardList}>
                {coupons.map((coupon) => (
                  <article className={styles.listCard} key={coupon._id}>
                    <span className={styles.listIcon}><i className="fa-solid fa-ticket" /></span>
                    <div className="flex-grow-1">
                      <strong>{coupon.couponName}</strong>
                      <p>{coupon.discount}% discount · {coupon.validFrom} to {coupon.validTo}</p>
                      {coupon.description && <small className="text-muted d-block">{coupon.description}</small>}
                    </div>
                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-sm btn-light border" onClick={() => openCouponEditor(coupon)} aria-label="Edit coupon"><i className="fa-solid fa-pen-to-square" /></button>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteCoupon(coupon._id)} disabled={actionLoading === `delete-${coupon._id}`} aria-label="Delete coupon"><i className="fa-solid fa-trash" /></button>
                    </div>
                  </article>
                ))}
                {!coupons.length && <p className={styles.emptyState}>No coupons added yet.</p>}
              </div>

              <div className="mt-4 pt-3 border-top d-flex gap-3">
                <button type="button" className="btn btn-outline-primary" onClick={() => openCouponEditor()}>
                  <i className="fa-solid fa-plus me-2" />Add Coupon
                </button>
                <button type="button" className="btn btn-primary flex-grow-1" onClick={() => { setActiveStep((p) => p + 1); setError(""); setMessage(""); }}>
                  Continue & Next
                </button>
              </div>
            </>
          ) : (
            <div className={styles.inlineEditor}>
              <h3>{couponForm._id ? "Edit Coupon" : "Add Coupon"}</h3>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted">Coupon Name / Code</label>
                  <input
                    type="text"
                    className="form-control"
                    value={couponForm.couponName}
                    onChange={(e) => updateCouponField("couponName", e.target.value)}
                    placeholder="e.g. WELCOME20"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted">Discount % (1-99%)</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    className="form-control"
                    value={couponForm.discount}
                    onChange={(e) => updateCouponField("discount", e.target.value)}
                    placeholder="e.g. 5 or 20"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted">Valid From</label>
                  <input
                    type="date"
                    className="form-control"
                    value={couponForm.validFrom}
                    onChange={(e) => updateCouponField("validFrom", e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small text-muted">Valid To</label>
                  <input
                    type="date"
                    className="form-control"
                    value={couponForm.validTo}
                    onChange={(e) => updateCouponField("validTo", e.target.value)}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold small text-muted">Description</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={couponForm.description}
                    onChange={(e) => updateCouponField("description", e.target.value)}
                    placeholder="Coupon details..."
                  />
                </div>
              </div>
              <div className="mt-4 pt-3 border-top d-flex gap-2">
                <button type="button" className="btn btn-light border flex-grow-1" onClick={() => { setShowCouponForm(false); setCouponForm(EMPTY_COUPON); }}>Cancel</button>
                <button type="button" className="btn btn-primary flex-grow-1" onClick={handleSaveCoupon} disabled={actionLoading === "coupon"}>
                  {actionLoading === "coupon" ? "Saving..." : "Save Coupon"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STEP: Banner & Slogan
      ═══════════════════════════════════════════════════════════════ */}
      {currentStepKey === "banner-slogan" && (
        <div>
          <div className="mb-4">
            <h5 className="fw-bold mb-1">Banner & Slogan</h5>
            <small className="text-muted">Update your banner image and tagline slogan</small>
          </div>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label fw-semibold small text-muted">Banner Image</label>
              <div className="d-flex justify-content-center">
                <div style={{ maxWidth: 480, width: "100%" }}>
                  <BannerUploadField
                    file={files.bannerImage}
                    existingUrl={existingFiles.bannerImage}
                    onChange={(file) => setFiles((c) => ({ ...c, bannerImage: file }))}
                  />
                </div>
              </div>
            </div>
            <div className="col-12">
              <label className="form-label fw-semibold small text-muted">Slogan</label>
              <input
                type="text"
                className="form-control"
                value={form.serviceSlogan}
                onChange={(e) => setForm((c) => ({ ...c, serviceSlogan: e.target.value }))}
                placeholder="e.g. Taste the Mediterranean"
                disabled={busy}
              />
            </div>
          </div>
          <div className="mt-4 pt-3 border-top">
            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={() => handleNextStep("banner-slogan")}
              disabled={busy}
            >
              {busy ? <><i className="fa-solid fa-spinner fa-spin me-2" />Saving...</> : "Save Slogan & Banner & Next"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STEP: Review & Submit
      ═══════════════════════════════════════════════════════════════ */}
      {currentStepKey === "review" && (
        <div>
          <div className="mb-4">
            <h5 className="fw-bold mb-1">Review & Submit</h5>
            <small className="text-muted">Review your profile details before submitting</small>
          </div>

          <div className={styles.reviewGrid}>
            {isRestaurant && (
              <div className={styles.reviewItem}>
                <span>{serviceName} Type</span>
                <strong>{selectedTypeNames.join(", ") || "Not selected"}</strong>
              </div>
            )}
            <div className={styles.reviewItem}>
              <span>Business Name</span>
              <strong>{form.serviceName || "Not entered"}</strong>
            </div>
            <div className={`${styles.reviewItem} ${styles.reviewWide}`}>
              <span>Description</span>
              <strong>{form.serviceDescription || "Not entered"}</strong>
            </div>
            <div className={styles.reviewItem}>
              <span>Cuisine</span>
              <strong>{form.cuisineName || "Not entered"}</strong>
            </div>
            <div className={styles.reviewItem}>
              <span>Company Legal Name</span>
              <strong>{form.companyLegalName || "Not entered"}</strong>
            </div>
            <div className={styles.reviewItem}>
              <span>Registration Number</span>
              <strong>{form.registrationNumber || "Not entered"}</strong>
            </div>
            <div className={styles.reviewItem}>
              <span>Tax ID Number</span>
              <strong>{form.taxIdentificationNumber || "Not entered"}</strong>
            </div>
            <div className={styles.reviewItem}>
              <span>Payment Method</span>
              <strong>{form.paymentMethod || "Bank"}</strong>
            </div>
            <div className={styles.reviewItem}>
              <span>Primary Owner</span>
              <strong>{form.primaryAccountOwner || "Not entered"}</strong>
            </div>
            <div className={styles.reviewItem}>
              <span>Slogan</span>
              <strong>{form.serviceSlogan || "Not entered"}</strong>
            </div>
            <div className={styles.reviewItem}>
              <span>Locations</span>
              <strong>{locations.length}</strong>
            </div>
            <div className={styles.reviewItem}>
              <span>Categories</span>
              <strong>{categories.length}</strong>
            </div>
            <div className={styles.reviewItem}>
              <span>Coupons</span>
              <strong>{coupons.length}</strong>
            </div>
          </div>

          <div className="mt-4 p-3 border rounded bg-light d-flex justify-content-between align-items-center">
            <div>
              <span className="fw-semibold text-dark d-block">Agreed to Terms & Conditions and Privacy Policy</span>
              <small className="text-muted">Confirm that all provided legal & business information is accurate.</small>
            </div>
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                checked={form.agreedToTerms}
                onChange={(e) => setForm((c) => ({ ...c, agreedToTerms: e.target.checked }))}
                style={{ cursor: "pointer", width: 45, height: 24 }}
                disabled={busy}
              />
            </div>
          </div>

          <div className="mt-3 p-3 border rounded bg-light d-flex justify-content-between align-items-center">
            <div>
              <span className="fw-semibold text-dark d-block">Data Processing Agreement (DPA)</span>
              <small className="text-muted">Consent to data processing in accordance with Eventuna compliance policies.</small>
            </div>
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                checked={form.dataProcessingAgreementAccepted}
                onChange={(e) => setForm((c) => ({ ...c, dataProcessingAgreementAccepted: e.target.checked }))}
                style={{ cursor: "pointer", width: 45, height: 24 }}
                disabled={busy}
              />
            </div>
          </div>

          <div className="mt-3 p-3 border rounded bg-light d-flex align-items-center gap-3">
            <i className="fa-solid fa-circle-info text-primary fs-4" />
            <span className="small text-muted">
              Submitting sends your updated profile information to Eventuna for review.
            </span>
          </div>

          <div className="mt-4 pt-3 border-top">
            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={handleSubmitApplication}
              disabled={busy}
            >
              {actionLoading === "review" ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin me-2" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit for Review
                  <i className="fa-solid fa-paper-plane ms-2" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
