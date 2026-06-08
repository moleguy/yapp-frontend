export type HallSettingsSection = {
  title: string;
  subtitle: string;
};

const SECTIONS: Record<string, HallSettingsSection> = {
  overview: {
    title: "Overview",
    subtitle: "Manage your hall's general settings, members, and permissions.",
  },
  profile: {
    title: "Hall Profile",
    subtitle: "Customize your hall's identity.",
  },
  rooms: {
    title: "Rooms & Floors",
    subtitle: "Manage rooms and floors in this hall.",
  },
  members: {
    title: "Members",
    subtitle: "Manage members of your hall, their roles, and permissions.",
  },
  requests: {
    title: "Join requests",
    subtitle: "Review and manage requests to join this hall.",
  },
  roles: {
    title: "Roles",
    subtitle: "Create and manage roles and their associated permissions.",
  },
  bans: {
    title: "Bans",
    subtitle: "Manage banned users in this hall.",
  },
  invites: {
    title: "Invites",
    subtitle: "Manage active invite links for this hall.",
  },
};

export function getHallSettingsSection(pathname: string): HallSettingsSection {
  const match = pathname.match(/\/halls\/[^/]+\/settings(?:\/([^/]+))?/);
  const segment = match?.[1] ?? "overview";
  return SECTIONS[segment] ?? { title: "Settings", subtitle: "" };
}
