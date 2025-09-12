export interface IProduct {
  id: number;
  name: string;
  category_id: string;
  supplier_price: number;
  sale_price: number;
  stock_quantity: number;
  unit: string;
  min_stock: number;
  created_at: string;
  supplier_id: string;
}

export interface IProductFormField {
    label: string;
    name: string;
    type: string;
    placeholder: string;
    required: boolean;
    description?: string;
};