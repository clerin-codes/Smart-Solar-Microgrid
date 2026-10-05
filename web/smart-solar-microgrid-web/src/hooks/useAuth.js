import { useContext } from "react";

import AuthContext from "../context/AuthContext";

/**
 * Provides access to the current authentication session.
 */
export default function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
