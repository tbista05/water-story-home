import express, { Request, Response } from "express";
import cors from "cors";

const app = express();
const PORT = 3001;

app.use(cors()); // Important for frontend-backend communication

app.get("/", (_req: Request, res: Response) => {
  res.send("🌊 Lake Erie API is running!");
});

app.get("/api/mock-data", (_req: Request, res: Response) => {
  res.json({
    nutrients: "high",
    phosphorus: 2.1,
    algaeBloomRisk: "moderate"
  });
});

app.listen(PORT, () => {
  console.log(`✅ API server listening on http://localhost:${PORT}`);
});

