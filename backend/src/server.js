import 'dotenv/config';
import { createApp } from './app.js';
import { ensureDatabase } from './db.js';

process.env.JWT_SECRET ||= 'campuscart-dev-secret';
process.env.CORS_ORIGIN ||= 'http://localhost:5173';

const port = Number(process.env.PORT || 3001);

await ensureDatabase();

const app = createApp();

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
