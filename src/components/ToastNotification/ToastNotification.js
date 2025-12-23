import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Функція для показу сповіщень у стилі navbar
export const showToast = (message, type = "info") => {
  const toastConfig = {
    position: "bottom-right",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "dark", // Темна тема
  };

  const toastStyle = {
    color: "#ffffffb2", // як у .navbar
    fontWeight: "normal",
    backgroundColor: "", // додається нижче
    backdropFilter: "blur(10px)",
  };

  switch (type) {
    case "success":
      toastStyle.backgroundColor = "rgba(68, 68, 68, 0.7)"; // як при hover у navbar
      toast.success(message, { ...toastConfig, style: toastStyle });
      break;
    case "warning":
      toastStyle.backgroundColor = "rgba(85, 85, 85, 0.7)"; // трохи яскравіший від базового
      toast.warning(message, { ...toastConfig, style: toastStyle });
      break;
    case "error":
      toastStyle.backgroundColor = "rgba(0, 0, 0, 0.34)"; // темний
      toast.error(message, { ...toastConfig, style: toastStyle });
      break;
    default:
      toastStyle.backgroundColor = "rgba(51, 51, 51, 0.7)"; // як background navbar
      toast.info(message, { ...toastConfig, style: toastStyle });
      break;
  }
};
