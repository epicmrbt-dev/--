import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, onSnapshot, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "nth-glass-495704-k5",
  appId: "1:26590233227:web:a629ebc0121bdbfd568a8e",
  apiKey: "AIzaSyDw9sODalUn5QezFyB3-dtosJH-s3S5BXE",
  authDomain: "nth-glass-495704-k5.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-8516f2c5-6ab9-413a-b39c-97d906b97b20",
  storageBucket: "nth-glass-495704-k5.firebasestorage.app",
  messagingSenderId: "26590233227"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Sign out
export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};
