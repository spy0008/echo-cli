import dotenv from "dotenv";
dotenv.config();

export const config = {
  googleApuKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
  model: process.env.ECHOO_MODEL || "gemini-2.5-flash",
};
