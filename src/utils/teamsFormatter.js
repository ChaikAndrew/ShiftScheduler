// src/utils/whatsappFormatter.js
// Форматує дані звіту для відправки в WhatsApp

export function formatDailySummaryForWhatsApp({
  selectedDate,
  detailed,
  lossesTotalDay,
  stratyByProductTotal,
  stratyByTaskTotal,
  products,
  entries,
  machines,
  stratyByMachine,
  stratyDetails,
}) {
  // Загальна кількість без Test (POD + POF + Zlecenie)
  const podTotal = detailed.total.byTask.POD || 0;
  const pofTotal = detailed.total.byTask.POF || 0;
  const zlecenieTotal = detailed.total.byTask.Zlecenie || 0;
  const totalWithoutTest = podTotal + pofTotal + zlecenieTotal;

  let message = `*RAPORT DZIENNY*\n`;
  message += `Data: ${selectedDate}\n`;
  message += `*RAZEM WYDRUKÓW:* ${totalWithoutTest}\n`;
  message += `┃ POD: ${podTotal}\n`;
  message += `┃ POF: ${pofTotal}\n`;
  message += `┃ Zlecenie: ${zlecenieTotal}\n`;
  message += `*PRODUKTY (RAZEM):*\n`;
  Object.entries(detailed.total.byProduct).forEach(([product, vals]) => {
    const productTotal = vals.total || 0;
    if (productTotal > 0) {
      message += `┃ ${product}: ${productTotal}\n`;
    }
  });
  message += `━━━━━━━━━━\n`;

  // По змінах
  const shifts = [
    { name: "ZMIANA 1", key: "first", data: detailed.first },
    { name: "ZMIANA 2", key: "second", data: detailed.second },
    { name: "ZMIANA 3", key: "third", data: detailed.third },
  ];

  shifts.forEach((shift, index) => {
    const shiftTotal = shift.data.total || 0;
    const shiftPOD = shift.data.byTask?.POD || 0;
    const shiftPOF = shift.data.byTask?.POF || 0;
    const shiftZlecenie = shift.data.byTask?.Zlecenie || 0;
    
    message += `*${shift.name}:* ${shiftTotal}\n`;
    message += `┃ POD: ${shiftPOD}\n`;
    message += `┃ POF: ${shiftPOF}\n`;
    message += `┃ Zlecenie: ${shiftZlecenie}\n`;
    // Продукти для цієї зміни
    Object.entries(shift.data.byProduct || {}).forEach(([product, vals]) => {
      const productTotal = vals.total || 0;
      if (productTotal > 0) {
        message += `┃ ${product}: ${productTotal}\n`;
      }
    });
    // Додаємо розділювач між змінами (крім останньої)
    if (index < shifts.length - 1) {
      message += `━━━━━━━━━━\n`;
    }
  });

  // Статистика по машинах
  if (machines && machines.length > 0 && entries && stratyByMachine) {
    message += `━━━━━━━━━━\n`;
    message += `*MASZYNY:*\n`;
    
    let totalStraty = 0;
    
    // Виводимо статистику по машинах
    Object.entries(stratyByMachine)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([machine, stats]) => {
        const machineName = machine.toUpperCase();
        const machineQuantity = stats.quantity || 0;
        const machineStraty = stats.straty || 0;
        totalStraty += machineStraty;
        
        if (machineQuantity > 0 || machineStraty > 0) {
          message += `┃ ${machineName}: ${machineQuantity} (${machineStraty} strat)\n`;
        }
      });
    
    // Підсумок страт з деталізацією
    if (totalStraty > 0) {
      message += `┃\n`;
      message += `┃ RAZEM STRAT: ${totalStraty}\n`;
      if (stratyDetails) {
        if (stratyDetails.BLUZA > 0) {
          message += `┃ Bluzy: ${stratyDetails.BLUZA}\n`;
        }
        if (stratyDetails.TSHIRT > 0) {
          message += `┃ T-shirty: ${stratyDetails.TSHIRT}\n`;
        }
        if (stratyDetails.POD > 0) {
          message += `┃ POD: ${stratyDetails.POD}\n`;
        }
        if (stratyDetails.POF > 0) {
          message += `┃ POF: ${stratyDetails.POF}\n`;
        }
        if (stratyDetails.ZLECENIE > 0) {
          message += `┃ Zlecenie: ${stratyDetails.ZLECENIE}\n`;
        }
      }
    }
  }

  return message;
}

export function getWhatsAppUrl(phoneNumber, message) {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
}

