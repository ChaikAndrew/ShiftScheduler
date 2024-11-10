import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./NavBar.module.scss"; // Імпорт SCSS-модуля

function NavBar() {
  return (
    <nav className={styles.navbar}>
      <NavLink
        to="/"
        className={({ isActive }) =>
          isActive ? `${styles.link} ${styles.active}` : styles.link
        }
      >
        Shift Scheduler
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
        to="/monthly-statistics"
        className={({ isActive }) =>
          isActive ? `${styles.link} ${styles.active}` : styles.link
        }
      >
        Monthly Statistics
      </NavLink>
    </nav>
  );
}

export default NavBar;
