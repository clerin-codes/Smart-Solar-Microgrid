import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { login as loginRequest } from '../services/api/authService'

const AuthContext = createContext(null)

function readUser() {
  try {
    return JSON.parse(localStorage.getItem('authUser'))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser)

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('authUser')
    setUser(null)
  }

  useEffect(() => {
    window.addEventListener('auth:expired', logout)
    return () => window.removeEventListener('auth:expired', logout)
  }, [])

  const login = async (nic, password) => {
    const result = await loginRequest(nic.trim(), password)
    const nextUser = {
      nic: result.nic,
      fullName: result.fullName,
      role: result.role,
      expiresAtUtc: result.expiresAtUtc,
    }
    localStorage.setItem('accessToken', result.token)
    localStorage.setItem('authUser', JSON.stringify(nextUser))
    setUser(nextUser)
    return nextUser
  }

  const value = useMemo(() => ({ user, login, logout }), [user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
