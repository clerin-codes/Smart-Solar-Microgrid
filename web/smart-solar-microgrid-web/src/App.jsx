import { Toaster } from 'react-hot-toast'

import { AuthProvider } from './context/AuthProvider'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <AuthProvider>
      <AppRoutes />

      <Toaster
        position="top-right"
        gutter={12}
        toastOptions={{
          duration: 3500,

          style: {
            borderRadius: '14px',
            padding: '14px 16px',
            background: '#0f172a',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow:
              '0 18px 48px rgba(15, 23, 42, 0.18)',
          },

          success: {
            style: {
              background:
                '#047857',
            },
          },

          error: {
            style: {
              background:
                '#b91c1c',
            },
          },
        }}
      />
    </AuthProvider>
  )
}

export default App