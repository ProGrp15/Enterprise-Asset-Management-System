import { createContext, useContext } from "react";

export const ThemeContext = createContext({
  theme: "light",
});

export const useThemeContext = () => useContext(ThemeContext);

export default ThemeContext;
