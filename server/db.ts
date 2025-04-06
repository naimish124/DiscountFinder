import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import { WebSocket } from 'ws';

// Configure WebSocket for serverless environments
// @ts-ignore
global.WebSocket = WebSocket;

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Export db client
export const db = drizzle(pool, { schema });