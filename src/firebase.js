import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBgfN9_UgFfkeHVL2tNfxuCXKPiCxLJvUs",
  authDomain: "techtavern-boards.firebaseapp.com",
  projectId: "techtavern-boards",
  storageBucket: "techtavern-boards.firebasestorage.app",
  messagingSenderId: "471305809765",
  appId: "1:471305809765:web:54f207c5b7307c36847b8c",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google provider instance
const googleProvider = new GoogleAuthProvider();

// Sign in with Google
export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

// Sign out
export function logout() {
  return signOut(auth);
}

// Email / Password sign-up
export function signUpWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

// Email / Password sign-in
export function signInWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// Listen for auth state changes
export function onUserStateChange(callback) {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}
