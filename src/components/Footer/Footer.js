import React from "react";
import style from "./Footer.module.scss";

function Footer() {
  return (
    <footer className={style.footer}>
      <p>
        ShiftPrint Manager / <span> HFT71 </span> / Wroclaw / Chaika Andrii /
        2025 &copy;
      </p>
    </footer>
  );
}

export default Footer;
