import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LoginPage.module.scss"; // Підключаємо модулі стилів

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [baseUrl, setBaseUrl] = useState(
    "https://shift-scheduler-server.vercel.app"
  );
  const navigate = useNavigate();

  useEffect(() => {
    const checkLocalhost = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1000); // Тайм-аут 1 секунда

        const response = await fetch("http://localhost:4040", {
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (response.ok) {
          console.log("Localhost available, switching to localhost.");
          setBaseUrl("http://localhost:4040");
        }
      } catch (error) {
        console.log("Localhost not available, using Vercel.");
      }
    };

    checkLocalhost();
  }, []);

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("Login started");

    try {
      console.log("Sending request to:", `${baseUrl}/auth/login`);

      const response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      console.log("Response received");

      if (!response.ok) {
        console.log("Invalid response:", response.status);
        throw new Error("Invalid username or password");
      }

      const data = await response.json();
      console.log("Data received:", data);

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user?.role);
      localStorage.setItem("username", data.user?.username);

      console.log("LocalStorage updated");

      const userRole = data.user?.role;
      console.log("User role:", userRole);

      // Перехід на відповідний Dashboard
      switch (userRole) {
        case "admin":
          navigate("/admin-dashboard");
          break;
        case "operator":
          navigate("/operator-dashboard");
          break;
        case "leader":
          navigate("/leader-dashboard");
          break;
        default:
          setError("Unknown role");
          return;
      }

      // Дайте час навігації і оновіть сторінку
      setTimeout(() => {
        window.location.reload();
      }, 300); // Затримка 300 мс
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed. Please try again.");
    }

    console.log("Login finished");
  };

  return (
    <div className={styles.loginContainer}>
      <h2 className={styles.header}>Login</h2>
      <form onSubmit={handleLogin}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Username</label>
          <input
            type="text"
            className={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Password</label>
          <div className={styles.passwordContainer}>
            <input
              type={showPassword ? "text" : "password"}
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
            <button
              type="button"
              className={styles.togglePassword}
              onClick={toggleShowPassword}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>
        {error && <p className={styles.errorMessage}>{error}</p>}
        <button type="submit" className={styles.button}>
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
