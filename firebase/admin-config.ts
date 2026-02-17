// firebase/admin-config.ts
import { cert } from 'firebase-admin/app';

export const serviceAccount = cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Use environment variables for security
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
});