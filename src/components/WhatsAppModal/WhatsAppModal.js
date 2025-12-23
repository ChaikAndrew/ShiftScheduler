import React, { useState, useEffect, useMemo, useCallback } from "react";
import { DateTime } from "luxon";
import CustomDatePicker from "../CustomDatePicker/CustomDatePicker";
import { getWhatsAppUrl } from "../../utils/whatsappFormatter";
import { formatDailySummaryForWhatsApp } from "../../utils/whatsappFormatter";
import { getEntriesByMonth } from "../../utils/api/shiftApi";
import { calculateDetailedByShift } from "../../utils/calculateDetailedByShift";
import { products, machines } from "../../utils/constants";
import { getStratyPerShiftByProductForDate } from "../../utils/calculateStratyPerShiftByProduct";
import { getStratyPerShiftByTaskForDate } from "../../utils/calculateStratyPerShiftByTask";
import { fetchStraties } from "../../utils/stratyApi";
import { recalculateDowntime } from "../../utils/recalculateDowntime";
import s from "./WhatsAppModal.module.scss";

const WhatsAppModal = ({ isOpen, onClose }) => {
  const [selectedDate, setSelectedDate] = useState(() =>
    DateTime.now().toISODate()
  );
  const [entries, setEntries] = useState({ first: {}, second: {}, third: {} });
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isLoadingStraty, setIsLoadingStraty] = useState(false);
  const [isLoadingStratyByMachine, setIsLoadingStratyByMachine] = useState(false);
  const [stratyByProduct, setStratyByProduct] = useState({
    first: {},
    second: {},
    third: {},
  });
  const [stratyByTask, setStratyByTask] = useState({
    first: { POD: 0, POF: 0, ZLECENIE: 0 },
    second: { POD: 0, POF: 0, ZLECENIE: 0 },
    third: { POD: 0, POF: 0, ZLECENIE: 0 },
  });
  const [stratyByMachine, setStratyByMachine] = useState({});
  const [stratyDetails, setStratyDetails] = useState({
    BLUZA: 0,
    TSHIRT: 0,
    POD: 0,
    POF: 0,
    ZLECENIE: 0,
  });

  // Завантаження entries для вибраної дати
  useEffect(() => {
    if (!isOpen || !selectedDate) return;

    const loadEntries = async () => {
      setIsLoadingEntries(true);
      try {
        const token = localStorage.getItem("token");
        const dt = DateTime.fromISO(selectedDate);
        const { data: dbEntries } = await getEntriesByMonth(
          dt.year,
          dt.month,
          token
        );

        const grouped = { first: {}, second: {}, third: {} };
        for (const entry of dbEntries) {
          const { shift, machine } = entry;
          if (!grouped[shift][machine]) grouped[shift][machine] = [];
          grouped[shift][machine].push(entry);
        }

        let fullyRecalculated = { ...grouped };
        for (const shift in grouped) {
          for (const machine in grouped[shift]) {
            fullyRecalculated = recalculateDowntime(
              fullyRecalculated,
              shift,
              machine
            );
          }
        }
        setEntries(fullyRecalculated);
      } catch (err) {
        console.error("❌ Error loading entries:", err.message);
      } finally {
        setIsLoadingEntries(false);
      }
    };

    loadEntries();
  }, [isOpen, selectedDate]);

  // Завантаження straty для вибраної дати
  useEffect(() => {
    if (!isOpen || !selectedDate) return;

    let alive = true;
    setIsLoadingStraty(true);
    (async () => {
      try {
        const [byProd, byTask] = await Promise.all([
          getStratyPerShiftByProductForDate(selectedDate, products),
          getStratyPerShiftByTaskForDate(selectedDate),
        ]);
        if (!alive) return;
        setStratyByProduct(byProd);
        setStratyByTask(byTask);
      } catch (e) {
        console.error("straty fetch error:", e);
      } finally {
        if (alive) setIsLoadingStraty(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isOpen, selectedDate]);

  // Завантаження straty по машинах
  useEffect(() => {
    if (!isOpen || !selectedDate) return;

    let alive = true;
    setIsLoadingStratyByMachine(true);
    (async () => {
      try {
        const SHIFT_LABEL = {
          first: "1 ZMIANA",
          second: "2 ZMIANA",
          third: "3 ZMIANA",
        };

        const allStraty = await Promise.all(
          Object.values(SHIFT_LABEL).map((shift) =>
            fetchStraties({ date: selectedDate, shift, mode: "day" })
          )
        );

        if (!alive) return;

        const machineStats = {};
        const machineQuantity = {};

        ["first", "second", "third"].forEach((shift) => {
          machines.forEach((machine) => {
            const shiftEntries = entries[shift]?.[machine] || [];
            shiftEntries.forEach((entry) => {
              if (entry.displayDate === selectedDate) {
                const qty = parseInt(entry.quantity, 10) || 0;
                if (!machineQuantity[machine]) {
                  machineQuantity[machine] = 0;
                }
                machineQuantity[machine] += qty;
              }
            });
          });
        });

        const details = {
          BLUZA: 0,
          TSHIRT: 0,
          POD: 0,
          POF: 0,
          ZLECENIE: 0,
        };

        allStraty.flat().forEach((item) => {
          const machine = (item.number_dtg || "").toLowerCase();
          if (machine) {
            if (!machineStats[machine]) {
              machineStats[machine] = { quantity: 0, straty: 0 };
            }
            machineStats[machine].straty += 1;
          }

          const product = (item.bluza_t_shirt || "").toUpperCase();
          if (product === "BLUZA") details.BLUZA++;
          else if (product === "T-SHIRT") details.TSHIRT++;

          const task = (item.pof_pod_hurt || "").toUpperCase();
          if (task === "POD") details.POD++;
          else if (task === "POF") details.POF++;
          else if (task === "ZLECENIE") details.ZLECENIE++;
        });

        setStratyDetails(details);

        machines.forEach((machine) => {
          const machineKey = machine.toLowerCase();
          if (!machineStats[machineKey]) {
            machineStats[machineKey] = { quantity: 0, straty: 0 };
          }
          machineStats[machineKey].quantity = machineQuantity[machine] || 0;
        });

        setStratyByMachine(machineStats);
      } catch (e) {
        console.error("straty by machine fetch error:", e);
        setStratyByMachine({});
      } finally {
        if (alive) setIsLoadingStratyByMachine(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isOpen, selectedDate, entries]);

  const detailed = useMemo(
    () => calculateDetailedByShift(entries, selectedDate, products),
    [entries, selectedDate]
  );

  const stratyByProductTotal = useMemo(() => {
    const sum = (p) =>
      (stratyByProduct.first?.[p] || 0) +
      (stratyByProduct.second?.[p] || 0) +
      (stratyByProduct.third?.[p] || 0);
    return Object.fromEntries(products.map((p) => [p, sum(p)]));
  }, [stratyByProduct]);

  const lossesTotalDay = useMemo(
    () => Object.values(stratyByProductTotal).reduce((a, b) => a + (b || 0), 0),
    [stratyByProductTotal]
  );

  const stratyByTaskTotal = useMemo(
    () => ({
      POD:
        (stratyByTask.first.POD || 0) +
        (stratyByTask.second.POD || 0) +
        (stratyByTask.third.POD || 0),
      POF:
        (stratyByTask.first.POF || 0) +
        (stratyByTask.second.POF || 0) +
        (stratyByTask.third.POF || 0),
      ZLECENIE:
        (stratyByTask.first.ZLECENIE || 0) +
        (stratyByTask.second.ZLECENIE || 0) +
        (stratyByTask.third.ZLECENIE || 0),
    }),
    [stratyByTask]
  );

  // Форматуємо повідомлення для WhatsApp
  const whatsappMessage = useMemo(() => {
    return formatDailySummaryForWhatsApp({
      selectedDate,
      detailed,
      lossesTotalDay,
      stratyByProductTotal,
      stratyByTaskTotal,
      products,
      entries,
      machines,
      stratyByMachine,
      stratyDetails,
    });
  }, [
    selectedDate,
    detailed,
    lossesTotalDay,
    stratyByProductTotal,
    stratyByTaskTotal,
    products,
    entries,
    stratyByMachine,
    stratyDetails,
  ]);

  // Перевірка, чи всі дані завантажені
  const isDataReady = useMemo(() => {
    return !isLoadingEntries && !isLoadingStraty && !isLoadingStratyByMachine;
  }, [isLoadingEntries, isLoadingStraty, isLoadingStratyByMachine]);

  const handleSend = useCallback(() => {
    if (!whatsappMessage || !isDataReady) return;
    const url = getWhatsAppUrl(null, whatsappMessage);
    window.open(url, "_blank");
    onClose();
  }, [whatsappMessage, isDataReady, onClose]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div className={s.overlay} onClick={handleClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.header}>
          <h2>Відправити звіт в WhatsApp</h2>
          <button className={s.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        <div className={s.content}>
          <div className={s.datePickerContainer}>
            <label>Оберіть дату:</label>
            <CustomDatePicker
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              shouldCloseOnSelect={true}
            />
          </div>

          {(isLoadingEntries || isLoadingStraty || isLoadingStratyByMachine) && (
            <div className={s.loading}>Завантаження даних...</div>
          )}

          {isDataReady && (
            <div className={s.preview}>
              <p>Дата: <strong>{selectedDate}</strong></p>
              <p className={s.messagePreview}>
                Повідомлення буде сформовано автоматично для вибраної дати.
              </p>
            </div>
          )}

          <div className={s.buttons}>
            <button
              className={s.cancelButton}
              onClick={handleClose}
              disabled={!isDataReady}
            >
              Скасувати
            </button>
            <button
              className={s.sendButton}
              onClick={handleSend}
              disabled={!isDataReady || !whatsappMessage}
            >
              Відправити в WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppModal;

