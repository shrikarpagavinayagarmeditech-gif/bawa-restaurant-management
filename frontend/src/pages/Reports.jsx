import {useEffect, useState } from "react";
import { api, money } from "../lib/api";
import React from "react";
export default function Reports() {
  const [tab, setTab] = useState("branch-comparison");
  const [data, setData] = useState([]);

  useEffect(() => {
    api
      .get(`/reports/${tab}`)
      .then((r) => {
        setData(r.data);
      })
      .catch((err) => {
        console.error("Report loading error:", err);
        setData([]);
      });
  }, [tab]);

  const cols = data[0]
    ? Object.keys(data[0])
    : [];

  const tabs = [
    "branch-comparison",
    "branch-wise",
    "food-wise",
    "shift-wise",
    "day-wise",
    "gst-wise",
    "expense",
    "outstanding",
  ];

  return (
    <>
      <h1>Reports</h1>

      <div className="tabs">
        {tabs.map((x) => (
          <button
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
            key={x}
          >
            {x}
          </button>
        ))}
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((r, i) => (
              <tr key={i}>
                {cols.map((c) => (
                  <td key={c}>
                    {typeof r[c] === "number"
                      ? money(r[c])
                      : String(r[c] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

