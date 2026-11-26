"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Swal from "sweetalert2";
import { authService } from "../services/authService";
import styles from "./MenuManager.module.css";

const normalizeList = (res, keys = []) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  for (const k of keys) {
    if (Array.isArray(res?.[k])) return res[k];
    if (Array.isArray(res?.data?.[k])) return res.data[k];
  }
  return [];
};

const DEFAULT_DISH_FALLBACK = ("data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
  <rect width="300" height="200" fill="#f8fafc"/>
  <rect x="0.5" y="0.5" width="299" height="199" fill="none" stroke="#e2e8f0"/>
  <g fill="#94a3b8" transform="translate(136, 75) scale(2.2)">
    <path d="M8 2a.5.5 0 0 1 .5.5V4h3.5A2.5 2.5 0 0 1 14.5 6.5v1A2.5 2.5 0 0 1 12 10H4a2.5 2.5 0 0 1-2.5-2.5v-1A2.5 2.5 0 0 1 4 4h3.5V2.5A.5.5 0 0 1 8 2zM3 13.5A1.5 1.5 0 0 1 4.5 12h7a1.5 1.5 0 0 1 1.5 1.5V14H3v-.5z"/>
  </g>
  <text x="150" y="142" text-anchor="middle" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600">No Photo Available</text>
</svg>
`)).replace(/'/g, "%27");

const resolveDishImageUrl = (prod) => {
  if (!prod) return DEFAULT_DISH_FALLBACK;
  let raw = "";
  if (Array.isArray(prod.photo) && prod.photo.length > 0) {
    const item = prod.photo[0];
    raw = typeof item === "string" ? item : (item?.fileName || item?.url || item?.photoUrl || "");
  } else if (typeof prod.photo === "string" && prod.photo) {
    raw = prod.photo;
  } else if (prod.photoUrl) {
    raw = prod.photoUrl;
  } else if (prod.image) {
    raw = prod.image;
  }

  if (!raw || typeof raw !== "string") return DEFAULT_DISH_FALLBACK;
  raw = raw.trim();

  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:") || raw.startsWith("blob:")) {
    return raw;
  }

  const clean = raw.replace(/^\/+/, "");
  return `https://event-una-image-bucket.s3.amazonaws.com/${clean}`;
};

export default function MenuManager() {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [products, setProducts] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [savingCategory, setSavingCategory] = useState(false);

  // Dish Modal
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDishId, setEditingDishId] = useState(null);
  const [dishForm, setDishForm] = useState({ name: "", price: "", description: "" });
  const [dishPhoto, setDishPhoto] = useState(null);
  const [dishPreviewUrl, setDishPreviewUrl] = useState("");
  const [savingDish, setSavingDish] = useState(false);

  // 1. Load Categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const res = await authService.getProductCategories();
      const list = normalizeList(res, ["categories", "allCategories"]);
      setCategories(list);
      if (list.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(list[0]._id || list[0].id || "");
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // 2. Load Products for Selected Category
  const fetchProducts = useCallback(async (catId) => {
    if (!catId) {
      setProducts([]);
      return;
    }
    try {
      setLoadingProducts(true);
      const res = await authService.getProductsByCategory({ categoryId: catId });
      const list = normalizeList(res, ["products", "allProducts"]);
      setProducts(list);
    } catch (err) {
      console.error("Failed to load products:", err);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchProducts(selectedCategoryId);
    }
  }, [selectedCategoryId, fetchProducts]);

  // Active Category Object
  const activeCategory = useMemo(() => {
    return categories.find((c) => (c._id || c.id) === selectedCategoryId) || categories[0] || null;
  }, [categories, selectedCategoryId]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter((p) =>
      (p.name || p.productName || "").toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  // Handle Photo selection
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setDishPhoto(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setDishPreviewUrl(url);
    } else {
      setDishPreviewUrl("");
    }
  };

  // 3. Save Category
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      Swal.fire({ icon: "warning", title: "Required", text: "Please enter category name." });
      return;
    }

    try {
      setSavingCategory(true);
      const res = await authService.addProductCategory({
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
      });

      if (res?.status) {
        Swal.fire({ icon: "success", title: "Category Created!", timer: 1500, showConfirmButton: false });
        setIsCategoryModalOpen(false);
        setCategoryForm({ name: "", description: "" });
        await fetchCategories();
      } else {
        Swal.fire({ icon: "error", title: "Error", text: res?.message || "Failed to create category." });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Failed to create category." });
    } finally {
      setSavingCategory(false);
    }
  };

  // 4. Save Dish / Product
  const handleSaveDish = async (e) => {
    e.preventDefault();
    if (!selectedCategoryId) {
      Swal.fire({ icon: "warning", title: "Select Category", text: "Please select a category first." });
      return;
    }
    if (!dishForm.name.trim()) {
      Swal.fire({ icon: "warning", title: "Required", text: "Please enter dish name." });
      return;
    }
    if (!dishForm.price || isNaN(Number(dishForm.price))) {
      Swal.fire({ icon: "warning", title: "Required", text: "Please enter a valid price." });
      return;
    }

    try {
      setSavingDish(true);
      const formData = new FormData();
      formData.append("name", dishForm.name.trim());
      formData.append("price", String(dishForm.price).trim());
      formData.append("description", dishForm.description.trim());

      let res;
      if (editingDishId) {
        formData.append("productId", editingDishId);
        if (dishPhoto) {
          formData.append("photos", dishPhoto);
        }
        res = await authService.updateProduct(formData);
      } else {
        formData.append("categoryId", selectedCategoryId);
        if (dishPhoto) {
          formData.append("photo", dishPhoto);
          formData.append("image", dishPhoto);
        }
        res = await authService.addProduct(formData);
      }

      if (res?.status) {
        Swal.fire({
          icon: "success",
          title: editingDishId ? "Dish Updated!" : "Dish Added!",
          timer: 1500,
          showConfirmButton: false,
        });
        setIsDishModalOpen(false);
        setEditingDishId(null);
        setDishForm({ name: "", price: "", description: "" });
        setDishPhoto(null);
        setDishPreviewUrl("");
        await fetchProducts(selectedCategoryId);
      } else {
        Swal.fire({ icon: "error", title: "Error", text: res?.message || "Failed to save dish." });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Failed to save dish." });
    } finally {
      setSavingDish(false);
    }
  };

  const handleOpenEditDish = (prod) => {
    const id = prod._id || prod.id;
    setEditingDishId(id);
    setDishForm({
      name: prod.name || prod.productName || "",
      price: String(prod.price ?? prod.finalPrice ?? ""),
      description: prod.description || "",
    });
    setDishPhoto(null);
    setDishPreviewUrl(resolveDishImageUrl(prod));
    setIsDishModalOpen(true);
  };

  // 5. Delete Dish
  const handleDeleteDish = async (dishId, dishName) => {
    const result = await Swal.fire({
      title: "Delete Dish?",
      text: `Are you sure you want to delete "${dishName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete",
    });

    if (result.isConfirmed) {
      try {
        const res = await authService.deleteProduct({ productId: dishId, id: dishId });
        if (res?.status) {
          Swal.fire({ icon: "success", title: "Deleted!", timer: 1200, showConfirmButton: false });
          await fetchProducts(selectedCategoryId);
        } else {
          Swal.fire({ icon: "error", title: "Error", text: res?.message || "Failed to delete dish." });
        }
      } catch (err) {
        Swal.fire({ icon: "error", title: "Error", text: err.message || "Failed to delete dish." });
      }
    }
  };

  // 6. Delete Category
  const handleDeleteCategory = async (catId, catName) => {
    const result = await Swal.fire({
      title: "Delete Category?",
      text: `Are you sure you want to delete category "${catName}" and all its dishes?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete",
    });

    if (result.isConfirmed) {
      try {
        const res = await authService.deleteProductCategory({ categoryId: catId });
        if (res?.status) {
          Swal.fire({ icon: "success", title: "Deleted!", timer: 1200, showConfirmButton: false });
          if (selectedCategoryId === catId) {
            setSelectedCategoryId("");
          }
          await fetchCategories();
        } else {
          Swal.fire({ icon: "error", title: "Error", text: res?.message || "Failed to delete category." });
        }
      } catch (err) {
        Swal.fire({ icon: "error", title: "Error", text: err.message || "Failed to delete category." });
      }
    }
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTitleArea}>
          <h1>Menu & Catalog Management</h1>
          <p>Organize your restaurant menu categories, set dish pricing, and update catalog items.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => setIsCategoryModalOpen(true)}
          >
            <i className="fa-solid fa-folder-plus" />
            <span>New Category</span>
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => {
              if (!selectedCategoryId) {
                Swal.fire({ icon: "info", title: "Create Category", text: "Please create or select a menu category first." });
                return;
              }
              setIsDishModalOpen(true);
            }}
          >
            <i className="fa-solid fa-plus" />
            <span>Add Dish</span>
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className={styles.layoutGrid}>
        {/* Left Column: Categories */}
        <aside className={styles.categorySidebar}>
          <div className={styles.sidebarHeader}>
            <h2>Menu Categories</h2>
            <button
              type="button"
              className={styles.addCategoryBtn}
              onClick={() => setIsCategoryModalOpen(true)}
              title="Add New Category"
            >
              <i className="fa-solid fa-plus" />
            </button>
          </div>

          {loadingCategories ? (
            <div className="py-4 text-center text-muted small">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="py-4 text-center">
              <i className="fa-solid fa-utensils text-muted fs-4 mb-2 d-block" />
              <p className="text-muted small mb-3">No categories yet.</p>
              <button
                type="button"
                className={styles.secondaryBtn}
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => setIsCategoryModalOpen(true)}
              >
                Create Category
              </button>
            </div>
          ) : (
            <ul className={styles.categoryList}>
              {categories.map((cat) => {
                const id = cat._id || cat.id;
                const isActive = id === selectedCategoryId;
                return (
                  <li
                    key={id}
                    className={`${styles.categoryItem} ${isActive ? styles.categoryItemActive : ""}`}
                    onClick={() => setSelectedCategoryId(id)}
                  >
                    <div className={styles.categoryInfo}>
                      <i className={`fa-solid fa-layer-group ${styles.categoryIcon}`} />
                      <span className={styles.categoryName}>{cat.name || cat.categoryName}</span>
                    </div>
                    {isActive && (
                      <span className={styles.itemCountBadge}>
                        {products.length} {products.length === 1 ? "dish" : "dishes"}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Right Column: Products List */}
        <main className={styles.productsMain}>
          <div className={styles.productsHeader}>
            <div className={styles.activeCategoryDetails}>
              <div className="d-flex align-items-center gap-2">
                <h3 className="m-0">{activeCategory?.name || activeCategory?.categoryName || "Select a Category"}</h3>
                {activeCategory?._id && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger border-0 p-1 rounded-circle"
                    onClick={() => handleDeleteCategory(activeCategory._id, activeCategory?.name || activeCategory?.categoryName)}
                    title="Delete this category"
                  >
                    <i className="fa-regular fa-trash-can" />
                  </button>
                )}
              </div>
              <p>{activeCategory?.description || "Browse and manage dishes under this category"}</p>
            </div>
            <div style={{ maxWidth: "240px", width: "100%" }}>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ height: "40px" }}
              />
            </div>
          </div>

          {loadingProducts ? (
            <div className={styles.productsGrid}>
              {[1, 2, 3].map((n) => (
                <div key={n} className={styles.skeletonCard} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className={styles.emptyCard}>
              <div className={styles.emptyIcon}>
                <i className="fa-solid fa-bowl-food" />
              </div>
              <h4>No dishes in this category</h4>
              <p>Add your first specialty item or beverage with photos and pricing to populate your customer menu.</p>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => setIsDishModalOpen(true)}
              >
                <i className="fa-solid fa-plus" />
                <span>Add First Dish</span>
              </button>
            </div>
          ) : (
            <div className={styles.productsGrid}>
              {filteredProducts.map((prod) => {
                const id = prod._id || prod.id;
                const price = Number(prod.price || prod.finalPrice || 0);
                const imgSrc = resolveDishImageUrl(prod);

                return (
                  <div key={id} className={styles.productCard}>
                    <div className={styles.productImageWrap}>
                      <img
                        src={imgSrc}
                        alt={prod.name || "Dish image"}
                        className={styles.productImage}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_DISH_FALLBACK;
                        }}
                      />
                      <span className={styles.priceTag}>${price.toFixed(2)}</span>
                    </div>
                    <div className={styles.productBody}>
                      <h4 className={styles.productName}>{prod.name || prod.productName}</h4>
                      <p className={styles.productDesc}>{prod.description || ""}</p>
                      <div className={styles.productFooter}>
                        <span className={styles.dishBadge}>
                          <i className="fa-solid fa-circle-check me-1" /> Available
                        </span>
                        <div className="d-flex align-items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-light border"
                            onClick={() => handleOpenEditDish(prod)}
                            title="Edit Dish"
                          >
                            <i className="fa-solid fa-pen-to-square" />
                          </button>
                          <button
                            type="button"
                            className={styles.deleteDishBtn}
                            onClick={() => handleDeleteDish(id, prod.name)}
                            title="Delete Dish"
                          >
                            <i className="fa-regular fa-trash-can" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ── Modal: Add Category ── */}
      {isCategoryModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsCategoryModalOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Create Menu Category</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsCategoryModalOpen(false)}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category Name *</label>
                  <input
                    className={styles.formInput}
                    placeholder="e.g. Starters, Main Course, Drinks, Desserts"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm((c) => ({ ...c, name: e.target.value }))}
                    autoFocus
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description (Optional)</label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="Brief description of items in this category"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm((c) => ({ ...c, description: e.target.value }))}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={savingCategory}
                >
                  {savingCategory ? "Saving..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Add / Edit Dish ── */}
      {isDishModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => { setIsDishModalOpen(false); setEditingDishId(null); }}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingDishId ? "Edit Dish" : `Add Dish to ${activeCategory?.name || "Menu"}`}</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => { setIsDishModalOpen(false); setEditingDishId(null); }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <form onSubmit={handleSaveDish}>
              <div className={styles.modalBody}>
                {/* Photo Dropzone */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Dish Photo</label>
                  <label className={styles.imageUploadZone}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handlePhotoChange}
                    />
                    {dishPreviewUrl ? (
                      <div>
                        <img src={dishPreviewUrl} alt="Preview" className={styles.uploadPreviewImg} />
                        <span className="small text-primary fw-semibold">Click to change photo</span>
                      </div>
                    ) : (
                      <div className={styles.uploadPrompt}>
                        <i className="fa-solid fa-cloud-arrow-up" />
                        <strong>Upload appetizing photo</strong>
                        <small>PNG, JPG or WEBP (Max 5MB)</small>
                      </div>
                    )}
                  </label>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Dish Name *</label>
                  <input
                    className={styles.formInput}
                    placeholder="e.g. Truffle Mushroom Risotto"
                    value={dishForm.name}
                    onChange={(e) => setDishForm((d) => ({ ...d, name: e.target.value }))}
                    autoFocus
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Price ($ / SAR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={styles.formInput}
                    placeholder="e.g. 24.50"
                    value={dishForm.price}
                    onChange={(e) => setDishForm((d) => ({ ...d, price: e.target.value }))}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="Describe ingredients, taste profile, or portion size..."
                    value={dishForm.description}
                    onChange={(e) => setDishForm((d) => ({ ...d, description: e.target.value }))}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => { setIsDishModalOpen(false); setEditingDishId(null); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={savingDish}
                >
                  {savingDish ? "Saving..." : editingDishId ? "Update Dish" : "Save Dish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

