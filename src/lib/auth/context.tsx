"use client";

import { createContext, useContext, type ReactNode } from "react";

// =============================================================================
// Mock User Types
// =============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: "admin" | "editor" | "author";
}

// =============================================================================
// Stubbed Auth Context
// =============================================================================

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock admin user for development
const MOCK_USER: User = {
  id: "mock-admin-001",
  name: "Admin User",
  email: "admin@kickass-cms.dev",
  avatarUrl: "https://i.pravatar.cc/150?u=admin",
  role: "admin",
};

// =============================================================================
// Auth Provider
// =============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  // In a real implementation, this would check cookies/tokens
  // For now, we always return the mock user
  const user = MOCK_USER;
  const isLoading = false;

  const signIn = async (_email: string, _password: string) => {
    // Stub: In real implementation, this would call an auth API
    console.log("Sign in stubbed - using mock user");
  };

  const signOut = async () => {
    // Stub: In real implementation, this would clear auth state
    console.log("Sign out stubbed");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// =============================================================================
// Auth Hook
// =============================================================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// =============================================================================
// Auth Guard Component
// =============================================================================

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    // In real implementation, redirect to login
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Not Authenticated</h1>
          <p className="text-muted-foreground">Please sign in to continue.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

