import { Product } from '../types/product';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Táo đỏ Mỹ',
    price: 59000,
    unit: 'kg',
    stock: 28,
    category: 'Trái cây',
    rating: 4.7,
    imageUrl: 'https://dummyimage.com/800x600/22c55e/ffffff&text=Apples',
    description: 'Táo giòn, ngọt nhẹ, phù hợp ăn trực tiếp hoặc làm salad.'
  },
  {
    id: 2,
    name: 'Chuối tiêu',
    price: 29000,
    unit: 'kg',
    stock: 42,
    category: 'Trái cây',
    rating: 4.5,
    imageUrl: 'https://dummyimage.com/800x600/f59e0b/ffffff&text=Bananas',
    description: 'Chuối chín tự nhiên, phù hợp bữa sáng và làm sinh tố.'
  },
  {
    id: 3,
    name: 'Sữa tươi không đường',
    price: 34000,
    unit: 'hộp 1L',
    stock: 18,
    category: 'Sữa & trứng',
    rating: 4.6,
    imageUrl: 'https://dummyimage.com/800x600/3b82f6/ffffff&text=Milk',
    description: 'Sữa tươi tiệt trùng, không đường, tiện dùng hằng ngày.'
  },
  {
    id: 4,
    name: 'Trứng gà ta',
    price: 42000,
    unit: 'vỉ 10',
    stock: 12,
    category: 'Sữa & trứng',
    rating: 4.8,
    imageUrl: 'https://dummyimage.com/800x600/a855f7/ffffff&text=Eggs',
    description: 'Trứng gà ta thơm ngon, phù hợp luộc, chiên, làm bánh.'
  },
  {
    id: 5,
    name: 'Ức gà phi lê',
    price: 89000,
    unit: '500g',
    stock: 9,
    category: 'Thịt cá',
    rating: 4.4,
    imageUrl: 'https://dummyimage.com/800x600/ef4444/ffffff&text=Chicken',
    description: 'Ức gà phi lê sạch, phù hợp eat-clean và meal prep.'
  },
  {
    id: 6,
    name: 'Cà chua bi',
    price: 25000,
    unit: 'hộp 300g',
    stock: 34,
    category: 'Rau củ',
    rating: 4.3,
    imageUrl: 'https://dummyimage.com/800x600/0ea5e9/ffffff&text=Tomatoes',
    description: 'Cà chua bi tươi, dùng làm salad hoặc ăn kèm.'
  },
  {
    id: 7,
    name: 'Bông cải xanh',
    price: 39000,
    unit: 'bông',
    stock: 15,
    category: 'Rau củ',
    rating: 4.6,
    imageUrl: 'https://dummyimage.com/800x600/16a34a/ffffff&text=Broccoli',
    description: 'Bông cải xanh giàu chất xơ, phù hợp luộc, xào, hấp.'
  },
  {
    id: 8,
    name: 'Gạo thơm',
    price: 155000,
    unit: 'túi 5kg',
    stock: 7,
    category: 'Thực phẩm khô',
    rating: 4.2,
    imageUrl: 'https://dummyimage.com/800x600/64748b/ffffff&text=Rice',
    description: 'Gạo thơm dẻo, phù hợp bữa cơm gia đình.'
  }
];

