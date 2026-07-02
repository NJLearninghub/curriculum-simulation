import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCoSM-hFw0-IG0e-vaZOBqobJpfVVGFa9s",
  authDomain: "gen-lang-client-0053781770.firebaseapp.com",
  projectId: "gen-lang-client-0053781770",
  storageBucket: "gen-lang-client-0053781770.firebasestorage.app",
  messagingSenderId: "106096017538",
  appId: "1:106096017538:web:74dffb84c570505c74749b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use custom firestore database ID from applet config
export const db = getFirestore(app, "ai-studio-37d9b36b-8281-44bc-bfcc-f633171e3bd7");

// CRITICAL CONSTRAINT: Test the connection on boot
export async function testFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firebase connection verified successfully.");
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration. Client is offline.");
    } else {
      console.log("Firebase connection test performed (may throw permission-denied if unauthenticated, which is normal).");
    }
    return false;
  }
}
