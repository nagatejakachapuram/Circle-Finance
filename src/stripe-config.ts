export interface Product {
  id: string
  priceId: string
  name: string
  description: string
  mode: 'payment' | 'subscription'
}

export const PRODUCTS: Product[] = [
  {
    id: 'prod_SqVrxrERyycw0w',
    priceId: 'price_1Ruoq5EZgx2g1KxfIMSvKX78',
    name: 'Circle Finance',
    description: 'Payments',
    mode: 'payment'
  }
]