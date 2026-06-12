const API_URL = "http://localhost:5000/api/expenses";

export const getExpenses = async () => {
  const response = await fetch(API_URL);
  return response.json();
};

export const addExpense = async (expense: {
  title: string;
  amount: number;
  category: string;
}) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(expense),
  });

  return response.json();
};