import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import style from "./LoginPage.module.scss";
import { FiEye, FiEyeOff } from "react-icons/fi";
import loginImage from "../../images/login.png";
import infoImage from "../../images/info.png";

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
          setError("Unknown role");
          return;
      }

      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed. Please try again.");
    }

    console.log("Login finished");
  };

  return (
    <div className={style.loginWrapper}>
      <div className={style.loginContainer}>
        <div></div>
        <img
          src={loginImage}
          alt="Login illustration"
          className={style.loginImage}
        />
        <h2 className={style.header}>Login</h2>
        <form onSubmit={handleLogin}>
          <div className={style.formGroup}>
            <label className={style.label}>Username</label>
            <input
              type="text"
              className={style.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </div>
          <div className={style.formGroup}>
            <label className={style.label}>Password</label>
            <div className={style.passwordContainer}>
              <input
                type={showPassword ? "text" : "password"}
                className={style.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
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
          {error && <p className={style.errorMessage}>{error}</p>}
          <button type="submit" className={style.button}>
            Login
          </button>
        </form>
      </div>
      <div className={style.descriptionBox}>
        <h2>What is ShiftPrint Manager?</h2>
        <p>
          ShiftPrint Manager is a system for registering shifts, tasks, and
          operator productivity. It allows you to manage work data, view
          detailed statistics, and streamline control over your production.
        </p>
        <ul>
          <li>
            <span className={style.highlighted}>- Real-time analytics</span> :
            instantly view productivity, downtime, output volume, and more
          </li>
          <li>
            <span className={style.highlighted}>- Simple and secure login</span>{" "}
            : access only for registered users with roles
          </li>
          <li>
            <span className={style.highlighted}>
              - Flexible shift management
            </span>{" "}
            : shifts, machines, and operators all under control
          </li>
          <li>
            <span className={style.highlighted}>- Task comments</span> : leave
            notes or feedback on any entry
          </li>
          <li>
            <span className={style.highlighted}>
              - Time-saving for team leaders
            </span>{" "}
            : no more Excel chaos, everything is automated
          </li>
          <li>
            <span className={style.highlighted}>- Cloud-based storage</span> :
            all data is centralized, safe, and accessible
          </li>
        </ul>
        <img
          src={infoImage}
          alt="Login illustration"
          className={style.infoImage}
        />
      </div>
    </div>
  );
};

export default LoginPage;
