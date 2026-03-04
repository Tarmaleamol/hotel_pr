export type OrderStatus = 'CREATED' | 'KOT_SENT' | 'UPDATED' | 'BILL_GENERATED' | 'PAID';

export interface OrderItemInput {
  menu_item_id: string;
  quantity: number;
  notes?: string;
}

export interface CreateOrderDto {
  table_id: string;
  items: OrderItemInput[];
}

export interface AddItemsDto {
  items: OrderItemInput[];
}
