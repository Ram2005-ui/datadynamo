import { supabase } from "@/integrations/supabase/clientRuntime";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          cancel: () => void;
          prompt: (callback?: (notification: any) => void) => void;
          onLoad: (callback: () => void) => void;
        };
      };
    };
  }
}

export interface GoogleSignInResponse {
  credential: string; // ID token
  clientId: string;
  select_by: string;
}

export interface GoogleAuthResult {
  error: Error | null;
  user?: {
    id: string;
    email: string;
    name: string;
    avatar: string;
  };
  isNewUser?: boolean;
}

/**
 * Initialize Google Sign-In script
 */
export function initializeGoogleSignIn(clientId: string) {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: () => {}, // callback handled elsewhere
        });
        resolve();
      } else {
        reject(new Error("Failed to load Google Sign-In script"));
      }
    };

    script.onerror = () => {
      reject(new Error("Failed to load Google Sign-In script"));
    };

    document.head.appendChild(script);
  });
}

/**
 * Verify ID token with backend and sign in user
 */
export async function verifyGoogleToken(idToken: string): Promise<GoogleAuthResult> {
  try {
    const response = await fetch(
      `${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/google-auth-verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        error: new Error(errorData.error || "Authentication failed"),
      };
    }

    const data = await response.json();

    if (!data.success) {
      return {
        error: new Error(data.error || "Authentication failed"),
      };
    }

    return {
      error: null,
      user: data.user,
      isNewUser: data.isNewUser,
    };
  } catch (error) {
    console.error("Error verifying Google token:", error);
    return {
      error: error instanceof Error ? error : new Error("Verification failed"),
    };
  }
}

/**
 * Handle Google Sign-In response
 */
export async function handleGoogleSignInResponse(
  response: GoogleSignInResponse
): Promise<GoogleAuthResult> {
  try {
    // First verify the token with our backend
    const verifyResult = await verifyGoogleToken(response.credential);

    if (verifyResult.error) {
      return verifyResult;
    }

    // If user already exists in our system, they're ready to go
    if (!verifyResult.isNewUser) {
      // The user is verified and exists, Supabase auth should handle the session
      return {
        error: null,
        user: verifyResult.user,
        isNewUser: false,
      };
    }

    // For new users, we need to create their account in Supabase
    // This should be handled by the client-side Supabase integration
    return {
      error: null,
      user: verifyResult.user,
      isNewUser: true,
    };
  } catch (error) {
    console.error("Error handling Google sign-in response:", error);
    return {
      error: error instanceof Error ? error : new Error("Sign-in failed"),
    };
  }
}

/**
 * Sign in with Google using Supabase built-in Google OAuth
 */
export async function signInWithGoogleOAuth(): Promise<GoogleAuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });

    if (error) {
      return {
        error: new Error(error.message),
      };
    }

    return {
      error: null,
    };
  } catch (error) {
    console.error("Error signing in with Google OAuth:", error);
    return {
      error: error instanceof Error ? error : new Error("OAuth sign-in failed"),
    };
  }
}
