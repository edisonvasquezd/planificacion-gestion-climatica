"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
    id: string;
    email: string;
    nombreCompleto: string;
    rol: string;
    organizacionId?: string;
}

interface ImpersonatingOrg {
    id: string;
    nombre: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    impersonatingOrg: ImpersonatingOrg | null;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    stopImpersonation: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

interface RegisterData {
    email: string;
    password: string;
    nombreCompleto: string;
    rol?: string;
    organizacionId?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [impersonatingOrg, setImpersonatingOrg] = useState<ImpersonatingOrg | null>(null);

    // Check for existing session on mount
    useEffect(() => {
        const savedToken = localStorage.getItem("auth_token");
        const savedImpersonating = localStorage.getItem("impersonating_org");

        if (savedImpersonating) {
            try {
                setImpersonatingOrg(JSON.parse(savedImpersonating));
            } catch {
                localStorage.removeItem("impersonating_org");
            }
        }

        if (savedToken) {
            setToken(savedToken);
            fetchUser(savedToken);
        } else {
            setIsLoading(false);
        }
    }, []);

    const fetchUser = async (authToken: string) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (response.ok) {
                const { data } = await response.json();
                setUser(data);
            } else {
                // Token invalid, clear it
                localStorage.removeItem("auth_token");
                setToken(null);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Error al iniciar sesión");
        }

        const { token: newToken, user: userData } = result.data;

        localStorage.setItem("auth_token", newToken);
        setToken(newToken);
        setUser(userData);
    };

    const register = async (data: RegisterData) => {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Error al registrar usuario");
        }

        // Auto-login after register
        await login(data.email, data.password);
    };

    const logout = async () => {
        if (token) {
            try {
                await fetch(`${API_URL}/api/auth/logout`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
            } catch (error) {
                console.error("Logout error:", error);
            }
        }

        localStorage.removeItem("auth_token");
        localStorage.removeItem("impersonating_org");
        setToken(null);
        setUser(null);
        setImpersonatingOrg(null);
    };

    const stopImpersonation = async () => {
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/api/admin/stop-impersonation`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const { data } = await response.json();
                localStorage.setItem("auth_token", data.token);
                localStorage.removeItem("impersonating_org");
                setToken(data.token);
                setImpersonatingOrg(null);
                // Refresh user data
                await fetchUser(data.token);
            }
        } catch (error) {
            console.error("Stop impersonation error:", error);
        }
    };

    const refreshUser = async () => {
        const savedToken = localStorage.getItem("auth_token");
        if (savedToken) {
            await fetchUser(savedToken);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated: !!user,
                impersonatingOrg,
                login,
                register,
                logout,
                stopImpersonation,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
