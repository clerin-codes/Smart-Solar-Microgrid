import {
  createContext,
} from 'react'

/**
 * Shared authentication context.
 *
 * The actual authentication/session logic is implemented in AuthProvider.jsx.
 * Keeping the context separate avoids mixing context creation with provider logic
 * and makes the authentication module easier to maintain.
 */
const AuthContext =
  createContext(null)

export default AuthContext