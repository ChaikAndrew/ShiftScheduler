import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import style from "./LoginPage.module.scss";
import { FiEye, FiEyeOff } from "react-icons/fi";
import LightPillar from "../../components/LightPillar/LightPillar";
import hftLogo from "../../images/hft.svg";
import { showToast } from "../../components/ToastNotification/ToastNotification";
import { ToastContainer } from "react-toastify";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [baseUrl, setBaseUrl] = useState(
    "https://shift-scheduler-server.vercel.app"
  );
  const navigate = useNavigate();

  useEffect(() => {
    // Disable scroll
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    // Add class for login page styling
    document.body.classList.add('login-page');

    const checkLocalhost = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1000);

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

    // Cleanup: restore scroll on unmount
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('login-page');
    };
  }, []);

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("Login started");
    setIsLoading(true);

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    try {
      console.log("Sending request to:", `${baseUrl}/auth/login`);

      const response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: trimmedUsername,
          password: trimmedPassword,
        }),
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

      switch (userRole) {
        case "admin":
          navigate("/admin-dashboard");
          break;
        case "operator":
          navigate("/shift-scheduler");
          break;
        case "leader":
          navigate("/leader-dashboard");
          break;
        default:
          showToast("Unknown role", "error");
          return;
      }

      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (error) {
      console.error("Login error:", error);
      showToast("Login failed. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }

    console.log("Login finished");
  };

  return (
    <div className={style.loginWrapper}>
      <div className={style.backgroundSection}>
        <LightPillar
          topColor="#5227FF"
          bottomColor="#FF9FFC"
          intensity={0.9}
          rotationSpeed={1}
          glowAmount={0.003}
          pillarWidth={3.0}
          pillarHeight={0.4}
          noiseIntensity={0}
          pillarRotation={115}
          interactive={false}
          mixBlendMode="screen"
        />
      </div>
      <div className={style.loginContainer}>
        <h2 className={style.header}>
          Welcome to Shift Print{" "}
          <span className={style.hft}>HFT</span>
          <span className={style.seven}>7</span>
          <span className={style.one}>1</span>
        </h2>
        <form onSubmit={handleLogin} className={style.form}>
          <div className={style.formGroup}>
            <input
              type="text"
              className={style.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
            />
          </div>
          <div className={style.formGroup}>
            <div className={style.passwordContainer}>
              <input
                type={showPassword ? "text" : "password"}
                className={style.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
              <button
                type="button"
                className={style.togglePassword}
                onClick={toggleShowPassword}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>
          {isLoading && (
            <div className={style.loadingSpinner}>
              <img src={hftLogo} alt="Loading" className={style.spinner} />
            </div>
          )}
          <button 
            type="submit" 
            className={style.button}
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default LoginPage;
