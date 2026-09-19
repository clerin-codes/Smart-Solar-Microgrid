import { useCallback, useMemo, useState } from 'react'
import { AuthContext } from './authContextObject'
import { authService } from '../services/authService'
import { TOKEN_KEY, USER_KEY } from '../services/apiClient'
import { ROLES } from '../utils/constants'

export const PROSUMER_WEB_MESSAGE =
  'The SunChain web portal is for Admin and Grid Operator accounts. Prosumers should use the SunChain mobile app.'

const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.exp ? payload.exp * 1000 < Date.now() : false
  } catch {
    return true
  }
}

const loadSession = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null')
    if (token && user && user.role !== ROLES.PROSUMER && !isTokenExpired(token)) return { token, user }
  } catch {
    // fall through to a clean session
  }
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  return { token: null, user: null }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession)

  const login = useCallback(async (nic, password) => {
    const data = await authService.login(nic, password)
    if (data.role === ROLES.PROSUMER) throw new Error(PROSUMER_WEB_MESSAGE)
    const user = { nic: data.nic, fullName: data.fullName, role: data.role }
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setSession({ token: data.token, user })
    return user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setSession({ token: null, user: null })
  }, [])

  const value = useMemo(
    () => ({
      user: session.user,
      token: session.token,
      isAuthenticated: Boolean(session.token),
      login,
      logout,
    }),
    [session, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
