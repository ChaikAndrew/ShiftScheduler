import React, { useState, useEffect, useCallback } from "react";
import style from "./SearchByZlecenieName.module.scss";
import { getEntriesByMonthRange } from "../../utils/api/shiftApi";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
const months = [
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 },
];

function SearchByZlecenieName({ isModalOpen, setIsModalOpen }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [startMonth, setStartMonth] = useState(1);
  const [startYear, setStartYear] = useState(currentYear);
  const [endMonth, setEndMonth] = useState(new Date().getMonth() + 1);
  const [endYear, setEndYear] = useState(currentYear);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSearchTerm("");
    setFilteredEntries([]);
    setSearchPerformed(false);
    setIsLoading(false);
  }, [setIsModalOpen]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setSearchPerformed(true);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await getEntriesByMonthRange(
        { startMonth, startYear, endMonth, endYear },
        token
      );

      const dbEntries = response.data;
      const normalizedSearchTerm = searchTerm
        .replace(/[_\s-]/g, "")
        .toLowerCase();

      const results = dbEntries.filter((entry) =>
        entry.task
          ?.replace(/[_\s-]/g, "")
          .toLowerCase()
          .includes(normalizedSearchTerm)
      );

      setFilteredEntries(results);
    } catch (err) {
      console.error("❌ Error searching entries:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeModal();
    };

    if (isModalOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen, closeModal]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token && isModalOpen) {
      setIsModalOpen(false);
    }
  }, [isModalOpen, setIsModalOpen]);

  if (!isModalOpen) return null;

  return (
    <>
      <div className={style.overlay} onClick={closeModal}></div>
      <div
        className={`${style.modal} ${
          filteredEntries.length > 0 ? style.largeModal : ""
        }`}
      >
        <button onClick={closeModal} className={style.closeButton}>
          &times;
        </button>
        <h3>Search by Zlecenie</h3>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
        >
          <div className={style.selectRow}>
            <div>
              <label>From:</label>
              <select
                value={startMonth}
                onChange={(e) => setStartMonth(+e.target.value)}
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.value}. {m.label}
                  </option>
                ))}
              </select>
              <select
                value={startYear}
                onChange={(e) => setStartYear(+e.target.value)}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>To:</label>
              <select
                value={endMonth}
                onChange={(e) => setEndMonth(+e.target.value)}
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.value}. {m.label}
                  </option>
                ))}
              </select>
              <select
                value={endYear}
                onChange={(e) => setEndYear(+e.target.value)}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <input
            type="text"
            className={style.input}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter zlecenie number"
          />

          <button type="submit" className={style.modalSearchButton}>
            Search
          </button>
        </form>

        {searchPerformed && (
          <>
            {isLoading ? (
              <Skeleton count={5} height={30} style={{ margin: "10px 0" }} />
            ) : filteredEntries.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Shift</th>
                    <th>Date</th>
                    <th>Leader</th>
                    <th>Operator</th>
                    <th>Machine</th>
                    <th>Zlecenie</th>
                    <th>Product</th>
                    <th>Color</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry, index) => (
                    <tr key={index}>
                      <td>{entry.shift}</td>
                      <td>{entry.displayDate || entry.date?.slice(0, 10)}</td>
                      <td>{entry.leader}</td>
                      <td>{entry.operator}</td>
                      <td>{entry.machine}</td>
                      <td className={style.searchZlecenie}>{entry.task}</td>
                      <td>{entry.product}</td>
                      <td>{entry.color}</td>
                      <td>{entry.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No matches found</p>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default SearchByZlecenieName;
