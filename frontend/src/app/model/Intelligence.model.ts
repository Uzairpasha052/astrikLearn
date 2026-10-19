export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface RiskFactor {
  factor: string;
  impact: 'positive' | 'neutral' | 'negative' | 'critical';
  detail: string;
  weight: number;
}

export interface RiskEvaluation {
  invoiceId: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  totalAmount: number;
  outstandingAmount: number;
  dueDate: string;
  daysOverdue: number;
  score: number; // 0 - 100
  confidence: number; // 0 - 100%
  riskLevel: RiskLevel;
  explanation: string[];
  factors: RiskFactor[];
  recommendedAction: string;
  evaluatedAt: string;
}

export interface AuditRecord {
  id: string;
  invoiceId: number;
  invoiceNumber: string;
  customerName: string;
  timestamp: string;
  originalRiskLevel: RiskLevel;
  originalScore: number;
  overrideRiskLevel: RiskLevel;
  userNotes: string;
  confirmedBy: string;
  actionTaken: string;
}
