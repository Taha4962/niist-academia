import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role === 'hod' && !user?.is_hod) {
    return <Navigate to="/faculty/dashboard" replace />
  }

  if (role === 'faculty' && user?.role !== 'faculty') {
    return <Navigate to="/student/dashboard" replace />
  }

  if (role === 'student' && user?.role !== 'student') {
    return <Navigate to="/faculty/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
