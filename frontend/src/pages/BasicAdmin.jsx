import { useEffect, useState } from "react";
import { api } from "../lib/api";
import React from "react";
export function Categories() {
  return (
    <Crud
      title="Categories"
      endpoint="/categories"
      fields={["name"]}
    />
  );
}

export function Shifts() {
  return (
    <Crud
      title="Shifts"
      endpoint="/shifts"
      fields={["name", "startTime", "endTime"]}
    />
  );
}

export function Food() {
  const [cats, setCats] = useState([]);
  const [rows, setRows] = useState([]);

  const [f, setF] = useState({
    name: "",
    rate: "",
    description: "",
    categoryId: "",
  });

  const load = () => {
    api
      .get("/food-items")
      .then((r) => setRows(r.data))
      .catch((err) => {
        console.error("Food loading error:", err);
      });
  };

  useEffect(() => {
    api
      .get("/categories")
      .then((r) => setCats(r.data))
      .catch((err) => {
        console.error("Category loading error:", err);
      });

    load();
  }, []);

  async function sub(e) {
    e.preventDefault();

    try {
      await api.post("/food-items", {
        ...f,
        rate: Number(f.rate),
      });

      setF({
        name: "",
        rate: "",
        description: "",
        categoryId: "",
      });

      load();
    } catch (err) {
      console.error("Food add error:", err);
    }
  }

  return (
    <>
      <h1>Food Items</h1>

      <div className="grid2">

        {/* Add Food */}
        <form className="panel" onSubmit={sub}>
          <h3>Add Food</h3>

          <input
            placeholder="Food name"
            value={f.name}
            onChange={(e) =>
              setF({
                ...f,
                name: e.target.value,
              })
            }
          />

          <input
            type="number"
            placeholder="Default rate"
            value={f.rate}
            onChange={(e) =>
              setF({
                ...f,
                rate: e.target.value,
              })
            }
          />

          <input
            placeholder="Description"
            value={f.description}
            onChange={(e) =>
              setF({
                ...f,
                description: e.target.value,
              })
            }
          />

          <select
            value={f.categoryId}
            onChange={(e) =>
              setF({
                ...f,
                categoryId: e.target.value,
              })
            }
          >
            <option value="">Category</option>

            {cats
              .filter((c) => c.active)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>

          <button type="submit">
            Add
          </button>
        </form>

        {/* Food List */}
        <div className="panel">
          {rows.map((x) => (
            <div className="row" key={x.id}>
              <b>{x.name}</b>

              <span>
                {x.category?.name || "No Category"}
              </span>

              <span>
                ₹{Number(x.rate).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}

function Crud({ title, endpoint, fields }) {
  const [rows, setRows] = useState([]);
  const [f, setF] = useState({});

  const load = () => {
    api
      .get(endpoint)
      .then((r) => setRows(r.data))
      .catch((err) => {
        console.error(`${title} loading error:`, err);
      });
  };

  useEffect(() => {
    load();
  }, []);

  async function sub(e) {
    e.preventDefault();

    try {
      await api.post(endpoint, f);

      setF({});

      load();
    } catch (err) {
      console.error(`${title} add error:`, err);
    }
  }

  return (
    <>
      <h1>{title}</h1>

      <div className="grid2">

        {/* Add */}
        <form className="panel" onSubmit={sub}>
          {fields.map((k) => (
            <input
              key={k}
              placeholder={k}
              value={f[k] || ""}
              onChange={(e) =>
                setF({
                  ...f,
                  [k]: e.target.value,
                })
              }
            />
          ))}

          <button type="submit">
            Add
          </button>
        </form>

        {/* List */}
        <div className="panel">
          {rows.map((x) => (
            <div className="row" key={x.id}>
              <b>{x.name}</b>

              <span>
                {x.startTime &&
                  `${x.startTime} - ${x.endTime}`}
              </span>

              <span>
                {x.active ? "Active" : "Inactive"}
              </span>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}

