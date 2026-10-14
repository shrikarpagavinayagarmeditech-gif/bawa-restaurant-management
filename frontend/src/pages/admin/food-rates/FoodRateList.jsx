import React, { useEffect, useState } from "react";

import {
  getBranchFoodRates,
  setBranchFoodRate,
  deleteBranchFoodRate,
} from "../../../controllers/branchFoodRate.controller";

import { getBranches } from "../../../controllers/branch.controller";

const FoodRateList = () => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");

  const [foodRates, setFoodRates] = useState([]);

  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);

  const [editingItem, setEditingItem] = useState(null);
  const [rate, setRate] = useState("");

  // ==========================================
  // LOAD BRANCHES
  // ==========================================

  const loadBranches = async () => {
    try {
      setLoadingBranches(true);

      const response = await getBranches();

      console.log("📥 Branches:", response);

    setBranches(response?.data || []);
      console.error("Failed to load branches:", error);

      alert(
        error.response?.data?.message ||
          "Failed to load branches"
      );
    } finally {
      setLoadingBranches(false);
    }
  };

  // ==========================================
  // LOAD FOOD RATES
  // ==========================================

  const loadFoodRates = async (branchId) => {
    if (!branchId) {
      setFoodRates([]);
      return;
    }

    try {
      setLoadingRates(true);

      const response = await getBranchFoodRates(branchId);

      console.log("📥 Food rates:", response);

      setFoodRates(response?.data || []);
    } catch (error) {
      console.error("Failed to load food rates:", error);

      alert(
        error.response?.data?.message ||
          "Failed to load food rates"
      );

      setFoodRates([]);
    } finally {
      setLoadingRates(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    loadBranches();
  }, []);

  // ==========================================
  // BRANCH CHANGE
  // ==========================================

  useEffect(() => {
    if (selectedBranch) {
      loadFoodRates(selectedBranch);
    } else {
      setFoodRates([]);
    }
  }, [selectedBranch]);

  // ==========================================
  // OPEN EDIT
  // ==========================================

  const handleEdit = (item) => {
    setEditingItem(item);

    setRate(
      item.hasOverride
        ? item.branchRate
        : item.defaultRate
    );
  };

  // ==========================================
  // CANCEL EDIT
  // ==========================================

  const handleCancelEdit = () => {
    setEditingItem(null);
    setRate("");
  };

  // ==========================================
  // SAVE RATE
  // ==========================================

  const handleSaveRate = async () => {
    if (!selectedBranch) {
      alert("Please select a branch");
      return;
    }

    if (!editingItem) {
      return;
    }

    if (
      rate === "" ||
      Number.isNaN(Number(rate)) ||
      Number(rate) < 0
    ) {
      alert("Please enter a valid rate");
      return;
    }

    try {
      await setBranchFoodRate({
        branchId: selectedBranch,
        foodItemId: editingItem.foodItemId,
        rate: Number(rate),
      });

      alert("Food rate saved successfully");

      handleCancelEdit();

      await loadFoodRates(selectedBranch);
    } catch (error) {
      console.error("Save rate error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to save food rate"
      );
    }
  };

  // ==========================================
  // REMOVE OVERRIDE
  // ==========================================

  const handleRemoveOverride = async (item) => {
    if (!item.hasOverride) {
      return;
    }

    const confirmed = window.confirm(
      `Remove branch override for "${item.foodName}"?\n\nDefault rate ₹${item.defaultRate} will be used.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteBranchFoodRate(
        selectedBranch,
        item.foodItemId
      );

      alert(
        "Branch rate override removed successfully"
      );

      await loadFoodRates(selectedBranch);
    } catch (error) {
      console.error(
        "Remove override error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to remove branch rate override"
      );
    }
  };

  return (
  <div className="page-container food-rate-page">

      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="page-header">

        <div>
          <h1>Food Rates</h1>

          <p>
            Manage branch-wise food price overrides
          </p>
        </div>

      </div>


      {/* ==========================================
          BRANCH SELECT
      ========================================== */}

      <div className="card">

        <div className="form-group">

          <label>
            Select Branch
          </label>

          <select
            value={selectedBranch}
            onChange={(e) =>
              setSelectedBranch(e.target.value)
            }
            disabled={loadingBranches}
          >

            <option value="">
              -- Select Branch --
            </option>

            {branches.map((branch) => (
              <option
                key={branch.id}
                value={branch.id}
              >
                {branch.name}
              </option>
            ))}

          </select>

        </div>

      </div>


      {/* ==========================================
          FOOD RATE TABLE
      ========================================== */}

      {selectedBranch && (

        <div className="card">

          <div className="card-header">

            <div>
              <h2>Food Item Rates</h2>

              <p>
                Default rate and branch-specific
                override
              </p>
            </div>

          </div>


          {loadingRates ? (

            <div className="loading-state">
              Loading food rates...
            </div>

          ) : foodRates.length === 0 ? (

            <div className="empty-state">
              No active food items found.
            </div>

          ) : (

            <div className="table-wrapper">

              <table className="data-table">

                <thead>

                  <tr>

                    <th>Food Item</th>

                    <th>Category</th>

                    <th>Default Rate</th>

                    <th>Branch Rate</th>

                    <th>Effective Rate</th>

                    <th>Override</th>

                    <th>Action</th>

                  </tr>

                </thead>


                <tbody>

                  {foodRates.map((item) => (

                    <tr key={item.foodItemId}>

                      <td>
                        <strong>
                          {item.foodName}
                        </strong>
                      </td>


                      <td>
                        {item.categoryName}
                      </td>


                      <td>
                        ₹{Number(
                          item.defaultRate
                        ).toFixed(2)}
                      </td>


                      <td>

                        {item.hasOverride
                          ? `₹${Number(
                              item.branchRate
                            ).toFixed(2)}`
                          : (
                            <span className="muted-text">
                              —
                            </span>
                          )}

                      </td>


                      <td>

                        <strong>
                          ₹{Number(
                            item.effectiveRate
                          ).toFixed(2)}
                        </strong>

                      </td>


                      <td>

                        {item.hasOverride ? (

                          <span className="status-badge active">
                            Override
                          </span>

                        ) : (

                          <span className="status-badge inactive">
                            Default
                          </span>

                        )}

                      </td>


                      <td>

                        <div className="action-buttons">

                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() =>
                              handleEdit(item)
                            }
                          >
                            Edit Rate
                          </button>


                          {item.hasOverride && (

                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() =>
                                handleRemoveOverride(
                                  item
                                )
                              }
                            >
                              Remove
                            </button>

                          )}

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      )}


      {/* ==========================================
          EDIT RATE MODAL
      ========================================== */}

      {editingItem && (

        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <div>

                <h2>
                  Edit Food Rate
                </h2>

                <p>
                  {editingItem.foodName}
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={handleCancelEdit}
              >
                ×
              </button>

            </div>


            <div className="modal-body">

              <div className="rate-info">

                <div>
                  <span>
                    Category
                  </span>

                  <strong>
                    {editingItem.categoryName}
                  </strong>
                </div>


                <div>
                  <span>
                    Default Rate
                  </span>

                  <strong>
                    ₹{Number(
                      editingItem.defaultRate
                    ).toFixed(2)}
                  </strong>
                </div>

              </div>


              <div className="form-group">

                <label>
                  Branch Rate
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rate}
                  onChange={(e) =>
                    setRate(e.target.value)
                  }
                  placeholder="Enter branch rate"
                />

              </div>


              <div className="modal-actions">

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>


                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveRate}
                >
                  Save Rate
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default FoodRateList;