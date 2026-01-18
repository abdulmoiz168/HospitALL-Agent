"use client";

import { useRoleContext, Role } from "@/lib/context/app-context";

/**
 * Hook for managing the current user role (patient or admin).
 *
 * @returns {Object} Role management functions and state
 * @returns {Role} role - The current role ("patient" | "admin")
 * @returns {function} setRole - Function to update the role
 * @returns {boolean} isAdmin - Whether the current role is admin
 * @returns {boolean} isPatient - Whether the current role is patient
 *
 * @example
 * ```tsx
 * const { role, setRole, isAdmin, isPatient } = useRole();
 *
 * // Toggle to admin mode
 * setRole("admin");
 *
 * // Conditionally render based on role
 * if (isAdmin) {
 *   return <AdminDashboard />;
 * }
 * ```
 */
export function useRole(): {
  role: Role;
  setRole: (role: Role) => void;
  isAdmin: boolean;
  isPatient: boolean;
} {
  const { role, setRole, isAdmin, isPatient } = useRoleContext();

  return {
    role,
    setRole,
    isAdmin,
    isPatient,
  };
}

// Re-export Role type for convenience
export type { Role };
