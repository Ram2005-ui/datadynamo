// @ts-ignore - Remote Deno modules cannot be validated by VS Code's TypeScript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Remote Deno modules cannot be validated by VS Code's TypeScript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// Type declarations for Deno and global APIs
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

declare const fetch: any;
declare const Request: any;
declare const Response: any;
declare const JSON: any;
declare const console: any;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

// Google's public key for verifying ID tokens
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";

// Verify Google ID token by calling Google's tokeninfo endpoint
async function verifyGoogleToken(idToken: string) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${idToken}`
    );

    if (!response.ok) {
      return { error: "Invalid token", data: null };
    }

    const tokenInfo = await response.json();

    // Verify the token was issued by Google and for our app
    if (tokenInfo.aud !== GOOGLE_CLIENT_ID) {
      return { error: "Token audience mismatch", data: null };
    }

    // Check token expiration
    const currentTime = Math.floor(Date.now() / 1000);
    if (tokenInfo.exp && tokenInfo.exp < currentTime) {
      return { error: "Token expired", data: null };
    }

    return {
      error: null,
      data: {
        sub: tokenInfo.sub, // Google user ID
        email: tokenInfo.email,
        email_verified: tokenInfo.email_verified,
        name: tokenInfo.name,
        picture: tokenInfo.picture,
      },
    };
  } catch (error) {
    console.error("Error verifying Google token:", error);
    return { error: "Failed to verify token", data: null };
  }
}

// Check if user exists or create new user in profiles table
async function getOrCreateUser(
  googleData: {
    sub: string;
    email: string;
    name: string;
    picture: string;
    email_verified: boolean;
  }
) {
  try {
    // First, try to find the user profile by email
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", googleData.email)
      .single();

    if (existingProfile) {
      // User profile exists, return their data
      return {
        error: null,
        data: { user: existingProfile, isNewUser: false },
      };
    }

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 means "no rows returned", which is expected for new users
      console.log("Fetch error:", fetchError);
    }

    // For new users, Supabase auth will be handled by the frontend
    // We just return the Google data so it can be used for Supabase signup
    return {
      error: null,
      data: {
        user: {
          id: googleData.sub,
          email: googleData.email,
          display_name: googleData.name,
          avatar_url: googleData.picture,
        },
        isNewUser: true,
      },
    };
  } catch (error) {
    console.error("Error getting or creating user:", error);
    return { error: "Database error", data: null };
  }
}

// Generate JWT token for the user
async function generateJWT(userId: string, email: string, isNewUser: boolean) {
  try {
    // Create a custom claim for JWT
    const payload = {
      sub: userId,
      email: email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      isNewUser: isNewUser,
    };

    return {
      error: null,
      data: {
        payload: payload,
      },
    };
  } catch (error) {
    console.error("Error generating JWT:", error);
    return { error: "Failed to generate token", data: null };
  }
}

serve(async (req: any) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { idToken } = await req.json();

    if (!idToken) {
      return new Response(
        JSON.stringify({ error: "Missing id token", success: false }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 1: Verify Google token
    const { error: tokenError, data: googleData } = await verifyGoogleToken(idToken);

    if (tokenError) {
      return new Response(
        JSON.stringify({
          error: tokenError,
          success: false,
          code: "TOKEN_VERIFICATION_FAILED",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Get or create user
    const { error: userError, data: userData } = await getOrCreateUser(googleData!);

    if (userError) {
      return new Response(
        JSON.stringify({
          error: userError,
          success: false,
          code: "USER_OPERATION_FAILED",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Generate JWT
    const { error: jwtError, data: tokenData } = await generateJWT(
      userData!.user.id,
      userData!.user.email,
      userData!.isNewUser
    );

    if (jwtError) {
      return new Response(
        JSON.stringify({
          error: jwtError,
          success: false,
          code: "JWT_GENERATION_FAILED",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userData!.user.id,
          email: userData!.user.email,
          name: userData!.user.display_name,
          avatar: userData!.user.avatar_url,
        },
        isNewUser: userData!.isNewUser,
        token: tokenData!.payload,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        success: false,
        code: "INTERNAL_ERROR",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
