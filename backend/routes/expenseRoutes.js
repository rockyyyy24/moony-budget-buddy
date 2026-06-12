const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");

router.get("/", async (req, res) => {
  const expenses = await Expense.find();
  res.json(expenses);
});

router.post("/", async (req, res) => {
  const newExpense = new Expense(req.body);
  await newExpense.save();
  res.json(newExpense);
});

module.exports = router;