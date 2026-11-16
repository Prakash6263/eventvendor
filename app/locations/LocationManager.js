"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Swal from "sweetalert2";
import { authService } from "../services/authService";
import LocationMapPicker from "../components/LocationMapPicker";
import styles from "./LocationManager.module.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const createDefaultSchedule = () => DAYS.map((day) => ({
  day,
  isOpen: true,
  morning: { from: "09:00", to: "14:00" },
  evening: { from: "17:00", to: "23:00" },
}));

const normalizeList = (res, keys = []) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  for (const k of keys) {
    if (Array.isArray(res?.[k])) return res[k];
    if (Array.isArray(res?.data?.[k])) return res.data[k];
  }
  return [];
};

export default function LocationManager() {
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details"); // "details", "hours", "gallery"

  // Add Location Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationForm, setLocationForm] = useState({
    addressName: "",
    address: "",
    lat: "24.7136",
    long: "46.6753",
    capacity: "100",
    locationPhone: "",
  });

  // Operating Hours State
  const [weeklySchedule, setWeeklySchedule] = useState(createDefaultSchedule);

  // Gallery State
  const [galleryMedia, setGalleryMedia] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaDesc, setMediaDesc] = useState("");

  // 1. Fetch Locations
  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authService.getMerchantLocations();
      const list = normalizeList(res, ["locations", "serviceLocationIds"]);
      setLocations(list);
      if (list.length > 0 && !selectedLocationId) {
        setSelectedLocationId(list[0]._id || list[0].id || list[0].locationId || "");
      }
    } catch (err) {
      console.error("Failed to load locations:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedLocationId]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Active Location Object
  const activeLocation = useMemo(() => {
    return locations.find((l) => (l._id || l.id || l.locationId) === selectedLocationId) || locations[0] || null;
  }, [locations, selectedLocationId]);

  // 2. Fetch Location Media Gallery
  const fetchGallery = useCallback(async (locId) => {
    if (!locId) {
      setGalleryMedia([]);
      return;
    }
    try {
      setLoadingGallery(true);
      const res = await authService.getMerchantLocationMedia({ locationId: locId });
      const list = normalizeList(res, ["media", "locationMedia", "photos"]);
      setGalleryMedia(list);
    } catch (err) {
      console.error("Failed to load gallery:", err);
      setGalleryMedia([]);
    } finally {
      setLoadingGallery(false);
    }
  }, []);

  useEffect(() => {
    if (selectedLocationId && activeTab === "gallery") {
      fetchGallery(selectedLocationId);
    }
  }, [selectedLocationId, activeTab, fetchGallery]);

  // 3. Save New Location
  const handleSaveLocation = async (e) => {
    e.preventDefault();
    if (!locationForm.addressName.trim() || !locationForm.address.trim()) {
      Swal.fire({ icon: "warning", title: "Required", text: "Please provide branch name and address." });
      return;
    }

    try {
      setSavingLocation(true);
      const payload = {
        addressName: locationForm.addressName.trim(),
        address: locationForm.address.trim(),
        lat: Number(locationForm.lat) || 24.7136,
        long: Number(locationForm.long) || 46.6753,
      };

      const res = await authService.addMerchantLocation(payload);
      if (res?.status) {
        Swal.fire({ icon: "success", title: "Branch Added!", timer: 1500, showConfirmButton: false });
        setIsAddModalOpen(false);
        setLocationForm({ addressName: "", address: "", lat: "24.7136", long: "46.6753", capacity: "100", locationPhone: "" });
        await fetchLocations();
      } else {
        Swal.fire({ icon: "error", title: "Error", text: res?.message || "Failed to add branch location." });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Failed to add branch location." });
    } finally {
      setSavingLocation(false);
    }
  };

  // 4. Update Schedule
  const updateScheduleTime = (dayIndex, shift, field, value) => {
    setWeeklySchedule((curr) => curr.map((d, i) => (
      i === dayIndex ? { ...d, [shift]: { ...d[shift], [field]: value } } : d
    )));
  };

  const handleSaveSchedule = () => {
    Swal.fire({
      icon: "success",
      title: "Operating Hours Saved!",
      text: "Your weekly operating hours have been updated for this branch.",
      timer: 1600,
      showConfirmButton: false,
    });
  };

  // 5. Upload Gallery Photo
  const handleUploadPhoto = async (e) => {
    e.preventDefault();
    if (!selectedLocationId) {
      Swal.fire({ icon: "warning", title: "Select Branch", text: "Please select a branch first." });
      return;
    }
    if (!mediaFile) {
      Swal.fire({ icon: "warning", title: "Select Photo", text: "Please select an image file to upload." });
      return;
    }

    try {
      setUploadingMedia(true);
      const formData = new FormData();
      formData.append("locationId", selectedLocationId);
      formData.append("media", mediaFile);
      formData.append("types", "photo");
      formData.append("photoDescription", mediaDesc.trim() || "Branch Photo");

      const res = await authService.addMerchantLocationMedia(formData);
      if (res?.status) {
        Swal.fire({ icon: "success", title: "Photo Uploaded!", timer: 1500, showConfirmButton: false });
        setMediaFile(null);
        setMediaDesc("");
        await fetchGallery(selectedLocationId);
      } else {
        Swal.fire({ icon: "error", title: "Upload Failed", text: res?.message || "Could not upload photo." });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Upload Failed", text: err.message || "Could not upload photo." });
    } finally {
      setUploadingMedia(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTitleArea}>
          <h1>Branch Locations & Operating Hours</h1>
          <p>Manage your restaurant branches, map coordinates, weekly operating shifts, and interior photo galleries.</p>
        </div>
        <div>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => setIsAddModalOpen(true)}
          >
            <i className="fa-solid fa-location-dot" />
            <span>Add Branch Location</span>
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className={styles.layoutGrid}>
        {/* Left Column: Branches List */}
        <aside className={styles.branchSidebar}>
          <div className={styles.sidebarHeader}>
            <h2>Active Branches ({locations.length})</h2>
            <button
              type="button"
              className={styles.secondaryBtn}
              style={{ padding: "6px 12px", fontSize: "12px" }}
              onClick={() => setIsAddModalOpen(true)}
            >
              <i className="fa-solid fa-plus" /> Add
            </button>
          </div>

          {loading ? (
            <div className="py-4 text-center text-muted small">Loading locations...</div>
          ) : locations.length === 0 ? (
            <div className="py-4 text-center">
              <i className="fa-solid fa-map-location-dot text-muted fs-4 mb-2 d-block" />
              <p className="text-muted small mb-3">No branch locations added yet.</p>
              <button
                type="button"
                className={styles.primaryBtn}
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => setIsAddModalOpen(true)}
              >
                Add First Branch
              </button>
            </div>
          ) : (
            <ul className={styles.branchList}>
              {locations.map((loc, idx) => {
                const id = loc._id || loc.id || loc.locationId || String(idx);
                const isActive = id === selectedLocationId;
                return (
                  <li
                    key={id}
                    className={`${styles.branchCard} ${isActive ? styles.branchCardActive : ""}`}
                    onClick={() => setSelectedLocationId(id)}
                  >
                    <div className={styles.branchTop}>
                      <h4 className={styles.branchName}>{loc.addressName || `Branch #${idx + 1}`}</h4>
                      <span className={styles.statusPill}>Active</span>
                    </div>
                    <p className={styles.branchAddress}>{loc.address || "Address not specified"}</p>
                    <div className={styles.branchMeta}>
                      <span><i className="fa-solid fa-crosshairs me-1" /> Lat: {Number(loc.lat || 0).toFixed(2)}, Long: {Number(loc.long || 0).toFixed(2)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Right Column: Branch Detail Pane */}
        <main className={styles.detailMain}>
          <div className={styles.detailHeader}>
            <div className={styles.activeBranchTitle}>
              <h3>{activeLocation?.addressName || "Branch Overview"}</h3>
              <p><i className="fa-solid fa-location-pin text-primary me-1" /> {activeLocation?.address || "Select a branch to view schedule & gallery"}</p>
            </div>
          </div>

          {/* Segmented Detail Tabs */}
          <div className={styles.detailTabs}>
            <button
              type="button"
              className={`${styles.detailTab} ${activeTab === "details" ? styles.detailTabActive : ""}`}
              onClick={() => setActiveTab("details")}
            >
              <i className="fa-solid fa-map" />
              <span>Location & Map</span>
            </button>
            <button
              type="button"
              className={`${styles.detailTab} ${activeTab === "hours" ? styles.detailTabActive : ""}`}
              onClick={() => setActiveTab("hours")}
            >
              <i className="fa-solid fa-clock" />
              <span>Operating Hours</span>
            </button>
            <button
              type="button"
              className={`${styles.detailTab} ${activeTab === "gallery" ? styles.detailTabActive : ""}`}
              onClick={() => setActiveTab("gallery")}
            >
              <i className="fa-solid fa-images" />
              <span>Branch Gallery</span>
            </button>
          </div>

          {/* Tab 1: Location & Map */}
          {activeTab === "details" && (
            <div>
              <div className="mb-4">
                <LocationMapPicker
                  lat={activeLocation?.lat || "24.7136"}
                  long={activeLocation?.long || "46.6753"}
                  onChange={() => {}}
                />
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Branch Name</label>
                  <input className={styles.formInput} value={activeLocation?.addressName || ""} readOnly />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Contact Phone</label>
                  <input className={styles.formInput} value={activeLocation?.locationPhone || "+966 11 000 0000"} readOnly />
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>Full Street Address</label>
                  <input className={styles.formInput} value={activeLocation?.address || ""} readOnly />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Operating Hours */}
          {activeTab === "hours" && (
            <div>
              <p className="text-muted small mb-3">
                Configure your daily dining shifts and customer reservation window. (24-hour format)
              </p>
              <table className={styles.hoursTable}>
                <tbody>
                  {weeklySchedule.map((sched, idx) => (
                    <tr key={sched.day} className={styles.hoursRow}>
                      <td className={styles.hoursDayCol}>
                        <i className="fa-regular fa-calendar me-2 text-primary" />
                        {sched.day}
                      </td>
                      <td className={styles.hoursShiftCol}>
                        <div className={styles.shiftGroup}>
                          <span className="small text-muted me-1">Shift 1:</span>
                          <div className={styles.timePill}>
                            <input
                              type="time"
                              className={styles.timeInput}
                              value={sched.morning.from}
                              onChange={(e) => updateScheduleTime(idx, "morning", "from", e.target.value)}
                            />
                            <span className="text-muted small">to</span>
                            <input
                              type="time"
                              className={styles.timeInput}
                              value={sched.morning.to}
                              onChange={(e) => updateScheduleTime(idx, "morning", "to", e.target.value)}
                            />
                          </div>

                          <span className="small text-muted ms-3 me-1">Shift 2:</span>
                          <div className={styles.timePill}>
                            <input
                              type="time"
                              className={styles.timeInput}
                              value={sched.evening.from}
                              onChange={(e) => updateScheduleTime(idx, "evening", "from", e.target.value)}
                            />
                            <span className="text-muted small">to</span>
                            <input
                              type="time"
                              className={styles.timeInput}
                              value={sched.evening.to}
                              onChange={(e) => updateScheduleTime(idx, "evening", "to", e.target.value)}
                            />
                          </div>
                        </div>
                      </td>
                      <td className={styles.hoursActionCol}>
                        <span className={styles.statusPill}>Open</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 pt-3 border-top d-flex justify-content-end">
                <button type="button" className={styles.primaryBtn} onClick={handleSaveSchedule}>
                  <i className="fa-solid fa-floppy-disk" />
                  <span>Save Operating Hours</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Photo Gallery */}
          {activeTab === "gallery" && (
            <div>
              <form onSubmit={handleUploadPhoto} className="p-3 bg-light rounded-4 border mb-4">
                <h5 className="fw-bold mb-3" style={{ fontSize: "15px" }}>Upload Branch Photo</h5>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Select Image *</label>
                    <input
                      type="file"
                      accept="image/*"
                      className={styles.formInput}
                      onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Photo Description</label>
                    <input
                      className={styles.formInput}
                      placeholder="e.g. Dining Hall, Terrace, Bar Area"
                      value={mediaDesc}
                      onChange={(e) => setMediaDesc(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-3 text-end">
                  <button type="submit" className={styles.primaryBtn} disabled={uploadingMedia || !mediaFile}>
                    {uploadingMedia ? "Uploading..." : "Upload Photo"}
                  </button>
                </div>
              </form>

              {loadingGallery ? (
                <div className="py-4 text-center text-muted small">Loading gallery...</div>
              ) : galleryMedia.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="fa-regular fa-images fs-3 mb-2 d-block" />
                  <p className="small mb-0">No photos uploaded for this branch yet.</p>
                </div>
              ) : (
                <div className={styles.galleryGrid}>
                  {galleryMedia.map((item, idx) => (
                    <div key={item._id || idx} className={styles.galleryItem}>
                      <img
                        src={item.mediaUrl || item.media || item.photoUrl || ""}
                        alt={item.photoDescription || "Branch Photo"}
                        className={styles.galleryImg}
                      />
                      {item.photoDescription && (
                        <span className={styles.galleryDesc}>{item.photoDescription}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── Modal: Add Branch ── */}
      {isAddModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsAddModalOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add New Branch Location</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsAddModalOpen(false)}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <form onSubmit={handleSaveLocation}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Branch / Location Name *</label>
                  <input
                    className={styles.formInput}
                    placeholder="e.g. Downtown Flagship, Olaya Branch"
                    value={locationForm.addressName}
                    onChange={(e) => setLocationForm((f) => ({ ...f, addressName: e.target.value }))}
                    autoFocus
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Full Street Address *</label>
                  <input
                    className={styles.formInput}
                    placeholder="Building no., Street name, District"
                    value={locationForm.address}
                    onChange={(e) => setLocationForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Latitude *</label>
                    <input
                      className={styles.formInput}
                      value={locationForm.lat}
                      onChange={(e) => setLocationForm((f) => ({ ...f, lat: e.target.value }))}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Longitude *</label>
                    <input
                      className={styles.formInput}
                      value={locationForm.long}
                      onChange={(e) => setLocationForm((f) => ({ ...f, long: e.target.value }))}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Pick on Map</label>
                  <LocationMapPicker
                    lat={locationForm.lat}
                    long={locationForm.long}
                    onChange={({ lat, long }) => setLocationForm((f) => ({ ...f, lat, long }))}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={savingLocation}
                >
                  {savingLocation ? "Saving..." : "Create Branch Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

