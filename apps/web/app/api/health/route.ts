import { isDatabaseConnected } from "@neighbourdoc/database";
import { api, ok } from "../_server";

export async function GET() {
  const dbConnected = await isDatabaseConnected();
  const uptimeSeconds = Math.floor(process.uptime());
  const memUsage = process.memoryUsage();

  return ok({
    status: "healthy",
    service: "NeighbourDoc Telehealth API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "development",
    database: {
      type: "postgresql",
      connected: dbConnected,
      mode: dbConnected ? "persistent_database" : "application_memory_state"
    },
    uptimeSeconds,
    memory: {
      rssMb: Math.round(memUsage.rss / (1024 * 1024)),
      heapUsedMb: Math.round(memUsage.heapUsed / (1024 * 1024))
    }
  });
}
