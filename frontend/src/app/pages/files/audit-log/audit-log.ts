import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AuditLogService } from '../../../services/auditLogService/audit-log.service';
import { AuditLogDto } from '../../../model/AuditLog.model';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-log.html',
  styleUrl: './audit-log.scss'
})
export class AuditLogComponent implements OnInit {
  private auditLogService = inject(AuditLogService);
  private toast = inject(ToastrService);

  logs = signal<AuditLogDto[]>([]);
  loading = signal(false);

  // Filters
  searchTerm = signal('');
  selectedAction = signal('ALL');
  selectedEntity = signal('ALL');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalCount = signal(0);
  totalPages = signal(0);

  // Inspection modal
  selectedLog = signal<AuditLogDto | null>(null);
  showDetailModal = signal(false);

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(page: number = 1): void {
    this.loading.set(true);
    this.auditLogService.getAuditLogs(page, this.pageSize()).subscribe({
      next: (res) => {
        this.logs.set(res.items);
        this.currentPage.set(res.pageNumber);
        this.totalCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error(
          err?.error?.message || 'Failed to load audit logs from API',
          'Audit Log'
        );
        this.loading.set(false);
      }
    });
  }

  filteredLogs = computed(() => {
    let list = this.logs();
    const search = this.searchTerm().trim().toLowerCase();
    const action = this.selectedAction();
    const entity = this.selectedEntity();

    if (search) {
      list = list.filter(
        (l) =>
          (l.userName && l.userName.toLowerCase().includes(search)) ||
          (l.entityName && l.entityName.toLowerCase().includes(search)) ||
          (l.entityId && l.entityId.toLowerCase().includes(search)) ||
          (l.action && l.action.toLowerCase().includes(search))
      );
    }

    if (action !== 'ALL') {
      list = list.filter(
        (l) => l.action.toLowerCase() === action.toLowerCase()
      );
    }

    if (entity !== 'ALL') {
      list = list.filter(
        (l) => l.entityName.toLowerCase() === entity.toLowerCase()
      );
    }

    return list;
  });

  // Action count metrics
  createCount = computed(
    () => this.logs().filter((l) => l.action.toUpperCase() === 'CREATE').length
  );
  updateCount = computed(
    () => this.logs().filter((l) => l.action.toUpperCase() === 'UPDATE').length
  );
  deleteCount = computed(
    () => this.logs().filter((l) => l.action.toUpperCase() === 'DELETE').length
  );

  getActionClass(action: string): string {
    switch (action?.toUpperCase()) {
      case 'CREATE':
      case 'INSERT':
        return 'badge-create';
      case 'UPDATE':
      case 'EDIT':
      case 'MODIFY':
        return 'badge-update';
      case 'DELETE':
      case 'REMOVE':
        return 'badge-delete';
      default:
        return 'badge-default';
    }
  }

  openDetail(log: AuditLogDto): void {
    this.selectedLog.set(log);
    this.showDetailModal.set(true);
  }

  closeDetail(): void {
    this.showDetailModal.set(false);
    this.selectedLog.set(null);
  }

  formatJson(val?: string | null): string {
    if (!val) return 'None recorded';
    try {
      const parsed = JSON.parse(val);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return val;
    }
  }

  parseJsonProperties(val?: string | null): { key: string; value: string }[] {
    if (!val) return [];
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.keys(parsed).map((k) => ({
          key: k,
          value:
            typeof parsed[k] === 'object'
              ? JSON.stringify(parsed[k])
              : String(parsed[k])
        }));
      }
    } catch {}
    return [{ key: 'Data', value: val }];
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) {
      this.loadLogs(p);
    }
  }
}
