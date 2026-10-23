export interface AuditLogDto {
  id: number;
  userId?: number;
  userName?: string;
  action: string;
  entityName: string;
  entityId?: string;
  oldValues?: string;
  newValues?: string;
  timestamp: string;
}
