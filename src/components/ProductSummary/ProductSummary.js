import React from "react";
import CustomActiveShapePieChart from "../CustomActiveShapePieChart/CustomActiveShapePieChart"; // Імпорт компонента для кругової діаграми
import styles from "./ProductSummary.module.scss"; // Припустимо, що є відповідний файл стилів

function ProductSummary({ productSummary }) {
  const hasProductData = Object.values(productSummary).some(
    (value) => value > 0
  );

  if (!hasProductData) {
    return null; // Якщо немає даних, не відображаємо компонент
  }

  // Підготовка даних для кругової діаграми
  const productData = Object.keys(productSummary)
    .filter((product) => productSummary[product] > 0)
    .map((product) => ({
      name: product,
      value: productSummary[product],
    }));

  const colors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#d0ed57",
    "#a4de6c",
    "#b3429d",
  ]; // Кольори для кругової діаграми

  return (
    <div className={styles.productSummary}>
      <p className={styles.productSummaryTitle}>
        {"Product summary".toUpperCase()}
      </p>
      <CustomActiveShapePieChart
        data={productData}
        colors={colors}
        width="100%"
        height={250}
      />

      <ul className={styles.productList}>
        {productData.map((product) => (
          <li key={product.name} className={styles.description}>
            <span>{product.name}</span>: <span>{product.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProductSummary;
