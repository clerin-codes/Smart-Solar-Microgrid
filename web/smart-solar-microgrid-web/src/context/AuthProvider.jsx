import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import AuthContext from './AuthContext'

import { loginUser } from '../services/api/authService'
import { getMyProfile } from '../services/api/accountService'

import {
  normalizeRole,
  normalizeStatus,
} from '../utils/userFormat'

const WEB_ROLES = [
  'Backoffice',
  'GridOperator',
]

function mapProfileToSessionUser(profile) {
  return {
    nic:
      profile?.nic ?? '',

    fullName:
      profile?.fullName ?? '',

    email:
      profile?.email ?? '',

    phoneNumber:
      profile?.phoneNumber ?? '',

    role:
      normalizeRole(
        profile?.role
      ),

    accountStatus:
      normalizeStatus(
        profile?.status ??
          profile?.accountStatus
      ),
  }
}

export function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const clearSession =
    useCallback(() => {
      localStorage.removeItem(
        'accessToken'
      )

      localStorage.removeItem(
        'authUser'
      )

      setUser(null)
    }, [])

  const saveSession =
    useCallback(
      (
        token,
        sessionUser
      ) => {
        if (token) {
          localStorage.setItem(
            'accessToken',
            token
          )
        }

        localStorage.setItem(
          'authUser',
          JSON.stringify(
            sessionUser
          )
        )

        setUser(sessionUser)
      },
      []
    )

  useEffect(() => {
    let active = true

    async function initializeSession() {
      const token =
        localStorage.getItem(
          'accessToken'
        )

      if (!token) {
        if (active) {
          setUser(null)
          setLoading(false)
        }

        return
      }

      try {
        const profile =
          await getMyProfile()

        if (!active) {
          return
        }

        const sessionUser =
          mapProfileToSessionUser(
            profile
          )

        if (
          !WEB_ROLES.includes(
            sessionUser.role
          )
        ) {
          clearSession()
          return
        }

        saveSession(
          token,
          sessionUser
        )
      } catch {
        if (active) {
          clearSession()
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    initializeSession()

    return () => {
      active = false
    }
  }, [
    clearSession,
    saveSession,
  ])

  useEffect(() => {
    function handleUnauthorized() {
      clearSession()
    }

    window.addEventListener(
      'auth:unauthorized',
      handleUnauthorized
    )

    return () => {
      window.removeEventListener(
        'auth:unauthorized',
        handleUnauthorized
      )
    }
  }, [clearSession])

  const login =
    useCallback(
      async (credentials) => {
        const response =
          await loginUser(
            credentials
          )

        const role =
          normalizeRole(
            response?.role
          )

        if (
          !WEB_ROLES.includes(
            role
          )
        ) {
          clearSession()

          throw new Error(
            'Solar Prosumer accounts use the mobile application. Web access is available only to Backoffice and Grid Operator users.'
          )
        }

        const token =
          response?.accessToken ??
          response?.token

        if (!token) {
          throw new Error(
            'The authentication server did not return an access token.'
          )
        }

        const initialUser = {
          nic:
            response?.nic ?? '',

          fullName:
            response?.fullName ?? '',

          email: '',

          phoneNumber: '',

          role,

          accountStatus:
            normalizeStatus(
              response?.accountStatus ??
                response?.status
            ),
        }

        saveSession(
          token,
          initialUser
        )

        try {
          const profile =
            await getMyProfile()

          const completeUser =
            mapProfileToSessionUser(
              profile
            )

          saveSession(
            token,
            completeUser
          )

          return completeUser
        } catch {
          return initialUser
        }
      },
      [
        clearSession,
        saveSession,
      ]
    )

  const logout =
    useCallback(() => {
      clearSession()
    }, [clearSession])

  const refreshProfile =
    useCallback(
      async () => {
        const profile =
          await getMyProfile()

        const sessionUser =
          mapProfileToSessionUser(
            profile
          )

        const token =
          localStorage.getItem(
            'accessToken'
          )

        if (!token) {
          clearSession()

          throw new Error(
            'Authentication session is no longer available.'
          )
        }

        saveSession(
          token,
          sessionUser
        )

        return sessionUser
      },
      [
        clearSession,
        saveSession,
      ]
    )

  const value =
    useMemo(
      () => ({
        user,

        loading,

        isAuthenticated:
          Boolean(user),

        login,

        logout,

        refreshProfile,
      }),
      [
        user,
        loading,
        login,
        logout,
        refreshProfile,
      ]
    )

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  )
}