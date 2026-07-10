import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, AuthState, UserRole } from "../types.js";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (fullName: string, email: string, password: string, role: UserRole) => Promise<User>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem("token"),
    loading: true,
    error: null,
  });

  // Verify and fetch current user profile on reload/load
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Session expired or invalid");
        }

        const data = await response.json();
        setState({
          user: data.user,
          token,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error("Auth verification failed:", err);
        localStorage.removeItem("token");
        setState({
          user: null,
          token: null,
          loading: false,
          error: null,
        });
      }
    };

    fetchProfile();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("token", data.token);
      setState({
        user: data.user,
        token: data.token,
        loading: false,
        error: null,
      });

      return data.user;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Invalid email or password";
      setState((prev) => ({ ...prev, loading: false, error: errMsg }));
      throw new Error(errMsg);
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    role: UserRole
  ): Promise<User> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, role }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      localStorage.setItem("token", data.token);
      setState({
        user: data.user,
        token: data.token,
        loading: false,
        error: null,
      });

      return data.user;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Registration failed";
      setState((prev) => ({ ...prev, loading: false, error: errMsg }));
      throw new Error(errMsg);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setState({
      user: null,
      token: null,
      loading: false,
      error: null,
    });
    // Request backend logout (optional status ping)
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        isAuthenticated: !!state.user,
        loading: state.loading,
        error: state.error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
