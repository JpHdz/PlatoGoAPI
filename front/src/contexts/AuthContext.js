import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configure axios defaults
  // Detect baseURL: window.API_URL (Docker/nginx) o localhost (desarrollo)
  // Detect baseURL: window.API_URL (Docker/nginx) o localhost (desarrollo)
  const apiUrl = (window.API_URL && window.API_URL !== "PLACEHOLDER_API_URL")
    ? window.API_URL
    : "http://localhost:4000/api/v1";
  axios.defaults.baseURL = apiUrl;
  axios.defaults.withCredentials = true;

  // Helper to decode JWT safely
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  // Check if user is already authenticated on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        // Optimistic login: Set user from token immediately
        const decoded = decodeToken(token);
        if (decoded) {
          // Construct a minimal user object from token payload
          // The payload usually has { id, role, iat, exp }
          // We might need more fields if the app relies on them (e.g. name), 
          // but for routing (role) this is enough.
          // If the app needs 'name' and it's not in token, it might show empty, 
          // but it won't redirect to login.
          setUser({ ...decoded, _id: decoded.id });
        }

        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        try {
          // Try to get full user info to verify token is still valid and get fresh data
          const response = await axios.get("/users/me");
          setUser(response.data.data.user);
        } catch (error) {
          // Only logout if 401 (invalid token)
          if (error.response?.status === 401) {
            logout();
          }
          // If network error or other error, we KEEP the user state from the token
          // so the user stays logged in (persistence).
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await axios.post("/users/login", {
        email,
        password,
      });

      const { token, data } = response.data;
      const user = data.user;

      // Store token
      localStorage.setItem("token", token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Set user in state
      setUser(user);

      // Return user for redirection logic
      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    setError(null);
  };

  const getRedirectPath = (user) => {
    if (!user || !user.role) return "/login";

    switch (user.role) {
      case "super-admin":
        return "/super-admin/dashboard";
      case "restaurant-admin":
        return "/restaurant/dashboard";
      default:
        return "/login";
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    getRedirectPath,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === "super-admin",
    isRestaurantAdmin: user?.role === "restaurant-admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
