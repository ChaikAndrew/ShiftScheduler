// src/components/WhatsAppButton/WhatsAppButton.js
import React, { useState } from "react";
import s from "./WhatsAppButton.module.scss";

const TEAMS_WEBHOOK_URL = process.env.REACT_APP_TEAMS_WEBHOOK_URL;

export default function WhatsAppButton({ message, disabled = false }) {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  const handleClick = async () => {
    if (!message || disabled || isSending) return;
    
    if (!TEAMS_WEBHOOK_URL) {
      setError("Webhook URL не налаштовано");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch(TEAMS_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
        }),
      });

      if (!response.ok) {
        throw new Error(`Помилка відправки: ${response.status}`);
      }

      // Успішно відправлено
      alert("Звіт успішно відправлено в Microsoft Teams!");
    } catch (err) {
      console.error("Помилка відправки в Teams:", err);
      setError("Не вдалося відправити звіт. Спробуйте ще раз.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled || !message || isSending}
        className={s.whatsappButton}
        title="Wyślij raport do Microsoft Teams"
      >
        <svg
          className={s.icon}
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M19.5 4h-15A2.5 2.5 0 0 0 2 6.5v11A2.5 2.5 0 0 0 4.5 20h15a2.5 2.5 0 0 0 2.5-2.5v-11A2.5 2.5 0 0 0 19.5 4zm.5 13.5a.5.5 0 0 1-.5.5h-15a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5h15a.5.5 0 0 1 .5.5v11zM17.5 8h-11a.5.5 0 0 0 0 1h11a.5.5 0 0 0 0-1zm0 3h-11a.5.5 0 0 0 0 1h11a.5.5 0 0 0 0-1zm0 3h-7a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1z" />
        </svg>
        <span>{isSending ? "Wysyłanie..." : "Wyślij do Teams"}</span>
      </button>
      {error && (
        <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
          {error}
        </div>
      )}
    </>
  );
}

