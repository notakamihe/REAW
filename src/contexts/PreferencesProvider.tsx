import { PreferencesContext } from "@/contexts";
import { PropsWithChildren, useEffect, useState } from "react";
import { Preferences } from "@/services/types/types";

const defaultPreferences = { color: "rose", theme: "system" };
const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');

export function PreferencesProvider({ children }: PropsWithChildren) {
  const [darkMode, setDarkMode] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [savedPreferences, setSavedPreferences] = useState<Preferences>(defaultPreferences); 
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    const localStoragePreferences = localStorage.getItem("preferences");
    
    if (localStoragePreferences) {
      const newPreferences = JSON.parse(localStoragePreferences);
      updatePreferences(newPreferences);
      setSavedPreferences(newPreferences);
    }    
  }, [])

  useEffect(() => {
    function handleSystemThemeChange(e: MediaQueryListEvent) {
      if (preferences.theme === "system")
        updateTheme(e.matches);
    }

    matchMedia.addEventListener('change', handleSystemThemeChange); 
    return () => matchMedia.removeEventListener("change", handleSystemThemeChange);
  }, [preferences.theme])

  function savePreferences() {
    localStorage.setItem("preferences", JSON.stringify(preferences));
    setSavedPreferences(preferences);
  }

  function updateTheme(dark: boolean) {
    if (dark)
      document.documentElement.setAttribute("data-theme", "dark"); 
    else
      document.documentElement.removeAttribute("data-theme");

    setDarkMode(dark);
  }

  function updatePreferences(newPreferences: Preferences) {
    if (newPreferences.color !== "rose")
      document.documentElement.setAttribute("data-color", newPreferences.color);
    else
      document.documentElement.removeAttribute("data-color");

    updateTheme(newPreferences.theme === "dark" || newPreferences.theme === "system" && matchMedia.matches);
    setPreferences(newPreferences);
  }

  return (
    <PreferencesContext.Provider 
      value={{ 
        darkMode,
        preferences, 
        savePreferences,
        savedPreferences,
        setShowPreferences,
        showPreferences,
        updatePreferences
      }}
    >
      {children}
    </PreferencesContext.Provider>
  )
}