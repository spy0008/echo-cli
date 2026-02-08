import express from "express";
import dotenv from "dotenv";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import cors from "cors";
import { auth } from "./lib/auth.js";
dotenv.config();

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "https://echo-cli.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.get("/health", (req, res) => {
  res.send("route working fine!!!");
});

app.get("/api/me", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  return res.json(session);
});

const FRONTEND_URL = process.env.FRONTEND_URL;

app.get("/device", async (req, res) => {
  const { user_code } = req.query;
  res.redirect(`${FRONTEND_URL}/device?user_code=${user_code}`);
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:/${process.env.PORT}`);
});
