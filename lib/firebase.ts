// ---------------------------------------------------------------------------
// Data access layer.
//
// Right now this returns the mock data from lib/data.ts. It's the single place
// you swap in Firebase Realtime Database later — the page just calls
// `getCharacters()` and doesn't care where the data comes from.
//
// -------------------------------- WIRING GUIDE -----------------------------
// 1. npm install firebase
// 2. Create a Firebase project + Realtime Database, then add a web app and copy
//    its config into NEXT_PUBLIC_* env vars (see .env.example).
// 3. Uncomment the block below and delete the mock return in getCharacters().
//
// import { initializeApp, getApps, getApp } from 'firebase/app';
// import { getDatabase, ref, get } from 'firebase/database';
//
// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
// };
//
// const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
// const db = getDatabase(app);
//
// NOTE: `output: 'export'` builds the page at *build time*, so a top-level
// `get()` here produces a static snapshot. For live updates, move the read into
// a client component with `onValue()` instead.
// ---------------------------------------------------------------------------

import { getMockCharacters, type Character } from './data';

export async function getCharacters(): Promise<Character[]> {
  // --- Firebase version (enable after following the wiring guide above) ------
  // const snapshot = await get(ref(db, 'characters'));
  // const value = snapshot.val() as Record<string, Character> | null;
  // return value ? Object.values(value) : [];

  // --- Mock version ----------------------------------------------------------
  return getMockCharacters();
}
