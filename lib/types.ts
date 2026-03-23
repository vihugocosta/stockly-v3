export type Competency = 'NR-10' | 'NR-12' | 'NR-35' | 'Geral' | 'Operação de Empilhadeira' | 'Soldagem';

export interface Employee {
  id: string;
  name: string;
  photo: string;
  role: string;
  competencies: Competency[];
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  requiredCompetencies: Competency[];
  totalQuantity: number;
  availableQuantity: number;
}

export interface Movement {
  id: string;
  toolId: string;
  assetId?: string;
  employeeId: string;
  type: 'checkout' | 'checkin';
  date: string;
  quantity: number;
  previousQuantity?: number;
  newQuantity?: number;
}

export interface AdminRequest {
  id: string;
  userId: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ActiveLoan {
  toolId: string;
  employeeId: string;
  assetId?: string;
  quantity: number;
  lastCheckoutDate: string;
}
