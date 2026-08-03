/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

export const useAuthContext = () => useContext(AuthContext);

export default AuthContext;
