// ==========================================
// CONFIGURAÇÃO DO FIREBASE (firebase.js)
// ==========================================
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ⚠️ Substitui estes valores pelas tuas chaves reais!
const firebaseConfig = {
  apiKey: "AIzaSyBOypcqfyylzg0ugktNCUBTVYUKMWoABOg",
  authDomain: "desola-fc-app.firebaseapp.com",
  projectId: "desola-fc-app",
  storageBucket: "desola-fc-app.firebasestorage.app",
  messagingSenderId: "38330698140",
  appId: "1:38330698140:web:62f6ce5181d8d055092059"
};

// 1. Inicializa o aplicativo base do Firebase
const app = initializeApp(firebaseConfig);

// 2. Prepara a Autenticação e o Banco de Dados
export const auth = getAuth(app);
export const db = getFirestore(app);
export { firebaseConfig };