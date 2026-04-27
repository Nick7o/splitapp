import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import './i18n'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import GroupDetails from './pages/GroupDetails'
import AddExpense from './pages/AddExpense'
import JoinGroup from './pages/JoinGroup'
import Activity from './pages/Activity'
import Profile from './pages/Profile'
import ProtectedRoute from './components/ProtectedRoute'
import { CreateGroupModalProvider } from './context/CreateGroupModalContext'

import SettleUpPage from './pages/SettleUpPage'
import GroupActivity from './pages/GroupActivity'
import GroupSettings from './pages/GroupSettings'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CreateGroupModalProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/groups/:id" element={<ProtectedRoute><GroupDetails /></ProtectedRoute>} />
          <Route path="/groups/:id/activity" element={<ProtectedRoute><GroupActivity /></ProtectedRoute>} />
          <Route path="/groups/:id/settings" element={<ProtectedRoute><GroupSettings /></ProtectedRoute>} />
          <Route path="/groups/:id/settle" element={<ProtectedRoute><SettleUpPage /></ProtectedRoute>} />
          <Route path="/groups/:id/add-expense" element={<ProtectedRoute><AddExpense /></ProtectedRoute>} />
          <Route path="/groups/:id/edit-expense/:expenseId" element={<ProtectedRoute><AddExpense /></ProtectedRoute>} />
          {/* JoinGroup also needs to be accessible so it can redirect to login if needed, or we can protect it. 
              Actually, JoinGroup has its own logic for handling 401s, but protecting it is safer. */}
          <Route path="/groups/:id/join" element={<ProtectedRoute><JoinGroup /></ProtectedRoute>} />
        </Routes>
      </CreateGroupModalProvider>
    </BrowserRouter>
  </StrictMode>,
)
