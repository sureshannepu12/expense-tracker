import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/lib/query-client'
import { useApplyTheme } from '@/lib/theme'
import { useMediaQuery } from '@/lib/use-media-query'
import { router } from '@/routes/router'
import './index.css'

function App() {
  useApplyTheme()
  // The devtools badge would cover the mobile tab bar, so only show it on wider screens.
  const isDesktop = useMediaQuery('(min-width: 768px)')
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster richColors position={isDesktop ? 'top-right' : 'top-center'} />
      {isDesktop && <ReactQueryDevtools buttonPosition="bottom-right" />}
    </QueryClientProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
