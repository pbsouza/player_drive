import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
  Auth,
  setPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
} from "firebase/auth";
import rawFirebaseConfig from "../../firebase-applet-config.json";

// Safe configuration check
const firebaseConfig = rawFirebaseConfig || {};

let app;
let auth: Auth | null = null;

try {
  if (firebaseConfig && (firebaseConfig as any).apiKey) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    try {
      setPersistence(auth, browserLocalPersistence).catch(() => {
        if (auth) setPersistence(auth, inMemoryPersistence).catch(() => {});
      });
    } catch (e) {
      console.warn("Falha ao configurar persistência inicial do Auth:", e);
    }
  } else {
    console.warn("Configuração do Firebase não encontrada ou incompleta.");
  }
} catch (err) {
  console.error("Erro ao inicializar o Firebase App:", err);
}

const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/drive.readonly");

let isSigningIn = false;

function getSafeStorageToken(): string | null {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      return sessionStorage.getItem("gdrive_access_token");
    }
  } catch (e) {
    console.warn("sessionStorage não disponível:", e);
  }
  return null;
}

function setSafeStorageToken(token: string | null) {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      if (token) {
        sessionStorage.setItem("gdrive_access_token", token);
      } else {
        sessionStorage.removeItem("gdrive_access_token");
      }
    }
  } catch (e) {
    console.warn("sessionStorage não disponível:", e);
  }
}

let cachedAccessToken: string | null = getSafeStorageToken();

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (!auth) {
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const storedToken = cachedAccessToken || getSafeStorageToken();
      if (storedToken) {
        cachedAccessToken = storedToken;
        if (onAuthSuccess) onAuthSuccess(user, storedToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        setSafeStorageToken(null);
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      setSafeStorageToken(null);
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  if (!auth) {
    throw new Error("O Firebase não foi inicializado. Verifique as credenciais no arquivo firebase-applet-config.json.");
  }
  try {
    isSigningIn = true;

    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch {
      try {
        await setPersistence(auth, inMemoryPersistence);
      } catch {}
    }

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Não foi possível obter o token de acesso do Google Drive.");
    }

    cachedAccessToken = credential.accessToken;
    setSafeStorageToken(credential.accessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Erro na autenticação:", error);
    if (error?.message?.includes("Database is closing") || error?.message?.includes("hidden") || error?.code === "auth/internal-error") {
      throw new Error("O navegador da TV bloqueou o armazenamento local (IndexedDB). Tente recarregar a página ou desativar o modo privado.");
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken || getSafeStorageToken();
};

export const clearStoredAccessToken = () => {
  cachedAccessToken = null;
  setSafeStorageToken(null);
};

export const logout = async () => {
  if (auth) {
    await firebaseSignOut(auth);
  }
  clearStoredAccessToken();
};

