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
    
    // Деталізація по машинах для цієї зміни
    if (entries && machines && entries[shift.key]) {
      const shiftEntries = entries[shift.key];
      const machinesInShift = machines
        .filter((machine) => {
          const machineEntries = shiftEntries[machine]?.filter(
            (e) => e.displayDate === selectedDate
          ) || [];
          return machineEntries.length > 0;
        })
        .sort();
      
      if (machinesInShift.length > 0) {
        message += `\n┃ *MASZYNY:*\n`;
        
        machinesInShift.forEach((machine) => {
          const machineEntries = shiftEntries[machine]?.filter(
            (e) => e.displayDate === selectedDate
          ) || [];
          
          if (machineEntries.length === 0) return;
          
          // Підрахунок статистики по машині
          let machineTotal = 0;
          const machineTasks = { POD: 0, POF: 0, Zlecenie: 0, Test: 0 };
          const machineProducts = {};
          
          machineEntries.forEach((entry) => {
            const qty = parseInt(entry.quantity, 10) || 0;
            machineTotal += qty;
            
            const task = entry.task;
            if (task === "POD" || task === "POF" || task === "Test") {
              machineTasks[task] = (machineTasks[task] || 0) + qty;
            } else {
              machineTasks.Zlecenie = (machineTasks.Zlecenie || 0) + qty;
            }
            
            if (entry.product) {
              machineProducts[entry.product] = 
                (machineProducts[entry.product] || 0) + qty;
            }
          });
          
          if (machineTotal > 0) {
            const machineName = machine.toUpperCase();
            message += `┃  *${machineName}*: ${machineTotal}\n`;
            
            // Задачі
            if (machineTasks.POD > 0) {
              message += `┃    POD: ${machineTasks.POD}\n`;
            }
            if (machineTasks.POF > 0) {
              message += `┃    POF: ${machineTasks.POF}\n`;
            }
            if (machineTasks.Zlecenie > 0) {
              message += `┃    Zlecenie: ${machineTasks.Zlecenie}\n`;
            }
            
            // Продукти (якщо є)
            const productEntries = Object.entries(machineProducts)
              .filter(([, qty]) => qty > 0)
              .sort(([a], [b]) => a.localeCompare(b));
            
            if (productEntries.length > 0) {
              productEntries.forEach(([product, qty]) => {
                message += `┃    ${product}: ${qty}\n`;
              });
            }
          }
        });
      }
    }
    
    // Додаємо розділювач між змінами (крім останньої)
    if (index < shifts.length - 1) {
      message += `━━━━━━━━━━\n`;
    }
  });

  // Статистика по машинах (загальна за день)
  if (machines && machines.length > 0 && entries) {
    message += `━━━━━━━━━━\n`;
    message += `*MASZYNY:*\n`;
    
    let totalStraty = 0;
    const machineStatsMap = {};
    
    // Рахуємо quantity для всіх машин з entries
    machines.forEach((machine) => {
      let machineQuantity = 0;
      
      // Сумуємо quantity по всіх змінах для цієї машини
      ["first", "second", "third"].forEach((shift) => {
        const shiftEntries = entries[shift]?.[machine] || [];
        shiftEntries.forEach((entry) => {
          if (entry.displayDate === selectedDate) {
            machineQuantity += parseInt(entry.quantity, 10) || 0;
          }
        });
      });
      
      // Отримуємо straty з stratyByMachine (якщо є)
      const machineKey = machine.toLowerCase();
      const stratyData = stratyByMachine?.[machineKey] || {};
      const machineStraty = stratyData.straty || 0;
      
      if (machineQuantity > 0 || machineStraty > 0) {
        machineStatsMap[machine] = {
          quantity: machineQuantity,
          straty: machineStraty,
        };
        totalStraty += machineStraty;
      }
    });
    
    // Виводимо статистику по машинах (відсортовані)
    Object.entries(machineStatsMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([machine, stats]) => {
        const machineName = machine.toUpperCase();
        const machineQuantity = stats.quantity || 0;
        const machineStraty = stats.straty || 0;
        
        message += `┃ *${machineName}*: ${machineQuantity}${machineStraty > 0 ? ` (${machineStraty} strat)` : ''}\n`;
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
  if (phoneNumber) {
    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  }
  // Якщо номер не вказано, використовуємо wa.me - на мобільних відкриє додаток, на десктопі - веб-версію
  // Користувач сам вибере контакт для відправки
  return `https://wa.me/?text=${encodedMessage}`;
}

