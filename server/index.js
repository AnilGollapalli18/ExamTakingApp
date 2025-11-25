import express from "express";
import cors from "cors";
import routesExam from "./routes/exam.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// simple request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// mount routes
app.use("/api/exam", routesExam);

// error handler
app.use((err, req, res, next) => {
  console.error("UNHANDLED SERVER ERROR:", err && err.stack ? err.stack : err);
  res.status(500).json({ error: err && err.message ? err.message : "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
