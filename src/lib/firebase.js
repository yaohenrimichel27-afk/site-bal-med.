import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyApIoddsoE4jWzldN6NakUij-xoKTU85jM",
  authDomain: "site-bal-med.firebaseapp.com",
  projectId: "site-bal-med",
  storageBucket: "site-bal-med.firebasestorage.app",
  messagingSenderId: "507322094972",
  appId: "1:507322094972:web:083ccf7f39199c814dc0f9",
  measurementId: "G-WWND3SQV54"
}

const app = initializeApp(firebaseConfig)
const db  = getFirestore(app)

export {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
}
