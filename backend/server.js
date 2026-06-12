const express = require("express");
const mongoose = require("mongoose");
const expenseRoutes = require("./routes/expenseRoutes");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/expenses", expenseRoutes);
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));
app.get("/", (req, res) => {
  res.send("Mooney backend is running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});