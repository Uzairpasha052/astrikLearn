import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { InvoiceDisplayDto } from '../../model/Invoice.model';
import {
  RiskEvaluation,
  RiskLevel,
  RiskFactor,
  AuditRecord
} from '../../model/Intelligence.model';
import { AuthService } from '../auth-service';

@Injectable({
  providedIn: 'root'
})
export class IntelligenceService {
  private platformId = inject(PLATFORM_ID);
  private authService = inject(AuthService);
  private auditStorageKey = 'invoice_ai_audit_logs';

  /**
   * Transparent Statistical Scoring Model
   * Evaluates Late-Payment Risk using invoice age, past customer history, and exposure amount.
   */
  evaluateInvoice(
    invoice: InvoiceDisplayDto,
    allInvoices: InvoiceDisplayDto[]
  ): RiskEvaluation {
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    const invoiceDate = new Date(invoice.invoiceDate);

    // 1. Calculate age / overdue days
    const diffTime = today.getTime() - dueDate.getTime();
    const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // 2. Customer historical profile
    const customerInvoices = allInvoices.filter(
      (inv) => inv.customerId === invoice.customerId && inv.id !== invoice.id
    );

    const totalCustomerInvoices = customerInvoices.length;
    const paidCustomerInvoices = customerInvoices.filter(
      (inv) => inv.status.toLowerCase() === 'paid'
    ).length;
    const pastOverdueInvoices = customerInvoices.filter((inv) => {
      const invDue = new Date(inv.dueDate);
      return inv.outstandingAmount > 0 && today > invDue;
    }).length;

    const paymentRatio =
      totalCustomerInvoices > 0 ? paidCustomerInvoices / totalCustomerInvoices : 0.8;

    // 3. Amount exposure compared to average
    const avgInvoiceAmount =
      customerInvoices.length > 0
        ? customerInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0) /
          customerInvoices.length
        : invoice.totalAmount;

    const amountRatio =
      avgInvoiceAmount > 0 ? invoice.totalAmount / avgInvoiceAmount : 1.0;

    // 4. Calculate Risk Points (0 - 100)
    let score = 15; // baseline points
    const factors: RiskFactor[] = [];
    const explanation: string[] = [];

    // Factor A: Days Overdue / Aging
    if (invoice.status.toLowerCase() === 'paid') {
      score = 0;
      factors.push({
        factor: 'Invoice Paid',
        impact: 'positive',
        detail: 'This invoice has been settled in full.',
        weight: 0
      });
      explanation.push('Invoice has no outstanding balance.');
    } else if (daysOverdue > 60) {
      score += 45;
      factors.push({
        factor: 'Severe Aging (>60 Days)',
        impact: 'critical',
        detail: `Invoice is ${daysOverdue} days past due date. Highest risk bracket.`,
        weight: 45
      });
      explanation.push(`Critical overdue period of ${daysOverdue} days.`);
    } else if (daysOverdue > 30) {
      score += 35;
      factors.push({
        factor: 'Moderate Overdue (31-60 Days)',
        impact: 'negative',
        detail: `Invoice is ${daysOverdue} days past due date.`,
        weight: 35
      });
      explanation.push(`Invoice is ${daysOverdue} days overdue.`);
    } else if (daysOverdue > 0) {
      score += 20;
      factors.push({
        factor: 'Recent Overdue (1-30 Days)',
        impact: 'negative',
        detail: `Invoice is ${daysOverdue} days overdue.`,
        weight: 20
      });
      explanation.push(`Invoice is ${daysOverdue} days past due.`);
    } else {
      const daysUntilDue = Math.abs(daysOverdue);
      if (daysUntilDue <= 3) {
        score += 8;
        factors.push({
          factor: 'Due Imminently',
          impact: 'neutral',
          detail: `Due within ${daysUntilDue} day(s).`,
          weight: 8
        });
        explanation.push(`Payment due in ${daysUntilDue} day(s).`);
      } else {
        score -= 5;
        factors.push({
          factor: 'Within Credit Period',
          impact: 'positive',
          detail: `Current invoice, due in ${daysUntilDue} days.`,
          weight: -5
        });
        explanation.push(`Current invoice with ${daysUntilDue} days remaining.`);
      }
    }

    // Factor B: Customer History
    if (totalCustomerInvoices >= 2) {
      if (pastOverdueInvoices > 0) {
        const penalty = Math.min(25, pastOverdueInvoices * 10);
        score += penalty;
        factors.push({
          factor: 'Past Default / Delayed Payments',
          impact: 'negative',
          detail: `Customer has ${pastOverdueInvoices} other overdue invoice(s).`,
          weight: penalty
        });
        explanation.push(
          `Customer account has ${pastOverdueInvoices} other unpaid/overdue invoice(s).`
        );
      } else if (paymentRatio >= 0.85) {
        score -= 10;
        factors.push({
          factor: 'Reliable Payment History',
          impact: 'positive',
          detail: `Customer has settled ${Math.round(paymentRatio * 100)}% of prior invoices.`,
          weight: -10
        });
        explanation.push(
          `Strong payment track record (${Math.round(paymentRatio * 100)}% settled).`
        );
      }
    } else {
      score += 5;
      factors.push({
        factor: 'New Customer Profile',
        impact: 'neutral',
        detail: 'Limited historical transactions recorded.',
        weight: 5
      });
      explanation.push('Limited prior transaction history to verify patterns.');
    }

    // Factor C: Balance & Exposure
    if (invoice.outstandingAmount > 0) {
      if (amountRatio > 1.8) {
        score += 15;
        factors.push({
          factor: 'High Value Exposure',
          impact: 'negative',
          detail: `Invoice amount is ${amountRatio.toFixed(1)}x greater than customer average.`,
          weight: 15
        });
        explanation.push(
          `Large financial exposure (${amountRatio.toFixed(1)}x customer average).`
        );
      }

      if (invoice.amountPaid > 0) {
        score -= 10;
        factors.push({
          factor: 'Partial Payment Received',
          impact: 'positive',
          detail: `Customer has already paid ${Math.round(
            (invoice.amountPaid / invoice.totalAmount) * 100
          )}% of total.`,
          weight: -10
        });
        explanation.push(
          `Partial payment of ${invoice.amountPaid.toLocaleString()} received.`
        );
      }
    }

    // Clamp score 0 - 100
    const finalScore = Math.max(0, Math.min(100, Math.round(score)));

    // Confidence calculation (increases with sample size and data completeness)
    const confidence = Math.min(
      95,
      60 + Math.min(25, totalCustomerInvoices * 5) + (invoice.items.length > 0 ? 10 : 0)
    );

    // Categorization
    let riskLevel: RiskLevel = 'Low';
    let recommendedAction = 'Routine automated follow-up upon due date.';

    if (invoice.status.toLowerCase() === 'paid') {
      riskLevel = 'Low';
      recommendedAction = 'None required. Invoice closed and settled.';
    } else if (finalScore >= 75) {
      riskLevel = 'Critical';
      recommendedAction =
        'Immediate Action Required: Call client credit controller, put account on credit hold, and issue formal final notice.';
    } else if (finalScore >= 50) {
      riskLevel = 'High';
      recommendedAction =
        'High Priority: Schedule direct telephone follow-up and send urgent reminder with payment link.';
    } else if (finalScore >= 28) {
      riskLevel = 'Medium';
      recommendedAction =
        'Moderate Priority: Send courtesy reminder email 3 days prior or post due date.';
    } else {
      riskLevel = 'Low';
      recommendedAction =
        'Low Risk: Standard monthly account statement. Customer in good standing.';
    }

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      totalAmount: invoice.totalAmount,
      outstandingAmount: invoice.outstandingAmount,
      dueDate: invoice.dueDate,
      daysOverdue: Math.max(0, daysOverdue),
      score: finalScore,
      confidence,
      riskLevel,
      explanation,
      factors,
      recommendedAction,
      evaluatedAt: new Date().toISOString()
    };
  }

  /**
   * Evaluates all open invoices and sorts by risk score descending
   */
  evaluateAll(invoices: InvoiceDisplayDto[]): RiskEvaluation[] {
    return invoices
      .map((inv) => this.evaluateInvoice(inv, invoices))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Save user confirmation or override to persistent audit trail
   */
  saveAuditRecord(
    evalData: RiskEvaluation,
    overrideLevel: RiskLevel,
    userNotes: string,
    actionTaken: string
  ): AuditRecord {
    const user = this.authService.getUser();
    const record: AuditRecord = {
      id: 'AUDIT-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      invoiceId: evalData.invoiceId,
      invoiceNumber: evalData.invoiceNumber,
      customerName: evalData.customerName,
      timestamp: new Date().toISOString(),
      originalRiskLevel: evalData.riskLevel,
      originalScore: evalData.score,
      overrideRiskLevel: overrideLevel,
      userNotes: userNotes.trim() || 'User confirmed advisory evaluation.',
      confirmedBy: user?.name || 'Authorized Staff',
      actionTaken
    };

    if (isPlatformBrowser(this.platformId)) {
      const records = this.getAuditRecords();
      records.unshift(record);
      localStorage.setItem(this.auditStorageKey, JSON.stringify(records.slice(0, 50)));
    }

    return record;
  }

  getAuditRecords(): AuditRecord[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      const raw = localStorage.getItem(this.auditStorageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
