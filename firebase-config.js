// ============================================================
// MRRHL Laboratory Survey - Firebase Configuration
// Compatible with plain HTML + JavaScript
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCNxFAzHyALHKs7nH8mkBTK-dbjUmoxtdY",
  authDomain: "mrrhl-survey2.firebaseapp.com",
  projectId: "mrrhl-survey2",
  storageBucket: "mrrhl-survey2.firebasestorage.app",
  messagingSenderId: "542832404991",
  appId: "1:542832404991:web:ed61db1edc35005ca81fca"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Create Firestore reference
const db = firebase.firestore();

// Create Auth reference (admin.js needs this for login/logout)
const auth = firebase.auth();

// Name of the Firestore collection responses are stored in
// (survey.js and admin.js both read this)
const RESPONSES_COLLECTION = "responses";

console.log("Firebase connected successfully ✅");
