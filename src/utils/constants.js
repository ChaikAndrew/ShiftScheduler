//Список доступних машин для вибору
export const machines = ["dtg1", "dtg2", "dtg3", "dtg4", "dtg5", "dtg6"];

//Типи задач, які оператор може виконувати
export const tasks = ["POD", "POF", "Zlecenie", "Sample", "Test"];

//Продукти, які можуть друкуватися
export const products = [
  "T-shirts",
  "T-shirts (Children)",
  "Hoodies",
  "Hoodies (Children)",
  "Bags",
  "Sleeves",
  "Baby Bodysuits",
  "Others",
];

//Можливі кольори продуктів
export const colors = ["Color", "White"];

//Причини простою, з ID та описом
export const reasons = [
  { id: 1, description: "1.Przezbrojenie (zmiana palety)" },
  { id: 2, description: "2.Czyszczenie głowic (planowane 2/zm)" },
  { id: 3, description: "3.Kalibracja palety (problem z wysokością)" },
  { id: 4, description: "4.Czyszczenie palet z farby" },
  { id: 5, description: "5.Przerwa pracownicza" },
  { id: 6, description: "6.Brak pełnej obsady" },
  { id: 7, description: "7.Brak plików" },
  { id: 8, description: "8.Brak farb/sprayu" },
  { id: 9, description: "9.Brak towaru produkcyjnego" },
  { id: 10, description: "10.Testy technologiczne" },
  { id: 11, description: "11.Problem z czujnikiem wysokości głowicy" },
  { id: 12, description: "12.Czyszczenie głowic (paskowanie głowic)" },
  { id: 13, description: "13.Uderzenie w głowicę" },
  { id: 14, description: "14.Awaria pieca" },
  { id: 15, description: "15.Błędy systemowe (system POD)" },
  { id: 16, description: "16.Konserwacja pieca tygodniowa/miesięczna" },
  { id: 17, description: "17.Konserwacja Kornit tygodniowa/miesięczna" },
  { id: 18, description: "18.Awaria dysków sieciowych/prądu" },
  { id: 19, description: "19.Segregacja towaru" },
  { id: 20, description: "20.Zawieszenie maszyny (restart)" },
  {
    id: 21,
    description: "21.Maszyna wyłączona z pracy (awaria opisana mailowo)",
  },
  { id: 22, description: "22.Operatywka" },
  { id: 23, description: "23.Zalewanie się palety sprayem" },
  { id: 24, description: "24.Przezbrojenie (zmiana temperatury pieca)" },
  { id: 26, description: "25.Zbiorniki na odpady płynne są pełne(wymiana)" },
  { id: 27, description: "26.Restart aplikacji" },
];

//Список лідерів змін
export const leaders = ["Karina", "Michal", "Lyuda"];

// Початкові часи для кожної зміни
export const shiftStartTimes = {
  first: "06:00",
  second: "14:00",
  third: "22:00",
};
