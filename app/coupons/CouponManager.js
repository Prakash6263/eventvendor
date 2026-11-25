"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Swal from "sweetalert2";
import { authService } from "../services/authService";
import styles from "./CouponManager.module.css";

const normalizeCoupons = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.coupons)) return res.data.coupons;
  if (Array.isArray(res?.coupons)) return res.coupons;
  return [];
};

export default function CouponManager() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all"); // "all", "active", "expired"
  const [copiedCode, setCopiedCode] = useState(null);

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    couponName: "",
    discount: "",
    validFrom: "",
    validTo: "",
    description: "",
  });

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authService.getMerchantCoupons();
      const list = normalizeCoupons(res);
      setCoupons(list);
    } catch (err) {
      console.error("Failed to load coupons:", err);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // Helpers
  const isCouponActive = (c) => {
    if (!c.validTo) return true;
    const now = new Date();
    // Accept YYYY-MM-DD or DD-MM-YYYY
    let expDate = new Date(c.validTo);
    if (isNaN(expDate.getTime())) {
      const parts = String(c.validTo).split("-");
      if (parts.length === 3) {
        // DD-MM-YYYY
        expDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }
    return isNaN(expDate.getTime()) ? true : expDate >= now;
  };

  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const name = String(c.couponName || "").toLowerCase();
      const desc = String(c.description || "").toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || name.includes(q) || desc.includes(q);

      if (!matchesSearch) return false;

      const active = isCouponActive(c);
      if (filterTab === "active") return active;
      if (filterTab === "expired") return !active;
      return true;
    });
  }, [coupons, searchQuery, filterTab]);

  const stats = useMemo(() => {
    const total = coupons.length;
    const activeCount = coupons.filter(isCouponActive).length;
    const avgDiscount = total > 0
      ? Math.round(
          coupons.reduce((sum, c) => {
            const val = parseFloat(String(c.discount || "").replace(/[^0-9.]/g, "")) || 0;
            return sum + val;
          }, 0) / total
        )
      : 0;

    return { total, activeCount, avgDiscount };
  }, [coupons]);

  const handleCopy = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDelete = (coupon) => {
    const couponId = coupon._id || coupon.id;
    if (!couponId) return;

    Swal.fire({
      title: "Delete Coupon?",
      text: `Are you sure you want to delete coupon code "${coupon.couponName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await authService.deleteMerchantCoupon({ couponId });
          if (res?.status !== false) {
            Swal.fire({
              title: "Deleted!",
              text: "Coupon has been successfully removed.",
              icon: "success",
              timer: 1800,
              showConfirmButton: false,
            });
            fetchCoupons();
          } else {
            Swal.fire("Error", res?.message || "Failed to delete coupon", "error");
          }
        } catch (err) {
          Swal.fire("Error", err.message || "Failed to delete coupon", "error");
        }
      }
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.couponName.trim()) {
      Swal.fire("Validation Error", "Please provide a coupon code (e.g. SUMMER25)", "warning");
      return;
    }
    if (!formData.discount.toString().trim()) {
      Swal.fire("Validation Error", "Please provide a discount value or percentage", "warning");
      return;
    }
    const discNum = parseFloat(String(formData.discount).replace(/[^0-9.]/g, ""));
    if (isNaN(discNum) || discNum < 1 || discNum > 99) {
      Swal.fire("Validation Error", "Discount percentage must be between 1% and 99%", "warning");
      return;
    }

    try {
      setSubmitting(true);
      const res = await authService.addMerchantCoupon({
        couponName: formData.couponName.toUpperCase().trim(),
        discount: formData.discount.trim(),
        validFrom: formData.validFrom || new Date().toISOString().split("T")[0],
        validTo: formData.validTo || "",
        description: formData.description.trim(),
      });

      if (res?.status !== false) {
        Swal.fire({
          title: "Coupon Created!",
          text: `Promotion code ${formData.couponName.toUpperCase()} is now live.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        setIsModalOpen(false);
        setFormData({
          couponName: "",
          discount: "",
          validFrom: "",
          validTo: "",
          description: "",
        });
        fetchCoupons();
      } else {
        Swal.fire("Error", res?.message || "Failed to create coupon", "error");
      }
    } catch (err) {
      Swal.fire("Error", err.message || "Failed to create coupon", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.couponContainer}>
      {/* Header Bar */}
      <div className={styles.headerBar}>
        <div className={styles.titleArea}>
          <h1>Promotions & Coupons</h1>
          <p>
            Create marketing discounts, seasonal promotional codes, and booking vouchers for your customers.
          </p>
        </div>
        <button className={styles.createBtn} onClick={() => setIsModalOpen(true)}>
          <i className="fa-solid fa-plus" />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
            <i className="fa-solid fa-ticket" />
          </div>
          <div className={styles.statMeta}>
            <h4>Total Coupons</h4>
            <p>{stats.total}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
            <i className="fa-solid fa-circle-check" />
          </div>
          <div className={styles.statMeta}>
            <h4>Active Promotions</h4>
            <p>{stats.activeCount}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconAmber}`}>
            <i className="fa-solid fa-percent" />
          </div>
          <div className={styles.statMeta}>
            <h4>Avg. Discount</h4>
            <p>{stats.avgDiscount > 0 ? `${stats.avgDiscount}%` : "—"}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search coupon code or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filterTabs}>
          <button
            className={`${styles.filterTabBtn} ${filterTab === "all" ? styles.filterTabBtnActive : ""}`}
            onClick={() => setFilterTab("all")}
          >
            All ({coupons.length})
          </button>
          <button
            className={`${styles.filterTabBtn} ${filterTab === "active" ? styles.filterTabBtnActive : ""}`}
            onClick={() => setFilterTab("active")}
          >
            Active ({stats.activeCount})
          </button>
          <button
            className={`${styles.filterTabBtn} ${filterTab === "expired" ? styles.filterTabBtnActive : ""}`}
            onClick={() => setFilterTab("expired")}
          >
            Expired ({coupons.length - stats.activeCount})
          </button>
        </div>
      </div>

      {/* Coupon Grid */}
      {loading ? (
        <div className={styles.couponGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <i className="fa-solid fa-ticket-simple" />
          </div>
          <h3>No coupons found</h3>
          <p>
            {searchQuery
              ? "No promotional coupons match your search query."
              : "You haven't launched any promotional discount vouchers yet."}
          </p>
          <button className={styles.createBtn} onClick={() => setIsModalOpen(true)}>
            <i className="fa-solid fa-plus" />
            <span>Create First Coupon</span>
          </button>
        </div>
      ) : (
        <div className={styles.couponGrid}>
          {filteredCoupons.map((coupon) => {
            const active = isCouponActive(coupon);
            const discountDisplay = String(coupon.discount || "").includes("%")
              ? coupon.discount
              : `${coupon.discount}%`;

            return (
              <div key={coupon._id || coupon.id} className={styles.couponTicket}>
                <div className={styles.ticketTop}>
                  <div className={styles.discountBadge}>
                    <span className={styles.discountValue}>{discountDisplay}</span>
                    <span className={styles.discountLabel}>Discount</span>
                  </div>
                  <div>
                    {active ? (
                      <span className={styles.statusPillActive}>
                        <i className="fa-solid fa-circle" style={{ fontSize: "6px" }} /> Active
                      </span>
                    ) : (
                      <span className={styles.statusPillExpired}>
                        <i className="fa-solid fa-circle" style={{ fontSize: "6px" }} /> Expired
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.ticketBody}>
                  <div className={styles.codeBoxWrap}>
                    <span className={styles.codeText}>{coupon.couponName}</span>
                    <button
                      className={styles.copyBtn}
                      onClick={() => handleCopy(coupon.couponName)}
                      title="Copy code"
                    >
                      <i className={copiedCode === coupon.couponName ? "fa-solid fa-check" : "fa-regular fa-copy"} />
                      <span>{copiedCode === coupon.couponName ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  <p className={styles.couponDesc}>
                    {coupon.description || "Applicable on eligible bookings and reservations."}
                  </p>

                  <div className={styles.ticketFooter}>
                    <div className={styles.validityInfo}>
                      <i className="fa-regular fa-calendar" />
                      <span>
                        Valid: {coupon.validFrom ? String(coupon.validFrom).slice(0, 10) : "Now"} –{" "}
                        {coupon.validTo ? String(coupon.validTo).slice(0, 10) : "No expiry"}
                      </span>
                    </div>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(coupon)}
                      title="Delete Coupon"
                    >
                      <i className="fa-regular fa-trash-can" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => !submitting && setIsModalOpen(false)}>
          <div className={styles.modalWindow} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Create Promotional Coupon</h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => !submitting && setIsModalOpen(false)}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.rowGrid}>
                  <div className={styles.formGroup}>
                    <label>Coupon Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. WELCOME20"
                      value={formData.couponName}
                      onChange={(e) =>
                        setFormData({ ...formData, couponName: e.target.value.toUpperCase() })
                      }
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Discount Value (% or Amount) * (1-99%)</label>
                    <input
                      type="text"
                      placeholder="e.g. 5% or 20%"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className={styles.rowGrid}>
                  <div className={styles.formGroup}>
                    <label>Valid From</label>
                    <input
                      type="date"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Valid Until</label>
                    <input
                      type="date"
                      value={formData.validTo}
                      onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Description / Terms</label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of the promotion, minimum spend, or eligible categories..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check" />
                      <span>Publish Coupon</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

