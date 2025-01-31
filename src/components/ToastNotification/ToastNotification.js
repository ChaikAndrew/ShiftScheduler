import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Функція для показу сповіщень з кастомними кольорами
export const showToast = (message, type = "info") => {
  const toastConfig = {
    position: "bottom-right",
    autoClose: 3000, // Автоматично закривається через 3 сек
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "light", // Використовуємо світлу тему
  };

  const toastStyle = {
    color: "black", // Білий текст
    fontWeight: "",
    backgroundColor: "",
  };

  switch (type) {
    case "success": // Зелений (#82ca9d)
      toastStyle.backgroundColor = "#82ca9d";
      toast.success(message, { ...toastConfig, style: toastStyle });
      break;
    case "warning": // Жовтий (#ffaa00)
      toastStyle.backgroundColor = "#ffaa00";
      toast.warning(message, { ...toastConfig, style: toastStyle });
      break;
    case "error": // Червоний (#dd6f6f)
      toastStyle.backgroundColor = "#dd6f6f";
      toast.error(message, { ...toastConfig, style: toastStyle });
      break;
    default: // Інші (наприклад, жовтогарячий)
      toastStyle.backgroundColor = "#ffaa00";
      toast.info(message, { ...toastConfig, style: toastStyle });
      break;
  }
};
