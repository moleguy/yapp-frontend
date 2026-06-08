import type { Role } from "@/lib/api";

export function isCreatorRole(role: Role | undefined | null): boolean {
  return role?.name.toLowerCase() === "creator";
}

export function roleDotColor(role: Role | undefined | null): string {
  if (!role) return "#73726e";
  if (isCreatorRole(role)) return "var(--role-creator-dot)";
  return role.color ?? "#73726e";
}

export function roleBadgeClassName(role: Role): string {
  if (isCreatorRole(role)) {
    return "inline-flex items-center gap-1.5 rounded-md border border-role-creator bg-role-creator-muted px-2 py-1 text-xs font-semibold text-role-creator";
  }
  return "inline-flex items-center gap-1.5 rounded-md bg-surface-control px-2 py-1 text-xs font-medium text-heading";
}

export function roleNameClassName(role: Role | undefined | null): string {
  if (isCreatorRole(role)) return "text-sm text-role-creator font-semibold";
  return "text-sm text-heading font-medium";
}
