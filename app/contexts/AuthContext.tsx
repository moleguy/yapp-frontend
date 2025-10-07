"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import {
  authSignIn,
  authSignUp,
  authSignOut,
  getUserMe,
  SignInReq,
  SignUpReq,
  UserMeRes,
} from "@/lib/api";
import {
  useSetUser,
  useClearUser,
  useSetActive,
} from "@/app/store/useUserStore";

export interface AuthError {
  message: string;
  code?: string;
  statusCode?: number;
}

interface AuthContextType {
  user: UserMeRes | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
  signin: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: AuthError }>;
  signup: (
    userData: SignUpReq,
  ) => Promise<{ success: boolean; error?: AuthError }>;
  signout: () => Promise<void>;
  refetch: () => Promise<UserMeRes | null>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserMeRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const router = useRouter();

  const setUserEdge = useSetUser(); // <- EdgeStore user setter
  const clearUserEdge = useClearUser(); // <- EdgeStore user clear
  const setActive = useSetActive(); // <- EdgeStore user active setter

  const clearError = useCallback(() => setError(null), []);

  const handleError = useCallback(
    (err: unknown, defaultMessage: string): AuthError => {
      if (err instanceof Error)
        return { message: err.message, code: "UNKNOWN_ERROR" };
      if (typeof err === "object" && err !== null) {
        const apiErr = err as {
          message?: string;
          code?: string;
          statusCode?: number;
        };
        return {
          message: apiErr.message || defaultMessage,
          code: apiErr.code,
          statusCode: apiErr.statusCode,
        };
      }
      return { message: defaultMessage, code: "UNKNOWN_ERROR" };
    },
    [],
  );

  const fetchUser = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        clearError();

        const userData = await getUserMe();
        setUser(userData);
        setActive(true);
        if (userData) setUserEdge(userData); // <- sync to EdgeStore
        return userData;
      } catch (err) {
        const authErr = handleError(err, "Failed to fetch user data");
        setError(authErr);
        setUser(null);
        setActive(false);
        clearUserEdge();
        return null;
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [clearError, handleError, setUserEdge, clearUserEdge, setActive],
  );

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const signin = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      clearError();

      if (!email?.trim() || !password?.trim()) {
        const err: AuthError = {
          message: "Email and password are required",
          code: "VALIDATION_ERROR",
        };
        setError(err);
        setLoading(false);
        return { success: false, error: err };
      }

      try {
        const payload: SignInReq = {
          email: email.trim().toLowerCase(),
          password,
        };

        const result = await authSignIn(payload);

        if (!result.success) {
          const err: AuthError = {
            message: result.message || "Sign in failed",
            code: "SIGNIN_FAILED",
          };
          setError(err);
          return { success: false, error: err };
        }

        // Fetch full user profile
        const userData = await fetchUser(false);
        if (!userData) {
          const err: AuthError = {
            message:
              "Signed in but failed to load user profile. Refresh the page.",
            code: "FETCH_USER_FAILED",
          };
          setError(err);
          return { success: false, error: err };
        }
        router.push("/home");

        return { success: true };
      } catch (err) {
        const authErr = handleError(err, "Sign in failed");
        setError(authErr);
        return { success: false, error: authErr };
      } finally {
        setLoading(false);
      }
    },
    [fetchUser, handleError, clearError, router, setError],
  );

  const signup = useCallback(
    async (userData: SignUpReq) => {
      try {
        setLoading(true);
        clearError();

        if (!userData.email?.trim()) {
          const err: AuthError = {
            message: "Email is required",
            code: "VALIDATION_ERROR",
          };
          setError(err);
          return { success: false, error: err };
        }

        const result = await authSignUp(userData);
        if (!result.success) {
          const err: AuthError = {
            message: result.message || "Sign up failed",
            code: "SIGNUP_FAILED",
          };
          setError(err);
          return { success: false, error: err };
        }

        return { success: true };
      } catch (err) {
        const authErr = handleError(err, "Sign up failed");
        setError(authErr);
        return { success: false, error: authErr };
      } finally {
        setLoading(false);
      }
    },
    [handleError, clearError],
  );

  const signout = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      await authSignOut();
    } catch (err) {
      console.error("Sign out failed:", err);
    } finally {
      setUser(null);
      clearUserEdge();
      setLoading(false);
      router.push("/signin");
    }
  }, [router, clearError, clearUserEdge]);

  const refetch = useCallback(() => fetchUser(true), [fetchUser]);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    error,
    signin,
    signup,
    signout,
    refetch,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const useAuthStatus = () => {
  const { isAuthenticated, loading } = useAuth();
  return { isAuthenticated, loading };
};

export const useRequireAuth = (redirectTo = "/signin") => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !isAuthenticated) router.push(redirectTo);
  }, [isAuthenticated, loading, redirectTo, router]);
  return { isAuthenticated, loading };
};
