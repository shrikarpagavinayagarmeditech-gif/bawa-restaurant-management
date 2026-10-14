import { useEffect, useState } from "react";
import { api, money } from "../lib/api";
import React from "react";
export default function Expenses() {
  const [rows, setRows] = useState([]);

  const [f, setF] = useState({
    category: "Market",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const load = () => {
    api
      .get("/expenses")
      .then((r) => {
        setRows(r.data);
      })
      .catch((err) => {
        console.error("Expenses loading error:", err);
      });
  };

  useEffect(() => {
    load();
  }, []);

  async function sub(e) {
    e.preventDefault();

    try {
      await api.post("/expenses", {
        ...f,
        amount: Number(f.amount),
      });

      setF({
        ...f,
        amount: "",
      });

      load();
    } catch (err) {
      console.error("Expense creation error:", err);

      alert(
        err.response?.data?.message ||
        "Failed to record expense"
      );
    }
  }

  return (
    <>
      <h1>Expenses</h1>

      <div className="grid2">

        {/* Add Expense */}
        <form
          className="panel"
          onSubmit={sub}
        >
          <input
            value={f.category}
            onChange={(e) =>
              setF({
                ...f,
                category: e.target.value,
              })
            }
            placeholder="Expense category"
          />

          <input
            type="number"
            value={f.amount}
            onChange={(e) =>
              setF({
                ...f,
                amount: e.target.value,
              })
            }
            placeholder="Amount"
          />

          <input
            type="date"
            value={f.date}
            onChange={(e) =>
              setF({
                ...f,
                date: e.target.value,
              })
            }
          />

          <button type="submit">
            Record Expense
          </button>
        </form>

        {/* Expense List */}
        <div className="panel">
          {rows.map((x) => (
            <div
              className="row"
              key={x.id}
            >
              <b>{x.category}</b>

              <span>
                {money(x.amount)}
              </span>

              <span>
                {new Date(x.date).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}

