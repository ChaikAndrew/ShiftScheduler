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
  };

  switch (type) {
    case "success":
      toastStyle.backgroundColor = "#444"; // як при hover у navbar
      toast.success(message, { ...toastConfig, style: toastStyle });
      break;
    case "warning":
      toastStyle.backgroundColor = "#555"; // трохи яскравіший від базового
      toast.warning(message, { ...toastConfig, style: toastStyle });
      break;
    case "error":
      toastStyle.backgroundColor = "#5c2b2b"; // темний, спокійний червоний
      toast.error(message, { ...toastConfig, style: toastStyle });
      break;
    default:
      toastStyle.backgroundColor = "#333"; // як background navbar
      toast.info(message, { ...toastConfig, style: toastStyle });
      break;
  }
};
