/** Shared list/nav row states — sidebar rooms, DMs, settings nav, hall lists. */
export const LIST_ITEM_BASE = "rounded-lg transition-colors";

export const LIST_ITEM_SELECTED = "bg-list-selected text-list-emphasis";

export const LIST_ITEM_IDLE =
  "text-list-muted hover:bg-list-hover hover:text-list-emphasis";

export function listItemClasses(selected: boolean): string {
  return selected ? LIST_ITEM_SELECTED : LIST_ITEM_IDLE;
}

/** Settings nav: selected row with primary left accent */
export const SETTINGS_NAV_SELECTED =
  'bg-list-selected text-list-emphasis before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-1/2 before:border-l-4 before:border-primary before:rounded-lg';

export const SETTINGS_NAV_IDLE =
  "hover:bg-list-hover text-list-muted hover:text-list-emphasis bg-none";
