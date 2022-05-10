import React from "react";

interface Preferences {
  color: string;
  theme: string;
}

export interface PreferencesContextType {
  preferences: Preferences;
  setPreferences: (preferences: Preferences) => void;
  setShowPreferences: (show: boolean) => void;
  showPreferences: boolean;
}

export const PreferencesContext = React.createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider : React.FC = ({children}) => {
  const [preferences, setPreferences] = React.useState<Preferences>(
    localStorage.getItem("preferences") ? JSON.parse(localStorage.getItem("preferences")!) :
    {
      color: "bubblegum", 
      theme: "system"
    }
  );

  const [showPreferences, setShowPreferences] = React.useState(false);

  React.useEffect(() => {
    localStorage.setItem("preferences", JSON.stringify(preferences));

    if (preferences.color !== "bubblegum") {
      document.documentElement.setAttribute("data-color", preferences.color);
    } else {
      document.documentElement.removeAttribute("data-color");
    }
    
    if (preferences.theme === "system") {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.body.setAttribute("data-theme", "dark");
      }
    } else if (preferences.theme === "dark") {
      document.body.setAttribute("data-theme", "dark");
    } else {
      document.body.removeAttribute("data-theme");
    }
  }, [preferences]);

  return (
    <PreferencesContext.Provider value={{preferences, setPreferences, setShowPreferences, showPreferences}}>
      {children}
    </PreferencesContext.Provider>
  )
}