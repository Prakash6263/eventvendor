"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Swal from "sweetalert2";
import {
  FaUtensils,
  FaBuilding,
  FaTruckRampBox,
  FaWandMagicSparkles,
  FaCamera,
  FaMusic,
  FaCouch,
  FaBroom,
  FaMasksTheater,
  FaChampagneGlasses,
  FaStore,
  FaListCheck,
  FaCircleInfo,
  FaImage,
  FaLocationDot,
  FaTicket,
  FaClipboardCheck,
  FaArrowLeft,
  FaArrowRight,
  FaXmark,
  FaPlus,
  FaCirclePlus,
  FaCheck,
  FaCircleCheck,
  FaTrashCan,
  FaSpinner,
  FaCloudArrowUp,
  FaBellConcierge,
  FaLayerGroup,
  FaCircle,
  FaChevronRight,
} from "react-icons/fa6";
import { authService } from "./authService";
import LocationMapPicker from "../components/LocationMapPicker";
import styles from "./ServicesManager.module.css";

const RESTAURANT_SERVICE_ID = "686fb6ced46e9740ee8277ec";
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const createDefaultSchedule = () =>
  DAYS.map((day) => ({
    day,
    morning: { from: "09:00", to: "14:00" },
    evening: { from: "17:00", to: "23:00" },
  }));

const getId = (v) => (typeof v === "string" ? v : v?._id || v?.id || "");

// The 9 official Event UNA Platform Service Categories (matching backend API & iOS)
const DEFAULT_PLATFORM_SERVICES = [
  {
    _id: "686fb6ced46e9740ee8277ec",
    servicesName: "Restaurants",
    categoryName: "Restaurants",
    serviceDescription: "Dining catalog, table reservations & branch shifts",
    subcategories: [
      { _id: "6881d39438087583c2427c82", subServicesName: "Fine Dining", serviceId: "686fb6ced46e9740ee8277ec" },
      { _id: "6881d3a238087583c2427c84", subServicesName: "Cafe", serviceId: "686fb6ced46e9740ee8277ec" },
      { _id: "6881d3ad38087583c2427c86", subServicesName: "Liar", serviceId: "686fb6ced46e9740ee8277ec" },
      { _id: "6881d3b938087583c2427c88", subServicesName: "Casual Dinnig", serviceId: "686fb6ced46e9740ee8277ec" },
      { _id: "6881d3c438087583c2427c8a", subServicesName: "Bar", serviceId: "686fb6ced46e9740ee8277ec" },
      { _id: "6881d3cf38087583c2427c8c", subServicesName: "South Indian", serviceId: "686fb6ced46e9740ee8277ec" },
      { _id: "68a422b04610ce53546e7e7f", subServicesName: "Southsssss", serviceId: "686fb6ced46e9740ee8277ec" },
    ],
  },
  {
    _id: "686fb6dcd46e9740ee8277ee",
    servicesName: "Facility",
    categoryName: "Facility",
    serviceDescription: "Venue booking, event halls & space management",
    subcategories: [
      { _id: "68ac5086622c179159c06fcc", subServicesName: "Hotel Lobby", serviceId: "686fb6dcd46e9740ee8277ee" },
      { _id: "68ac50db622c179159c06fcf", subServicesName: "Funeral Home", serviceId: "686fb6dcd46e9740ee8277ee" },
      { _id: "68ac5106622c179159c06fd2", subServicesName: "Balroom", serviceId: "686fb6dcd46e9740ee8277ee" },
      { _id: "68ac5116622c179159c06fd4", subServicesName: "commuinty center", serviceId: "686fb6dcd46e9740ee8277ee" },
    ],
  },
  {
    _id: "686fb6edd46e9740ee8277f0",
    servicesName: "Catering",
    categoryName: "Catering",
    serviceDescription: "Catering packages, bulk menus & delivery shifts",
    subcategories: [
      { _id: "6aace9615c8a6f5c36cd54a0", subServicesName: "commuinty center", serviceId: "686fb6edd46e9740ee8277f0" },
    ],
  },
  {
    _id: "686fb714d46e9740ee8277f2",
    servicesName: "Decoration & Lighting",
    categoryName: "Decoration & Lighting",
    serviceDescription: "Theme decoration, lighting setup & stage design",
    subcategories: [],
  },
  {
    _id: "686fb723d46e9740ee8277f4",
    servicesName: "Photography",
    categoryName: "Photography",
    serviceDescription: "Event photography, videography & albums",
    subcategories: [],
  },
  {
    _id: "686fb788d46e9740ee8277f6",
    servicesName: "Music Band and DJ",
    categoryName: "Music Band & DJ",
    serviceDescription: "DJ setups, live bands & sound engineering",
    subcategories: [],
  },
  {
    _id: "686fb7bad46e9740ee8277f8",
    servicesName: "Furniture Rentals",
    categoryName: "Furniture Rentals",
    serviceDescription: "Event chairs, tables, tents & rental items",
    subcategories: [],
  },
  {
    _id: "686fb7e8d46e9740ee8277fa",
    servicesName: "Servants and Cleaning",
    categoryName: "Servants and Cleaning",
    serviceDescription: "Event hospitality staff, servers & cleaning crews",
    subcategories: [],
  },
  {
    _id: "686fb80bd46e9740ee8277fc",
    servicesName: "Entertainment & clown",
    categoryName: "Entertainment & Clown",
    serviceDescription: "Performers, magicians, clowns & event artists",
    subcategories: [],
  },
];

const DEFAULT_SUB_TYPES = [
  { _id: "fine_dining", subServicesName: "Fine Dining" },
  { _id: "casual_dining", subServicesName: "Casual Dining" },
  { _id: "fast_food", subServicesName: "Fast Food" },
  { _id: "cafe_bakery", subServicesName: "Cafe & Bakery" },
  { _id: "buffet", subServicesName: "Buffet" },
  { _id: "lounge", subServicesName: "Lounge" },
  { _id: "pizzeria", subServicesName: "Pizzeria" },
];

const getSubTypesForCategory = (catName = "") => {
  const c = catName.toUpperCase();
  if (c.includes("FACILITY") || c.includes("VENUE")) {
    return [
      { _id: "wedding_hall", subServicesName: "Wedding Hall" },
      { _id: "banquet_hall", subServicesName: "Banquet Hall" },
      { _id: "conference_room", subServicesName: "Conference Room" },
      { _id: "open_lawn", subServicesName: "Open Lawn / Garden" },
      { _id: "rooftop", subServicesName: "Rooftop Venue" },
      { _id: "exhibition_center", subServicesName: "Exhibition Center" },
      { _id: "private_villa", subServicesName: "Private Villa" },
    ];
  }
  if (c.includes("CATERING")) {
    return [
      { _id: "wedding_buffet", subServicesName: "Wedding Buffet" },
      { _id: "corporate_catering", subServicesName: "Corporate Catering" },
      { _id: "live_stations", subServicesName: "Live Cooking Stations" },
      { _id: "box_meals", subServicesName: "Packed / Box Meals" },
      { _id: "cocktail_snacks", subServicesName: "Cocktail Finger Foods" },
      { _id: "dessert_counter", subServicesName: "Dessert & Beverage Bar" },
    ];
  }
  if (c.includes("DECOR") || c.includes("LIGHT")) {
    return [
      { _id: "floral_decor", subServicesName: "Floral Decoration" },
      { _id: "stage_backdrop", subServicesName: "Stage & Backdrop" },
      { _id: "ambient_lighting", subServicesName: "Ambient & Mood Lighting" },
      { _id: "entrance_arch", subServicesName: "Grand Entrance Arch" },
      { _id: "table_centerpieces", subServicesName: "Table Centerpieces" },
      { _id: "fairy_lights", subServicesName: "Fairy Lights & Canopies" },
    ];
  }
  if (c.includes("PHOTO") || c.includes("CAMERA") || c.includes("VIDEO")) {
    return [
      { _id: "wedding_photo", subServicesName: "Wedding Photography" },
      { _id: "candid_shoots", subServicesName: "Candid Event Shoots" },
      { _id: "cinematic_video", subServicesName: "Cinematic Video & Teasers" },
      { _id: "drone_coverage", subServicesName: "Drone Aerial Coverage" },
      { _id: "photo_booth", subServicesName: "Instant Photo Booth" },
      { _id: "pre_event_shoot", subServicesName: "Pre-Event Portraiture" },
    ];
  }
  if (c.includes("MUSIC") || c.includes("DJ") || c.includes("BAND")) {
    return [
      { _id: "dj_sound", subServicesName: "DJ & Sound System" },
      { _id: "live_band", subServicesName: "Live Acoustic Band" },
      { _id: "instrumental", subServicesName: "Solo Instrumental / Violin" },
      { _id: "wedding_singer", subServicesName: "Wedding / Event Singer" },
      { _id: "traditional_folk", subServicesName: "Traditional Folk Troupe" },
      { _id: "stage_pa", subServicesName: "Stage PA & Audio Engineering" },
    ];
  }
  if (c.includes("FURNITURE") || c.includes("RENTAL")) {
    return [
      { _id: "banquet_chairs", subServicesName: "Banquet Chairs & Covers" },
      { _id: "dining_tables", subServicesName: "Round & Dining Tables" },
      { _id: "lounge_sofas", subServicesName: "VIP Lounge Sofas" },
      { _id: "canopy_tents", subServicesName: "Canopy & Marquee Tents" },
      { _id: "cocktail_tables", subServicesName: "High Cocktail Tables" },
      { _id: "stage_platforms", subServicesName: "Riser & Stage Platforms" },
    ];
  }
  if (c.includes("SERVANT") || c.includes("CLEAN") || c.includes("STAFF")) {
    return [
      { _id: "waiters", subServicesName: "Uniformed Waiters & Servers" },
      { _id: "kitchen_helpers", subServicesName: "Kitchen Helpers" },
      { _id: "cleaning_crew", subServicesName: "Post-Event Cleaning Crew" },
      { _id: "valet_parking", subServicesName: "Valet Parking Drivers" },
      { _id: "event_security", subServicesName: "Bouncers & Event Security" },
      { _id: "hostess_usher", subServicesName: "Guest Ushers & Hostesses" },
    ];
  }
  if (c.includes("ENTERTAIN") || c.includes("CLOWN") || c.includes("MAGIC")) {
    return [
      { _id: "clown_magic", subServicesName: "Clown & Magic Show" },
      { _id: "kids_host", subServicesName: "Kids Games & Activities Host" },
      { _id: "face_painting", subServicesName: "Face Painting & Tattoos" },
      { _id: "mascot_costume", subServicesName: "Cartoon Mascots & Costumes" },
      { _id: "fire_acrobat", subServicesName: "Fire Show & Acrobats" },
      { _id: "caricature_artist", subServicesName: "Live Caricature Artist" },
    ];
  }
  return DEFAULT_SUB_TYPES;
};

// Rich default attributes for all 9 platform categories (Prefills Cuisine/Specialty, Slogan, Menu/URL, Banner & Description)
const CATEGORY_DEFAULTS = {
  catering: {
    cuisineName: "Buffet, Live Cooking & Multi-Cuisine Catering",
    serviceSlogan: "Exquisite Catering & Culinary Excellence for Every Special Event",
    menuUrl: "https://eventuna.com/menu/catering",
    bannerImage: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",
    description: "Full-service wedding and corporate catering packages, live cooking counters, and customized multi-course banquets.",
  },
  restaurant: {
    cuisineName: "Multi-Cuisine, Continental & Signature Dining",
    serviceSlogan: "Authentic Flavors, Memorable Dining & Warm Hospitality",
    menuUrl: "https://eventuna.com/menu/dining",
    bannerImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    description: "Premium dining experience with hand-crafted recipes, fresh ingredients, and welcoming ambiance.",
  },
  facility: {
    cuisineName: "Banquet Hall, Party Lawn & Luxury Event Spaces",
    serviceSlogan: "The Perfect Venue for Unforgettable Celebrations & Gatherings",
    menuUrl: "https://eventuna.com/venue/brochure",
    bannerImage: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
    description: "Spacious luxury banquet halls and open-air lawns equipped with state-of-the-art facilities for weddings and corporate galas.",
  },
  decor: {
    cuisineName: "Theme Decoration, Floral Styling & Stage Backdrops",
    serviceSlogan: "Transforming Spaces into Breathtaking Experiences",
    menuUrl: "https://eventuna.com/decor/portfolio",
    bannerImage: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80",
    description: "Bespoke stage backdrops, floral entrance arches, fairy light canopies, and complete event theme architecture.",
  },
  photo: {
    cuisineName: "Wedding Photography, Cinematic Teasers & Aerial Drones",
    serviceSlogan: "Capturing Every Cherished Moment with Art & Precision",
    menuUrl: "https://eventuna.com/photo/gallery",
    bannerImage: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
    description: "High-definition wedding photo shoots, 4K cinematic highlights, instant photo-booths, and pre-event portraiture.",
  },
  music: {
    cuisineName: "Live Acoustic Band, DJ Sets & Stage Audio Engineering",
    serviceSlogan: "Electrifying Rhythms & Unmatched Live Entertainment",
    menuUrl: "https://eventuna.com/music/tracks",
    bannerImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
    description: "Professional DJs, live acoustic music ensembles, folk troupes, and concert-grade PA sound system engineering.",
  },
  furniture: {
    cuisineName: "VIP Lounges, Banquet Chairs, Tents & High Cocktail Tables",
    serviceSlogan: "Premium Event Furniture, Tents & Seating Comfort",
    menuUrl: "https://eventuna.com/rentals/catalog",
    bannerImage: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80",
    description: "Complete event rental inventory including round dining tables, banquet chair covers, VIP sofas, and canopy marquees.",
  },
  servant: {
    cuisineName: "Uniformed Waiters, Kitchen Helpers, Valet & Cleaning Crews",
    serviceSlogan: "Professional Hospitality & Flawless Event Service",
    menuUrl: "https://eventuna.com/staffing/rates",
    bannerImage: "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=1200&q=80",
    description: "Trained hospitality professionals, attentive table servers, valet parking drivers, and post-event cleanup specialists.",
  },
  entertain: {
    cuisineName: "Stage Performers, Magicians, Event Clowns & Hosts",
    serviceSlogan: "Joyful Entertainment & Magic for All Ages",
    menuUrl: "https://eventuna.com/shows/schedule",
    bannerImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
    description: "Engaging magicians, interactive clown acts, party animators, and celebrity event hosts to entertain your guests.",
  },
};

const getCategoryDefaults = (categoryOrName = "") => {
  const c = String(categoryOrName).toLowerCase();
  if (c.includes("cater")) return CATEGORY_DEFAULTS.catering;
  if (c.includes("rest") || c.includes("din")) return CATEGORY_DEFAULTS.restaurant;
  if (c.includes("facil") || c.includes("hall") || c.includes("venue")) return CATEGORY_DEFAULTS.facility;
  if (c.includes("decor") || c.includes("light")) return CATEGORY_DEFAULTS.decor;
  if (c.includes("photo") || c.includes("video") || c.includes("camera")) return CATEGORY_DEFAULTS.photo;
  if (c.includes("music") || c.includes("dj") || c.includes("band")) return CATEGORY_DEFAULTS.music;
  if (c.includes("furn") || c.includes("rent")) return CATEGORY_DEFAULTS.furniture;
  if (c.includes("serv") || c.includes("clean") || c.includes("staff")) return CATEGORY_DEFAULTS.servant;
  if (c.includes("entertain") || c.includes("clown") || c.includes("magic")) return CATEGORY_DEFAULTS.entertain;
  return CATEGORY_DEFAULTS.catering;
};

// Dynamic Metadata Mapper for Services (Resolves categories, icons, colors, and descriptions dynamically)
const getServiceMeta = (svc) => {
  const cat = (svc?.categoryName || svc?.servicesName || svc?.serviceName || "").toUpperCase();

  if (cat.includes("RESTAURANT") || cat.includes("FOOD") || cat.includes("DINING")) {
    return {
      title: svc?.serviceName && !["Restaurants", "RESTAURANTS"].includes(svc.serviceName)
        ? svc.serviceName
        : "Restaurants & Dining",
      categoryBadge: "Restaurants",
      Icon: FaUtensils,
      iconBg: "#eef2ff",
      iconColor: "#4f46e5",
      description:
        svc?.serviceDescription ||
        svc?.description ||
        "Dining catalog, table reservations & branch shifts",
      actionLabel: "Configure",
      isSupported: true,
    };
  }

  if (cat.includes("FACILITY") || cat.includes("VENUE")) {
    return {
      title: svc?.serviceName && !["Facility", "FACILITY"].includes(svc.serviceName)
        ? svc.serviceName
        : "Facilities & Venues",
      categoryBadge: "Facility",
      Icon: FaBuilding,
      iconBg: "#f0fdf4",
      iconColor: "#16a34a",
      description:
        svc?.serviceDescription ||
        svc?.description ||
        "Venue booking, event halls & space management",
      actionLabel: "Configure",
      isSupported: true,
    };
  }

  if (cat.includes("CATERING")) {
    return {
      title: svc?.serviceName && !["Catering", "CATERING"].includes(svc.serviceName)
        ? svc.serviceName
        : "Catering Services",
      categoryBadge: "Catering",
      Icon: FaTruckRampBox,
      iconBg: "#fef3c7",
      iconColor: "#d97706",
      description:
        svc?.serviceDescription ||
        svc?.description ||
        "Catering packages, bulk menus & delivery shifts",
      actionLabel: "Configure",
      isSupported: true,
    };
  }

  if (cat.includes("DECOR") || cat.includes("LIGHT")) {
    return {
      title: svc?.serviceName || "Decoration & Lighting",
      categoryBadge: "Decoration",
      Icon: FaWandMagicSparkles,
      iconBg: "#f3e8ff",
      iconColor: "#9333ea",
      description:
        svc?.serviceDescription ||
        svc?.description ||
        "Theme decoration, lighting setup & stage design",
      actionLabel: "Configure",
      isSupported: true,
    };
  }

  if (cat.includes("PHOTO") || cat.includes("CAMERA") || cat.includes("VIDEO")) {
    return {
      title: svc?.serviceName || "Photography",
      categoryBadge: "Photography",
      Icon: FaCamera,
      iconBg: "#e0f2fe",
      iconColor: "#0284c7",
      description:
        svc?.serviceDescription ||
        svc?.description ||
        "Event photography, videography & albums",
      actionLabel: "Configure",
      isSupported: true,
    };
  }

  if (cat.includes("MUSIC") || cat.includes("DJ") || cat.includes("BAND")) {
    return {
      title: svc?.serviceName || "Music Band & DJ",
      categoryBadge: "Music & DJ",
      Icon: FaMusic,
      iconBg: "#fce7f3",
      iconColor: "#ec4899",
      description:
        svc?.serviceDescription ||
        svc?.description ||
        "DJ setups, live bands & sound engineering",
      actionLabel: "Configure",
      isSupported: true,
    };
  }

  if (cat.includes("FURNITURE") || cat.includes("RENTAL")) {
    return {
      title: svc?.serviceName || "Furniture Rentals",
      categoryBadge: "Rentals",
      Icon: FaCouch,
      iconBg: "#fef9c3",
      iconColor: "#ca8a04",
      description:
        svc?.serviceDescription ||
        svc?.description ||
        "Event chairs, tables, tents & rental items",
      actionLabel: "Configure",
      isSupported: true,
    };
  }

  if (cat.includes("SERVANT") || cat.includes("CLEAN") || cat.includes("STAFF")) {
    return {
      title: svc?.serviceName || "Servants and Cleaning",
      categoryBadge: "Staff & Cleaning",
      Icon: FaBroom,
      iconBg: "#ccfbf1",
      iconColor: "#0d9488",
      description:
        svc?.serviceDescription ||
        svc?.description ||
        "Event hospitality staff, servers & cleaning crews",
      actionLabel: "Configure",
      isSupported: true,
    };
  }

  if (cat.includes("ENTERTAIN") || cat.includes("CLOWN") || cat.includes("MAGIC")) {
    return {
      title: svc?.serviceName || "Entertainment & Clown",
      categoryBadge: "Entertainment",
      Icon: FaMasksTheater,
      iconBg: "#ffedd5",
      iconColor: "#ea580c",
      description:
        svc?.serviceDescription ||
        svc?.description ||
        "Performers, magicians, clowns & event artists",
      actionLabel: "Configure",
      isSupported: true,
    };
  }

  if (cat.includes("CLUB") || cat.includes("LOUNGE") || cat.includes("NIGHT")) {
    return {
      title: svc?.serviceName || "Clubs & Lounges",
      categoryBadge: "Nightlife",
      Icon: FaChampagneGlasses,
      iconBg: "#fdf2f8",
      iconColor: "#db2777",
      description:
        svc?.serviceDescription ||
        svc?.description ||
        "Nightlife bookings, VIP tables & reservations",
      actionLabel: "Configure",
      isSupported: true,
    };
  }

  // Dynamic API category fallback
  const rawName = svc?.servicesName || svc?.categoryName || svc?.serviceName || "Service";
  const formattedName = rawName
    .toLowerCase()
    .split(/[\s_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    title: svc?.serviceName || formattedName,
    categoryBadge: formattedName,
    Icon: FaStore,
    iconBg: "#f1f5f9",
    iconColor: "#475569",
    description:
      svc?.serviceDescription ||
      svc?.description ||
      `${formattedName} services & operations`,
    actionLabel: "Configure",
    isSupported: true,
  };
};

export default function ServicesManager() {
  const [loading, setLoading] = useState(true);
  const [merchantServices, setMerchantServices] = useState([]);
  const [platformServices, setPlatformServices] = useState([]);
  const [subServices, setSubServices] = useState([]);
  const [loadingSubServices, setLoadingSubServices] = useState(false);

  // Screen View Mode: "list" (Services List) vs "setup" (Unified Setup Wizard)
  const [viewMode, setViewMode] = useState("list");
  const [selectedService, setSelectedService] = useState(null);

  // Unified Setup Wizard Steps:
  // 1. types -> 2. details -> 3. banner -> 4. locations -> 5. menu -> 6. coupons -> 7. review
  const [activeStep, setActiveStep] = useState(0);
  const STEPS = [
    { id: "types", label: "Business Type", Icon: FaListCheck },
    { id: "details", label: "Business Details", Icon: FaCircleInfo },
    { id: "banner", label: "Banner & Slogan", Icon: FaImage },
    { id: "locations", label: "Locations & Hours", Icon: FaLocationDot },
    { id: "menu", label: "Catalog / Menu", Icon: FaUtensils },
    { id: "coupons", label: "Coupons", Icon: FaTicket },
    { id: "review", label: "Review & Publish", Icon: FaClipboardCheck },
  ];

  // Add Service Modal
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);

  // Form State for Setup Wizard (Matching iOS AddRestInfoVC, AdditolaRestInfoVC & ReviewAllDetailVC)
  const [form, setForm] = useState({
    serviceId: RESTAURANT_SERVICE_ID,
    serviceName: "Restaurants",
    serviceDescription: "",
    serviceSubcategoryIds: [],
    cuisineName: "",
    menuUrl: "",
    webUrl: "",
    phone: "",
    commercialPermitNumber: "",
    vatNumber: "",
    onlineReservation: false,
    serviceSlogan: "",
  });

  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");

  const categorySubTypes = useMemo(() => {
    // Always prefer live API subServices. Only use hardcoded fallback if API returned nothing.
    if (subServices && subServices.length > 0) {
      return subServices;
    }
    // Fallback: use static list only when API has no data for this category
    const currentCat =
      form.serviceName ||
      selectedService?.servicesName ||
      selectedService?.serviceName ||
      selectedService?.categoryName ||
      "";
    return getSubTypesForCategory(currentCat);
  }, [subServices, form.serviceName, selectedService]);

  // Locations State
  const [locations, setLocations] = useState([]);
  const [editingLocId, setEditingLocId] = useState(null);
  const [weeklySchedule, setWeeklySchedule] = useState(createDefaultSchedule);
  const [locationForm, setLocationForm] = useState({
    addressName: "",
    address: "",
    lat: "22.7196",
    long: "75.8577",
    capacity: "100",
    locationPhone: "",
    floorPlan: "",
    onlineReservationLocation: true,
    acceptPreorder: true,
    openTwoShifts: false,
  });
  const [locationPhoto, setLocationPhoto] = useState(null);
  const [locationPhotoDesc, setLocationPhotoDesc] = useState("");
  const [locationPhotoPreview, setLocationPhotoPreview] = useState("");

  // Menu State
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [dishes, setDishes] = useState([]);
  const [loadingDishes, setLoadingDishes] = useState(false);
  const [newDish, setNewDish] = useState({ name: "", price: "", description: "", categoryId: "" });
  const [dishPhoto, setDishPhoto] = useState(null);
  const [dishPhotoPreview, setDishPhotoPreview] = useState("");

  // Merchant Profile State
  const [merchantProfile, setMerchantProfile] = useState(null);

  // Coupons State
  const [coupons, setCoupons] = useState([]);
  const [newCoupon, setNewCoupon] = useState({ couponName: "", discount: "", validFrom: "", validTo: "", description: "" });

  const [saving, setSaving] = useState(false);

  // 1. Initial Load: Fetch Merchant Services & Platform Services
  const loadServicesData = useCallback(async () => {
    try {
      setLoading(true);
      const [mServicesRes, pServicesRes, profileRes] = await Promise.all([
        authService.getMerchantServicesList().catch(() => null),
        authService.getServices().catch(() => null),
        authService.getMerchantProfile().catch(() => null),
      ]);

      if (profileRes?.data) {
        setMerchantProfile(profileRes.data);
      }

      let pList = Array.isArray(pServicesRes?.services)
        ? pServicesRes.services
        : Array.isArray(pServicesRes?.data)
        ? pServicesRes.data
        : [];
      // If API returned valid list, use it directly. Only fall back to static data as last resort.
      if (!pList || pList.length < 2) {
        pList = DEFAULT_PLATFORM_SERVICES;
      }
      setPlatformServices(pList);

      // 1. Flatten all services owned by this merchant across categories
      const allMerchantServices = [];
      if (Array.isArray(mServicesRes?.data)) {
        mServicesRes.data.forEach((catGroup) => {
          if (Array.isArray(catGroup.services)) {
            catGroup.services.forEach((s) => {
              allMerchantServices.push({
                ...s,
                categoryId: typeof s.categoryId === "object" ? s.categoryId?._id : (s.categoryId || catGroup.categoryId),
                categoryName: catGroup.categoryName || (typeof s.categoryId === "object" ? s.categoryId?.servicesName : ""),
              });
            });
          }
        });
      }

      // Also incorporate services from profileRes if not already present
      if (Array.isArray(profileRes?.data?.services)) {
        profileRes.data.services.forEach((pSvc) => {
          const already = allMerchantServices.some((s) => s._id === pSvc._id);
          if (!already) {
            allMerchantServices.push({
              ...pSvc,
              categoryId: typeof pSvc.categoryId === "object" ? pSvc.categoryId?._id : pSvc.categoryId,
              categoryName: typeof pSvc.categoryId === "object" ? pSvc.categoryId?.servicesName : "",
            });
          }
        });
      }

      setMerchantServices(allMerchantServices);

      // Populate form from existing profile or currently selected service
      if (allMerchantServices.length > 0) {
        setSelectedService((currentSelected) => {
          const currentId = currentSelected?._id;
          const activeSvc = allMerchantServices.find((s) => s._id === currentId) || (currentSelected ? currentSelected : allMerchantServices[0]);
          if (activeSvc) {
            const meta = getServiceMeta(activeSvc);
            const catDefaults = getCategoryDefaults(activeSvc.serviceName || meta.title);
            setForm((prev) => ({
              ...prev,
              serviceId: activeSvc._id,
              serviceName: activeSvc.serviceName || prev.serviceName || meta.title,
              serviceDescription: activeSvc.serviceDescription || activeSvc.description || prev.serviceDescription || catDefaults.description,
              serviceSubcategoryIds: Array.isArray(activeSvc.serviceSubcategoryIds) && activeSvc.serviceSubcategoryIds.length > 0
                ? activeSvc.serviceSubcategoryIds.map(getId)
                : prev.serviceSubcategoryIds,
              cuisineName: activeSvc.cuisineName || prev.cuisineName || catDefaults.cuisineName,
              menuUrl: activeSvc.menuUrl || prev.menuUrl || catDefaults.menuUrl,
              webUrl: activeSvc.webUrl || prev.webUrl || (activeSvc.menuUrl ? activeSvc.menuUrl.replace(/\/menu.*$/, "") : "https://eventuna.com"),
              phone: activeSvc.phone || prev.phone || (profileRes?.data?.mobile ? `${profileRes.data.countryCode || "+966"} ${profileRes.data.mobile}` : "+966 50 123 4567"),
              commercialPermitNumber: activeSvc.commercialPermitNumber || prev.commercialPermitNumber || "1010987654",
              vatNumber: activeSvc.vatNumber || profileRes?.data?.vatNumber || prev.vatNumber || "310123456700003",
              onlineReservation: activeSvc.onlineReservation !== undefined ? Boolean(activeSvc.onlineReservation) : prev.onlineReservation,
              serviceSlogan: activeSvc.serviceSlogan || prev.serviceSlogan || catDefaults.serviceSlogan,
            }));
            if (activeSvc.bannerImage) {
              setBannerPreview(activeSvc.bannerImage);
            } else {
              setBannerPreview(catDefaults.bannerImage);
            }
          }
          return activeSvc;
        });
      }

      // Also load Subservices for first category
      const firstCatId = allMerchantServices[0]?.categoryId || RESTAURANT_SERVICE_ID;
      const subRes = await authService.getSubServices({ id: firstCatId }).catch(() => null);
      const subList = Array.isArray(subRes?.services)
        ? subRes.services
        : Array.isArray(subRes?.subcategories)
        ? subRes.subcategories
        : Array.isArray(subRes?.data?.services)
        ? subRes.data.services
        : Array.isArray(subRes?.data)
        ? subRes.data
        : [];
      setSubServices(subList);

      // Load locations, categories, coupons
      const [locRes, catRes, coupRes] = await Promise.all([
        authService.getMerchantLocations().catch(() => null),
        authService.getProductCategories().catch(() => null),
        authService.getMerchantCoupons().catch(() => null),
      ]);

      const locList = Array.isArray(locRes?.data)
        ? locRes.data
        : Array.isArray(locRes?.data?.locations)
        ? locRes.data.locations
        : Array.isArray(locRes?.locations)
        ? locRes.locations
        : [];
      setLocations(locList);

      const catList = Array.isArray(catRes?.data) ? catRes.data : [];
      setCategories(catList);
      if (catList.length > 0) {
        const firstCId = catList[0]._id || catList[0].id || "";
        setSelectedCategoryId((prev) => prev || firstCId);
        setNewDish((prev) => ({ ...prev, categoryId: prev.categoryId || firstCId }));
      }

      const coupList = Array.isArray(coupRes?.data)
        ? coupRes.data
        : Array.isArray(coupRes?.data?.coupons)
        ? coupRes.data.coupons
        : [];
      setCoupons(coupList);
    } catch (err) {
      console.error("Failed to load services data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServicesData();
  }, [loadServicesData]);

  // Auto-select first category and fetch dishes when categories load
  useEffect(() => {
    if (categories && categories.length > 0) {
      const activeCat = categories.find((c) => (c._id || c.id || c.name) === selectedCategoryId) || categories[0];
      const catId = activeCat?._id || activeCat?.id || "";
      if (catId && (!selectedCategoryId || dishes.length === 0)) {
        setSelectedCategoryId(catId);
        setNewDish((prev) => ({ ...prev, categoryId: catId }));
        setLoadingDishes(true);
        authService
          .getProductsByCategory({ categoryId: catId })
          .then((dishRes) => {
            const dishList = Array.isArray(dishRes?.data)
              ? dishRes.data
              : Array.isArray(dishRes?.products)
              ? dishRes.products
              : Array.isArray(dishRes?.data?.products)
              ? dishRes.data.products
              : [];
            setDishes(dishList);
          })
          .catch(() => setDishes([]))
          .finally(() => setLoadingDishes(false));
      }
    }
  }, [categories, selectedCategoryId, dishes.length]);

  // Start configuring a service
  const handleOpenSetup = async (serviceOrCat) => {
    let targetService = serviceOrCat;
    const catId = serviceOrCat?.categoryId?._id || serviceOrCat?.categoryId || serviceOrCat?._id;

    // Check if merchant already owns a service for this category
    const existing = merchantServices.find(
      (s) => s._id === serviceOrCat?._id || s.categoryId === catId || s.categoryId?._id === catId
    );

    if (existing) {
      targetService = existing;
    } else {
      // If clicking a platform category that has no merchant service yet:
      // Create a service instance on the backend immediately so we have a real merchant serviceId!
      try {
        setSaving(true);
        const meta = getServiceMeta(serviceOrCat);
        const createRes = await authService.addMerchantService({
          categoryId: catId,
          serviceName: meta.title,
          serviceDescription: meta.description,
        });
        if (createRes?.status && createRes?.data?._id) {
          targetService = {
            ...createRes.data,
            categoryId: catId,
            categoryName: meta.title,
          };
          setMerchantServices((prev) => [targetService, ...prev]);
        }
      } catch (err) {
        console.error("Failed to initialize service draft:", err);
      } finally {
        setSaving(false);
      }
    }

    setSelectedService(targetService);
    const realServiceId = targetService?._id;
    const meta = getServiceMeta(targetService);
    const catDefaults = getCategoryDefaults(targetService?.serviceName || meta.title);

    // Profile Phone default
    const defaultPhone =
      (targetService?.phone && targetService.phone.trim()) ||
      (merchantProfile?.mobile
        ? `${merchantProfile.countryCode || "+966"} ${merchantProfile.mobile}`
        : authService.getUser()?.mobile
        ? `${authService.getUser()?.countryCode || "+966"} ${authService.getUser()?.mobile}`
        : "+966 50 123 4567");

    // Local cached form data for this service (if previously entered)
    let cachedForm = {};
    if (typeof window !== "undefined" && realServiceId) {
      try {
        cachedForm = JSON.parse(localStorage.getItem(`eventuna_form_${realServiceId}`) || "{}");
      } catch (e) {}
    }

    const finalServiceName =
      (targetService?.serviceName && targetService.serviceName.trim()) || cachedForm.serviceName || meta.title;
    const finalDescription =
      (targetService?.serviceDescription && targetService.serviceDescription.trim()) ||
      (targetService?.description && targetService.description.trim()) ||
      cachedForm.serviceDescription ||
      catDefaults.description;
    const finalCuisine =
      (targetService?.cuisineName && targetService.cuisineName.trim()) || cachedForm.cuisineName || catDefaults.cuisineName;
    const finalMenuUrl =
      (targetService?.menuUrl && targetService.menuUrl.trim()) ||
      (targetService?.webUrl && targetService.webUrl.trim()) ||
      cachedForm.menuUrl ||
      catDefaults.menuUrl;
    const finalPhone =
      (targetService?.phone && targetService.phone.trim()) || cachedForm.phone || defaultPhone;
    const finalWebUrl =
      (targetService?.webUrl && targetService.webUrl.trim()) ||
      cachedForm.webUrl ||
      (finalMenuUrl ? finalMenuUrl.replace(/\/menu.*$/, "") : "https://eventuna.com");
    const finalCommercialPermit =
      (targetService?.commercialPermitNumber && targetService.commercialPermitNumber.trim()) ||
      cachedForm.commercialPermitNumber ||
      "1010987654";
    const finalVatNumber =
      (targetService?.vatNumber && targetService.vatNumber.trim()) ||
      (merchantProfile?.vatNumber && merchantProfile.vatNumber.trim()) ||
      cachedForm.vatNumber ||
      "310123456700003";
    const finalSlogan =
      (targetService?.serviceSlogan && targetService.serviceSlogan.trim()) || cachedForm.serviceSlogan || catDefaults.serviceSlogan;
    const finalBanner =
      (targetService?.bannerImage && targetService.bannerImage.trim()) || cachedForm.bannerImage || catDefaults.bannerImage;

    // 1. Recover saved subcategories from both targetService and localStorage
    const savedSubIds = [];
    if (Array.isArray(targetService?.serviceSubcategoryIds)) {
      targetService.serviceSubcategoryIds.forEach((s) => {
        if (typeof s === "object" && s !== null) {
          if (s._id) savedSubIds.push(String(s._id));
          if (s.subServicesName) savedSubIds.push(String(s.subServicesName));
        } else if (typeof s === "string") {
          savedSubIds.push(s);
        }
      });
    }
    if (typeof window !== "undefined" && realServiceId) {
      try {
        const local = JSON.parse(localStorage.getItem(`eventuna_subcats_${realServiceId}`) || "[]");
        if (Array.isArray(local)) {
          local.forEach((id) => savedSubIds.push(String(id)));
        }
      } catch (e) {}
    }
    let uniqueSubIds = Array.from(new Set(savedSubIds.filter(Boolean)));
    if (uniqueSubIds.length === 0) {
      const defaultTypes = getSubTypesForCategory(finalServiceName);
      if (defaultTypes && defaultTypes[0]) {
        uniqueSubIds = [String(defaultTypes[0]._id || defaultTypes[0].subServicesName)];
      }
    }

    setForm({
      serviceId: realServiceId,
      categoryId: catId,
      serviceName: finalServiceName,
      serviceDescription: finalDescription,
      serviceSubcategoryIds: uniqueSubIds,
      cuisineName: finalCuisine,
      menuUrl: finalMenuUrl,
      webUrl: finalWebUrl,
      phone: finalPhone,
      commercialPermitNumber: finalCommercialPermit,
      vatNumber: finalVatNumber,
      onlineReservation:
        targetService?.onlineReservation !== undefined
          ? Boolean(targetService.onlineReservation)
          : true,
      serviceSlogan: finalSlogan,
    });

    setBannerPreview(finalBanner);

    let initLocations = [];
    if (Array.isArray(targetService?.serviceLocationIds) && targetService.serviceLocationIds.length > 0) {
      initLocations = targetService.serviceLocationIds;
    }
    setLocations(initLocations);

    setActiveStep(0);
    setViewMode("setup");
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Load subservices, locations, categories & coupons for this service
    // subCategoryId MUST be the platform category _id (not merchant service _id)
    const subCategoryId =
      targetService?.categoryId?._id ||
      targetService?.categoryId ||
      catId;
    try {
      setLoadingSubServices(true);
      const [subRes, locRes, catRes, coupRes] = await Promise.all([
        authService.getSubServices({ id: subCategoryId }).catch(() => null),
        authService.getMerchantLocations().catch(() => null),
        authService.getProductCategories().catch(() => null),
        authService.getMerchantCoupons().catch(() => null),
      ]);

      const subList = Array.isArray(subRes?.services)
        ? subRes.services
        : Array.isArray(subRes?.subcategories)
        ? subRes.subcategories
        : Array.isArray(subRes?.data?.services)
        ? subRes.data.services
        : Array.isArray(subRes?.data)
        ? subRes.data
        : [];
      setSubServices(subList);

      const allLocs = Array.isArray(locRes?.data)
        ? locRes.data
        : Array.isArray(locRes?.data?.locations)
        ? locRes.data.locations
        : Array.isArray(locRes?.locations)
        ? locRes.locations
        : [];

      // Merge locations from both service.serviceLocationIds and alllocations API
      const locMap = new Map();
      initLocations.forEach((l) => {
        if (l && (l._id || l.id)) locMap.set(String(l._id || l.id), l);
      });
      allLocs.forEach((l) => {
        const sId = String(l.serviceId?._id || l.serviceId || "");
        if (!realServiceId || !sId || sId === String(realServiceId)) {
          locMap.set(String(l._id || l.id), l);
        }
      });
      let finalLocs = Array.from(locMap.values());
      if (finalLocs.length === 0 && allLocs.length > 0) {
        finalLocs = allLocs;
      }
      setLocations(finalLocs);

      // Categories
      const allCats = Array.isArray(catRes?.data) ? catRes.data : [];
      const serviceCats = allCats.filter(
        (c) => !c.serviceId || (c.serviceId?._id || c.serviceId) === realServiceId
      );
      const relevantCats = serviceCats.length > 0 ? serviceCats : allCats;
      setCategories(relevantCats);

      const firstCat = relevantCats[0];
      const initialCatId = firstCat?._id || firstCat?.id || "";
      setSelectedCategoryId(initialCatId);
      setNewDish((prev) => ({ ...prev, categoryId: initialCatId }));

      if (initialCatId) {
        setLoadingDishes(true);
        try {
          const dishRes = await authService.getProductsByCategory({ categoryId: initialCatId }).catch(() => null);
          const dishList = Array.isArray(dishRes?.data)
            ? dishRes.data
            : Array.isArray(dishRes?.products)
            ? dishRes.products
            : Array.isArray(dishRes?.data?.products)
            ? dishRes.data.products
            : [];
          setDishes(dishList);
        } catch (e) {
          console.error("Failed to load dishes:", e);
        } finally {
          setLoadingDishes(false);
        }
      } else {
        setDishes([]);
      }

      const coupList = Array.isArray(coupRes?.data)
        ? coupRes.data
        : Array.isArray(coupRes?.data?.coupons)
        ? coupRes.data.coupons
        : [];
      setCoupons(coupList);
    } catch (e) {
      console.error("Failed to load setup resources:", e);
    } finally {
      setLoadingSubServices(false);
    }
  };

  const handleSelectCategory = async (catId) => {
    setSelectedCategoryId(catId);
    setNewDish((prev) => ({ ...prev, categoryId: catId }));
    try {
      setLoadingDishes(true);
      const dishRes = await authService.getProductsByCategory({ categoryId: catId }).catch(() => null);
      const dishList = Array.isArray(dishRes?.data)
        ? dishRes.data
        : Array.isArray(dishRes?.products)
        ? dishRes.products
        : Array.isArray(dishRes?.data?.products)
        ? dishRes.data.products
        : [];
      setDishes(dishList);
    } catch (e) {
      console.error("Failed to load dishes for category:", e);
    } finally {
      setLoadingDishes(false);
    }
  };

  const handleDeleteDish = async (dish) => {
    const dId = dish._id || dish.id;
    if (!dId) return;
    const confirm = await Swal.fire({
      title: "Remove Dish?",
      text: `Are you sure you want to remove "${dish.name}" from the menu?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, Remove",
    });
    if (confirm.isConfirmed) {
      try {
        setSaving(true);
        await authService.deleteProduct({ productId: dId }).catch(() => null);
        setDishes((prev) => prev.filter((d) => (d._id || d.id) !== dId));
        Swal.fire("Removed", `Dish "${dish.name}" removed from menu.`, "success");
      } catch (err) {
        Swal.fire("Error", err.message || "Failed to remove dish", "error");
      } finally {
        setSaving(false);
      }
    }
  };

  // Toggle Type Selection
  const toggleType = (sub) => {
    const subId = String(sub._id || sub.id || sub.subServicesName);
    const subName = String(sub.subServicesName || sub.name || "");

    setForm((prev) => {
      const isSelected = prev.serviceSubcategoryIds.some(
        (saved) =>
          saved === subId ||
          (subName && saved.toLowerCase().trim() === subName.toLowerCase().trim())
      );

      const nextIds = isSelected
        ? prev.serviceSubcategoryIds.filter(
            (saved) =>
              saved !== subId &&
              (!subName || saved.toLowerCase().trim() !== subName.toLowerCase().trim())
          )
        : [...prev.serviceSubcategoryIds, subId];

      if (typeof window !== "undefined" && prev.serviceId) {
        try {
          localStorage.setItem(`eventuna_subcats_${prev.serviceId}`, JSON.stringify(nextIds));
        } catch (e) {}
      }

      return {
        ...prev,
        serviceSubcategoryIds: nextIds,
      };
    });
  };

  // Banner file handler
  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  // Branch location photo handler
  const handleLocationPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocationPhoto(file);
      setLocationPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Dish photo handler
  const handleDishPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setDishPhoto(file);
      setDishPhotoPreview(URL.createObjectURL(file));
    } else {
      setDishPhoto(null);
      setDishPhotoPreview("");
    }
  };

  // Save / Update Location
  const handleAddLocation = async () => {
    if (!locationForm.addressName.trim() || !locationForm.address.trim()) {
      Swal.fire("Missing Details", "Please provide a branch name and street address.", "warning");
      return;
    }

    try {
      setSaving(true);
      let targetLocId = editingLocId;

      if (!targetLocId) {
        // 1. ADD NEW LOCATION INSTANCE
        const locPayload = {
          serviceId: form.serviceId,
          addressName: locationForm.addressName.trim(),
          address: locationForm.address.trim(),
          lat: Number(locationForm.lat) || 22.7196,
          long: Number(locationForm.long) || 75.8577,
        };
        const res = await authService.addMerchantLocation(locPayload);
        if (res?.status) {
          targetLocId = res?.data?._id || res?.location?._id;
        } else {
          Swal.fire("Error", res?.message || "Failed to add location", "error");
          return;
        }
      }

      // 2. UPDATE LOCATION DETAILS (Capacity, Shift Hours, Phone, Floor Plan, Policies)
      if (targetLocId) {
        const updatePayload = {
          locationId: targetLocId,
          addressName: locationForm.addressName.trim(),
          address: locationForm.address.trim(),
          lat: Number(locationForm.lat) || 22.7196,
          long: Number(locationForm.long) || 75.8577,
          capacity: Number(locationForm.capacity) || 100,
          locationPhone: locationForm.locationPhone.trim(),
          floorPlan: locationForm.floorPlan.trim(),
          onlineReservationLocation: Boolean(locationForm.onlineReservationLocation),
          acceptPreorder: Boolean(locationForm.acceptPreorder),
          openTwoShifts: Boolean(locationForm.openTwoShifts),
          weeklySchedule: (weeklySchedule || []).map((s) => ({
            day: s.day || "Monday",
            morning: { from: s.morning?.from || "09:00", to: s.morning?.to || "14:00" },
            evening: { from: s.evening?.from || "17:00", to: s.evening?.to || "23:00" },
          })),
        };
        await authService.updateMerchantLocation(updatePayload);

        // 3. UPLOAD PHOTO IF SELECTED
        if (locationPhoto) {
          const photoFd = new FormData();
          photoFd.append("locationId", targetLocId);
          photoFd.append("types", "photo");
          photoFd.append("photoDescription", locationPhotoDesc.trim() || "Branch Photo");
          photoFd.append("media", locationPhoto);
          await authService.addMerchantLocationMedia(photoFd).catch(() => null);
          setLocationPhoto(null);
          setLocationPhotoPreview("");
          setLocationPhotoDesc("");
        }

        Swal.fire("Branch Saved", "Branch details, capacity, and hours saved successfully.", "success");
        setEditingLocId(null);
        setLocationForm({
          addressName: "",
          address: "",
          lat: "22.7196",
          long: "75.8577",
          capacity: "100",
          locationPhone: "",
          floorPlan: "",
          onlineReservationLocation: true,
          acceptPreorder: true,
          openTwoShifts: false,
        });
        setLocationPhoto(null);
        setLocationPhotoPreview("");
        setLocationPhotoDesc("");

        // Refresh locations
        const locRes = await authService.getMerchantLocations().catch(() => null);
        const locList = Array.isArray(locRes?.data)
          ? locRes.data
          : Array.isArray(locRes?.data?.locations)
          ? locRes.data.locations
          : Array.isArray(locRes?.locations)
          ? locRes.locations
          : [];
        const serviceLocs = locList.filter(
          (l) => !l.serviceId || (l.serviceId?._id || l.serviceId) === form.serviceId
        );
        setLocations(serviceLocs.length > 0 ? serviceLocs : locList);
      }
    } catch (err) {
      Swal.fire("Error", err.message || "Failed to save location", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEditLocation = (loc) => {
    setEditingLocId(loc._id || loc.id);
    setLocationForm({
      addressName: loc.addressName || "",
      address: loc.address || "",
      lat: String(loc.lat || "22.7196"),
      long: String(loc.long || "75.8577"),
      capacity: String(loc.capacity || "100"),
      locationPhone: loc.locationPhone || "",
      floorPlan: loc.floorPlan || "",
      onlineReservationLocation: loc.onlineReservationLocation !== false,
      acceptPreorder: loc.acceptPreorder !== false,
      openTwoShifts: Boolean(loc.openTwoShifts),
    });
    if (Array.isArray(loc.weeklySchedule) && loc.weeklySchedule.length > 0) {
      setWeeklySchedule(loc.weeklySchedule);
    }
    // Prefill / pre-render existing photo from locationPhotoVideoList or locationPhoto or image
    const mediaItem = Array.isArray(loc.locationPhotoVideoList) && loc.locationPhotoVideoList.length > 0
      ? loc.locationPhotoVideoList[0]
      : null;
    const existingPhotoUrl =
      mediaItem?.url ||
      mediaItem?.file ||
      loc.locationPhoto ||
      loc.photo ||
      loc.image ||
      "";
    setLocationPhoto(null);
    setLocationPhotoPreview(existingPhotoUrl);
    setLocationPhotoDesc(mediaItem?.description || loc.photoDescription || "");

    const el = document.getElementById("branch-config-form");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleCancelEditLocation = () => {
    setEditingLocId(null);
    setLocationForm({
      addressName: "",
      address: "",
      lat: "22.7196",
      long: "75.8577",
      capacity: "100",
      locationPhone: "",
      floorPlan: "",
      onlineReservationLocation: true,
      acceptPreorder: true,
      openTwoShifts: false,
    });
    setLocationPhoto(null);
    setLocationPhotoPreview("");
    setLocationPhotoDesc("");
    setWeeklySchedule(createDefaultSchedule());
  };

  // Add Category
  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      Swal.fire("Missing Category", "Please enter a menu category name.", "warning");
      return;
    }
    try {
      setSaving(true);
      const res = await authService.addProductCategory({
        serviceId: form.serviceId,
        name: newCatName.trim(),
        description: newCatDesc.trim(),
      });
      if (res?.status !== false) {
        Swal.fire("Category Created", `Category "${newCatName}" added.`, "success");
        const createdCat = res.data || { _id: Date.now().toString(), name: newCatName.trim(), description: newCatDesc.trim() };
        setCategories((prev) => [...prev, createdCat]);
        const newId = createdCat._id || createdCat.id || "";
        if (newId) {
          setSelectedCategoryId(newId);
          setNewDish((prev) => ({ ...prev, categoryId: newId }));
        }
        setNewCatName("");
        setNewCatDesc("");
      } else {
        Swal.fire("Error", res?.message || "Failed to create category", "error");
      }
    } catch (err) {
      Swal.fire("Error", err.message || "Failed to create category", "error");
    } finally {
      setSaving(false);
    }
  };

  // Add Dish / Product
  const handleAddDish = async () => {
    if (!newDish.name.trim() || !newDish.price) {
      Swal.fire("Missing Details", "Please provide dish name and price.", "warning");
      return;
    }
    const catId = newDish.categoryId || selectedCategoryId || categories[0]?._id;
    if (!catId) {
      Swal.fire("Select Category", "Please create or select a menu category first.", "warning");
      return;
    }
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("categoryId", catId);
      fd.append("name", newDish.name.trim());
      fd.append("description", newDish.description.trim());
      fd.append("price", String(newDish.price));
      if (dishPhoto) {
        fd.append("photo", dishPhoto);
      }
      const res = await authService.addProduct(fd);
      if (res?.status !== false) {
        Swal.fire("Dish Added", `Dish "${newDish.name}" added to menu.`, "success");
        setNewDish({ name: "", price: "", description: "", categoryId: catId });
        setDishPhoto(null);
        setDishPhotoPreview("");
        // Refresh dishes for this category
        const dishRes = await authService.getProductsByCategory({ categoryId: catId }).catch(() => null);
        const dishList = Array.isArray(dishRes?.data)
          ? dishRes.data
          : Array.isArray(dishRes?.products)
          ? dishRes.products
          : Array.isArray(dishRes?.data?.products)
          ? dishRes.data.products
          : [];
        setDishes(dishList.length > 0 ? dishList : (prev) => [...prev, res.data || { ...newDish, categoryId: catId }]);
      } else {
        Swal.fire("Error", res?.message || "Failed to add dish", "error");
      }
    } catch (err) {
      Swal.fire("Error", err.message || "Failed to add dish", "error");
    } finally {
      setSaving(false);
    }
  };

  // Add Coupon (iOS AddCouponVC)
  const handleAddCoupon = async () => {
    if (!newCoupon.couponName.trim() || !newCoupon.discount.trim()) {
      Swal.fire("Missing Info", "Please enter coupon code and discount percentage.", "warning");
      return;
    }
    try {
      setSaving(true);
      const res = await authService.addMerchantCoupon({
        serviceId: form.serviceId,
        couponName: newCoupon.couponName.toUpperCase().trim(),
        discount: newCoupon.discount.trim(),
        validFrom: newCoupon.validFrom || new Date().toISOString().split("T")[0],
        validTo: newCoupon.validTo || "",
        description: newCoupon.description.trim() || "Promotional Discount Voucher",
      });
      if (res?.status !== false) {
        Swal.fire("Coupon Created", `Promotion ${newCoupon.couponName} is live.`, "success");
        setCoupons((prev) => [...prev, { ...newCoupon, couponName: newCoupon.couponName.toUpperCase().trim() }]);
        setNewCoupon({ couponName: "", discount: "", validFrom: "", validTo: "", description: "" });
        // Refresh coupon list
        const coupRes = await authService.getMerchantCoupons().catch(() => null);
        const list = Array.isArray(coupRes?.data)
          ? coupRes.data
          : Array.isArray(coupRes?.data?.coupons)
          ? coupRes.data.coupons
          : [];
        if (list.length > 0) setCoupons(list);
      } else {
        Swal.fire("Error", res?.message || "Failed to add coupon", "error");
      }
    } catch (err) {
      Swal.fire("Error", err.message || "Failed to add coupon", "error");
    } finally {
      setSaving(false);
    }
  };

  // Delete Coupon (iOS CouponlistVC)
  const handleDeleteCoupon = async (c) => {
    const cId = c._id || c.id || c.couponId;
    if (!cId) return;
    const confirm = await Swal.fire({
      title: "Delete Coupon?",
      text: `Are you sure you want to remove promotion "${c.couponName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, Delete",
    });
    if (confirm.isConfirmed) {
      try {
        setSaving(true);
        await authService.deleteMerchantCoupon({ couponId: cId });
        setCoupons((prev) => prev.filter((item) => (item._id || item.id) !== cId));
        Swal.fire("Deleted", "Coupon removed successfully.", "success");
      } catch (err) {
        Swal.fire("Error", err.message || "Failed to delete coupon", "error");
      } finally {
        setSaving(false);
      }
    }
  };

  // Delete / Remove Service
  const handleDeleteService = async (svc) => {
    const sId = svc._id || svc.id || svc.serviceId;
    const meta = getServiceMeta(svc);
    const result = await Swal.fire({
      title: "Remove Service?",
      text: `Are you sure you want to remove "${meta.title}"? You will need to reconfigure it if you add it again.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, Remove",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        setSaving(true);
        if (sId) {
          await authService.deleteMerchantService(sId).catch(() => null);
        }
        if (typeof window !== "undefined") {
          try {
            const stored = JSON.parse(localStorage.getItem("eventuna_configured_services") || "[]");
            const updated = stored.filter((id) => id !== sId);
            localStorage.setItem("eventuna_configured_services", JSON.stringify(updated));
          } catch (e) {
            console.error(e);
          }
        }
        Swal.fire("Removed", "Service has been removed.", "success");
        loadServicesData();
      } catch (err) {
        Swal.fire("Error", err.message || "Failed to remove service", "error");
      } finally {
        setSaving(false);
      }
    }
  };

  // Final Publish / Save
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("serviceId", form.serviceId);
      formData.append("serviceName", form.serviceName);
      formData.append("serviceDescription", form.serviceDescription || "");
      formData.append("cuisineName", form.cuisineName || "");
      formData.append("menuUrl", form.menuUrl || "");
      formData.append("webUrl", form.webUrl || "");
      formData.append("phone", form.phone || "");
      formData.append("commercialPermitNumber", form.commercialPermitNumber || "");
      formData.append("onlineReservation", String(form.onlineReservation));
      formData.append("serviceSlogan", form.serviceSlogan || "");

      // If vatNumber is provided, keep profile in sync
      if (form.vatNumber) {
        authService.updateProfile({ vatNumber: form.vatNumber }).catch(() => null);
      }

      // Match any selected names/keys to actual MongoDB Subservice IDs if available
      const resolvedMongoIds = new Set();
      (form.serviceSubcategoryIds || []).forEach((idOrName) => {
        if (typeof idOrName === "string" && /^[0-9a-fA-F]{24}$/.test(idOrName)) {
          resolvedMongoIds.add(idOrName);
        } else {
          const matchedSub = (subServices || []).find(
            (s) =>
              (s.subServicesName || s.name || "").toLowerCase().trim() ===
              String(idOrName).toLowerCase().trim()
          );
          if (matchedSub?._id && /^[0-9a-fA-F]{24}$/.test(matchedSub._id)) {
            resolvedMongoIds.add(matchedSub._id);
          }
        }
      });
      resolvedMongoIds.forEach((id) => {
        formData.append("serviceSubcategoryIds[]", id);
      });

      // Persist full selection and form data in localStorage keyed by serviceId
      if (typeof window !== "undefined" && form.serviceId) {
        try {
          localStorage.setItem(
            `eventuna_subcats_${form.serviceId}`,
            JSON.stringify(form.serviceSubcategoryIds)
          );
          localStorage.setItem(
            `eventuna_form_${form.serviceId}`,
            JSON.stringify(form)
          );
        } catch (e) {
          console.error("Failed to cache selected subcategories:", e);
        }
      }

      if (bannerFile) {
        formData.append("bannerImage", bannerFile);
      }

      const res = await authService.updateMerchantServiceDetail(formData);
      if (res?.status) {
        // Update local merchantServices state so it's instantly reflected when reopening
        setMerchantServices((prev) =>
          prev.map((s) =>
            s._id === form.serviceId
              ? {
                  ...s,
                  serviceName: form.serviceName,
                  serviceDescription: form.serviceDescription,
                  serviceSlogan: form.serviceSlogan,
                  cuisineName: form.cuisineName,
                  phone: form.phone,
                  menuUrl: form.menuUrl,
                  webUrl: form.webUrl,
                  commercialPermitNumber: form.commercialPermitNumber,
                  vatNumber: form.vatNumber,
                  onlineReservation: form.onlineReservation,
                  serviceSubcategoryIds: form.serviceSubcategoryIds,
                  bannerImage: bannerPreview || s.bannerImage,
                }
              : s
          )
        );

        Swal.fire({
          title: "Service Published!",
          text: "Your service profile, locations, menu, and promotions are live.",
          icon: "success",
        }).then(() => {
          setViewMode("list");
          loadServicesData();
        });
      } else {
        Swal.fire("Error", res?.message || "Failed to update service", "error");
      }
    } catch (err) {
      Swal.fire("Error", err.message || "Failed to save service", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <FaSpinner className="fa-spin" style={{ fontSize: "36px", color: "#4f46e5" }} />
          <p style={{ marginTop: "16px", color: "#64748b" }}>Loading services and catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* ─────────────────────────────────────────────────────────────
          VIEW 1: SERVICES LIST & MANAGEMENT
      ───────────────────────────────────────────────────────────── */}
      {viewMode === "list" && (
        <>
          <div className={styles.headerBar}>
            <div className={styles.titleArea}>
              <h1>My Services & Businesses</h1>
              <p>
                Select, activate, and manage your restaurant and hospitality services on Eventuna.
              </p>
            </div>
            <button className={styles.primaryBtn} onClick={() => setViewMode("select")}>
              <FaPlus size={13} />
              <span>Add New Service</span>
            </button>
          </div>

          {merchantServices.length === 0 ? (
            <div className={styles.emptyState}>
              <FaBellConcierge className={styles.emptyStateIcon} size={48} />
              <h3>No Services Configured Yet</h3>
              <p>
                You haven&apos;t added or configured any services for your business yet. Click below to choose your business category and complete setup.
              </p>
              <button className={styles.primaryBtn} onClick={() => setViewMode("select")}>
                <FaPlus size={13} />
                <span>Select Your Business Service</span>
              </button>
            </div>
          ) : (
            <div className={styles.serviceListWrapper}>
              {/* Table / List Header */}
              <div className={styles.serviceListHeader}>
                <span>Service & Business</span>
                <span>Category</span>
                <span>Status</span>
                <span style={{ textAlign: "right" }}>Action</span>
              </div>

              {/* Service List Rows */}
              {merchantServices.map((svc, idx) => {
                const meta = getServiceMeta(svc);
                const IconComp = meta.Icon || FaStore;
                const cardKey = svc._id || svc.id || svc.serviceId || `merchant-service-${idx}`;

                return (
                  <div
                    key={cardKey}
                    className={styles.serviceListRow}
                    onClick={() => handleOpenSetup(svc)}
                  >
                    {/* Col 1: Icon, Title, Description */}
                    <div className={styles.serviceMainInfo}>
                      <div
                        className={styles.serviceListIcon}
                        style={{ background: meta.iconBg, color: meta.iconColor }}
                      >
                        <IconComp size={18} />
                      </div>
                      <div className={styles.serviceDetails}>
                        <h3 className={styles.serviceListTitle}>{meta.title}</h3>
                        <p className={styles.serviceListDesc}>{meta.description}</p>
                      </div>
                    </div>

                    {/* Col 2: Category Pill */}
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span className={styles.serviceCategoryPill}>
                        <FaLayerGroup className="text-muted" size={11} />
                        {meta.categoryBadge}
                      </span>
                    </div>

                    {/* Col 3: Status Pill */}
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span className={styles.statusBadgeActive}>
                        <FaCircle size={6} />
                        Active
                      </span>
                    </div>

                    {/* Col 4: Action Button */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                      <button
                        type="button"
                        className={styles.manageBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSetup(svc);
                        }}
                      >
                        <span>Manage</span>
                        <FaArrowRight size={12} />
                      </button>
                      <button
                        type="button"
                        className={styles.deleteRowBtn}
                        title="Remove Service"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteService(svc);
                        }}
                      >
                        <FaTrashCan size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          VIEW 2: DEDICATED SERVICE SELECTION SCREEN (Matching iOS SignUPVC)
      ───────────────────────────────────────────────────────────── */}
      {viewMode === "select" && (
        <div className={styles.selectionViewContainer}>
          <div className={styles.selectionHeaderBar}>
            {merchantServices.length > 0 ? (
              <button className={styles.secondaryBtn} onClick={() => setViewMode("list")}>
                <FaArrowLeft size={13} />
                <span>Back to My Services</span>
              </button>
            ) : (
              <div />
            )}
            <div className={styles.selectionBadge}>
              <span>Step 1: Choose Service Category</span>
            </div>
          </div>

          <div className={styles.selectionHero}>
            <h2>Select the Service You Provide</h2>
            <p>
              Choose a business category to activate and configure your profile, menu catalog, locations, and reservations on Eventuna.
            </p>
          </div>

          <div className={styles.servicesGrid}>
            {platformServices.map((pSvc, idx) => {
              const meta = getServiceMeta(pSvc);
              const IconComp = meta.Icon || FaStore;
              const sId = pSvc._id || pSvc.id;
              const isAlreadyActive = merchantServices.some(
                (m) => (m.serviceId || m._id || m.id) === sId
              );

              return (
                <div
                  key={sId || `psvc-${idx}`}
                  className={styles.serviceCategoryCard}
                  onClick={() => handleOpenSetup(pSvc)}
                >
                  <div className={styles.serviceCategoryCardTop}>
                    <div
                      className={styles.serviceCategoryIconWrap}
                      style={{ background: meta.iconBg, color: meta.iconColor }}
                    >
                      <IconComp size={24} />
                    </div>
                    {isAlreadyActive ? (
                      <span className={styles.categoryActiveBadge}>Active</span>
                    ) : (
                      <span className={styles.categoryArrowPill}>
                        <FaArrowRight size={12} />
                      </span>
                    )}
                  </div>

                  <div className={styles.serviceCategoryContent}>
                    <h3 className={styles.serviceCategoryTitle}>{meta.title}</h3>
                    <p className={styles.serviceCategoryDesc}>{meta.description}</p>
                  </div>

                  <div className={styles.serviceCategoryFooter}>
                    <span>{isAlreadyActive ? "Manage Service" : "Configure & Setup"}</span>
                    <FaChevronRight size={12} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          VIEW 3: THE UNIFIED SETUP SCREEN ("Ek screen in sabki")
          Matches iOS RestaurentTypeVC -> AddRestInfoVC -> RestaurentSloganVC
          -> RestaurentLocationVC -> MenuCatVC -> CouponlistVC -> ReviewAllDetailVC
      ───────────────────────────────────────────────────────────── */}
      {viewMode === "setup" && (
        <div className={styles.flowCard}>
          {/* Top Bar with Back Button */}
          <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button className={styles.secondaryBtn} onClick={() => setViewMode(merchantServices.length > 0 ? "list" : "select")}>
              <FaArrowLeft size={13} />
              <span>Back to Services</span>
            </button>
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#4f46e5" }}>
              {form.serviceName || "Business"} Setup Wizard • Step {activeStep + 1} of {STEPS.length}
            </span>
          </div>

          {/* Sequential Step Pills (Horizontal Tabs) */}
          <div className={styles.flowNavbar}>
            {STEPS.map((step, idx) => (
              <button
                key={step.id}
                className={`${styles.stepPill} ${activeStep === idx ? styles.stepPillActive : ""}`}
                onClick={() => setActiveStep(idx)}
              >
                <span className={styles.stepPillNumber}>{idx + 1}</span>
                {step.Icon && <step.Icon size={14} />}
                <span>{step.label}</span>
              </button>
            ))}
          </div>

          <div className={styles.flowContent}>
            {/* STEP 1: Service Type (iOS RestaurentTypeVC / ServiceTypeVC) */}
            {activeStep === 0 && (
              <div>
                <div className={styles.sectionHeader}>
                  <h3>Select {form.serviceName || "Business"} Types & Specialties</h3>
                  <p>Choose every specialty and establishment type that applies to your {form.serviceName || "business"}.</p>
                </div>

                <div className={styles.typeTagsGrid}>
                  {loadingSubServices ? (
                    <div style={{ padding: "20px", color: "#64748b", display: "flex", alignItems: "center", gap: "8px" }}>
                      <FaSpinner className="fa-spin" size={16} />
                      <span>Loading types...</span>
                    </div>
                  ) : (
                    categorySubTypes.map((sub) => {
                      const subId = String(sub._id || sub.id || sub.subServicesName);
                      const subName = String(sub.subServicesName || sub.name || "");
                      const selected = form.serviceSubcategoryIds.some(
                        (saved) =>
                          saved === subId ||
                          (subName && saved.toLowerCase().trim() === subName.toLowerCase().trim())
                      );
                      return (
                        <button
                          key={subId}
                          type="button"
                          className={`${styles.typeTagBtn} ${selected ? styles.typeTagBtnSelected : ""}`}
                          onClick={() => toggleType(sub)}
                        >
                          <span>{subName}</span>
                          {selected ? (
                            <FaCircleCheck className="text-primary" size={16} />
                          ) : (
                            <FaCirclePlus className="text-muted" size={16} />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: Details */}
            {activeStep === 1 && (
              <div>
                <div className={styles.sectionHeader}>
                  <h3>{form.serviceName || "Business"} Details & Information</h3>
                  <p>Enter your primary brand name, specialty, contact information, and reservation policies.</p>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>{form.serviceName ? `${form.serviceName} Name` : "Business Name"} *</label>
                    <input
                      type="text"
                      value={form.serviceName}
                      onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
                      placeholder="e.g. Al-Bustan Fine Dining"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>{form.serviceName?.toLowerCase().includes("restaurant") ? "Primary Cuisine *" : "Specialty / Cuisine *"}</label>
                    <input
                      type="text"
                      value={form.cuisineName}
                      onChange={(e) => setForm({ ...form, cuisineName: e.target.value })}
                      placeholder="e.g. Italian, Mediterranean, Wedding Catering"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Contact Phone Number</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+966 50 123 4567"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Digital Menu URL (PDF / Online Menu)</label>
                    <input
                      type="url"
                      value={form.menuUrl}
                      onChange={(e) => setForm({ ...form, menuUrl: e.target.value })}
                      placeholder="https://example.com/menu.pdf"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Website / Social / Portfolio URL</label>
                    <input
                      type="url"
                      value={form.webUrl}
                      onChange={(e) => setForm({ ...form, webUrl: e.target.value })}
                      placeholder="https://yourbrand.com or Instagram URL"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Commercial Registration / Permit No.</label>
                    <input
                      type="text"
                      value={form.commercialPermitNumber}
                      onChange={(e) => setForm({ ...form, commercialPermitNumber: e.target.value })}
                      placeholder="e.g. 1010987654"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>VAT / Tax Identification No.</label>
                    <input
                      type="text"
                      value={form.vatNumber}
                      onChange={(e) => setForm({ ...form, vatNumber: e.target.value })}
                      placeholder="e.g. 310123456700003"
                    />
                  </div>

                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>{form.serviceName ? `${form.serviceName} Description` : "Description"}</label>
                    <textarea
                      rows={3}
                      value={form.serviceDescription}
                      onChange={(e) => setForm({ ...form, serviceDescription: e.target.value })}
                      placeholder="Briefly describe your offerings, specialties, and service options..."
                    />
                  </div>

                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={form.onlineReservation}
                        onChange={(e) => setForm({ ...form, onlineReservation: e.target.checked })}
                        style={{ width: "20px", height: "20px" }}
                      />
                      <span><strong>Enable Online Bookings / Reservations</strong> (Allow customers to book directly through the app)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Banner & Slogan */}
            {activeStep === 2 && (
              <div>
                <div className={styles.sectionHeader}>
                  <h3>Marketing Slogan & Brand Banner</h3>
                  <p>Upload a high-resolution hero photo and a memorable promotional slogan.</p>
                </div>

                <div className={styles.formGrid}>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>{form.serviceName || "Business"} Slogan / Catchphrase</label>
                    <input
                      type="text"
                      value={form.serviceSlogan}
                      onChange={(e) => setForm({ ...form, serviceSlogan: e.target.value })}
                      placeholder="e.g. Authentic Flavors, Unforgettable Evenings"
                    />
                  </div>

                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Hero Banner Photo / Cover Image</label>
                    <input type="file" accept="image/*" onChange={handleBannerChange} />
                    {bannerPreview && (
                      <div style={{ marginTop: "14px", position: "relative" }}>
                        <img
                          src={bannerPreview}
                          alt="Banner Preview"
                          style={{ width: "100%", maxHeight: "240px", objectFit: "cover", borderRadius: "14px", border: "1px solid #e2e8f0" }}
                        />
                        <span style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(15, 23, 42, 0.75)", color: "#ffffff", padding: "4px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: "600", backdropFilter: "blur(4px)" }}>
                          Active Cover Banner
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Locations & Hours (iOS RestaurentLocationVC + AdditonalinfoLocationVC + OpenHoursVC + AddPhotosVideoVC) */}
            {activeStep === 3 && (
              <div>
                <div className={styles.sectionHeader}>
                  <h3>Branch Locations, Capacity & Shift Hours</h3>
                  <p>Configure multiple branches, seating capacity, daily operating hours, and location media.</p>
                </div>

                {/* Existing branches (iOS RestaurentLocationVC) */}
                <div style={{ marginBottom: "28px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                      Registered Branches ({locations.length})
                    </h4>
                    {editingLocId && (
                      <button
                        type="button"
                        onClick={handleCancelEditLocation}
                        style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                      >
                        + Add Another Branch
                      </button>
                    )}
                  </div>

                  {locations.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", background: "#f8fafc", borderRadius: "14px", border: "1px dashed #cbd5e1" }}>
                      <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>No branches registered yet. Fill the complete branch form below to add one.</p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "14px" }}>
                      {locations.map((loc, i) => {
                        const isCurrent = (loc._id || loc.id) === editingLocId;
                        const mediaItem = Array.isArray(loc.locationPhotoVideoList) && loc.locationPhotoVideoList.length > 0 ? loc.locationPhotoVideoList[0] : null;
                        const branchPhotoUrl = mediaItem?.url || mediaItem?.file || loc.locationPhoto || loc.photo || loc.image || "";
                        return (
                          <div
                            key={i}
                            style={{
                              padding: "16px",
                              border: isCurrent ? "2px solid #4f46e5" : "1px solid #e2e8f0",
                              borderRadius: "14px",
                              background: isCurrent ? "#eef2ff" : "#ffffff",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                            }}
                          >
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", gap: "10px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                                  {branchPhotoUrl ? (
                                    <div style={{ width: "46px", height: "46px", borderRadius: "8px", overflow: "hidden", border: "1px solid #cbd5e1", flexShrink: 0, background: "#f1f5f9" }}>
                                      <img
                                        src={branchPhotoUrl}
                                        alt={loc.addressName}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        onError={(e) => { e.target.style.display = "none"; }}
                                      />
                                    </div>
                                  ) : (
                                    <div style={{ width: "46px", height: "46px", borderRadius: "8px", background: "#f1f5f9", display: "grid", placeItems: "center", color: "#6366f1", flexShrink: 0, fontSize: "16px" }}>
                                      🏢
                                    </div>
                                  )}
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <strong style={{ fontSize: "15px", color: "#0f172a", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                      {loc.addressName || `Branch #${i + 1}`}
                                    </strong>
                                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                      {loc.address}
                                    </p>
                                  </div>
                                </div>
                                <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 8px", background: "#ecfdf5", color: "#059669", borderRadius: "999px", flexShrink: 0 }}>
                                  Active
                                </span>
                              </div>

                              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                                <span style={{ fontSize: "12px", padding: "3px 8px", background: "#f1f5f9", borderRadius: "6px", color: "#334155" }}>
                                  👥 Capacity: {loc.capacity || 100}
                                </span>
                                {loc.locationPhone && (
                                  <span style={{ fontSize: "12px", padding: "3px 8px", background: "#f1f5f9", borderRadius: "6px", color: "#334155" }}>
                                    📞 {loc.locationPhone}
                                  </span>
                                )}
                                <span style={{ fontSize: "12px", padding: "3px 8px", background: loc.onlineReservationLocation !== false ? "#eff6ff" : "#fef2f2", color: loc.onlineReservationLocation !== false ? "#2563eb" : "#dc2626", borderRadius: "6px" }}>
                                  Reservations: {loc.onlineReservationLocation !== false ? "Yes" : "No"}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "10px" }}>
                              <button
                                type="button"
                                onClick={() => handleEditLocation(loc)}
                                style={{
                                  flex: 1,
                                  padding: "7px 12px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  borderRadius: "8px",
                                  border: "1px solid #c7d2fe",
                                  background: "#ffffff",
                                  color: "#4f46e5",
                                  cursor: "pointer",
                                  textAlign: "center",
                                }}
                              >
                                ✏️ Edit Branch & Hours
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Add / Edit Branch Complete Form */}
                <div
                  id="branch-config-form"
                  style={{
                    padding: "24px",
                    border: editingLocId ? "2px solid #4f46e5" : "1.5px dashed #cbd5e1",
                    borderRadius: "18px",
                    background: "#ffffff",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h4 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                      {editingLocId ? "✏️ Edit Branch Details & Operational Settings" : "+ Add New Branch & Shift Hours"}
                    </h4>
                    {editingLocId && (
                      <button
                        type="button"
                        onClick={handleCancelEditLocation}
                        style={{ fontSize: "13px", color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  {/* Section 1: Address & Coordinates (iOS AddressChooseVC) */}
                  <div style={{ marginBottom: "22px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      1. Branch Location & Coordinates
                    </span>
                    <div className={styles.formGrid} style={{ marginTop: "12px" }}>
                      <div className={styles.formGroup}>
                        <label>Branch Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Flagship Downtown Dine"
                          value={locationForm.addressName}
                          onChange={(e) => setLocationForm({ ...locationForm, addressName: e.target.value })}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Street Address *</label>
                        <input
                          type="text"
                          placeholder="Street, District, City, Country"
                          value={locationForm.address}
                          onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                        />
                      </div>
                      <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                        <label>Select Precise Coordinates on Map</label>
                        <LocationMapPicker
                          address={locationForm.address}
                          lat={locationForm.lat}
                          lng={locationForm.long}
                          onSelect={(loc) =>
                            setLocationForm((prev) => ({
                              ...prev,
                              addressName: prev.addressName || loc.addressName || "",
                              address: loc.address || prev.address,
                              lat: String(loc.lat),
                              long: String(loc.long || loc.lng),
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Additional Info & Policies */}
                  <div style={{ marginBottom: "22px", borderTop: "1px solid #f1f5f9", paddingTop: "18px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      2. Capacity & Reservation Policies
                    </span>
                    <div className={styles.formGrid} style={{ marginTop: "12px" }}>
                      <div className={styles.formGroup}>
                        <label>Guest / Seating Capacity</label>
                        <input
                          type="number"
                          placeholder="e.g. 200"
                          value={locationForm.capacity}
                          onChange={(e) => setLocationForm({ ...locationForm, capacity: e.target.value })}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Branch Contact Phone</label>
                        <input
                          type="tel"
                          placeholder="+966 50 123 4567"
                          value={locationForm.locationPhone}
                          onChange={(e) => setLocationForm({ ...locationForm, locationPhone: e.target.value })}
                        />
                      </div>
                      <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                        <label>Link to Floor Plan Layout (PDF / Image URL)</label>
                        <input
                          type="url"
                          placeholder="https://yourdomain.com/floorplans/downtown.pdf"
                          value={locationForm.floorPlan}
                          onChange={(e) => setLocationForm({ ...locationForm, floorPlan: e.target.value })}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "600", color: "#1e293b" }}>
                          <input
                            type="checkbox"
                            checked={locationForm.onlineReservationLocation}
                            onChange={(e) => setLocationForm({ ...locationForm, onlineReservationLocation: e.target.checked })}
                            style={{ width: "18px", height: "18px" }}
                          />
                          Accept Online Reservations at this branch
                        </label>
                      </div>
                      <div className={styles.formGroup}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "600", color: "#1e293b" }}>
                          <input
                            type="checkbox"
                            checked={locationForm.acceptPreorder}
                            onChange={(e) => setLocationForm({ ...locationForm, acceptPreorder: e.target.checked })}
                            style={{ width: "18px", height: "18px" }}
                          />
                          Accept Food & Beverage Pre-order
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Operating Shifts & Shift Hours */}
                  <div style={{ marginBottom: "22px", borderTop: "1px solid #f1f5f9", paddingTop: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        3. Operating Shifts & Opening Hours
                      </span>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", color: "#334155", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={locationForm.openTwoShifts}
                          onChange={(e) => setLocationForm({ ...locationForm, openTwoShifts: e.target.checked })}
                          style={{ width: "16px", height: "16px" }}
                        />
                        Open Two Shifts Daily (Morning & Evening)
                      </label>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead>
                          <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                            <th style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0" }}>Day</th>
                            <th style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0" }}>Morning Shift (From - To)</th>
                            {locationForm.openTwoShifts && (
                              <th style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0" }}>Evening Shift (From - To)</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {(weeklySchedule || []).map((s, idx) => (
                            <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "10px 12px", fontWeight: "600", color: "#1e293b" }}>{s.day}</td>
                              <td style={{ padding: "10px 12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <input
                                    type="time"
                                    value={s.morning?.from || "09:00"}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setWeeklySchedule((prev) =>
                                        prev.map((item, i) =>
                                          i === idx ? { ...item, morning: { ...item.morning, from: val } } : item
                                        )
                                      );
                                    }}
                                    style={{ padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                                  />
                                  <span>to</span>
                                  <input
                                    type="time"
                                    value={s.morning?.to || "14:00"}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setWeeklySchedule((prev) =>
                                        prev.map((item, i) =>
                                          i === idx ? { ...item, morning: { ...item.morning, to: val } } : item
                                        )
                                      );
                                    }}
                                    style={{ padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                                  />
                                </div>
                              </td>
                              {locationForm.openTwoShifts && (
                                <td style={{ padding: "10px 12px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <input
                                      type="time"
                                      value={s.evening?.from || "17:00"}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setWeeklySchedule((prev) =>
                                          prev.map((item, i) =>
                                            i === idx ? { ...item, evening: { ...item.evening, from: val } } : item
                                          )
                                        );
                                      }}
                                      style={{ padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                                    />
                                    <span>to</span>
                                    <input
                                      type="time"
                                      value={s.evening?.to || "23:00"}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setWeeklySchedule((prev) =>
                                          prev.map((item, i) =>
                                            i === idx ? { ...item, evening: { ...item.evening, to: val } } : item
                                          )
                                        );
                                      }}
                                      style={{ padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                                    />
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 4: Location Photo Gallery */}
                  <div style={{ marginBottom: "24px", borderTop: "1px solid #f1f5f9", paddingTop: "18px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      4. Branch Photos & Media Gallery
                    </span>
                    <div className={styles.formGrid} style={{ marginTop: "12px" }}>
                      <div className={styles.formGroup}>
                        <label>Upload Branch Photo / Interior</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLocationPhotoChange}
                          style={{ padding: "8px", border: "1px solid #cbd5e1", borderRadius: "8px" }}
                        />
                        {locationPhotoPreview && (
                          <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "14px", padding: "10px 14px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                            <div style={{
                              width: "100px",
                              height: "70px",
                              borderRadius: "8px",
                              overflow: "hidden",
                              border: "2px solid #6366f1",
                              background: "#e0e7ff",
                              flexShrink: 0,
                            }}>
                              <img
                                src={locationPhotoPreview}
                                alt="Branch Preview"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e) => {
                                  e.target.src = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80";
                                }}
                              />
                            </div>
                            <div style={{ fontSize: "12px", color: "#475569", flex: 1 }}>
                              <span style={{ fontWeight: "700", display: "block", color: "#1e293b", marginBottom: "2px" }}>
                                {editingLocId && !locationPhoto ? "Current Saved Branch Photo" : "Selected Photo Preview"}
                              </span>
                              <span style={{ color: "#64748b", display: "block", fontSize: "11px", wordBreak: "break-all" }}>
                                {locationPhoto ? locationPhoto.name : (locationPhotoDesc || "Active branch photo")}
                              </span>
                              {locationPhoto && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLocationPhoto(null);
                                    // revert to existing photo if editing
                                    const loc = locations.find((l) => (l._id || l.id) === editingLocId);
                                    const mediaItem = loc?.locationPhotoVideoList?.[0];
                                    setLocationPhotoPreview(mediaItem?.url || mediaItem?.file || loc?.image || "");
                                  }}
                                  style={{ marginTop: "4px", color: "#ef4444", fontSize: "11px", fontWeight: "600", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                                >
                                  ✕ Revert new photo
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={styles.formGroup}>
                        <label>Photo Description / Caption</label>
                        <input
                          type="text"
                          placeholder="e.g. VIP Dining Area or Main Entrance"
                          value={locationPhotoDesc}
                          onChange={(e) => setLocationPhotoDesc(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <button className={styles.primaryBtn} onClick={handleAddLocation} disabled={saving}>
                      {saving ? (
                        <>
                          <FaSpinner className="fa-spin" size={13} />
                          <span>Saving Branch...</span>
                        </>
                      ) : (
                        <>
                          <FaPlus size={13} />
                          <span>{editingLocId ? "Update Branch Details & Hours" : "Save Branch Location & Hours"}</span>
                        </>
                      )}
                    </button>
                    {editingLocId && (
                      <button
                        type="button"
                        onClick={handleCancelEditLocation}
                        style={{ padding: "10px 18px", border: "1px solid #cbd5e1", background: "#f8fafc", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Menu & Catalog (iOS MenuCatVC + AddItemVC) */}
            {activeStep === 4 && (
              <div>
                <div className={styles.sectionHeader}>
                  <h3>Menu Categories & Dish Catalog</h3>
                  <p>Organize your dining menu into categories and add signature dishes.</p>
                </div>

                {/* Categories */}
                <div style={{ marginBottom: "24px" }}>
                  <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "12px", color: "#0f172a" }}>
                    Active Categories (Click to view dishes)
                  </h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
                    {categories.length > 0 ? (
                      categories.map((c, i) => {
                        const cId = c._id || c.id || c.name;
                        const isCurrent = cId === selectedCategoryId;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSelectCategory(cId)}
                            style={{
                              padding: "8px 18px",
                              background: isCurrent ? "#4f46e5" : "#f1f5f9",
                              color: isCurrent ? "#ffffff" : "#334155",
                              border: isCurrent ? "1.5px solid #4f46e5" : "1px solid #cbd5e1",
                              borderRadius: "999px",
                              fontSize: "13px",
                              fontWeight: "600",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              transition: "all 0.2s ease",
                            }}
                          >
                            <span>{c.name}</span>
                            {isCurrent && <FaCircleCheck size={14} />}
                          </button>
                        );
                      })
                    ) : (
                      <p style={{ color: "#64748b", fontSize: "14px" }}>No categories created yet.</p>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "10px", maxWidth: "480px", marginBottom: "28px" }}>
                    <input
                      type="text"
                      placeholder="New category name (e.g. Appetizers)"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      style={{ flex: 1, padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "10px" }}
                    />
                    <button className={styles.primaryBtn} onClick={handleAddCategory} disabled={saving}>
                      <span>+ Add Category</span>
                    </button>
                  </div>

                  {/* Dishes for Current Category */}
                  <div style={{ marginBottom: "28px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                        Menu Items in {categories.find((c) => (c._id || c.id || c.name) === selectedCategoryId)?.name || "Category"} ({dishes.length})
                      </h4>
                    </div>

                    {loadingDishes ? (
                      <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                        <FaSpinner className="fa-spin" size={20} />
                        <p style={{ marginTop: "10px", fontSize: "13px" }}>Loading menu items...</p>
                      </div>
                    ) : dishes.length === 0 ? (
                      <div style={{ padding: "24px", textAlign: "center", background: "#f8fafc", borderRadius: "14px", border: "1px dashed #cbd5e1" }}>
                        <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>No items added to this category yet. Use the form below to add signature dishes.</p>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
                        {dishes.map((d, idx) => {
                          const dishPhotoUrl = Array.isArray(d.photo) && d.photo[0]
                            ? d.photo[0].fileName || d.photo[0].name || d.photo[0]
                            : d.image || "";
                          const safePhotoUrl = dishPhotoUrl && String(dishPhotoUrl).startsWith("http")
                            ? dishPhotoUrl
                            : dishPhotoUrl
                            ? `https://event-una-image-bucket.s3.amazonaws.com/merchant/products/${dishPhotoUrl}`
                            : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80";

                          return (
                            <div
                              key={d._id || idx}
                              style={{
                                padding: "14px",
                                background: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "14px",
                                display: "flex",
                                gap: "12px",
                                alignItems: "center",
                                justifyContent: "space-between",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                              }}
                            >
                              <img
                                src={safePhotoUrl}
                                alt={d.name}
                                style={{ width: "64px", height: "64px", borderRadius: "10px", objectFit: "cover" }}
                              />
                              <div style={{ flex: 1, minWidth: 0, paddingRight: "8px" }}>
                                <strong style={{ display: "block", fontSize: "14px", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {d.name}
                                </strong>
                                <span style={{ display: "inline-block", fontSize: "12px", fontWeight: "700", color: "#4f46e5", marginTop: "2px" }}>
                                  SAR {d.price}
                                </span>
                                {d.description && (
                                  <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {d.description}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteDish(d)}
                                style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", borderRadius: "8px", padding: "8px", cursor: "pointer" }}
                                title="Delete Dish"
                              >
                                <FaTrashCan size={13} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Add Dish form */}
                  <div style={{ padding: "20px", border: "1.5px dashed #cbd5e1", borderRadius: "16px", background: "#ffffff" }}>
                    <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>+ Add Dish to Menu</h4>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label>Dish Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Butter Chicken Deluxe"
                          value={newDish.name}
                          onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Category *</label>
                        <select
                          value={newDish.categoryId || selectedCategoryId}
                          onChange={(e) => setNewDish({ ...newDish, categoryId: e.target.value })}
                          style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "10px", width: "100%", background: "#fff" }}
                        >
                          <option value="">Select Category</option>
                          {categories.map((c, i) => (
                            <option key={i} value={c._id || c.id || c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Price (SAR / Currency) *</label>
                        <input
                          type="number"
                          placeholder="e.g. 45"
                          value={newDish.price}
                          onChange={(e) => setNewDish({ ...newDish, price: e.target.value })}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Dish Photo</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleDishPhotoChange}
                          style={{ padding: "6px", border: "1px solid #cbd5e1", borderRadius: "8px" }}
                        />
                        {dishPhotoPreview && (
                          <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "10px", padding: "6px 10px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <img
                              src={dishPhotoPreview}
                              alt="Dish Preview"
                              style={{ width: "48px", height: "48px", borderRadius: "6px", objectFit: "cover", border: "1.5px solid #6366f1" }}
                            />
                            <div style={{ fontSize: "11px", color: "#475569" }}>
                              <span style={{ fontWeight: "600", display: "block", color: "#1e293b" }}>Selected Photo</span>
                              <span>{dishPhoto?.name}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                        <label>Description</label>
                        <input
                          type="text"
                          placeholder="Ingredients, preparation and serving style..."
                          value={newDish.description}
                          onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
                        />
                      </div>
                    </div>
                    <button className={styles.primaryBtn} onClick={handleAddDish} disabled={saving} style={{ marginTop: "12px" }}>
                      <span>+ Add Dish</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: Coupons */}
            {activeStep === 5 && (
              <div>
                <div className={styles.sectionHeader}>
                  <h3>Promotional Coupons & Customer Discounts</h3>
                  <p>Launch discount vouchers and seasonal booking promotions.</p>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "12px", color: "#0f172a" }}>
                    Active Coupons ({coupons.length})
                  </h4>

                  {coupons.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1", marginBottom: "20px" }}>
                      <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>No active coupons found. Create your first promotional coupon below.</p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px", marginBottom: "24px" }}>
                      {coupons.map((c, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "16px",
                            border: "1px solid #e0e7ff",
                            borderRadius: "14px",
                            background: "#ffffff",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                              <span style={{ fontSize: "20px", fontWeight: "800", color: "#4f46e5" }}>
                                {c.discount}% OFF
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteCoupon(c)}
                                style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
                                title="Delete Coupon"
                              >
                                <FaTrashCan size={14} />
                              </button>
                            </div>
                            <strong style={{ fontSize: "15px", color: "#0f172a", display: "block", marginBottom: "4px" }}>
                              {c.couponName}
                            </strong>
                            <p style={{ fontSize: "12px", color: "#64748b", margin: 0, marginBottom: "8px", lineHeight: "1.4" }}>
                              {c.description || "General booking promotion"}
                            </p>
                          </div>
                          {(c.validFrom || c.validTo) && (
                            <div style={{ fontSize: "11px", color: "#94a3b8", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
                              Valid: {c.validFrom || "Start"} to {c.validTo || "Open"}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add coupon form */}
                  <div style={{ padding: "24px", border: "1.5px dashed #cbd5e1", borderRadius: "18px", background: "#ffffff", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
                    <h4 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: "#0f172a" }}>
                      + Create New Coupon
                    </h4>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label>Coupon Code *</label>
                        <input
                          type="text"
                          placeholder="e.g. WELCOME25"
                          value={newCoupon.couponName}
                          onChange={(e) => setNewCoupon({ ...newCoupon, couponName: e.target.value.toUpperCase() })}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Discount Percentage (%) *</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          placeholder="e.g. 20"
                          value={newCoupon.discount}
                          onChange={(e) => setNewCoupon({ ...newCoupon, discount: e.target.value })}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Valid From (Start Date)</label>
                        <input
                          type="date"
                          value={newCoupon.validFrom}
                          onChange={(e) => setNewCoupon({ ...newCoupon, validFrom: e.target.value })}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Valid To (Expiration Date)</label>
                        <input
                          type="date"
                          value={newCoupon.validTo}
                          onChange={(e) => setNewCoupon({ ...newCoupon, validTo: e.target.value })}
                        />
                      </div>
                      <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                        <label>Promotion Description</label>
                        <input
                          type="text"
                          placeholder="e.g. Special weekend festival discount on all table reservations"
                          value={newCoupon.description}
                          onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                        />
                      </div>
                    </div>
                    <button className={styles.primaryBtn} onClick={handleAddCoupon} disabled={saving} style={{ marginTop: "14px" }}>
                      {saving ? (
                        <>
                          <FaSpinner className="fa-spin" size={13} />
                          <span>Saving Coupon...</span>
                        </>
                      ) : (
                        <span>Save & Activate Coupon</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: Review & Submit (iOS ReviewAllDetailVC) */}
            {activeStep === 6 && (
              <div>
                <div className={styles.sectionHeader}>
                  <h3>Review Your Service & Publish</h3>
                  <p>Check your complete restaurant service configuration before publishing.</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", padding: "20px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Service / Business Name</span>
                    <strong style={{ display: "block", fontSize: "16px", color: "#0f172a" }}>{form.serviceName}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Specialty / Cuisine</span>
                    <strong style={{ display: "block", fontSize: "16px", color: "#0f172a" }}>{form.cuisineName || "Not set"}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Phone Number</span>
                    <strong style={{ display: "block", fontSize: "15px", color: "#0f172a" }}>{form.phone || "Not set"}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Website / Social URL</span>
                    <strong style={{ display: "block", fontSize: "14px", color: "#4f46e5", wordBreak: "break-all" }}>{form.webUrl || "Not set"}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Digital Menu URL</span>
                    <strong style={{ display: "block", fontSize: "14px", color: "#4f46e5", wordBreak: "break-all" }}>{form.menuUrl || "Not set"}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Commercial Permit No.</span>
                    <strong style={{ display: "block", fontSize: "15px", color: "#0f172a" }}>{form.commercialPermitNumber || "Not set"}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>VAT / Tax Identification No.</span>
                    <strong style={{ display: "block", fontSize: "15px", color: "#0f172a" }}>{form.vatNumber || "Not set"}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Slogan / Catchphrase</span>
                    <strong style={{ display: "block", fontSize: "15px", color: "#0f172a" }}>{form.serviceSlogan || "Not set"}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Registered Branches</span>
                    <strong style={{ display: "block", fontSize: "16px", color: "#0f172a" }}>{locations.length} Branch(es)</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Menu Categories</span>
                    <strong style={{ display: "block", fontSize: "16px", color: "#0f172a" }}>{categories.length} Categories</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Active Coupons</span>
                    <strong style={{ display: "block", fontSize: "16px", color: "#0f172a" }}>{coupons.length} Active</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Online Reservations</span>
                    <strong style={{ display: "block", fontSize: "16px", color: form.onlineReservation ? "#16a34a" : "#64748b" }}>
                      {form.onlineReservation ? "✓ Enabled" : "Disabled"}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls with Prev / Next / Submit */}
          <div className={styles.flowFooter}>
            {activeStep > 0 ? (
              <button className={styles.secondaryBtn} onClick={() => setActiveStep((prev) => prev - 1)}>
                <FaArrowLeft size={13} />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {activeStep < STEPS.length - 1 ? (
              <button className={styles.primaryBtn} onClick={() => setActiveStep((prev) => prev + 1)}>
                <span>Continue & Next Step</span>
                <FaArrowRight size={13} />
              </button>
            ) : (
              <button className={styles.primaryBtn} onClick={handleSaveAll} disabled={saving}>
                {saving ? (
                  <>
                    <FaSpinner className="fa-spin" size={14} />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <FaCircleCheck size={14} />
                    <span>Publish {form.serviceName || "Business"} Service</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
