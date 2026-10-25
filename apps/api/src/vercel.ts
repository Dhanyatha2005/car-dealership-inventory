/** Vercel serverless entry: the Express app is itself a (req, res) handler. */
import { buildApi } from './bootstrap';
import { parseEnv } from './config/env';

export default buildApi(parseEnv(process.env)).app;
