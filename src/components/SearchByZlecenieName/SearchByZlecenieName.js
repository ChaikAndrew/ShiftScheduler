import React, { useState, useEffect, useCallback } from "react";
import style from "./SearchByZlecenieName.module.scss";

function SearchByZlecenieName({ entries, isModalOpen, setIsModalOpen }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSearchTerm("");
    setFilteredEntries([]);
    setSearchPerformed(false);
  }, [setIsModalOpen]);

  const handleSearch = () => {
    if (!searchTerm.trim()) return;

    setSearchPerformed(true);
    const normalizedSearchTerm = searchTerm
      .replace(/[_\s-]/g, "")
      .toLowerCase();

    const results = Object.entries(entries).flatMap(([shift, machines]) =>
      Object.entries(machines).flatMap(([machine, machineEntries]) =>
        machineEntries
          .filter((entry) =>
            entry.task
              .replace(/[_\s-]/g, "")
              .toLowerCase()
              .includes(normalizedSearchTerm)
          )
          .map((entry) => ({
            ...entry,
            shift,
            machine,
          }))
      )
    );
    setFilteredEntries(results);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeModal();
    };

    if (isModalOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.classList.add("modal-open"); // Блокуємо прокрутку сторінки
    } else {
      document.body.classList.remove("modal-open"); // Відновлюємо прокрутку
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
        <h3>Search by Zlecenie Name</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
        >
          <input
            type="text"
            className={style.input}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Input Zlecenie Number"
          />
          <button type="submit" className={style.modalSearchButton}>
            Search
          </button>
        </form>

        {searchPerformed && (
          <>
            {filteredEntries.length > 0 ? (
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
                      <td>{entry.displayDate}</td>
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
              <p>No results found</p>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default SearchByZlecenieName;
