// import React from 'react';
// import { Navigate } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';

// export default function PrivateRoute({ children }) {
//   const { currentUser } = useAuth();
  
//   return currentUser ? children : <Navigate to="/login" />;
// }
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

// A wrapper for protected routes
export default function PrivateRoute({ children }) {
  const { user } = useContext(AuthContext);

  // If no user, redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
