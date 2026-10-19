import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { InvoiceService } from '../../../services/invoiceService/invoice.service';
import { IntelligenceService } from '../../../services/intelligenceService/intelligence.service';
import { ReminderService } from '../../../services/reminderService/reminder.service';
import { AuthService } from '../../../services/auth-service';
import { InvoiceDisplayDto } from '../../../model/Invoice.model';
import { RiskEvaluation, RiskLevel, AuditRecord } from '../../../model/Intelligence.model';
import { CreateReminderDto } from '../../../model/Reminder.model';

@Component({
  selector: 'app-intelligence',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './intelligence.html',
  styleUrl: './intelligence.scss'
})
export class Intelligence implements OnInit {
  private invoiceService = inject(InvoiceService);
  private intelligenceService = inject(IntelligenceService);
  private reminderService = inject(ReminderService);
  private authService = inject(AuthService);
  private toast = inject(ToastrService);

  loading = signal(false);
  activeTab = signal<'scoring' | 'audit'>('scoring');
  filterRisk = signal<string>('ALL');
  searchTerm = signal<string>('');

  allInvoices = signal<InvoiceDisplayDto[]>([]);
  evaluations = signal<RiskEvaluation[]>([]);
  auditRecords = signal<AuditRecord[]>([]);

  // Selected item for evaluation detail drawer / modal
  selectedEval = signal<RiskEvaluation | null>(null);
  showOverrideModal = signal(false);
  overrideRiskLevel = signal<RiskLevel>('Medium');
  overrideNotes = signal('');

  // Quick reminder modal from intelligence
  showReminderModal = signal(false);
  reminderDate = signal(new Date().toISOString().split('T')[0]);
  reminderType = signal('Email');
  reminderMessage = signal('');
  schedulingReminder = signal(false);

  ngOnInit(): void {
    this.loadData();
    this.loadAuditLogs();
  }

  loadData(): void {
    this.loading.set(true);
    this.invoiceService.getInvoices(1, 100).subscribe({
      next: (res) => {
        this.allInvoices.set(res.items);
        const evals = this.intelligenceService.evaluateAll(res.items);
        this.evaluations.set(evals);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load invoice portfolio for intelligence scoring', 'Error');
        this.loading.set(false);
      }
    });
  }

  loadAuditLogs(): void {
    this.auditRecords.set(this.intelligenceService.getAuditRecords());
  }

  filteredEvaluations = computed(() => {
    let list = this.evaluations();
    const risk = this.filterRisk();
    const search = this.searchTerm().trim().toLowerCase();

    if (risk !== 'ALL') {
      list = list.filter((e) => e.riskLevel.toLowerCase() === risk.toLowerCase());
    }

    if (search) {
      list = list.filter(
        (e) =>
          e.customerName.toLowerCase().includes(search) ||
          e.invoiceNumber.toLowerCase().includes(search)
      );
    }

    return list;
  });

  // KPI Metrics
  criticalCount = computed(() => this.evaluations().filter((e) => e.riskLevel === 'Critical').length);
  highCount = computed(() => this.evaluations().filter((e) => e.riskLevel === 'High').length);
  mediumCount = computed(() => this.evaluations().filter((e) => e.riskLevel === 'Medium').length);
  lowCount = computed(() => this.evaluations().filter((e) => e.riskLevel === 'Low').length);

  openDetail(evalData: RiskEvaluation): void {
    this.selectedEval.set(evalData);
  }

  closeDetail(): void {
    this.selectedEval.set(null);
  }

  openOverrideModal(evalData: RiskEvaluation): void {
    this.selectedEval.set(evalData);
    this.overrideRiskLevel.set(evalData.riskLevel);
    this.overrideNotes.set('');
    this.showOverrideModal.set(true);
  }

  closeOverrideModal(): void {
    this.showOverrideModal.set(false);
  }

  submitOverride(): void {
    const current = this.selectedEval();
    if (!current) return;

    this.intelligenceService.saveAuditRecord(
      current,
      this.overrideRiskLevel(),
      this.overrideNotes(),
      'User Overrode / Confirmed Risk Profile'
    );

    this.toast.success('Assessment confirmed and logged to audit trail.', 'Compliance Recorded');
    this.loadAuditLogs();
    this.closeOverrideModal();
  }

  openQuickReminder(evalData: RiskEvaluation): void {
    this.selectedEval.set(evalData);
    this.reminderDate.set(new Date().toISOString().split('T')[0]);
    this.reminderType.set(evalData.riskLevel === 'Critical' ? 'Formal Notice' : 'Email');
    this.reminderMessage.set(
      `Credit Follow-up: Invoice #${evalData.invoiceNumber} for ${evalData.customerName} has an outstanding balance of $${evalData.outstandingAmount.toLocaleString()}. ${evalData.recommendedAction}`
    );
    this.showReminderModal.set(true);
  }

  closeQuickReminder(): void {
    this.showReminderModal.set(false);
  }

  sendReminder(): void {
    const current = this.selectedEval();
    if (!current) return;

    this.schedulingReminder.set(true);
    const dto: CreateReminderDto = {
      invoiceId: current.invoiceId,
      reminderDate: this.reminderDate(),
      reminderType: this.reminderType(),
      message: this.reminderMessage()
    };

    this.reminderService.createReminder(dto).subscribe({
      next: () => {
        this.toast.success(
          `Follow-up reminder scheduled for ${current.customerName}`,
          'Action Executed'
        );
        this.intelligenceService.saveAuditRecord(
          current,
          current.riskLevel,
          `Triggered ${this.reminderType()} follow-up from Risk Scoring panel.`,
          'Automated Follow-up Created'
        );
        this.loadAuditLogs();
        this.schedulingReminder.set(false);
        this.closeQuickReminder();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to schedule reminder', 'Error');
        this.schedulingReminder.set(false);
      }
    });
  }
}
