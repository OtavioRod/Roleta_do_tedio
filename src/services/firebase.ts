import AsyncStorage from "@react-native-async-storage/async-storage";
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import {
  Firestore,
  getFirestore,
  initializeFirestore,
} from "firebase/firestore";
import { Platform } from "react-native";

const configuracao = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let instanciaApp: FirebaseApp | null = null;
let instanciaAuth: Auth | null = null;
let instanciaFirestore: Firestore | null = null;

export function firebaseConfigurado() {
  return Boolean(
    configuracao.apiKey && configuracao.projectId && configuracao.appId,
  );
}

function obterApp() {
  if (!instanciaApp) {
    instanciaApp =
      getApps().length > 0 ? getApp() : initializeApp(configuracao);
  }

  return instanciaApp;
}

export function obterAuth(): Auth {
  if (!instanciaAuth) {
    const app = obterApp();

    if (Platform.OS === "web") {
      instanciaAuth = getAuth(app);
    } else {
      try {
        instanciaAuth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } catch {
        instanciaAuth = getAuth(app);
      }
    }

    instanciaAuth.languageCode = "pt-BR";
  }

  return instanciaAuth;
}

export function obterFirestore(): Firestore {
  if (!instanciaFirestore) {
    const app = obterApp();

    try {
      instanciaFirestore = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      });
    } catch {
      instanciaFirestore = getFirestore(app);
    }
  }

  return instanciaFirestore;
}
