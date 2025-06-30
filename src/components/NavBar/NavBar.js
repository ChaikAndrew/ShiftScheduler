import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiLogOut,
  FiHome,
  FiCalendar,
  FiUsers,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
} from "react-icons/fi";
import { VscPreview } from "react-icons/vsc";
import { SlPrinter } from "react-icons/sl";
import { GrGroup } from "react-icons/gr";
import { BsClock } from "react-icons/bs";
import { FiSearch } from "react-icons/fi";
import { TbFileExport } from "react-icons/tb";

import styles from "./NavBar.module.scss";
import LogoWithAnimation from "../LogoWithAnimation/LogoWithAnimation";

const NavBar = ({ isCollapsed, setIsCollapsed, setIsSearchModalOpen }) => {
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
        {(role === "admin" || role === "leader") && (
          <NavLink
            to="/monthly-statistics"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            <GrGroup className={styles.icon} />
            <span className={styles.linkText}>Monthly Statistics</span>
          </NavLink>
        )}
        {(role === "admin" || role === "leader") && (
          <NavLink
            to="/leader-statistics"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            <FiUsers className={styles.icon} />
            <span className={styles.linkText}>Leader Statistics</span>
          </NavLink>
        )}
        {(role === "admin" || role === "leader") && (
          <NavLink
            to="/machine-time-stats"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            <BsClock className={styles.icon} />
            <span className={styles.linkText}>Machine Time Stats</span>
          </NavLink>
        )}
        {(role === "admin" || role === "leader") && (
          <NavLink
            to="/machines-quantity-stats"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            <SlPrinter className={styles.icon} />
            <span className={styles.linkText}>Machines Quantity Stats</span>
          </NavLink>
        )}
        {(role === "admin" || role === "leader") && (
          <NavLink
            to="/operator-statistics"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            <FiUser className={styles.icon} />
            <span className={styles.linkText}>Operator Statistics</span>
          </NavLink>
        )}
        <NavLink
          to="#"
          onClick={() => setIsSearchModalOpen(true)}
          className={styles.link}
        >
          <FiSearch className={styles.icon} />
          <span className={styles.linkText}>Zlecenie Search</span>
        </NavLink>
        {(role === "admin" || role === "leader") && (
          <NavLink
            to="/export-to-excel"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            <TbFileExport className={styles.icon} />
            <span className={styles.linkText}>Export to Excel</span>
          </NavLink>
        )}

        <NavLink
          to={dashboardLink.path}
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ""} ${
              styles.dashboardLink
            }`
          }
        >
          <VscPreview className={styles.icon} />
          <span className={styles.linkText}>{dashboardLink.label}</span>
        </NavLink>
      </div>
      <div className={styles.userSection}>
        <LogoWithAnimation />
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
