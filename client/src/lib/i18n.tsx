import { createContext, useContext, useState, useEffect } from "react";

export type Lang = "en" | "fr";

export const translations = {
  en: {
    register: {
      title: "Register | Jinko Solar",
      phonePlaceholder: "Phone number",
      passwordPlaceholder: "Password",
      invitePlaceholder: "Invitation code (optional)",
      registerBtn: "Sign Up",
      loginBtn: "I have an account",
      loading: "Loading...",
      successTitle: "Registration successful!",
      successDesc: "Welcome to Jinko Solar!",
      errorTitle: "Registration error",
      errorDesc: "An error occurred",
      invalidPhone: "Invalid number",
      selectCountry: "Select a country",
      minPassword: "At least 6 characters",
    },
    login: {
      title: "Login | Jinko Solar",
      phonePlaceholder: "Phone number",
      passwordPlaceholder: "Password",
      rememberMe: "Remember me",
      loginBtn: "Log In",
      registerBtn: "Sign Up",
      loading: "Logging in...",
      errorTitle: "Login error",
      errorDesc: "Check your information",
      invalidPhone: "Invalid number",
      selectCountry: "Select a country",
      passwordRequired: "Password required",
    },
  },
  fr: {
    register: {
      title: "Inscription | Jinko Solar",
      phonePlaceholder: "Numéro de téléphone",
      passwordPlaceholder: "Mot de passe",
      invitePlaceholder: "Code d'invitation (optionnel)",
      registerBtn: "Autoriser",
      loginBtn: "J'ai un compte",
      loading: "Chargement...",
      successTitle: "Inscription réussie !",
      successDesc: "Bienvenue sur Jinko Solar !",
      errorTitle: "Erreur d'inscription",
      errorDesc: "Une erreur est survenue",
      invalidPhone: "Numéro invalide",
      selectCountry: "Sélectionnez un pays",
      minPassword: "Au moins 6 caractères",
    },
    login: {
      title: "Connexion | Jinko Solar",
      phonePlaceholder: "Numéro de téléphone",
      passwordPlaceholder: "Mot de passe",
      rememberMe: "Souviens-toi",
      loginBtn: "Se connecter",
      registerBtn: "Autoriser",
      loading: "Connexion...",
      errorTitle: "Erreur de connexion",
      errorDesc: "Vérifiez vos informations",
      invalidPhone: "Numéro invalide",
      selectCountry: "Sélectionnez un pays",
      passwordRequired: "Mot de passe requis",
    },
  },
};

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: typeof translations["en"];
}

const LangContext = createContext<LangContextType>({
  lang: "en",
  setLang: () => {},
  t: translations["en"],
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("jinko_lang");
    return (saved === "fr" || saved === "en") ? saved : "en";
  });

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("jinko_lang", l);
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
