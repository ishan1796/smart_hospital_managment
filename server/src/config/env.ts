import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "file:./dev.db",
  jwtSecret: process.env.JWT_SECRET || "hospital_management_secret_key_2026",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  geminiApiKey: process.env.GEMINI_API_KEY || ""
};
