import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../../controllers/category.controller";


function Categories() {
  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingCategory, setEditingCategory] =
    useState(null);

  const [categoryName, setCategoryName] =
    useState("");

  const [active, setActive] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [statusUpdatingId, setStatusUpdatingId] =
    useState(null);


  // =========================================
  // LOAD CATEGORIES
  // =========================================

  useEffect(() => {
    loadCategories();
  }, []);


  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const result =
        await getCategories();

      console.log(
        "📂 Final category result:",
        result
      );

      let categoryList =
        result?.data?.categories;

      if (!Array.isArray(categoryList)) {
        categoryList =
          Array.isArray(result?.data)
            ? result.data
            : [];
      }

      setCategories(categoryList);

    } catch (error) {
      console.error(
        "❌ Category page error:",
        error
      );

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };


  // =========================================
  // FILTER
  // =========================================

  const filteredCategories =
    useMemo(() => {
      return categories.filter(
        (category) =>
          category.name
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );
    }, [categories, search]);


  // =========================================
  // OPEN CREATE
  // =========================================

  const openCreateModal = () => {
    setEditingCategory(null);
    setCategoryName("");
    setActive(true);
    setError("");
    setSuccess("");

    setShowModal(true);
  };


  // =========================================
  // OPEN EDIT
  // =========================================

  const openEditModal = (category) => {
    setEditingCategory(category);

    setCategoryName(
      category.name || ""
    );

    setActive(
      category.active !== false
    );

    setError("");
    setSuccess("");

    setShowModal(true);
  };


  // =========================================
  // CLOSE MODAL
  // =========================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingCategory(null);
    setCategoryName("");
    setActive(true);
  };


  // =========================================
  // SAVE (create / edit)
  // =========================================

  const handleSave = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedName =
      categoryName.trim();

    if (!trimmedName) {
      setError(
        "Category name is required"
      );

      return;
    }

    try {
      setSaving(true);

      if (editingCategory) {
        await updateCategory(
          editingCategory.id,
          {
            name: trimmedName,
            active,
          }
        );

        setSuccess(
          "Category updated successfully"
        );
      } else {
        await createCategory(
          trimmedName
        );

        setSuccess(
          "Category created successfully"
        );
      }

      await loadCategories();

      setTimeout(() => {
        setShowModal(false);
        setEditingCategory(null);
        setCategoryName("");
        setActive(true);
        setSuccess("");
      }, 500);

    } catch (error) {
      console.error(
        "❌ Save category error:",
        error
      );

      setError(error.message);
    } finally {
      setSaving(false);
    }
  };


  // =========================================
  // DELETE (real delete — calls DELETE API)
  // =========================================

  const handleDeleteCategory = async (
    category
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${category.name}"? This cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await deleteCategory(
        category.id
      );

      setSuccess(
        "Category deleted successfully"
      );

      await loadCategories();

    } catch (error) {
      console.error(
        "❌ Delete category error:",
        error
      );

      setError(error.message);
    }
  };


  // =========================================
  // TOGGLE ACTIVE / INACTIVE
  // =========================================

  const handleToggleStatus = async (
    category
  ) => {
    try {
      setError("");
      setSuccess("");
      setStatusUpdatingId(category.id);

      await updateCategory(
        category.id,
        {
          active: !category.active,
        }
      );

      setSuccess(
        category.active
          ? "Category deactivated"
          : "Category activated"
      );

      await loadCategories();

    } catch (error) {
      console.error(
        "❌ Status update error:",
        error
      );

      setError(error.message);
    } finally {
      setStatusUpdatingId(null);
    }
  };


  // =========================================
  // DATE FORMAT
  // =========================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };


  return (
    <div className="categories-page">

      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <div className="category-page-header">

        <div>
          <h2>
            Categories
          </h2>

          <p>
            Manage food categories
          </p>
        </div>

        <button
          className="primary-action-button"
          onClick={openCreateModal}
        >
          + Add Category
        </button>

      </div>


      {/* =====================================
          ALERTS
      ===================================== */}

      {error && !showModal && (
        <div className="page-alert error">
          {error}
        </div>
      )}

      {success && !showModal && (
        <div className="page-alert success">
          {success}
        </div>
      )}


      {/* =====================================
          SEARCH
      ===================================== */}

      <div className="category-toolbar">

        <div className="category-search">

          <span>
            🔍
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search categories..."
          />

        </div>

        <div className="category-count">
          {filteredCategories.length}
          {" "}
          Categories
        </div>

      </div>


      {/* =====================================
          CONTENT
      ===================================== */}

      <div className="category-card">

        {loading ? (
          <div className="category-loading">
            <div className="billing-loader" />

            <p>
              Loading categories...
            </p>
          </div>
        ) : filteredCategories.length ===
          0 ? (
          <div className="category-empty">

            <div className="category-empty-icon">
              📂
            </div>

            <h3>
              No categories found
            </h3>

            <p>
              Create your first food category.
            </p>

            <button
              className="primary-action-button"
              onClick={openCreateModal}
            >
              + Add Category
            </button>

          </div>
        ) : (
          <div className="category-table-wrapper">

            <table className="category-table">

              <thead>
                <tr>
                  <th>
                    #
                  </th>

                  <th>
                    Category Name
                  </th>

                  <th>
                    Food Items
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Created
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>

                {filteredCategories.map(
                  (category, index) => (
                    <tr
                      key={category.id}
                    >

                      <td>
                        {index + 1}
                      </td>

                      <td>
                        <div className="category-name-cell">

                          <div className="category-icon">
                            🍽️
                          </div>

                          <div>
                            <strong>
                              {category.name}
                            </strong>

                            <span>
                              ID:{" "}
                              {category.id}
                            </span>
                          </div>

                        </div>
                      </td>

                      <td>
                        <span className="food-count">
                          {category
                            ._count
                            ?.foodItems ??
                            category
                              .foodItems
                              ?.length ??
                            0}
                        </span>
                      </td>

                      <td>

                        <button
                          className={`status-badge ${
                            category.active
                              ? "active"
                              : "inactive"
                          }`}
                          onClick={() =>
                            handleToggleStatus(
                              category
                            )
                          }
                          disabled={
                            statusUpdatingId ===
                            category.id
                          }
                        >
                          <span />
                          {statusUpdatingId ===
                          category.id
                            ? "..."
                            : category.active
                            ? "Active"
                            : "Inactive"}
                        </button>

                      </td>

                      <td>
                        {formatDate(
                          category.createdAt
                        )}
                      </td>

                      <td>

                        <div className="category-actions">

                          <button
                            className="icon-action edit"
                            onClick={() =>
                              openEditModal(
                                category
                              )
                            }
                            title="Edit"
                          >
                            ✏️
                          </button>

                          <button
                            className="icon-action delete"
                            onClick={() =>
                              handleDeleteCategory(
                                category
                              )
                            }
                            title="Delete"
                          >
                            🗑️
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>


      {/* =====================================
          MODAL
      ===================================== */}

      {showModal && (
        <div
          className="category-modal-overlay"
          onClick={closeModal}
        >

          <div
            className="category-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="category-modal-header">

              <div>
                <h3>
                  {editingCategory
                    ? "Edit Category"
                    : "Add Category"}
                </h3>

                <p>
                  {editingCategory
                    ? "Update category details"
                    : "Create a new food category"}
                </p>
              </div>

              <button
                className="modal-close-button"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>

            </div>


            <form
              onSubmit={handleSave}
              className="category-form"
            >

              <div className="category-form-group">

                <label>
                  Category Name
                </label>

                <input
                  type="text"
                  value={categoryName}
                  onChange={(event) =>
                    setCategoryName(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Biryani & Rice"
                  autoFocus
                  disabled={saving}
                />

              </div>

              {error && (
                <div className="page-alert error">
                  {error}
                </div>
              )}

              {success && (
                <div className="page-alert success">
                  {success}
                </div>
              )}

              <div className="category-modal-footer">

                <button
                  type="button"
                  className="secondary-action-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-action-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingCategory
                    ? "Update Category"
                    : "Create Category"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Categories;