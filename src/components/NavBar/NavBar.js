import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "./NavBar.module.scss";

function NavBar() {
  const navigate = useNavigate();
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [username, setUsername] = useState(localStorage.getItem("username"));

  useEffect(() => {
    const handleStorageChange = () => {
      setRole(localStorage.getItem("role"));
      setUsername(localStorage.getItem("username"));
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setRole(null);
    setUsername(null);
    navigate("/login");
  };

  const getDashboardLink = () => {
    switch (role) {
      case "admin":
        return { path: "/admin-dashboard", label: "Admin Dashboard" };
      case "leader":
        return { path: "/leader-dashboard", label: "Leader Dashboard" };
      case "operator":
        return { path: "/operator-dashboard", label: "Operator Dashboard" };
      default:
        return { path: "/login", label: "Dashboard" };
    }
  };

  const dashboardLink = getDashboardLink();

  return (
    <nav className={styles.navbar}>
      {!role ? (
        <div className={styles.singleLink}>
          <NavLink
            to="/login"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Login
          </NavLink>
        </div>
      ) : (
        <>
          <div className={styles.navLinks}>
            <NavLink
              to="/shift-scheduler"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              Shift Scheduler
            </NavLink>
            <NavLink
              to="/monthly-statistics"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              Monthly Statistics
            </NavLink>
            <NavLink
              to="/leader-statistics"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              Leader Statistics
            </NavLink>
            <NavLink
              to="/machine-statistics"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              Machine Statistics
            </NavLink>
            <NavLink
              to="/operator-statistics"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              Operator Statistics
            </NavLink>
            <NavLink
              to={dashboardLink.path}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              {dashboardLink.label}
            </NavLink>
          </div>
          <div className={styles.userInfo}>
            {username ? (
              <span className={styles.username}>
                You are <span className={styles.userInfoStatus}>online</span>{" "}
                as: <span className={styles.userInfoName}> {username} </span> ({" "}
                {role} )
              </span>
            ) : (
              <span className={styles.username}>Checking connection...</span>
            )}
          </div>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </>
      )}
    </nav>
  );
}

export default NavBar;
