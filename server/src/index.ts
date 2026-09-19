import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config/env";
import apiRoutes from "./routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// Security and utility middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Root
app.use("/api", apiRoutes);

// Global Error Handler
app.use(errorHandler);

// Start Server
if (process.env.NODE_ENV !== "test") {
  app.listen(config.port, () => {
    console.log(`=================================================`);
    console.log(`🏥 AegisCare Hospital Backend API is running!`);
    console.log(`📡 URL: http://localhost:${config.port}`);
    console.log(`🔒 Environment: ${config.nodeEnv}`);
    console.log(`=================================================`);
  });
}

export default app;
