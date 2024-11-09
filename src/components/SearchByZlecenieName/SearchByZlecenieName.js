import React, { useState, useEffect } from "react";
import style from "./SearchByZlecenieName.module.scss";

function SearchByZlecenieName({ entries }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setSearchTerm("");
    setFilteredEntries([]);
    setSearchPerformed(false);
  };

  const handleSearch = () => {
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
      if (e.key === "Escape") {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  return (
    <div className={style.searchContainer}>
      <button onClick={openModal} className={style.fixedButton}>
        Zlecenie Search
      </button>

      {isModalOpen && (
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
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter Zlecenie Name"
            />
            <button onClick={handleSearch}>Search</button>

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
                        <th>Zlecenie Number</th>
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
      )}
    </div>
  );
}

export default SearchByZlecenieName;
