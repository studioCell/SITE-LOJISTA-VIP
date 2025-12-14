import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";

// --- Configurações Reais do Projeto Lojista VIP ---
const firebaseConfig = {
  apiKey: "AIzaSyD2YRzhxuUBD0YPsUs8PEb2kyGe-0Us-kI",
  authDomain: "lojista-vip-1492b.firebaseapp.com",
  projectId: "lojista-vip-1492b",
  storageBucket: "lojista-vip-1492b.firebasestorage.app",
  messagingSenderId: "310297709248",
  appId: "1:310297709248:web:c0ef8e6f5ec1a15f637b25",
  measurementId: "G-7YN817FE4R"
};

// Check if config is set
export const isFirebaseConfigured = firebaseConfig.apiKey !== "SUA_API_KEY_AQUI";

const app = initializeApp(firebaseConfig);

// Initialize Firestore with the new cache settings to avoid warnings
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
