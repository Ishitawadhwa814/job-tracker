// import React, { createContext, useContext, useState, useEffect } from "react";
// import axios from "axios";

// const AuthContext = createContext();

// export function useAuth() {
//   return useContext(AuthContext);
// }

// export function AuthProvider({ children }) {
//   const [currentUser, setCurrentUser] = useState(null);

//   async function signup(email, password) {
//     await axios.post("http://localhost:5000/api/auth/signup", { email, password });
//   }

//   async function login(email, password) {
//     const res = await axios.post("http://localhost:5000/api/auth/login", { email, password });
//     localStorage.setItem("token", res.data.token);
//     setCurrentUser({ email });
//   }

//   function logout() {
//     localStorage.removeItem("token");
//     setCurrentUser(null);
//   }

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       // You could call /me endpoint to verify token
//       setCurrentUser({ email: "user-from-token" });
//     }
//   }, []);

//   const value = {
//     currentUser,
//     signup,
//     login,
//     logout,
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// // }
// import React, { createContext, useContext, useState, useEffect } from "react";
// import axios from "axios";

// const AuthContext = createContext();

// export function useAuth() {
//   return useContext(AuthContext);
// }

// export function AuthProvider({ children }) {
//   const [currentUser, setCurrentUser] = useState(null);

//   async function signup(email, password) {
//     await axios.post("http://localhost:5000/api/auth/signup", { email, password });
//   }

//   async function login(email, password) {
//     const res = await axios.post("http://localhost:5000/api/auth/login", { email, password });
//     localStorage.setItem("token", res.data.token);
//     setCurrentUser({ email });
//   }

//   function logout() {
//     localStorage.removeItem("token");
//     setCurrentUser(null);
//   }

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       setCurrentUser({ email: "user-from-token" }); // later decode JWT
//     }
//   }, []);

//   const value = { currentUser, signup, login, logout };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// }



import React, { createContext, useState, useEffect, useContext } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // On page reload, check localStorage for token
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ✅ Custom hook for easier usage
export function useAuth() {
  return useContext(AuthContext);
}
