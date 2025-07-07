import * as express from "express";
import * as cors from "cors";

const app = express();
const PORT = 3001;

app.use(cors()); // Important for frontend-backend communication

app.get("/", (_req, res) => {
  res.send("🌊 Lake Erie API is running!");
});

app.get("/api/mock-data", (_req, res) => {
  res.json({
    nutrients: "high",
    phosphorus: 2.1,
    algaeBloomRisk: "moderate"
  });
});

app.listen(PORT, () => {
  console.log(`✅ API server listening on http://localhost:${PORT}`);
});

