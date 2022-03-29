import React from "react";

interface Preferences {
  color: string;
  theme: string;
}

export interface PreferencesContextType extends Preferences {
  setColor: (color: string) => void;
  setShowPreferences: (show: boolean) => void;
  setTheme : (theme : string) => void;
  showPreferences: boolean;
}

export const PreferencesContext = React.createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider : React.FC = ({children}) => {
  const [color, setColor] = React.useState(localStorage.getItem("color") || "bubblegum");
  const [showPreferences, setShowPreferences] = React.useState(false);
  const [theme, setTheme] = React.useState(localStorage.getItem("theme") || "system");

  React.useEffect(() => {
    localStorage.setItem("color", color);

    document.documentElement.removeAttribute("data-color");

    if (color !== "bubblegum") {
      document.documentElement.setAttribute("data-color", color);
    }
  }, [color]);

  React.useEffect(() => {
    localStorage.setItem("theme", theme);

    document.body.removeAttribute("data-theme");

    if (theme === "system") {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.body.setAttribute("data-theme", "dark");
      }
    } else if (theme === "dark") {
      document.body.setAttribute("data-theme", "dark");
    }
  }, [theme]);

  return (
    <PreferencesContext.Provider value={{color, setColor, setShowPreferences, setTheme, showPreferences, theme}}>
      {children}
    </PreferencesContext.Provider>
  )
}