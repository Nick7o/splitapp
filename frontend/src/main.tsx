import { StrictMode, Suspense, lazy, type ReactElement } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import './i18n'
import ProtectedRoute from './components/ProtectedRoute'
import { CreateGroupModalProvider } from './context/CreateGroupModalContext'
import { ToastProvider } from './context/ToastContext'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const GroupDetails = lazy(() => import('./pages/GroupDetails'))
const AddExpense = lazy(() => import('./pages/AddExpense'))
const JoinGroup = lazy(() => import('./pages/JoinGroup'))
const Activity = lazy(() => import('./pages/Activity'))
const Profile = lazy(() => import('./pages/Profile'))
const SettleUpPage = lazy(() => import('./pages/SettleUpPage'))
const GroupActivity = lazy(() => import('./pages/GroupActivity'))
const GroupSettings = lazy(() => import('./pages/GroupSettings'))
const DesignSystem = lazy(() => import('./pages/DesignSystem'))

const pageFallback = (
  <div className="flex min-h-screen items-center justify-center bg-background text-sm font-semibold text-on-surface-variant">
    Loading...
  </div>
)

const page = (element: ReactElement) => (
  <Suspense fallback={pageFallback}>{element}</Suspense>
)

const protectedPage = (element: ReactElement) => (
  <ProtectedRoute>{page(element)}</ProtectedRoute>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <CreateGroupModalProvider>
          <Routes>
            <Route path="/" element={page(<Login />)} />
            <Route path="/dashboard" element={protectedPage(<Dashboard />)} />
            <Route path="/groups" element={protectedPage(<Dashboard />)} />
            <Route path="/activity" element={protectedPage(<Activity />)} />
            <Route path="/profile" element={protectedPage(<Profile />)} />
            <Route path="/groups/:id" element={protectedPage(<GroupDetails />)} />
            <Route path="/groups/:id/activity" element={protectedPage(<GroupActivity />)} />
            <Route path="/groups/:id/settings" element={protectedPage(<GroupSettings />)} />
            <Route path="/groups/:id/settle" element={protectedPage(<SettleUpPage />)} />
            <Route path="/groups/:id/add-expense" element={protectedPage(<AddExpense />)} />
            <Route path="/groups/:id/edit-expense/:expenseId" element={protectedPage(<AddExpense />)} />
            <Route path="/groups/:id/join" element={protectedPage(<JoinGroup />)} />
            <Route path="/design-system" element={page(<DesignSystem />)} />
          </Routes>
        </CreateGroupModalProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
