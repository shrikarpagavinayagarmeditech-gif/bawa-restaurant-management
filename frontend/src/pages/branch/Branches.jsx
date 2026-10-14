import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from "../../controllers/branch.controller";

function Branches() {
  // =========================================
  // STATES
  // =========================================

  const [branches, setBranches] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [statusUpdatingId, setStatusUpdatingId] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingBranch, setEditingBranch] =
    useState(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =========================================
  // FORM
  // =========================================

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    gstNumber: "",
    username: "",
    password: "",
    active: true,
  });

  // =========================================
  // LOAD BRANCHES
  // =========================================

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError("");

      console.log(
        "🏢 Loading branches..."
      );

      const result =
        await getBranches();

      console.log(
        "📦 Branch API result:",
        result
      );

      let branchList = [];

      // { data: { branches: [] } }
      if (
        Array.isArray(
          result?.data?.branches
        )
      ) {
        branchList =
          result.data.branches;
      }

      // { data: [] }
      else if (
        Array.isArray(result?.data)
      ) {
        branchList = result.data;
      }

      // []
      else if (
        Array.isArray(result)
      ) {
        branchList = result;
      }

      console.log(
        "✅ Final branch list:",
        branchList
      );

      setBranches(branchList);
    } catch (error) {
      console.error(
        "❌ Load branches error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load branches."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // FILTER
  // =========================================

  const filteredBranches =
    useMemo(() => {
      const keyword =
        search.trim().toLowerCase();

      if (!keyword) {
        return branches;
      }

      return branches.filter(
        (branch) =>
          branch.name
            ?.toLowerCase()
            .includes(keyword) ||
          branch.address
            ?.toLowerCase()
            .includes(keyword) ||
          branch.phone
            ?.toLowerCase()
            .includes(keyword) ||
          branch.username
            ?.toLowerCase()
            .includes(keyword)
      );
    }, [branches, search]);

  // =========================================
  // COUNTS
  // =========================================

  const activeCount =
    branches.filter(
      (branch) =>
        branch.active === true
    ).length;

  const inactiveCount =
    branches.filter(
      (branch) =>
        branch.active !== true
    ).length;

  // =========================================
  // RESET FORM
  // =========================================

  const resetForm = () => {
    setForm({
      name: "",
      address: "",
      phone: "",
      gstNumber: "",
      username: "",
      password: "",
      active: true,
    });
  };

  // =========================================
  // OPEN CREATE
  // =========================================

  const openCreateModal = () => {
    resetForm();

    setEditingBranch(null);

    setError("");

    setSuccess("");

    setShowModal(true);
  };

  // =========================================
  // OPEN EDIT
  // =========================================

  const openEditModal = (branch) => {
    console.log(
      "✏️ Editing branch:",
      branch
    );

    setEditingBranch(branch);

    setForm({
      name: branch.name || "",
      address: branch.address || "",
      phone: branch.phone || "",
      gstNumber:
        branch.gstNumber || "",
      username:
        branch.username || "",
      password: "",
      active:
        branch.active !== false,
    });

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

    setEditingBranch(null);

    resetForm();

    setError("");
  };

  // =========================================
  // FORM CHANGE
  // =========================================

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // =========================================
  // SAVE BRANCH
  // =========================================

  const handleSave = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    if (!form.name.trim()) {
      setError(
        "Restaurant name is required."
      );
      return;
    }

    if (!form.address.trim()) {
      setError(
        "Address is required."
      );
      return;
    }

    if (!form.phone.trim()) {
      setError(
        "Phone number is required."
      );
      return;
    }

    if (!form.username.trim()) {
      setError(
        "Username is required."
      );
      return;
    }

    // Password required only while creating
    if (
      !editingBranch &&
      !form.password.trim()
    ) {
      setError(
        "Password is required."
      );
      return;
    }

    try {
      setSaving(true);

      // =======================================
      // CREATE
      // =======================================

      if (!editingBranch) {
        const payload = {
          name: form.name.trim(),
          address: form.address.trim(),
          phone: form.phone.trim(),
          gstNumber:
            form.gstNumber.trim() || null,
          username:
            form.username.trim(),
          password:
            form.password.trim(),
        };

        console.log(
          "➕ Create branch payload:",
          payload
        );

        await createBranch(
          payload
        );

        setSuccess(
          "Branch created successfully."
        );
      }

      // =======================================
      // UPDATE
      // =======================================

      else {
        const payload = {
          name: form.name.trim(),
          address: form.address.trim(),
          phone: form.phone.trim(),
          gstNumber:
            form.gstNumber.trim() || null,
          username:
            form.username.trim(),
          active:
            form.active,
        };

        // Only send password if entered
        if (form.password.trim()) {
          payload.password =
            form.password.trim();
        }

        console.log(
          "✏️ Update branch payload:",
          payload
        );

        await updateBranch(
          editingBranch.id,
          payload
        );

        setSuccess(
          "Branch updated successfully."
        );
      }

      // -----------------------------------------
      // REFRESH
      // -----------------------------------------

      await loadBranches();

      // -----------------------------------------
      // CLOSE
      // -----------------------------------------

      setShowModal(false);

      setEditingBranch(null);

      resetForm();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error(
        "❌ Save branch error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to save branch."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // DELETE
  // =========================================

  const handleDelete = async (
    branch
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to permanently delete "${branch.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(branch.id);

      setError("");

      setSuccess("");

      console.log(
        "🗑️ Deleting branch:",
        branch.id
      );

      await deleteBranch(
        branch.id
      );

      setSuccess(
        `"${branch.name}" deleted successfully.`
      );

      await loadBranches();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error(
        "❌ Delete branch error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to delete branch."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================
  // ACTIVE / INACTIVE
  // =========================================

  const handleToggleStatus = async (
    branch
  ) => {
    const newStatus =
      branch.active !== true;

    const confirmed =
      window.confirm(
        newStatus
          ? `Activate "${branch.name}"?`
          : `Deactivate "${branch.name}"?\n\nBranch users will not be able to use this branch while it is inactive.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setStatusUpdatingId(
        branch.id
      );

      setError("");

      setSuccess("");

      console.log(
        "🔄 Changing branch status:",
        {
          id: branch.id,
          active: newStatus,
        }
      );

      await updateBranch(
        branch.id,
        {
          active: newStatus,
        }
      );

      // Update UI immediately
      setBranches(
        (previous) =>
          previous.map(
            (item) =>
              item.id === branch.id
                ? {
                    ...item,
                    active:
                      newStatus,
                  }
                : item
          )
      );

      setSuccess(
        newStatus
          ? `"${branch.name}" activated successfully.`
          : `"${branch.name}" deactivated successfully.`
      );

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error(
        "❌ Status update error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to update branch status."
      );
    } finally {
      setStatusUpdatingId(
        null
      );
    }
  };

  // =========================================
  // DATE
  // =========================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "-";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="branches-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="branch-page-header">

        <div>
          <h2>
            Branches
          </h2>

          <p>
            Manage restaurant branches
          </p>
        </div>

        <button
          type="button"
          className="primary-action-button"
          onClick={
            openCreateModal
          }
        >
          + Add Branch
        </button>

      </div>

      {/* =====================================
          SUMMARY
      ===================================== */}

      <div className="branch-summary">

        <div className="branch-summary-card">

          <div className="branch-summary-icon">
            🏢
          </div>

          <div>
            <span>
              Total Branches
            </span>

            <strong>
              {branches.length}
            </strong>
          </div>

        </div>

        <div className="branch-summary-card">

          <div className="branch-summary-icon">
            🟢
          </div>

          <div>
            <span>
              Active
            </span>

            <strong>
              {activeCount}
            </strong>
          </div>

        </div>

        <div className="branch-summary-card">

          <div className="branch-summary-icon">
            ⚪
          </div>

          <div>
            <span>
              Inactive
            </span>

            <strong>
              {inactiveCount}
            </strong>
          </div>

        </div>

      </div>

      {/* =====================================
          ALERTS
      ===================================== */}

      {error &&
        !showModal && (
          <div className="page-alert error">
            ⚠️ {error}
          </div>
        )}

      {success &&
        !showModal && (
          <div className="page-alert success">
            ✓ {success}
          </div>
        )}

      {/* =====================================
          SEARCH
      ===================================== */}

      <div className="branch-toolbar">

        <div className="branch-search">

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
            placeholder="Search branches..."
          />

          {search && (
            <button
              type="button"
              className="search-clear"
              onClick={() =>
                setSearch("")
              }
            >
              ×
            </button>
          )}

        </div>

        <div className="branch-count">
          {filteredBranches.length}{" "}
          Branches
        </div>

      </div>

      {/* =====================================
          TABLE
      ===================================== */}

      <div className="branch-card">

        {loading ? (

          <div className="branch-loading">

            <div className="billing-loader" />

            <p>
              Loading branches...
            </p>

          </div>

        ) : filteredBranches.length ===
          0 ? (

          <div className="branch-empty">

            <div className="branch-empty-icon">
              🏢
            </div>

            <h3>
              {search
                ? "No branches found"
                : "No branches available"}
            </h3>

            <p>
              {search
                ? "Try a different search."
                : "Create your first restaurant branch."}
            </p>

            {!search && (
              <button
                type="button"
                className="primary-action-button"
                onClick={
                  openCreateModal
                }
              >
                + Add Branch
              </button>
            )}

          </div>

        ) : (

          <div className="branch-table-wrapper">

            <table className="branch-table">

              <thead>

                <tr>

                  <th>
                    #
                  </th>

                  <th>
                    Branch
                  </th>

                  <th>
                    Contact
                  </th>

                  <th>
                    GST
                  </th>

                  <th>
                    Login
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

                {filteredBranches.map(
                  (
                    branch,
                    index
                  ) => {

                    const branchIsActive =
                      branch.active ===
                      true;

                    const isDeleting =
                      deletingId ===
                      branch.id;

                    const isUpdating =
                      statusUpdatingId ===
                      branch.id;

                    return (
                      <tr
                        key={
                          branch.id
                        }
                      >

                        {/* NUMBER */}

                        <td>
                          {index + 1}
                        </td>

                        {/* BRANCH */}

                        <td>

                          <div className="branch-name-cell">

                            <div className="branch-icon">
                              🏢
                            </div>

                            <div>

                              <strong>
                                {
                                  branch.name
                                }
                              </strong>

                              <span>
                                {
                                  branch.address ||
                                  "No address"
                                }
                              </span>

                            </div>

                          </div>

                        </td>

                        {/* CONTACT */}

                        <td>

                          <div className="branch-contact-cell">

                            <strong>
                              {
                                branch.phone ||
                                "-"
                              }
                            </strong>

                          </div>

                        </td>

                        {/* GST */}

                        <td>
                          {branch.gstNumber ||
                            "-"}
                        </td>

                        {/* LOGIN */}

                        <td>

                          <span className="branch-username">
                            {branch.username ||
                              "-"}
                          </span>

                        </td>

                        {/* STATUS */}

                        <td>

                          <button
                            type="button"
                            className={`status-badge ${
                              branchIsActive
                                ? "active"
                                : "inactive"
                            }`}
                            onClick={() =>
                              handleToggleStatus(
                                branch
                              )
                            }
                            disabled={
                              isUpdating
                            }
                          >

                            <span />

                            {isUpdating
                              ? "Updating..."
                              : branchIsActive
                              ? "Active"
                              : "Inactive"}

                          </button>

                        </td>

                        {/* DATE */}

                        <td>
                          {formatDate(
                            branch.createdAt
                          )}
                        </td>

                        {/* ACTIONS */}

                        <td>

                          <div className="category-actions">

                            {/* EDIT */}

                            <button
                              type="button"
                              className="icon-action edit"
                              onClick={() =>
                                openEditModal(
                                  branch
                                )
                              }
                              disabled={
                                isDeleting
                              }
                              title="Edit Branch"
                            >
                              ✏️
                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              className="icon-action delete"
                              onClick={() =>
                                handleDelete(
                                  branch
                                )
                              }
                              disabled={
                                isDeleting
                              }
                              title="Delete Branch"
                            >
                              {isDeleting
                                ? "..."
                                : "🗑️"}
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* =====================================
          CREATE / EDIT MODAL
      ===================================== */}

      {showModal && (

        <div
          className="branch-modal-overlay"
          onClick={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }

          }}
        >

          <div
            className="branch-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="branch-modal-header">

              <div>

                <h3>
                  {editingBranch
                    ? "Edit Branch"
                    : "Add Branch"}
                </h3>

                <p>
                  {editingBranch
                    ? "Update branch details"
                    : "Create a new restaurant branch"}
                </p>

              </div>

              <button
                type="button"
                className="modal-close-button"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSave
              }
              className="branch-form"
            >

              {/* RESTAURANT NAME */}

              <div className="branch-form-group">

                <label>
                  Restaurant Name
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="name"
                  value={
                    form.name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. Bawa Restaurant - Main Branch"
                  disabled={
                    saving
                  }
                />

              </div>

              {/* ADDRESS */}

              <div className="branch-form-group">

                <label>
                  Address
                  <span>*</span>
                </label>

                <textarea
                  name="address"
                  value={
                    form.address
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter complete branch address"
                  rows="3"
                  disabled={
                    saving
                  }
                />

              </div>

              {/* TWO COLUMNS */}

              <div className="branch-form-grid">

                {/* PHONE */}

                <div className="branch-form-group">

                  <label>
                    Phone
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={
                      form.phone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="9876543210"
                    disabled={
                      saving
                    }
                  />

                </div>

                {/* GST */}

                <div className="branch-form-group">

                  <label>
                    GST Number
                  </label>

                  <input
                    type="text"
                    name="gstNumber"
                    value={
                      form.gstNumber
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Optional"
                    disabled={
                      saving
                    }
                  />

                </div>

              </div>

              {/* LOGIN TITLE */}

              <div className="branch-section-title">
                Branch Login
              </div>

              {/* USERNAME */}

              <div className="branch-form-group">

                <label>
                  Username
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="username"
                  value={
                    form.username
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="branch_username"
                  disabled={
                    saving
                  }
                />

              </div>

              {/* PASSWORD */}

              <div className="branch-form-group">

                <label>

                  Password

                  {!editingBranch && (
                    <span>
                      *
                    </span>
                  )}

                </label>

                <input
                  type="password"
                  name="password"
                  value={
                    form.password
                  }
                  onChange={
                    handleChange
                  }
                  placeholder={
                    editingBranch
                      ? "Leave blank to keep current password"
                      : "Enter branch password"
                  }
                  disabled={
                    saving
                  }
                />

                {editingBranch && (
                  <small>
                    Leave blank if you do not
                    want to change the password.
                  </small>
                )}

              </div>

              {/* STATUS */}

              {editingBranch && (

                <div className="branch-form-group">

                  <label>
                    Branch Status
                  </label>

                  <label className="branch-switch-row">

                    <input
                      type="checkbox"
                      name="active"
                      checked={
                        form.active
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        saving
                      }
                    />

                    <span className="branch-switch" />

                    <span>
                      {form.active
                        ? "Active"
                        : "Inactive"}
                    </span>

                  </label>

                </div>

              )}

              {/* ERROR */}

              {error && (
                <div className="branch-modal-error">
                  ⚠️ {error}
                </div>
              )}

              {/* FOOTER */}

              <div className="branch-modal-footer">

                <button
                  type="button"
                  className="category-cancel-button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="category-save-button"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Saving..."
                    : editingBranch
                    ? "Update Branch"
                    : "Create Branch"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Branches;