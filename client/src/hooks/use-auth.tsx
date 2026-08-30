
import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

type User = any;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          // Only set user if the server returned a user object.
          // This prevents overwriting a freshly registered/logged-in
          // user with `null` due to a timing race between requests.
          if (data.user) setUser(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = (user: User) => {
    setUser(user);
  };

  const logout = async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
      setUser(null);
      // Every property/project/estimate query fetched while logged in is
      // still sitting in the cache under the SAME query keys (they don't
      // include a userId) — without clearing it, navigating back to a
      // page like PropertyOverview after logout, or just having it still
      // mounted, kept showing that stale authenticated data (a query's
      // last-successful `data` survives a failed background refetch by
      // default) instead of reflecting that the session is gone.
      queryClient.clear();
      setLocation('/');
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
