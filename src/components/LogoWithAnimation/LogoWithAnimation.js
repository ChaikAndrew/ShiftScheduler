// components/LogoWithAnimation.js
import React from "react";
import styles from "./LogoWithAnimation.module.scss";
import logoSvg from "../../images/hft.svg";

const LogoWithAnimation = () => {
  return (
    <div className={styles.logoContainer}>
      <img src={logoSvg} alt="Logo" className={styles.logo} />
    </div>
  );
};

export default LogoWithAnimation;
