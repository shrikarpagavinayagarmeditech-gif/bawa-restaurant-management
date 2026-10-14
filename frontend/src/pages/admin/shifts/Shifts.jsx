import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    getShifts,
    createShift,
    updateShift,
    deleteShift,
} from "../../../controllers/shift.controller.js";

import "./shift.css";

function Shifts() {
    const [shifts, setShifts] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState(null);

    const [form, setForm] = useState({
        name: "",
        startTime: "",
        endTime: "",
        isActive: true,
    });

    const [error, setError] = useState("");


    // =========================================
    // LOAD SHIFTS
    // =========================================

    const loadShifts = async () => {
        try {
            setLoading(true);
            setError("");

            console.log("📡 Loading shifts...");

            const response = await getShifts();

            console.log("📥 Shift API result:", response);

            const data =
                response?.data ||
                response?.shifts ||
                [];

            if (Array.isArray(data)) {
                setShifts(data);
            } else {
                setShifts([]);
            }

        } catch (error) {
            console.error(
                "❌ Load shifts failed:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to load shifts."
            );

        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadShifts();
    }, []);


    // =========================================
    // FILTER
    // =========================================

    const filteredShifts = useMemo(() => {
        const value = search
            .trim()
            .toLowerCase();

        if (!value) {
            return shifts;
        }

        return shifts.filter((shift) =>
            shift.name
                ?.toLowerCase()
                .includes(value)
        );
    }, [shifts, search]);


    // =========================================
    // COUNTS
    // =========================================

    const totalShifts = shifts.length;

    const activeShifts = shifts.filter(
        (shift) => shift.active === true
    ).length;

    const inactiveShifts = shifts.filter(
        (shift) => shift.active === false
    ).length;


    // =========================================
    // OPEN CREATE
    // =========================================

    const handleAdd = () => {
        setEditingShift(null);

        setForm({
            name: "",
            startTime: "",
            endTime: "",
            isActive: true,
        });

        setError("");
        setModalOpen(true);
    };


    // =========================================
    // OPEN EDIT
    // =========================================

    const handleEdit = (shift) => {
        console.log(
            "✏️ Editing shift:",
            shift
        );

        setEditingShift(shift);

        setForm({
            name: shift.name || "",
            startTime: shift.startTime || "",
            endTime: shift.endTime || "",

            // IMPORTANT
            // Database field = active
            // Form field = isActive

            isActive:
                shift.active ?? true,
        });

        setError("");
        setModalOpen(true);
    };


    // =========================================
    // CLOSE MODAL
    // =========================================

    const handleClose = () => {
        if (saving) {
            return;
        }

        setModalOpen(false);
        setEditingShift(null);
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
    // SAVE
    // =========================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");

        if (!form.name.trim()) {
            setError(
                "Shift name is required."
            );
            return;
        }

        if (!form.startTime) {
            setError(
                "Start time is required."
            );
            return;
        }

        if (!form.endTime) {
            setError(
                "End time is required."
            );
            return;
        }

        try {
            setSaving(true);

            const payload = {
                name: form.name.trim(),
                startTime: form.startTime,
                endTime: form.endTime,

                // Backend expects isActive
                isActive: form.isActive,
            };

            console.log(
                "📤 Shift payload:",
                payload
            );

            if (editingShift) {
                await updateShift(
                    editingShift.id,
                    payload
                );

                console.log(
                    "✅ Shift updated successfully"
                );

            } else {
                await createShift(payload);

                console.log(
                    "✅ Shift created successfully"
                );
            }

            await loadShifts();

            setModalOpen(false);
            setEditingShift(null);

            setForm({
                name: "",
                startTime: "",
                endTime: "",
                isActive: true,
            });

            setError("");

        } catch (error) {
            console.error(
                "❌ Save shift failed:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to save shift."
            );

        } finally {
            setSaving(false);
        }
    };


    // =========================================
    // DELETE
    // =========================================

    const handleDelete = async (shift) => {
        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${shift.name}"?`
            );

        if (!confirmed) {
            return;
        }

        try {
            console.log(
                "🗑️ Deleting shift:",
                shift.id
            );

            await deleteShift(shift.id);

            console.log(
                "✅ Shift deleted successfully"
            );

            await loadShifts();

        } catch (error) {
            console.error(
                "❌ Delete shift failed:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to delete shift."
            );
        }
    };


    // =========================================
    // TIME FORMAT
    // =========================================

    const formatTime = (time) => {
        if (!time) {
            return "-";
        }

        const [hours, minutes] =
            time.split(":");

        const date = new Date();

        date.setHours(
            Number(hours),
            Number(minutes),
            0,
            0
        );

        return date.toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };


    // =========================================
    // UI
    // =========================================

    return (
        <div className="shifts-page">

            {/* =====================================
          HEADER
      ===================================== */}

            <div className="shifts-header">

                <div>
                    <h1>Shifts</h1>

                    <p>
                        Manage restaurant working shifts
                    </p>
                </div>

                <button
                    className="shift-add-button"
                    onClick={handleAdd}
                >
                    <span>+</span>
                    Add Shift
                </button>

            </div>


            {/* =====================================
          SUMMARY
      ===================================== */}

            <div className="shift-summary">

                <div className="shift-summary-card">

                    <div className="shift-summary-icon">
                        ◷
                    </div>

                    <div>
                        <span>Total Shifts</span>

                        <strong>
                            {totalShifts}
                        </strong>
                    </div>

                </div>


                <div className="shift-summary-card">

                    <div className="shift-summary-icon active">
                        ✓
                    </div>

                    <div>
                        <span>Active</span>

                        <strong>
                            {activeShifts}
                        </strong>
                    </div>

                </div>


                <div className="shift-summary-card">

                    <div className="shift-summary-icon inactive">
                        −
                    </div>

                    <div>
                        <span>Inactive</span>

                        <strong>
                            {inactiveShifts}
                        </strong>
                    </div>

                </div>

            </div>


            {/* =====================================
          TOOLBAR
      ===================================== */}

            <div className="shift-toolbar">

                <div className="shift-search">

                    <span>⌕</span>

                    <input
                        type="text"
                        placeholder="Search shifts..."
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                    />

                </div>

                <div className="shift-result-count">

                    {filteredShifts.length} shift
                    {filteredShifts.length !== 1
                        ? "s"
                        : ""}

                </div>

            </div>


            {/* =====================================
          ERROR
      ===================================== */}

            {error && !modalOpen && (
                <div className="shift-page-error">
                    {error}
                </div>
            )}


            {/* =====================================
          TABLE
      ===================================== */}

            <div className="shift-table-card">

                {loading ? (

                    <div className="shift-loading">
                        Loading shifts...
                    </div>

                ) : filteredShifts.length === 0 ? (

                    <div className="shift-empty">

                        <div className="shift-empty-icon">
                            ◷
                        </div>

                        <h3>
                            No shifts found
                        </h3>

                        <p>
                            Create your first restaurant
                            shift to get started.
                        </p>

                        <button
                            onClick={handleAdd}
                            className="shift-empty-button"
                        >
                            + Add Shift
                        </button>

                    </div>

                ) : (

                    <div className="shift-table-wrapper">

                        <table className="shift-table">

                            <thead>
                                <tr>

                                    <th>
                                        SHIFT NAME
                                    </th>

                                    <th>
                                        START TIME
                                    </th>

                                    <th>
                                        END TIME
                                    </th>

                                    <th>
                                        STATUS
                                    </th>

                                    <th className="shift-action-heading">
                                        ACTIONS
                                    </th>

                                </tr>
                            </thead>

                            <tbody>

                                {filteredShifts.map(
                                    (shift) => (

                                        <tr key={shift.id}>

                                            <td>

                                                <div className="shift-name-cell">

                                                    <div className="shift-row-icon">
                                                        ◷
                                                    </div>

                                                    <strong>
                                                        {shift.name}
                                                    </strong>

                                                </div>

                                            </td>


                                            <td>

                                                <span className="shift-time">

                                                    {formatTime(
                                                        shift.startTime
                                                    )}

                                                </span>

                                            </td>


                                            <td>

                                                <span className="shift-time">

                                                    {formatTime(
                                                        shift.endTime
                                                    )}

                                                </span>

                                            </td>


                                            <td>

                                                <span
                                                    className={
                                                        shift.active
                                                            ? "shift-status active"
                                                            : "shift-status inactive"
                                                    }
                                                >

                                                    <span className="status-dot">
                                                        ●
                                                    </span>

                                                    {shift.active
                                                        ? "Active"
                                                        : "Inactive"}

                                                </span>

                                            </td>


                                            <td>

                                                <div className="shift-actions">

                                                    <button
                                                        className="shift-edit-button"
                                                        onClick={() =>
                                                            handleEdit(
                                                                shift
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="shift-delete-button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                shift
                                                            )
                                                        }
                                                    >
                                                        Delete
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

            {modalOpen && (

                <div
                    className="shift-modal-overlay"
                    onMouseDown={handleClose}
                >

                    <div
                        className="shift-modal"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="shift-modal-header">

                            <div>

                                <h2>
                                    {editingShift
                                        ? "Edit Shift"
                                        : "Add Shift"}
                                </h2>

                                <p>
                                    {editingShift
                                        ? "Update shift details"
                                        : "Create a new restaurant shift"}
                                </p>

                            </div>

                            <button
                                className="shift-modal-close"
                                onClick={handleClose}
                            >
                                ×
                            </button>

                        </div>


                        <form
                            className="shift-form"
                            onSubmit={handleSubmit}
                        >

                            {/* Shift Name */}

                            <div className="shift-form-group">

                                <label>
                                    Shift Name
                                    <span>*</span>
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Example: Morning Shift"
                                    value={form.name}
                                    onChange={handleChange}
                                />

                            </div>


                            {/* Time */}

                            <div className="shift-time-row">

                                <div className="shift-form-group">

                                    <label>
                                        Start Time
                                        <span>*</span>
                                    </label>

                                    <input
                                        type="time"
                                        name="startTime"
                                        value={form.startTime}
                                        onChange={handleChange}
                                    />

                                </div>


                                <div className="shift-form-group">

                                    <label>
                                        End Time
                                        <span>*</span>
                                    </label>

                                    <input
                                        type="time"
                                        name="endTime"
                                        value={form.endTime}
                                        onChange={handleChange}
                                    />

                                </div>

                            </div>


                            {/* Active */}

                            <div className="shift-active-row">

                                <div>

                                    <strong>
                                        Shift Status
                                    </strong>

                                    <p>
                                        Inactive shifts will not be
                                        available for billing.
                                    </p>

                                </div>

                                <label className="shift-switch">

                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={form.isActive}
                                        onChange={handleChange}
                                    />

                                    <span></span>

                                </label>

                            </div>


                            {/* Modal Error */}

                            {error && (
                                <div className="shift-form-error">
                                    {error}
                                </div>
                            )}


                            {/* Footer */}

                            <div className="shift-modal-footer">

                                <button
                                    type="button"
                                    className="shift-cancel-button"
                                    onClick={handleClose}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="shift-save-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingShift
                                            ? "Update Shift"
                                            : "Create Shift"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Shifts;