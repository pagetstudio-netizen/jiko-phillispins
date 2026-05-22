import { createContext, useContext, useState, useEffect } from "react";

export type Lang = "en" | "fr";

export const translations = {
  en: {
    register: {
      title: "Register | Noviqra Ai",
      phonePlaceholder: "Phone number",
      passwordPlaceholder: "Password",
      invitePlaceholder: "Invitation code (optional)",
      registerBtn: "Sign Up",
      loginBtn: "I have an account",
      loading: "Loading...",
      successTitle: "Registration successful!",
      successDesc: "Welcome to Noviqra Ai!",
      errorTitle: "Registration error",
      errorDesc: "An error occurred",
      invalidPhone: "Invalid number",
      selectCountry: "Select a country",
      minPassword: "At least 6 characters",
    },
    login: {
      title: "Login | Noviqra Ai",
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
    changePassword: {
      title: "Security | Noviqra Ai",
      header: "Change password",
      back: "Back",
      currentPassword: "Current password",
      newPassword: "New password",
      confirmPassword: "Confirm password",
      mismatch: "Passwords do not match",
      submit: "Confirm",
      submitting: "Updating...",
      requiredFields: "Required fields",
      requiredFieldsDesc: "Please fill in all fields",
      tooShort: "Password too short",
      tooShortDesc: "At least 6 characters",
      errorTitle: "Error",
      errorMismatch: "Passwords do not match",
      successTitle: "Success",
      successDesc: "Password changed successfully",
    },
    info: {
      header: "Stay informed",
      empty: "No information available at the moment.",
      loading: "Loading...",
      notFound: "Article not found.",
    },
    contact: {
      title: "Contact us",
      channel: "Official channel",
      channelSub: "Join our official channel",
      group: "Discussion group",
      groupSub: "Join our Telegram group",
      support: "Customer service",
      supportSub: "Available from 09:00 to 20:00",
    },
  },
  fr: {
    register: {
      title: "Inscription | Noviqra Ai",
      phonePlaceholder: "Numéro de téléphone",
      passwordPlaceholder: "Mot de passe",
      invitePlaceholder: "Code d'invitation (optionnel)",
      registerBtn: "Autoriser",
      loginBtn: "J'ai un compte",
      loading: "Chargement...",
      successTitle: "Inscription réussie !",
      successDesc: "Bienvenue sur Noviqra Ai !",
      errorTitle: "Erreur d'inscription",
      errorDesc: "Une erreur est survenue",
      invalidPhone: "Numéro invalide",
      selectCountry: "Sélectionnez un pays",
      minPassword: "Au moins 6 caractères",
    },
    login: {
      title: "Connexion | Noviqra Ai",
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
    changePassword: {
      title: "Sécurité | Noviqra Ai",
      header: "Changer le mot de passe",
      back: "Retour",
      currentPassword: "Ancien mot de passe",
      newPassword: "Nouveau mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      mismatch: "Les mots de passe ne correspondent pas",
      submit: "Confirmer",
      submitting: "Modification...",
      requiredFields: "Champs requis",
      requiredFieldsDesc: "Veuillez remplir tous les champs",
      tooShort: "Mot de passe trop court",
      tooShortDesc: "Au moins 6 caractères",
      errorTitle: "Erreur",
      errorMismatch: "Les mots de passe ne correspondent pas",
      successTitle: "Succès",
      successDesc: "Mot de passe modifié avec succès",
    },
    info: {
      header: "Être informé",
      empty: "Aucune information disponible pour le moment.",
      loading: "Chargement...",
      notFound: "Article introuvable.",
    },
    contact: {
      title: "Nous contacter",
      channel: "Chaîne officielle",
      channelSub: "Rejoignez notre chaîne officielle",
      group: "Groupe de discussion",
      groupSub: "Rejoignez notre groupe Telegram",
      support: "Service client",
      supportSub: "Disponible de 09h00 à 20h00",
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
    const saved = localStorage.getItem("noviqra_lang");
    return (saved === "fr" || saved === "en") ? saved : "en";
  });

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("noviqra_lang", l);
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
