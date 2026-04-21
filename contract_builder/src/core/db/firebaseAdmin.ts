/**
 * Firebase Admin SDK - Server-side only
 * 
 * This module provides server-side Firestore access using Firebase Admin SDK.
 * Use this in Server Actions and API routes where client SDK would hit permission errors.
 * 
 * NEVER import this in client components.
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;
let adminDb: Firestore | undefined;

/**
 * Check if explicit service account credentials are available in env vars
 */
function hasExplicitCredentials(): boolean {
  const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
  const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
  const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;

  return hasProjectId && hasClientEmail && hasPrivateKey;
}

/**
 * Get credential mode for logging (safe - no secrets)
 */
function getCredentialMode(): string {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && hasPrivateKey) {
    return `explicit-cert (project: ${projectId}, client: ${clientEmail})`;
  }
  if (projectId) {
    return `default-credentials-fallback (project: ${projectId})`;
  }
  return 'default-credentials-fallback';
}

/**
 * Get or initialize the Firebase Admin app instance
 * 
 * Priority:
 * 1. Use explicit env-var credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
 * 2. Fallback to default credentials (GOOGLE_APPLICATION_CREDENTIALS or GCP service account)
 */
export function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  // Check if already initialized by another module
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  // Try explicit env-var credentials first
  if (hasExplicitCredentials()) {
    console.log('[FirebaseAdmin] Using explicit env-var credentials');
    console.log(`[FirebaseAdmin] Credential mode: ${getCredentialMode()}`);

    try {
      // Process private key: replace escaped newlines with actual newlines
      const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n');

      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: privateKey,
        }),
        projectId: process.env.FIREBASE_PROJECT_ID!,
      });

      console.log('[FirebaseAdmin] Initialized successfully with explicit credentials');
      return adminApp;
    } catch (error) {
      console.error('[FirebaseAdmin] Failed to initialize with explicit credentials:', error);
      // Fall through to try default credentials
    }
  }

  // Check for partial env vars and warn
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId || clientEmail || privateKey) {
    const missing = [];
    if (!projectId) missing.push('FIREBASE_PROJECT_ID');
    if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');

    console.warn(
      `[FirebaseAdmin] Incomplete env-var credentials. Missing: ${missing.join(', ')}. ` +
      'Falling back to default credentials...'
    );
  } else {
    console.log('[FirebaseAdmin] No explicit env-var credentials found. Using default credentials...');
  }

  // Fallback to default credentials
  try {
    adminApp = initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    console.log('[FirebaseAdmin] Initialized with default credentials');
  } catch (error) {
    console.error('[FirebaseAdmin] Failed to initialize:', error);
    throw new Error(
      'Firebase Admin initialization failed. ' +
      'Ensure either (1) FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY env vars are set, ' +
      'or (2) GOOGLE_APPLICATION_CREDENTIALS is set to a service account key file path.'
    );
  }

  return adminApp;
}

/**
 * Get the server-side Firestore instance
 * This bypasses client security rules and uses Admin SDK permissions
 */
export function getAdminDb(): Firestore {
  if (adminDb) {
    return adminDb;
  }

  const app = getAdminApp();
  adminDb = getFirestore(app);
  return adminDb;
}

/**
 * Check if Firebase Admin is properly configured
 */
export function isAdminConfigured(): boolean {
  try {
    getAdminApp();
    return true;
  } catch {
    return false;
  }
}
