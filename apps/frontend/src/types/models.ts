export interface DiningTable {
  id: string;
  table_no: string;
  is_occupied: boolean | number;
  capacity: number;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
}

export interface Order {
  id: string;
  table_id: string;
  status: 'CREATED' | 'KOT_SENT' | 'UPDATED' | 'BILL_GENERATED' | 'PAID';
  subtotal: number;
  tax: number;
  total: number;
  updated_at: string;
}
