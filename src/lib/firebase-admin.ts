import fs from 'fs';
import path from 'path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function loadFirebaseProjectId(): string {
  if (process.env.FIREBASE_PROJECT_ID?.trim()) {
    return process.env.FIREBASE_PROJECT_ID.trim();
  }
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (typeof parsed?.projectId === 'string' && parsed.projectId.trim()) {
        return parsed.projectId.trim();
      }
    } catch {
      // Fallback handled below
    }
  }
  return '';
}

if (!getApps().length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  const projectId = loadFirebaseProjectId();

  if (serviceAccountJson) {
    const parsedServiceAccount = JSON.parse(serviceAccountJson);
    initializeApp({
      credential: cert(parsedServiceAccount),
      projectId: parsedServiceAccount.project_id || projectId || undefined,
    });
  } else {
    initializeApp({
      projectId: projectId || undefined,
    });
  }
}

export const adminAuth = getAuth();
