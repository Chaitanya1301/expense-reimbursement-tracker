import { Routes, Route } from 'react-router-dom'
import { Login } from './pages/Login'
import { RoleHome } from './pages/RoleHome'
import { ProtectedRoute } from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RoleHome />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
