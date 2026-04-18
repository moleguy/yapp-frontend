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
  useUserStore,
  useSetUser,
  useClearUser,
  useSetActive,
  useUpdateUser,
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
  const updateUserEdge = useUpdateUser(); // <- EdgeStore user updater

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
        if (userData) {
          // Priority: yapp_access_token key -> Zustand store -> current userData
          const forcedToken = typeof window !== 'undefined' ? localStorage.getItem("yapp_access_token") : null;
          const storeToken = useUserStore.getState().user?.access_token;
          const token = forcedToken || storeToken || (userData as any).access_token;

          const mergedData = { ...userData, access_token: token };
          setUser(mergedData);
          setUserEdge(mergedData);
          setActive(true);
        } else {
          setUser(null);
          setActive(false);
          clearUserEdge();
        }
        return userData;
      } catch (err) {
        console.error("[AuthProvider.fetchUser] Error:", err);
        // Silently fail - user is not authenticated or backend is unreachable
        // This is expected on initial load
        setUser(null);
        setActive(false);
        clearUserEdge();
        return null;
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [clearError, setUserEdge, clearUserEdge, setActive],
  );

  useEffect(() => {
    // Check if user is already authenticated via existing JWT cookie
    // This handles page reloads when user is already signed in
    const initAuth = async () => {
      try {
        setLoading(true);
        const userData = await getUserMe();
        if (userData) {
          // Priority: yapp_access_token key -> Zustand store -> current userData
          const forcedToken = typeof window !== 'undefined' ? localStorage.getItem("yapp_access_token") : null;
          const storeToken = useUserStore.getState().user?.access_token;
          const token = forcedToken || storeToken || (userData as any).access_token;

          const mergedData = { ...userData, access_token: token };
          setUser(mergedData);
          setUserEdge(mergedData);
          setActive(true);
        } else {
          setUser(null);
          setActive(false);
          clearUserEdge();
        }
      } catch (err) {
        console.error("[AuthProvider] Failed to initialize auth:", err);
        setUser(null);
        setActive(false);
        clearUserEdge();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [setActive, setUserEdge, clearUserEdge]);

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

        console.log("[AuthContext.signin] Starting signin with payload:", { email: payload.email });
        const result = await authSignIn(payload);
        console.log("[AuthContext.signin] authSignIn result:", result);

        if (!result.success) {
          const err: AuthError = {
            message: result.message || "Sign in failed",
            code: "SIGNIN_FAILED",
          };
          console.error("[AuthContext.signin] Signin failed:", err.message);
          setError(err);
          return { success: false, error: err };
        }

        console.log("[AuthContext.signin] Signin successful, fetching user profile");

        // Sync token to store if returned in signin response
        if (result.access_token) {
          console.log("[AuthContext.signin] Updating user store with access token");
          // FORCE into localStorage immediately to bypass Zustand sync lag
          localStorage.setItem("yapp_access_token", result.access_token);

          setUserEdge({
            id: result.id,
            username: result.username,
            display_name: result.display_name,
            email: result.email,
            phone_number: result.phone_number,
            avatar_url: result.avatar_url,
            avatar_thumbnail_url: result.avatar_thumbnail_url,
            description: result.description,
            friend_policy: result.friend_policy,
            active: result.active,
            created_at: result.created_at,
            updated_at: result.updated_at,
            access_token: result.access_token
          });
        }

        // Fetch full user profile
        const userData = await fetchUser(false);
        if (!userData) {
          const err: AuthError = {
            message:
              "Signed in but failed to load user profile. Refresh the page.",
            code: "FETCH_USER_FAILED",
          };
          console.error("[AuthContext.signin] Failed to fetch user profile after signin");
          setError(err);
          return { success: false, error: err };
        }
        console.log("[AuthContext.signin] User profile loaded successfully:", userData.username);
        router.push("/home");

        return { success: true };
      } catch (err) {
        const authErr = handleError(err, "Sign in failed");
        console.error("[AuthContext.signin] Exception:", authErr);
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
