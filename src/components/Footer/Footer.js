import React from "react";
import style from "./Footer.module.scss";

function Footer() {
  return (
    <footer className={style.footer}>
      <p>
        Chaika Andrii / <span> HFT71 </span> / Wroclaw / 2025 &copy; All rights
        reserved
      </p>
    </footer>
  );
}

export default Footer;
