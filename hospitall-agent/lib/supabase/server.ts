import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// Create a service role client for admin operations (bypasses RLS)
// Returns null if SUPABASE_SERVICE_ROLE_KEY is not configured (logging will be skipped)
export function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return null;
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // Service client doesn't need cookies
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Create a service role client that throws if not configured (for admin routes)
export function createServiceClientRequired() {
  const client = createServiceClient();
  if (!client) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return client;
}

// Helper to get the current user from a request
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

// Helper to get user profile with role
export async function getUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return { user, profile: null };
  }

  return { user, profile };
}

// Helper to check if user is admin
export async function isAdmin(): Promise<boolean> {
  const result = await getUserProfile();
  if (!result || !result.profile) {
    return false;
  }
  return result.profile.role === "admin";
}

// Helper to require authentication - throws if not authenticated
export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

// Helper to require admin role - throws if not admin
export async function requireAdmin() {
  const result = await getUserProfile();
  if (!result || !result.user) {
    throw new Error("Authentication required");
  }
  if (!result.profile || result.profile.role !== "admin") {
    throw new Error("Admin access required");
  }
  return result;
}
