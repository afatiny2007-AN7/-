import type { IncomingMessage, ServerResponse } from 'http';
import app from '../src/app.ts';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.url) {
    const parsed = new URL(req.url, 'http://localhost');
    const rewrittenPath = parsed.searchParams.get('__vercel_path');
    if (rewrittenPath !== null) {
      parsed.searchParams.delete('__vercel_path');
      const cleanSubpath = rewrittenPath.replace(/^\/+/, '');
      const qs = parsed.searchParams.toString();
      req.url = `/api/${cleanSubpath}${qs ? `?${qs}` : ''}`;
    }
  }

  return app(req as any, res as any);
}
