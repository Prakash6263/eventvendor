"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../services/authService";
import LocationMapPicker from "./LocationMapPicker";
import { getApplicationRoute, normalizeApplicationStatus } from "../lib/merchantStatus";
import statusStyles from "./merchantStatus.module.css";
import styles from "./MerchantProfileWizard.module.css";

const DRAFT_KEY = "eventuna-merchant-onboarding-draft";
const RESTAURANT_SERVICE_ID = "686fb6ced46e9740ee8277ec";

const STEPS = [
  {
    id: "primary",
    label: "Primary Information",
    subtitle: "Legal, tax & payout info",
    icon: "fa-address-card",
  },
  {
    id: "documents",
    label: "Documents Verification",
    subtitle: "Commercial permit & VAT",
    icon: "fa-file-shield",
  },
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
  termsOfServiceAccepted: false,
  privacyPolicyAccepted: false,
  dataProcessingAgreementAccepted: false,
};

const EMPTY_FILES = {
  businessRegistrationImage: null,
  vatRegistrationImage: null,
  otherImage: null,
  bannerImage: null,
  taxExemptionCertificate: null,
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
  onlineReservationLocation: false,
  acceptPreorder: false,
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

const EMPTY_CATEGORY = {
  name: "",
  description: "",
};

const getId = (value) => (typeof value === "string" ? value : value?._id || "");

const findLocationInResponse = (response, expectedLocation = null) => {
  const candidates = [
    response?.data?.location,
    response?.data?.serviceLocation,
    response?.data?.serviceLocationId,
    response?.location,
    response?.serviceLocation,
    response?.serviceLocationId,
    response?.data,
  ];

  for (const candidate of candidates) {
    if (candidate && !Array.isArray(candidate) && typeof candidate === "object" && getId(candidate)) {
      return candidate;
    }
  }

  const arrays = [
    response?.data,
    response?.data?.locations,
    response?.data?.serviceLocationIds,
    response?.locations,
    response?.serviceLocationIds,
  ].filter(Array.isArray);

  for (const locations of arrays) {
    const match = expectedLocation
      ? [...locations].reverse().find((location) => (
          location?.addressName === expectedLocation.addressName
          && location?.address === expectedLocation.address
        ))
      : locations.at(-1);
    if (match && getId(match)) return match;
  }

  const directId = response?.locationId
    || response?.data?.locationId
    || response?.data?._id
    || response?._id
    || "";
  return directId ? { _id: directId } : null;
};

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

function UploadField({ label, description, name, file, existingUrl, accept = "image/*,.pdf", onChange }) {
  const previewUrl = useMemo(() => {
    if (file) {
      if (file.type?.startsWith("image/") || /\.(jpe?g|png|webp|gif|jfif|bmp|svg)$/i.test(file.name || "")) {
        try {
          return URL.createObjectURL(file);
        } catch {
          return "";
        }
      }
      return "";
    }
    if (existingUrl && typeof existingUrl === "string" && (existingUrl.startsWith("http") || existingUrl.startsWith("data:image/"))) {
      return existingUrl;
    }
    return "";
  }, [file, existingUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch {}
      }
    };
  }, [previewUrl]);

  const isPdf = Boolean(
    file?.type === "application/pdf" ||
    (file?.name && file.name.toLowerCase().endsWith(".pdf")) ||
    (typeof existingUrl === "string" && existingUrl.toLowerCase().endsWith(".pdf"))
  );

  const hasFile = Boolean(file || existingUrl);

  return (
    <div className={`${styles.uploadCard} ${hasFile ? styles.uploadCardUploaded : ""}`}>
      <input
        id={`upload-${name}`}
        className={styles.hiddenInput}
        type="file"
        accept={accept}
        onChange={(event) => onChange(name, event.target.files?.[0] || null)}
      />
      <label htmlFor={`upload-${name}`} className={styles.uploadCardContent}>
        <div className={styles.uploadCardTop}>
          <div className={styles.uploadBadgeIcon}>
            {previewUrl ? (
              <img className={styles.docUploadPreview} src={previewUrl} alt={`${label} preview`} />
            ) : isPdf ? (
              <i className="fa-solid fa-file-pdf" style={{ color: "#ef4444" }} />
            ) : hasFile ? (
              <i className="fa-solid fa-file-check" />
            ) : (
              <i className="fa-solid fa-cloud-arrow-up" />
            )}
          </div>
          <div className={styles.uploadCardText}>
            <span className={styles.uploadCardLabel}>{label}</span>
            {description && <span className={styles.uploadCardDesc}>{description}</span>}
          </div>
        </div>

        <div className={styles.uploadCardBottom}>
          {hasFile ? (
            <div className={styles.fileUploadedRow}>
              <span className={styles.fileNamePill}>
                <i className="fa-solid fa-circle-check" />
                <span className={styles.fileNameText}>
                  {file?.name || "Uploaded Document"}
                </span>
              </span>
              <span className={styles.replaceText}>Click to replace</span>
            </div>
          ) : (
            <div className={styles.uploadCtaRow}>
              <span className={styles.browseButton}>Browse File</span>
              <span className={styles.fileFormatHint}>PDF, PNG, JPG (max 10MB)</span>
            </div>
          )}
        </div>
      </label>
    </div>
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
  const [categories, setCategories] = useState([]);
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
  const [locationMedia, setLocationMedia] = useState([]);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaThumbnail, setMediaThumbnail] = useState(null);
  const [mediaDescription, setMediaDescription] = useState("");
  const [couponForm, setCouponForm] = useState(EMPTY_COUPON);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
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
    taxExemptionCertificate: profile?.taxExemptionCertificate || "",
  }), [profile]);

  const certPreview = useMemo(() => {
    if (files.taxExemptionCertificate) {
      if (files.taxExemptionCertificate.type?.startsWith("image/") || /\.(jpe?g|png|webp|gif|jfif)$/i.test(files.taxExemptionCertificate.name || "")) {
        try { return URL.createObjectURL(files.taxExemptionCertificate); } catch { return ""; }
      }
      return "";
    }
    if (existingFiles.taxExemptionCertificate && typeof existingFiles.taxExemptionCertificate === "string" && existingFiles.taxExemptionCertificate.startsWith("http")) {
      return existingFiles.taxExemptionCertificate;
    }
    return "";
  }, [files.taxExemptionCertificate, existingFiles.taxExemptionCertificate]);

  useEffect(() => {
    return () => {
      if (certPreview && certPreview.startsWith("blob:")) {
        try { URL.revokeObjectURL(certPreview); } catch {}
      }
    };
  }, [certPreview]);

  const selectedTypeNames = useMemo(() => {
    const selected = new Set(form.serviceSubcategoryIds);
    return subServices
      .filter((service) => selected.has(service._id))
      .map((service) => service.subServicesName);
  }, [form.serviceSubcategoryIds, subServices]);

  const isRestaurantService = useMemo(() => {
    const serviceName = (selectedServiceName || "").trim().toLowerCase();
    if (serviceName && serviceName !== "restaurants" && serviceName !== "restaurant" && serviceName !== "food") {
      return false;
    }
    return true;
  }, [selectedServiceName]);

  const visibleSteps = useMemo(() => {
    return STEPS;
  }, []);

  const getActiveServiceId = useCallback(() => {
    return (
      getId(profile?.serviceId) ||
      getId(authService.getUser()?.serviceId) ||
      getId(authService.getUser()?.merchantProfile?.serviceId) ||
      (typeof window !== "undefined"
        ? localStorage.getItem("eventuna-signup-service-id") ||
          localStorage.getItem("serviceId")
        : "") ||
      RESTAURANT_SERVICE_ID
    );
  }, [profile?.serviceId]);

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
      companyLegalName: merchantProfile.companyLegalName || "",
      registrationNumber: merchantProfile.registrationNumber || "",
      registeredAddress: merchantProfile.registeredAddress || "",
      countryOfIncorporation: merchantProfile.countryOfIncorporation || "",
      taxIdentificationNumber: merchantProfile.taxIdentificationNumber || "",
      accountsPayableContact: merchantProfile.accountsPayableContact || "",
      billingStreetAddress: merchantProfile.billingStreetAddress || "",
      billingCity: merchantProfile.billingCity || "",
      billingStateProvince: merchantProfile.billingStateProvince || "",
      billingCountry: merchantProfile.billingCountry || "",
      paymentMethod: merchantProfile.paymentMethod || "Bank",
      bankName: merchantProfile.bankName || "",
      accountNumber: merchantProfile.accountNumber || "",
      routingIfscNumber: merchantProfile.routingIfscNumber || "",
      cardNumber: merchantProfile.cardNumber || "",
      cardExpiryDate: merchantProfile.cardExpiryDate || "",
      nameOnCard: merchantProfile.nameOnCard || "",
      primaryAccountOwner: merchantProfile.primaryAccountOwner || "",
      technicalContact: merchantProfile.technicalContact || "",
      signatory: merchantProfile.signatory || "",
      agreedToTerms: Boolean(merchantProfile.agreedToTerms || merchantProfile.termsOfServiceAccepted),
      termsOfServiceAccepted: Boolean(merchantProfile.termsOfServiceAccepted || merchantProfile.agreedToTerms),
      privacyPolicyAccepted: Boolean(merchantProfile.privacyPolicyAccepted),
      dataProcessingAgreementAccepted: Boolean(merchantProfile.dataProcessingAgreementAccepted),
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
          || RESTAURANT_SERVICE_ID;
        const serviceName = typeof merchantProfile.serviceId === "object"
          ? merchantProfile.serviceId?.servicesName || localStorage.getItem("eventuna-signup-service-name") || "Restaurants"
          : localStorage.getItem("eventuna-signup-service-name") || "Restaurants";
        const restaurantService = serviceId === RESTAURANT_SERVICE_ID
          || serviceName.trim().toLowerCase() === "restaurants"
          || serviceName.trim().toLowerCase() === "restaurant";
        setSelectedServiceName(serviceName);
        setStarted(Boolean(savedDraft?.started));
        const rawDraftStep = Number(savedDraft?.step ?? 0);
        const clampedStep = Number.isFinite(rawDraftStep)
          ? Math.min(Math.max(0, rawDraftStep), visibleSteps.length - 1)
          : 0;
        const hasPrimaryInfo = Boolean(
          savedDraft?.form?.companyLegalName ||
          merchantProfile?.companyLegalName
        );
        setStep(hasPrimaryInfo ? clampedStep : 0);
        setMessage("");

        if (serviceId) {
          authService.saveAuthData({ serviceId });
          setLoadingSubServices(true);
          const subServiceResponse = await authService.getSubServices({ id: serviceId });
          if (!cancelled) {
            if (subServiceResponse?.status) {
              setSubServices(normalizeArrayResponse(subServiceResponse, ["services", "subServices"]));
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

        const categoriesResponse = await authService.getProductCategories();
        if (!cancelled && categoriesResponse?.status) {
          setCategories(normalizeArrayResponse(categoriesResponse, ["categories"]));
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
    const safeStep = Math.min(Math.max(0, step), visibleSteps.length - 1);
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ started, step: safeStep, form }));
  }, [form, loading, started, step, visibleSteps.length]);

  useEffect(() => {
    if (step >= visibleSteps.length) {
      setStep(Math.max(0, visibleSteps.length - 1));
    }
  }, [step, visibleSteps.length]);

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

  const updateCategoryField = (field, value) => {
    setCategoryForm((current) => ({ ...current, [field]: value }));
    setError("");
    setMessage("");
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
    const currentStepId = visibleSteps[step]?.id;
    if (currentStepId === "primary") {
      if (!form.companyLegalName.trim() || !form.registrationNumber.trim() || !form.registeredAddress.trim() || !form.countryOfIncorporation.trim()) {
        return "Please fill in all Legal and Business Details.";
      }
      if (!form.taxIdentificationNumber.trim() || !form.vatNumber.trim()) {
        return "Please fill in all Tax Information.";
      }
      if (!form.accountsPayableContact.trim() || !form.billingStreetAddress.trim() || !form.billingCity.trim() || !form.billingCountry.trim()) {
        return "Please fill in all Billing Address details.";
      }
      if (form.paymentMethod === "Bank" && (!form.bankName.trim() || !form.accountNumber.trim() || !form.routingIfscNumber.trim())) {
        return "Please fill in all Bank details.";
      }
      if (form.paymentMethod === "Credit Card" && (!form.cardNumber.trim() || !form.cardExpiryDate.trim() || !form.nameOnCard.trim())) {
        return "Please fill in all Credit Card details.";
      }
      if (!form.primaryAccountOwner.trim() || !form.technicalContact.trim() || !form.signatory.trim()) {
        return "Please fill in all Contact Persons.";
      }
      if (!form.termsOfServiceAccepted || !form.privacyPolicyAccepted || !form.dataProcessingAgreementAccepted) {
        return "Please accept all required agreements to continue.";
      }
    }
    if (currentStepId === "documents") {
      if (!form.commercialPermitNumber.trim()) return "Commercial permit number is required.";
      if (!form.vatNumber.trim()) return "VAT number is required.";
      if (!files.businessRegistrationImage && !existingFiles.businessRegistrationImage) return "Upload the business registration document.";
      if (!files.vatRegistrationImage && !existingFiles.vatRegistrationImage) return "Upload the VAT registration document.";
      if (!files.otherImage && !existingFiles.otherImage) return "Upload the other supporting document.";
    }
    if (currentStepId === "details") {
      if (!form.serviceName.trim() || !form.serviceDescription.trim()) {
        return isRestaurantService ? "Enter the restaurant name and description." : "Enter the title and description.";
      }
    }
    if (currentStepId === "types" && form.serviceSubcategoryIds.length === 0) {
      return "Select at least one restaurant type.";
    }
    if (currentStepId === "banner") {
      if (!files.bannerImage && !existingFiles.bannerImage) return "Upload a banner image.";
      if (!form.serviceSlogan.trim()) return "Enter a slogan.";
    }
    if (currentStepId === "locations" && locations.length === 0) return "Add at least one location.";
    if (currentStepId === "menu" && categories.length === 0) return "Add at least one category.";
    return "";
  };

  const handleContinue = async () => {
    setError("");
    setMessage("");

    const currentStepId = visibleSteps[step]?.id;

    if (currentStepId === "locations") {
      if (locationView === "details") {
        setActionLoading("location-details");
        let locationId = selectedLocationId;
        if (!locationId) {
          const createdLocation = await handleAddLocation();
          locationId = getId(createdLocation);
        }
        if (!locationId) {
          locationId = `loc_${Date.now()}`;
        }
        const isLocalId = String(locationId).startsWith("loc_");
        if (!isLocalId) {
          try {
            const payload = {
              floorPlan: String(locationForm.floorPlan || ""),
              capacity: String(locationForm.capacity ?? ""),
              weeklySchedule: [],
              locationPhone: String(locationForm.locationPhone || ""),
              locationId: String(locationId),
              onlineReservationLocation: Boolean(locationForm.onlineReservationLocation),
              acceptPreorder: Boolean(locationForm.acceptPreorder),
            };
            await authService.updateMerchantLocation(payload);
          } catch (err) {
            console.warn("Backend update-location failed, using draft state:", err);
          }
        }
        setActionLoading("");
        setLocations((current) => {
          const exists = current.some((l) => getId(l) === locationId);
          if (exists) {
            return current.map((location) => (
              getId(location) === locationId ? { ...location, ...locationForm, _id: locationId } : location
            ));
          }
          return [...current, { ...locationForm, _id: locationId }];
        });
        setMessage("Location details saved.");
        setLocationSectionsCompleted((current) => ({ ...current, details: true }));
        setSelectedLocationId(locationId);
        setLocationView("list");
        return;
      }

      if (locationView === "hours") {
        let locationId = selectedLocationId;
        if (!locationId) {
          setError("Save this location before adding opening hours.");
          return;
        }
        setActionLoading("opening-hours");
        const isLocalId = String(locationId).startsWith("loc_");
        if (!isLocalId) {
          try {
            await authService.updateMerchantLocation({
              locationId,
              weeklySchedule,
              openTwoShifts: Boolean(locationForm.openTwoShifts),
            });
          } catch (err) {
            console.warn("Backend opening hours update failed, using draft state:", err);
          }
        }
        setActionLoading("");
        setLocations((current) => current.map((l) => (
          getId(l) === locationId ? { ...l, weeklySchedule, openTwoShifts: Boolean(locationForm.openTwoShifts) } : l
        )));
        setMessage("Opening hours updated successfully.");
        setLocationSectionsCompleted((current) => ({ ...current, hours: true }));
        setLocationView("list");
        return;
      }

      if (locationView === "photos") {
        if (mediaFile) {
          await uploadLocationMedia();
        }
        setLocationView("list");
        return;
      }

      if (locationView === "address") {
        if (!selectedLocationId) {
          const createdLocation = await handleAddLocation();
          if (!createdLocation) return;
        }
        setLocationView("list");
        return;
      }
    }

    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Auto-save primary information step directly to API
    if (currentStepId === "primary") {
      try {
        const primaryPayload = new FormData();
        primaryPayload.append("companyLegalName", (form.companyLegalName || "").trim());
        primaryPayload.append("registrationNumber", (form.registrationNumber || "").trim());
        primaryPayload.append("registeredAddress", (form.registeredAddress || "").trim());
        primaryPayload.append("countryOfIncorporation", (form.countryOfIncorporation || "").trim());
        primaryPayload.append("taxIdentificationNumber", (form.taxIdentificationNumber || "").trim());
        primaryPayload.append("vatNumber", (form.vatNumber || "").trim());
        if (files.taxExemptionCertificate) {
          primaryPayload.append("taxExemptionCertificate", files.taxExemptionCertificate);
        }
        primaryPayload.append("accountsPayableContact", (form.accountsPayableContact || "").trim());
        primaryPayload.append("billingStreetAddress", (form.billingStreetAddress || "").trim());
        primaryPayload.append("billingCity", (form.billingCity || "").trim());
        primaryPayload.append("billingStateProvince", (form.billingStateProvince || "").trim());
        primaryPayload.append("billingCountry", (form.billingCountry || "").trim());
        primaryPayload.append("paymentMethod", form.paymentMethod || "Bank");
        if (form.paymentMethod === "Credit Card") {
          primaryPayload.append("cardNumber", (form.cardNumber || "").trim());
          primaryPayload.append("cardExpiryDate", (form.cardExpiryDate || "").trim());
          primaryPayload.append("nameOnCard", (form.nameOnCard || "").trim());
        } else {
          primaryPayload.append("bankName", (form.bankName || "").trim());
          primaryPayload.append("accountNumber", (form.accountNumber || "").trim());
          primaryPayload.append("routingIfscNumber", (form.routingIfscNumber || "").trim());
        }
        primaryPayload.append("primaryAccountOwner", (form.primaryAccountOwner || "").trim());
        primaryPayload.append("technicalContact", (form.technicalContact || "").trim());
        primaryPayload.append("signatory", (form.signatory || "").trim());
        primaryPayload.append("agreedToTerms", "true");

        await authService.updateProfile(primaryPayload);
      } catch (err) {
        console.warn("Auto-saving primary information warning:", err);
      }
    }

    setError("");
    setMessage("");
    setStep((current) => Math.min(current + 1, visibleSteps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setError("");
    setMessage("");
    if (step === 0) {
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

    let newLocation = null;
    let newLocationId = null;

    try {
      const response = await authService.addMerchantLocation(payload);
      if (response?.status) {
        newLocation = findLocationInResponse(response, payload);
        newLocationId = getId(newLocation);

        if (!newLocationId) {
          for (let attempt = 0; attempt < 2 && !newLocationId; attempt += 1) {
            await new Promise((resolve) => window.setTimeout(resolve, 300));
            const locationsResponse = await authService.getMerchantLocations();
            newLocation = findLocationInResponse(locationsResponse, payload);
            newLocationId = getId(newLocation);
          }
        }
      }
    } catch (err) {
      console.warn("Backend addMerchantLocation warning:", err);
    }

    if (!newLocationId) {
      newLocationId = `loc_${Date.now()}`;
      newLocation = {
        _id: newLocationId,
        ...payload,
        ...locationForm,
      };
    }

    const normalizedLocation = {
      ...(typeof newLocation === "object" ? newLocation : {}),
      ...payload,
      _id: newLocationId,
    };
    setSelectedLocationId(newLocationId);
    setLocations((current) => {
      const exists = current.some((location) => getId(location) === newLocationId);
      return exists
        ? current.map((location) => getId(location) === newLocationId ? { ...location, ...normalizedLocation } : location)
        : [...current, normalizedLocation];
    });
    setLocationSectionsCompleted((current) => ({ ...current, address: true }));
    setActionLoading("");
    return normalizedLocation;
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
      onlineReservationLocation: Boolean(detail.onlineReservationLocation),
      acceptPreorder: Boolean(detail.acceptPreorder),
    });
    const scheduleByDay = new Map((detail.weeklySchedule || []).map((item) => [item.day, item]));
    setWeeklySchedule(createEmptySchedule().map((item) => ({ ...item, ...(scheduleByDay.get(item.day) || {}) })));
    setLocationSectionsCompleted({
      details: detailsCompleted,
      hours: hoursCompleted,
      photos: Array.isArray(detail.locationPhotoVideoList) && detail.locationPhotoVideoList.length > 0,
    });
    const isLocalLoc = String(locationId).startsWith("loc_");
    if (isLocalLoc) {
      setLocationMedia(Array.isArray(detail.locationPhotoVideoList) ? detail.locationPhotoVideoList : []);
    } else {
      try {
        const mediaResponse = await authService.getMerchantLocationMedia({ locationId });
        setLocationMedia(mediaResponse?.status && Array.isArray(mediaResponse.data) ? mediaResponse.data : (detail.locationPhotoVideoList || []));
      } catch {
        setLocationMedia(Array.isArray(detail.locationPhotoVideoList) ? detail.locationPhotoVideoList : []);
      }
    }
    setLocationView("address");
    setActionLoading("");
  };

  const uploadLocationMedia = async () => {
    if (!selectedLocationId) {
      setError("Save this location before uploading photos or videos.");
      return;
    }
    if (!mediaFile) {
      setError("Select a photo or video to upload.");
      return;
    }
    setActionLoading("location-media");
    setError("");

    const isLocalId = String(selectedLocationId).startsWith("loc_");
    const mediaType = mediaFile.type.startsWith("video/") ? "video" : "photo";
    const previewUrl = URL.createObjectURL(mediaFile);
    const localMediaItem = {
      _id: `media_${Date.now()}`,
      url: previewUrl,
      media: previewUrl,
      thumbnailUrl: previewUrl,
      mediaType,
      types: mediaType,
      description: mediaDescription.trim(),
      photoDescription: mediaDescription.trim(),
      file: mediaFile,
    };

    if (!isLocalId) {
      try {
        const payload = new FormData();
        payload.append("locationId", selectedLocationId);
        payload.append("media", mediaFile);
        payload.append("types", mediaType);
        payload.append("photoDescription", mediaDescription.trim());
        if (mediaThumbnail) payload.append("thumbnails", mediaThumbnail);
        const response = await authService.addMerchantLocationMedia(payload);
        if (response?.status) {
          const uploaded = response.data?.locationPhotoVideoList || [];
          setLocationMedia(uploaded.length ? uploaded : (current) => [...current, response.data]);
          setLocationSectionsCompleted((current) => ({ ...current, photos: true }));
          setMediaFile(null);
          setMediaThumbnail(null);
          setMediaDescription("");
          setMessage(response.message || "Media uploaded successfully.");
          setLocationView("address");
          setActionLoading("");
          return;
        }
      } catch (err) {
        console.warn("Backend addMerchantLocationMedia failed, using draft state:", err);
      }
    }

    // Local draft fallback when location is in onboarding draft
    setLocationMedia((current) => [...current, localMediaItem]);
    setLocations((current) => current.map((loc) => {
      if (getId(loc) === selectedLocationId) {
        const existingList = Array.isArray(loc.locationPhotoVideoList) ? loc.locationPhotoVideoList : [];
        return { ...loc, locationPhotoVideoList: [...existingList, localMediaItem] };
      }
      return loc;
    }));
    setLocationSectionsCompleted((current) => ({ ...current, photos: true }));
    setMediaFile(null);
    setMediaThumbnail(null);
    setMediaDescription("");
    setMessage("Media added to location draft.");
    setLocationView("address");
    setActionLoading("");
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

  const saveLocationDetails = async () => {
    setError("");
    setMessage("");
    let locationId = selectedLocationId;
    if (!locationId) {
      const createdLocation = await handleAddLocation();
      locationId = getId(createdLocation);
    }
    if (!locationId) {
      locationId = `loc_${Date.now()}`;
    }
    setActionLoading("location-details");
    setError("");

    const isLocalId = String(locationId).startsWith("loc_");
    if (!isLocalId) {
      try {
        const payload = {
          floorPlan: String(locationForm.floorPlan || ""),
          capacity: String(locationForm.capacity ?? ""),
          weeklySchedule: [],
          locationPhone: String(locationForm.locationPhone || ""),
          locationId: String(locationId),
          onlineReservationLocation: Boolean(locationForm.onlineReservationLocation),
          acceptPreorder: Boolean(locationForm.acceptPreorder),
        };
        await authService.updateMerchantLocation(payload);
      } catch (err) {
        console.warn("Backend update-location failed, saving to local draft:", err);
      }
    }

    setLocations((current) => {
      const exists = current.some((l) => getId(l) === locationId);
      if (exists) {
        return current.map((location) => (
          getId(location) === locationId ? { ...location, ...locationForm, _id: locationId } : location
        ));
      }
      return [...current, { ...locationForm, _id: locationId }];
    });
    setMessage("Location details saved.");
    setLocationSectionsCompleted((current) => ({ ...current, details: true }));
    setSelectedLocationId(locationId);
    setLocationView("address");
    setActionLoading("");
  };

  const saveOpeningHours = async () => {
    let locationId = selectedLocationId;
    if (!locationId) {
      setError("Save this location before adding opening hours.");
      return;
    }
    setActionLoading("opening-hours");
    setError("");

    const isLocalId = String(locationId).startsWith("loc_");
    if (!isLocalId) {
      try {
        await authService.updateMerchantLocation({
          locationId,
          weeklySchedule,
          openTwoShifts: Boolean(locationForm.openTwoShifts),
        });
      } catch (err) {
        console.warn("Backend update opening hours failed, saving to local draft:", err);
      }
    }

    setLocations((current) => current.map((l) => (
      getId(l) === locationId ? { ...l, weeklySchedule, openTwoShifts: Boolean(locationForm.openTwoShifts) } : l
    )));
    setMessage("Opening hours updated successfully.");
    setLocationSectionsCompleted((current) => ({ ...current, hours: true }));
    setLocationView("address");
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
      if (response?.status) {
        const createdCategory = response.data || response.category || response.result || {
          _id: response._id || response.id || `cat-${Date.now()}`,
          name,
          description,
        };
        setCategories((current) => {
          const createdId = getId(createdCategory);
          return createdId && current.some((category) => getId(category) === createdId)
            ? current
            : [...current, createdCategory];
        });
        setCategoryForm(EMPTY_CATEGORY);
        setShowCategoryForm(false);
        setMessage(response.message || "Category created successfully.");
        setActionLoading("");
        return;
      }
    } catch (e) {
      console.warn("Category creation error, saving to local draft:", e);
    }

    // Draft fallback when backend service is not yet registered
    const draftCategory = { _id: `cat_${Date.now()}`, name, description };
    setCategories((current) => [...current, draftCategory]);
    setCategoryForm(EMPTY_CATEGORY);
    setShowCategoryForm(false);
    setMessage("Category saved to draft.");
    setActionLoading("");
  };

  const refreshCoupons = async () => {
    try {
      const response = await authService.getMerchantCoupons();
      if (response?.status) {
        setCoupons(normalizeArrayResponse(response, ["coupons", "allCoupons"]));
      }
    } catch (e) {
      console.warn("Failed to refresh coupons:", e);
    }
  };

  const handleSaveCoupon = async () => {
    setError("");
    if (!couponForm.couponName.trim() || couponForm.discount === "" || !couponForm.validFrom || !couponForm.validTo) {
      setError("Coupon name, discount, valid-from date, and valid-to date are required.");
      return;
    }
    const discount = Number(couponForm.discount);
    if (!Number.isFinite(discount) || discount < 1 || discount > 99) {
      setError("Discount percentage must be between 1% and 99%.");
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
    try {
      const response = couponForm._id
        ? await authService.updateMerchantCoupon({ couponId: couponForm._id, ...payload })
        : await authService.addMerchantCoupon(payload);

      if (response?.status) {
        await refreshCoupons();
        setCouponForm(EMPTY_COUPON);
        setShowCouponForm(false);
        setMessage(response.message || "Coupon saved successfully.");
        setActionLoading("");
        return;
      }
    } catch (e) {
      console.warn("Coupon creation error, saving to local draft:", e);
    }

    // Draft fallback when backend service is not yet registered
    const draftCoupon = {
      _id: couponForm._id || `coup_${Date.now()}`,
      ...payload,
    };
    setCoupons((current) => {
      const exists = current.some((c) => getId(c) === draftCoupon._id);
      return exists
        ? current.map((c) => (getId(c) === draftCoupon._id ? draftCoupon : c))
        : [...current, draftCoupon];
    });
    setCouponForm(EMPTY_COUPON);
    setShowCouponForm(false);
    setMessage("Coupon saved to draft.");
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
    // 1. Legal, Tax, Billing, Contact & Agreement details for update-merchant-getMerchantProfileFields
    const primaryPayload = new FormData();
    primaryPayload.append("companyLegalName", (form.companyLegalName || "").trim());
    primaryPayload.append("registrationNumber", (form.registrationNumber || "").trim());
    primaryPayload.append("registeredAddress", (form.registeredAddress || "").trim());
    primaryPayload.append("countryOfIncorporation", (form.countryOfIncorporation || "").trim());
    primaryPayload.append("taxIdentificationNumber", (form.taxIdentificationNumber || "").trim());
    primaryPayload.append("vatNumber", (form.vatNumber || "").trim());
    if (files.taxExemptionCertificate) {
      primaryPayload.append("taxExemptionCertificate", files.taxExemptionCertificate);
    }
    primaryPayload.append("accountsPayableContact", (form.accountsPayableContact || "").trim());
    primaryPayload.append("billingStreetAddress", (form.billingStreetAddress || "").trim());
    primaryPayload.append("billingCity", (form.billingCity || "").trim());
    primaryPayload.append("billingStateProvince", (form.billingStateProvince || "").trim());
    primaryPayload.append("billingCountry", (form.billingCountry || "").trim());

    const method = form.paymentMethod || "Bank";
    primaryPayload.append("paymentMethod", method);
    if (method === "Credit Card") {
      primaryPayload.append("cardNumber", (form.cardNumber || "").trim());
      primaryPayload.append("cardExpiryDate", (form.cardExpiryDate || "").trim());
      primaryPayload.append("nameOnCard", (form.nameOnCard || "").trim());
    } else {
      primaryPayload.append("bankName", (form.bankName || "").trim());
      primaryPayload.append("accountNumber", (form.accountNumber || "").trim());
      primaryPayload.append("routingIfscNumber", (form.routingIfscNumber || "").trim());
    }

    primaryPayload.append("primaryAccountOwner", (form.primaryAccountOwner || "").trim());
    primaryPayload.append("technicalContact", (form.technicalContact || "").trim());
    primaryPayload.append("signatory", (form.signatory || "").trim());
    primaryPayload.append("agreedToTerms", "true");

    // 2. Documents for update-profile
    const docPayload = new FormData();
    docPayload.append("commercialPermitNumber", (form.commercialPermitNumber || "").trim());
    docPayload.append("vatNumber", (form.vatNumber || "").trim());
    if (files.businessRegistrationImage) {
      docPayload.append("businessRegistrationImage", files.businessRegistrationImage);
    }
    if (files.vatRegistrationImage) {
      docPayload.append("vatRegistrationImage", files.vatRegistrationImage);
    }
    if (files.otherImage) {
      docPayload.append("otherImage", files.otherImage);
    }

    return { primaryPayload, docPayload };
  };

  const handleSubmitApplication = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const validationError = validateStep();
      if (validationError) {
        setError(validationError);
        setSaving(false);
        return;
      }

      const { primaryPayload, docPayload } = buildSubmission();
      await Promise.all([
        authService.updateProfile(primaryPayload).catch((e) => {
          console.warn("Primary profile update warning:", e);
          return { status: false, message: e.message };
        }),
        authService.updateMerchantProfile(docPayload).catch((e) => {
          console.warn("Merchant document update warning:", e);
          return { status: false, message: e.message };
        }),
      ]);

      const profileResponse = await authService.getMerchantProfile();
      localStorage.removeItem(DRAFT_KEY);

      const newStatus = normalizeApplicationStatus(profileResponse?.data?.applicationStatus || "pending");
      if (newStatus === "approved") {
        const user = authService.getUser() || profileResponse?.data || {};
        const merchantId = user?._id || user?.id || user?.email || "default";
        const hasSeenCongrats = typeof window !== "undefined" && localStorage.getItem(`eventuna_congrats_seen_${merchantId}`);
        if (!hasSeenCongrats) {
          router.replace("/congratulations");
        } else {
          router.replace("/");
        }
      } else {
        router.replace("/application-pending");
      }
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

  const safeStepIndex = Math.min(Math.max(0, step), visibleSteps.length - 1);
  const currentStep = visibleSteps[safeStepIndex] || visibleSteps[0] || STEPS[0];
  const currentStepId = currentStep?.id;

  return (
    <section className={styles.wizardCard}>
      <aside className={styles.stepSidebar}>
        <div className={styles.sidebarSticky}>
          <div className={styles.sidebarBadge}>
            <i className="fa-solid fa-shield-halved" />
            <span>Merchant Verification</span>
          </div>

          <div className={styles.sidebarHeading}>
            <h1>Complete Your Profile</h1>
            <p>Submit your verified business information and compliance documents for platform activation.</p>
          </div>

          <div className={styles.sidebarProgressWrap}>
            <div className={styles.sidebarProgressMeta}>
              <span>Step {safeStepIndex + 1} of {visibleSteps.length}</span>
              <span>{safeStepIndex === 0 ? "50%" : "100%"}</span>
            </div>
            <div className={styles.sidebarProgressBar}>
              <div
                className={styles.sidebarProgressFill}
                style={{ width: `${((safeStepIndex + 1) / visibleSteps.length) * 100}%` }}
              />
            </div>
          </div>

          <ol className={styles.stepList}>
            {visibleSteps.map((item, index) => {
              const isDone = index < safeStepIndex;
              const isActive = index === safeStepIndex;
              return (
                <li
                  key={item.id}
                  className={`${styles.stepItem} ${isActive ? styles.stepActive : ""} ${isDone ? styles.stepDone : ""}`}
                  onClick={() => {
                    setError("");
                    setMessage("");
                    setStep(index);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <span className={styles.stepIcon}>
                    {isDone ? (
                      <i className="fa-solid fa-check" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </span>
                  <div className={styles.stepText}>
                    <span className={styles.stepTitle}>{item.label}</span>
                    <span className={styles.stepSubtitle}>{item.subtitle}</span>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className={styles.sidebarTrustBox}>
            <div className={styles.sidebarTrustCard}>
              <div className={styles.sidebarTrustIcon}>
                <i className="fa-solid fa-lock" />
              </div>
              <div className={styles.sidebarTrustText}>
                <strong>256-Bit SSL Encrypted</strong>
                <p>All records & documents are transmitted through secure banking protocols.</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className={styles.stepContent}>
        <div className={styles.mobileProgress}>
          <span>Step {safeStepIndex + 1} of {visibleSteps.length}</span>
          <div><span style={{ width: `${((safeStepIndex + 1) / visibleSteps.length) * 100}%` }} /></div>
        </div>

        <header className={styles.contentHeader}>
          {safeStepIndex > 0 && (
            <button type="button" className={styles.backIcon} onClick={handleBack} aria-label="Go back">
              <i className="fa-solid fa-arrow-left" />
            </button>
          )}
          <div>
            <div className={styles.stepBadgePill}>
              Step {safeStepIndex + 1} of {visibleSteps.length} • {safeStepIndex === 0 ? "General Profile" : "Compliance Documents"}
            </div>
            <h2 className={styles.contentTitle}>
              {safeStepIndex === 0 ? "Primary Information" : "Documents Verification"}
            </h2>
            <p className={styles.contentSubtitle}>
              {safeStepIndex === 0
                ? "Enter your legal corporate identity, tax identifiers, billing contact, and payment configuration."
                : "Upload required commercial permits and VAT registration certificates for platform review."}
            </p>
          </div>
        </header>

        {error && <div className={styles.errorAlert}><i className="fa-solid fa-circle-exclamation" /> {error}</div>}
        {message && !error && <div className={styles.successAlert}><i className="fa-solid fa-circle-check" /> {message}</div>}

        <div className={styles.stepBody}>
          {currentStepId === "primary" && (
            <div className={styles.formStack}>
              {/* 1. Legal and Business Details */}
              <section className={styles.formSection}>
                <div className={styles.sectionHeading}>
                  <div className={styles.sectionIconWrap}>
                    <i className="fa-solid fa-building" />
                  </div>
                  <div>
                    <h3 className={styles.sectionTitle}>Legal & Business Details</h3>
                    <p className={styles.sectionSubtitle}>Enter your registered company name, registration number, and legal address.</p>
                  </div>
                </div>
                <div className={styles.formGrid}>
                  <label className={styles.fieldLabel}>
                    <span className={styles.labelText}>Company Legal Name <span className={styles.requiredMark}>*</span></span>
                    <input
                      className={styles.input}
                      value={form.companyLegalName}
                      onChange={(event) => updateField("companyLegalName", event.target.value)}
                      placeholder="e.g., Eventuna Hospitality Ltd."
                    />
                  </label>
                  <label className={styles.fieldLabel}>
                    <span className={styles.labelText}>Registration Number <span className={styles.requiredMark}>*</span></span>
                    <input
                      className={styles.input}
                      value={form.registrationNumber}
                      onChange={(event) => updateField("registrationNumber", event.target.value)}
                      placeholder="e.g., 1010928374"
                    />
                  </label>
                  <label className={styles.fieldLabel}>
                    <span className={styles.labelText}>Registered Address <span className={styles.requiredMark}>*</span></span>
                    <input
                      className={styles.input}
                      value={form.registeredAddress}
                      onChange={(event) => updateField("registeredAddress", event.target.value)}
                      placeholder="Building name, Street, City"
                    />
                  </label>
                  <label className={styles.fieldLabel}>
                    <span className={styles.labelText}>Country of Incorporation <span className={styles.requiredMark}>*</span></span>
                    <input
                      className={styles.input}
                      value={form.countryOfIncorporation}
                      onChange={(event) => updateField("countryOfIncorporation", event.target.value)}
                      placeholder="e.g., Saudi Arabia, UAE, India"
                    />
                  </label>
                </div>
              </section>

              {/* 2. Tax Information */}
              <section className={styles.formSection}>
                <div className={styles.sectionHeading}>
                  <div className={styles.sectionIconWrap}>
                    <i className="fa-solid fa-file-invoice-dollar" />
                  </div>
                  <div>
                    <h3 className={styles.sectionTitle}>Tax Information</h3>
                    <p className={styles.sectionSubtitle}>Provide your corporate tax identifier and VAT number for fiscal reporting.</p>
                  </div>
                </div>
                <div className={styles.formGrid}>
                  <label className={styles.fieldLabel}>
                    <span className={styles.labelText}>Tax Identification Number (TIN) <span className={styles.requiredMark}>*</span></span>
                    <input
                      className={styles.input}
                      value={form.taxIdentificationNumber}
                      onChange={(event) => updateField("taxIdentificationNumber", event.target.value)}
                      placeholder="Enter TIN"
                    />
                  </label>
                  <label className={styles.fieldLabel}>
                    <span className={styles.labelText}>VAT Number <span className={styles.requiredMark}>*</span></span>
                    <input
                      className={styles.input}
                      value={form.vatNumber}
                      onChange={(event) => updateField("vatNumber", event.target.value)}
                      placeholder="Enter 15-digit VAT number"
                    />
                  </label>
                  <div className={styles.fullWidth}>
                    <label className={styles.fieldLabel}>
                      <span className={styles.labelText}>Tax Exemption Certificate <span className={styles.optionalMark}>(Optional)</span></span>
                      <div className={styles.certUploadCard}>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          style={{ display: "none" }}
                          id="taxExemptionCertInput"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setFiles((c) => ({ ...c, taxExemptionCertificate: file }));
                          }}
                        />
                        <label htmlFor="taxExemptionCertInput" className={styles.certUploadLabel}>
                          <div className={styles.certUploadIcon}>
                            {certPreview ? (
                              <img src={certPreview} alt="Tax certificate preview" className={styles.certThumb} />
                            ) : (
                              <i className="fa-solid fa-file-arrow-up" />
                            )}
                          </div>
                          <div className={styles.certUploadMeta}>
                            <strong>{files.taxExemptionCertificate ? files.taxExemptionCertificate.name : (existingFiles.taxExemptionCertificate ? "Tax Exemption Certificate Uploaded" : "Upload Tax Exemption Certificate")}</strong>
                            <span>PDF, PNG or JPG (Max 10MB)</span>
                          </div>
                          <button type="button" className={styles.certUploadBtn} onClick={() => document.getElementById("taxExemptionCertInput")?.click()}>
                            {files.taxExemptionCertificate || existingFiles.taxExemptionCertificate ? "Change File" : "Browse File"}
                          </button>
                        </label>
                      </div>
                    </label>
                  </div>
                </div>
              </section>

              {/* 3. Billing and Payment */}
              <section className={styles.formSection}>
                <div className={styles.sectionHeading}>
                  <div className={styles.sectionIconWrap}>
                    <i className="fa-solid fa-wallet" />
                  </div>
                  <div>
                    <h3 className={styles.sectionTitle}>Billing & Payment</h3>
                    <p className={styles.sectionSubtitle}>Specify billing contact details and configure your payout collection method.</p>
                  </div>
                </div>
                <div className={styles.formGrid}>
                  <label className={`${styles.fieldLabel} ${styles.fullWidth}`}>
                    <span className={styles.labelText}>Accounts Payable Contact <span className={styles.requiredMark}>*</span></span>
                    <input
                      className={styles.input}
                      value={form.accountsPayableContact}
                      onChange={(event) => updateField("accountsPayableContact", event.target.value)}
                      placeholder="Full name or finance department contact"
                    />
                  </label>
                  <label className={`${styles.fieldLabel} ${styles.fullWidth}`}>
                    <span className={styles.labelText}>Street Address <span className={styles.requiredMark}>*</span></span>
                    <input
                      className={styles.input}
                      value={form.billingStreetAddress}
                      onChange={(event) => updateField("billingStreetAddress", event.target.value)}
                      placeholder="House/office no., building name, street"
                    />
                  </label>
                  <label className={styles.fieldLabel}>
                    <span className={styles.labelText}>City <span className={styles.requiredMark}>*</span></span>
                    <input
                      className={styles.input}
                      value={form.billingCity}
                      onChange={(event) => updateField("billingCity", event.target.value)}
                      placeholder="City"
                    />
                  </label>
                  <label className={styles.fieldLabel}>
                    <span className={styles.labelText}>State / Province <span className={styles.requiredMark}>*</span></span>
                    <input
                      className={styles.input}
                      value={form.billingStateProvince}
                      onChange={(event) => updateField("billingStateProvince", event.target.value)}
                      placeholder="State or Province"
                    />
                  </label>
                  <label className={`${styles.fieldLabel} ${styles.fullWidth}`}>
                    <span className={styles.labelText}>Country <span className={styles.requiredMark}>*</span></span>
                    <input
                      className={styles.input}
                      value={form.billingCountry}
                      onChange={(event) => updateField("billingCountry", event.target.value)}
                      placeholder="Country"
                    />
                  </label>
                </div>

                <div className={styles.paymentMethodWrapper}>
                  <span className={styles.subSectionTitle}>Payout Method</span>
                  <div className={styles.paymentMethodCards}>
                    <div
                      className={`${styles.paymentCard} ${form.paymentMethod === "Bank" ? styles.paymentCardActive : ""}`}
                      onClick={() => updateField("paymentMethod", "Bank")}
                    >
                      <div className={styles.paymentCardRadio}>
                        <span className={form.paymentMethod === "Bank" ? styles.radioChecked : styles.radioUnchecked} />
                      </div>
                      <div className={styles.paymentCardIcon}>
                        <i className="fa-solid fa-building-columns" />
                      </div>
                      <div className={styles.paymentCardInfo}>
                        <strong>Bank Transfer (ACH / Wire)</strong>
                        <span>Direct payout deposit into corporate account</span>
                      </div>
                    </div>
                    <div
                      className={`${styles.paymentCard} ${form.paymentMethod === "Credit Card" ? styles.paymentCardActive : ""}`}
                      onClick={() => updateField("paymentMethod", "Credit Card")}
                    >
                      <div className={styles.paymentCardRadio}>
                        <span className={form.paymentMethod === "Credit Card" ? styles.radioChecked : styles.radioUnchecked} />
                      </div>
                      <div className={styles.paymentCardIcon}>
                        <i className="fa-solid fa-credit-card" />
                      </div>
                      <div className={styles.paymentCardInfo}>
                        <strong>Corporate Credit Card</strong>
                        <span>Card-based automated clearing</span>
                      </div>
                    </div>
                  </div>

                  {form.paymentMethod === "Credit Card" ? (
                    <div className={`${styles.formGrid} ${styles.paymentSubForm}`}>
                      <label className={`${styles.fieldLabel} ${styles.fullWidth}`}>
                        <span className={styles.labelText}>Card Number <span className={styles.requiredMark}>*</span></span>
                        <input
                          className={styles.input}
                          value={form.cardNumber}
                          onChange={(event) => updateField("cardNumber", event.target.value)}
                          placeholder="1234 5678 9012 3456"
                        />
                      </label>
                      <label className={styles.fieldLabel}>
                        <span className={styles.labelText}>Expiry Date <span className={styles.requiredMark}>*</span></span>
                        <input
                          className={styles.input}
                          value={form.cardExpiryDate}
                          onChange={(event) => updateField("cardExpiryDate", event.target.value)}
                          placeholder="MM/YY"
                        />
                      </label>
                      <label className={styles.fieldLabel}>
                        <span className={styles.labelText}>Name on Card <span className={styles.requiredMark}>*</span></span>
                        <input
                          className={styles.input}
                          value={form.nameOnCard}
                          onChange={(event) => updateField("nameOnCard", event.target.value)}
                          placeholder="Name as it appears on card"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className={`${styles.formGrid} ${styles.paymentSubForm}`}>
                      <label className={styles.fieldLabel}>
                        <span className={styles.labelText}>Bank Name <span className={styles.requiredMark}>*</span></span>
                        <input
                          className={styles.input}
                          value={form.bankName}
                          onChange={(event) => updateField("bankName", event.target.value)}
                          placeholder="e.g., Al Rajhi Bank, Chase, HDFC"
                        />
                      </label>
                      <label className={styles.fieldLabel}>
                        <span className={styles.labelText}>Account / IBAN Number <span className={styles.requiredMark}>*</span></span>
                        <input
                          className={styles.input}
                          value={form.accountNumber}
                          onChange={(event) => updateField("accountNumber", event.target.value)}
                          placeholder="Account or IBAN Number"
                        />
                      </label>
                      <label className={`${styles.fieldLabel} ${styles.fullWidth}`}>
                        <span className={styles.labelText}>Routing / IFSC / Swift Code <span className={styles.requiredMark}>*</span></span>
                        <input
                          className={styles.input}
                          value={form.routingIfscNumber}
                          onChange={(event) => updateField("routingIfscNumber", event.target.value)}
                          placeholder="Routing number or IFSC code"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </section>

              {/* 4. Contact Persons */}
              <section className={styles.formSection}>
                <div className={styles.sectionHeading}>
                  <div className={styles.sectionIconWrap}>
                    <i className="fa-solid fa-user-tie" />
                  </div>
                  <div>
                    <h3 className={styles.sectionTitle}>Authorized Contact Persons</h3>
                    <p className={styles.sectionSubtitle}>Identify individuals authorized to act on behalf of this merchant account.</p>
                  </div>
                </div>
                <div className={styles.formGrid}>
                  <label className={styles.fieldLabel}>
                    <span className={styles.labelText}>Primary Account Owner <span className={styles.requiredMark}>*</span></span>
                    <input
                      className={styles.input}
                      value={form.primaryAccountOwner}
                      onChange={(event) => updateField("primaryAccountOwner", event.target.value)}
                      placeholder="Full name of primary owner"
                    />
                  </label>
                  <label className={styles.fieldLabel}>
                    <span className={styles.labelText}>Technical Contact <span className={styles.requiredMark}>*</span></span>
                    <input
                      className={styles.input}
                      value={form.technicalContact}
                      onChange={(event) => updateField("technicalContact", event.target.value)}
                      placeholder="Technical / Operations contact"
                    />
                  </label>
                  <label className={`${styles.fieldLabel} ${styles.fullWidth}`}>
                    <span className={styles.labelText}>Authorized Signatory <span className={styles.requiredMark}>*</span></span>
                    <input
                      className={styles.input}
                      value={form.signatory}
                      onChange={(event) => updateField("signatory", event.target.value)}
                      placeholder="Legal signatory full name"
                    />
                  </label>
                </div>
              </section>

              {/* 5. Agreements and Compliance */}
              <section className={styles.formSection}>
                <div className={styles.sectionHeading}>
                  <div className={styles.sectionIconWrap}>
                    <i className="fa-solid fa-shield-halved" />
                  </div>
                  <div>
                    <h3 className={styles.sectionTitle}>Agreements & Legal Compliance</h3>
                    <p className={styles.sectionSubtitle}>Please review and accept our standard merchant platform agreements.</p>
                  </div>
                </div>
                <div className={styles.agreementStack}>
                  <div className={`${styles.agreementRow} ${form.termsOfServiceAccepted ? styles.agreementRowActive : ""}`}>
                    <label className={styles.agreementLabel}>
                      <input
                        type="checkbox"
                        checked={Boolean(form.termsOfServiceAccepted)}
                        onChange={(e) => {
                          updateField("termsOfServiceAccepted", e.target.checked);
                          if (e.target.checked && form.privacyPolicyAccepted && form.dataProcessingAgreementAccepted) {
                            updateField("agreedToTerms", true);
                          }
                        }}
                      />
                      <span>I agree to the <strong>Terms of Service</strong> <span className={styles.requiredMark}>*</span></span>
                    </label>
                    <a href="https://eventuna.com/terms" target="_blank" rel="noopener noreferrer" className={styles.agreementLink}>
                      <span>Read Terms</span>
                      <i className="fa-solid fa-arrow-up-right-from-square" />
                    </a>
                  </div>

                  <div className={`${styles.agreementRow} ${form.privacyPolicyAccepted ? styles.agreementRowActive : ""}`}>
                    <label className={styles.agreementLabel}>
                      <input
                        type="checkbox"
                        checked={Boolean(form.privacyPolicyAccepted)}
                        onChange={(e) => {
                          updateField("privacyPolicyAccepted", e.target.checked);
                          if (e.target.checked && form.termsOfServiceAccepted && form.dataProcessingAgreementAccepted) {
                            updateField("agreedToTerms", true);
                          }
                        }}
                      />
                      <span>I agree to the <strong>Privacy Policy</strong> <span className={styles.requiredMark}>*</span></span>
                    </label>
                    <a href="https://eventuna.com/privacy" target="_blank" rel="noopener noreferrer" className={styles.agreementLink}>
                      <span>Read Policy</span>
                      <i className="fa-solid fa-arrow-up-right-from-square" />
                    </a>
                  </div>

                  <div className={`${styles.agreementRow} ${form.dataProcessingAgreementAccepted ? styles.agreementRowActive : ""}`}>
                    <label className={styles.agreementLabel}>
                      <input
                        type="checkbox"
                        checked={Boolean(form.dataProcessingAgreementAccepted)}
                        onChange={(e) => {
                          updateField("dataProcessingAgreementAccepted", e.target.checked);
                          if (e.target.checked && form.termsOfServiceAccepted && form.privacyPolicyAccepted) {
                            updateField("agreedToTerms", true);
                          }
                        }}
                      />
                      <span>I agree to the <strong>Data Processing Agreement (DPA)</strong> <span className={styles.requiredMark}>*</span></span>
                    </label>
                    <a href="https://eventuna.com/about" target="_blank" rel="noopener noreferrer" className={styles.agreementLink}>
                      <span>Read DPA</span>
                      <i className="fa-solid fa-arrow-up-right-from-square" />
                    </a>
                  </div>
                </div>
              </section>
            </div>
          )}

          {currentStepId === "documents" && (
            <div className={styles.formStack}>
              {/* Official Verification Documents */}
              <section className={styles.formSection}>
                <div className={styles.sectionHeading}>
                  <div className={styles.sectionIconWrap}>
                    <i className="fa-solid fa-file-shield" />
                  </div>
                  <div>
                    <h3 className={styles.sectionTitle}>Official Verification Documents</h3>
                    <p className={styles.sectionSubtitle}>Upload clear, legible scans or photos of your government registration and tax certificates.</p>
                  </div>
                </div>

                <div className={styles.uploadGrid}>
                  <UploadField
                    label="Business Registration (CR)"
                    description="Commercial permit or trade license"
                    name="businessRegistrationImage"
                    file={files.businessRegistrationImage}
                    existingUrl={existingFiles.businessRegistrationImage}
                    onChange={(name, file) => setFiles((current) => ({ ...current, [name]: file }))}
                  />
                  <UploadField
                    label="VAT Registration Certificate"
                    description="Tax authority VAT certificate"
                    name="vatRegistrationImage"
                    file={files.vatRegistrationImage}
                    existingUrl={existingFiles.vatRegistrationImage}
                    onChange={(name, file) => setFiles((current) => ({ ...current, [name]: file }))}
                  />
                  <UploadField
                    label="Other Supporting Document"
                    description="Municipal license or health permit"
                    name="otherImage"
                    file={files.otherImage}
                    existingUrl={existingFiles.otherImage}
                    onChange={(name, file) => setFiles((current) => ({ ...current, [name]: file }))}
                  />
                </div>
              </section>

              {/* Permit & Registration Identifiers */}
              <section className={styles.formSection}>
                <div className={styles.sectionHeading}>
                  <div className={styles.sectionIconWrap}>
                    <i className="fa-solid fa-id-card" />
                  </div>
                  <div>
                    <h3 className={styles.sectionTitle}>Permit & Registration Identifiers</h3>
                    <p className={styles.sectionSubtitle}>Confirm your registration numbers matching the uploaded official documents.</p>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <label className={styles.fieldLabel}>
                    <span className={styles.labelText}>Commercial Permit Number <span className={styles.requiredMark}>*</span></span>
                    <input
                      className={styles.input}
                      value={form.commercialPermitNumber}
                      onChange={(event) => updateField("commercialPermitNumber", event.target.value)}
                      placeholder="Enter official permit number"
                    />
                  </label>
                  <label className={styles.fieldLabel}>
                    <span className={styles.labelText}>VAT Number <span className={styles.requiredMark}>*</span></span>
                    <input
                      className={styles.input}
                      value={form.vatNumber}
                      onChange={(event) => updateField("vatNumber", event.target.value)}
                      placeholder="Enter VAT registration number"
                    />
                  </label>
                </div>

                <div className={styles.submissionNoticeBox}>
                  <div className={styles.submissionNoticeIcon}>
                    <i className="fa-solid fa-circle-check" />
                  </div>
                  <div className={styles.submissionNoticeContent}>
                    <strong>What happens after submission?</strong>
                    <p>Our compliance review team typically reviews merchant applications within 24 to 48 business hours. You can monitor verification status directly on your dashboard.</p>
                  </div>
                </div>
              </section>
            </div>
          )}

        </div>

        <footer className={styles.navigation}>
          {safeStepIndex > 0 ? (
            <button type="button" className={styles.secondaryButton} onClick={handleBack}>
              <i className="fa-solid fa-arrow-left" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {safeStepIndex < visibleSteps.length - 1 ? (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleContinue}
            >
              <span>Next: Documents</span>
              <i className="fa-solid fa-arrow-right" />
            </button>
          ) : (
            <button
              type="button"
              className={styles.primaryButtonSubmit}
              onClick={handleSubmitApplication}
              disabled={saving}
            >
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane" />
                  <span>Submit for Verification</span>
                </>
              )}
            </button>
          )}
        </footer>
      </div>
    </section>
  );
}
