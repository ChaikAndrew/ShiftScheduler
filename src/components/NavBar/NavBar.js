import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiLogOut,
  FiHome,
  FiCalendar,
  FiBarChart,
  FiUsers,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { VscPreview } from "react-icons/vsc";
import { SlPrinter } from "react-icons/sl";
import { GrGroup } from "react-icons/gr";

import styles from "./NavBar.module.scss";

const NavBar = ({ isCollapsed, setIsCollapsed }) => {
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
    localStorage.clear();
    setRole(null);
    setUsername(null);
    navigate("/login");
  };

  const getDashboardLink = () => {
    if (!role) {
      return { path: "/login", label: "Dashboard", icon: <FiHome /> };
    }
    return {
      path: `/${role}-dashboard`,
      label: `${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard`,
      icon: <FiHome />,
    };
  };

  const dashboardLink = getDashboardLink();

  if (!role || !username) {
    return null;
  }

  return (
    <div className={`${styles.navbar} ${isCollapsed ? styles.collapsed : ""}`}>
      <div className={styles.logoContainer}>
        <button
          className={styles.collapseButton}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <FiChevronRight className={styles.icon} />
          ) : (
            <FiChevronLeft className={styles.icon} />
          )}
        </button>
      </div>
      <div className={styles.linksContainer}>
        <NavLink
          to="/shift-scheduler"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          <FiCalendar className={styles.icon} />
          <span className={styles.linkText}>Shift Scheduler</span>
        </NavLink>
        <NavLink
          to="/monthly-statistics"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          <FiBarChart className={styles.icon} />
          <span className={styles.linkText}>Monthly Statistics</span>
        </NavLink>
        <NavLink
          to="/leader-statistics"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          <FiUsers className={styles.icon} />
          <span className={styles.linkText}>Leader Statistics</span>
        </NavLink>
        <NavLink
          to="/machine-time-stats"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          <SlPrinter className={styles.icon} />
          <span className={styles.linkText}>Machine Time Stats</span>
        </NavLink>
        <NavLink
          to="/machines-quantity-stats"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          <SlPrinter className={styles.icon} />
          <span className={styles.linkText}>Machines Quantity Stats</span>
        </NavLink>
        <NavLink
          to="/operator-statistics"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          <GrGroup className={styles.icon} />
          <span className={styles.linkText}>Operator Statistics</span>
        </NavLink>

        <NavLink
          to={dashboardLink.path}
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          <VscPreview className={styles.icon} />
          <span className={styles.linkText}>{dashboardLink.label}</span>
        </NavLink>
      </div>
      <div className={styles.userSection}>
        <div className={styles.userInfo}>
          <div className={styles.username}>{username}</div>
          <div className={styles.role}>({role})</div>
          <div className={styles.onlineStatus}>Online</div>
        </div>
        <button onClick={handleLogout} className={styles.logoutButton}>
          <FiLogOut className={styles.icon} />
          <span className={styles.linkText}>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default NavBar;
