const express = require("express");
const router = express.Router();

let expenses = [];
let nextId = 1;

router.get("/", (req, res) => {
  res.json(expenses);
});

router.post("/", (req, res) => {
  const { title, amount, category } = req.body;
  const expense = { id: nextId++, title, amount, category, createdAt: new Date() };
  expenses.push(expense);
  res.json(expense);
});

module.exports = router;
