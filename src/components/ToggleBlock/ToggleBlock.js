import React, { useState, useRef, useEffect } from "react";
import styles from "./ToggleBlock.module.scss";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

const ToggleBlock = ({ title, tooltip, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef(null);
  const [height, setHeight] = useState("0px");

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setHeight(`${contentRef.current.scrollHeight}px`);
    } else {
      setHeight("0px");
    }
  }, [isOpen, children]);

  return (
    <div className={styles.toggleBlock}>
      <button
        className={styles.toggleButton}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? <FaChevronDown /> : <FaChevronRight />}
        <span className={styles.titleWithTooltip}>
          {title}
          {tooltip && <span className={styles.tooltip}>{tooltip}</span>}
        </span>
      </button>

      <div
        ref={contentRef}
        className={styles.content}
        style={{
          maxHeight: height,
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className={styles.inner}>{children}</div>
      </div>
    </div>
  );
};

export default ToggleBlock;
