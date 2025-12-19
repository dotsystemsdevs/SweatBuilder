const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("OK");
});

// Onboarding endpoint
app.post("/api/ai/onboarding", (req, res) => {
  const { step } = req.body || {};

  if (step === "PING") {
    return res.json({ ok: true });
  }

  return res.json({ ok: true, step: step || "unknown" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
