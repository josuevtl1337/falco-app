export interface IExpense {
  id: number;
  name: string;
  description: string;
  units: number;
  amount: number;
  currency: string; // 'USD', 'ARS', etc.
  payment_type: string; // 'cash', 'credit_card', etc.
  document: string; // 'invoice', 'receipt', etc.
  date: string; // ISO date string
  created_at: string; // ISO date string
}

export interface IExpenseFormField {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  required?: boolean;
  description?: string;
}