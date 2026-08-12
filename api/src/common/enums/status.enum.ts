/**
 * Shared ACTIVE/SUSPENDED lifecycle used by the admin-managed reference
 * entities (Country, City, Language, EventCategory) and TicketCategory.
 * Suspend/activate is preferred over hard delete for referenced records.
 */
export enum SettingStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}
