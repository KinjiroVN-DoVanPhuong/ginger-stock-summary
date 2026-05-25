// src/utils/sampleData.js
// Dữ liệu mẫu để hiển thị khi chưa cấu hình Firebase

const now = Date.now();
const DAY = 86_400_000;

export const SAMPLE_CASH_BALANCE = 91_155_100;

export const SAMPLE_CASH_HISTORY = [
  {
    id: 'sc1',
    type: 'IN',
    amount: 100_000_000,
    note: 'Nạp vốn ban đầu',
    createdAt: now - 30 * DAY,
  },
  {
    id: 'sc2',
    type: 'IN',
    amount: 50_000_000,
    note: 'Nạp thêm tháng này',
    createdAt: now - 15 * DAY,
  },
];

export const SAMPLE_TRANSACTIONS = [
  {
    id: 'st1',
    type: 'BUY',
    symbol: 'VNM',
    quantity: 500,
    price: 75_000,
    grossAmount: 37_500_000,
    fee: 93_750,
    totalCost: 37_593_750,
    note: 'Giá hợp lý, mua trung hạn',
    createdAt: now - 25 * DAY,
  },
  {
    id: 'st2',
    type: 'BUY',
    symbol: 'HPG',
    quantity: 1_000,
    price: 24_000,
    grossAmount: 24_000_000,
    fee: 60_000,
    totalCost: 24_060_000,
    note: '',
    createdAt: now - 20 * DAY,
  },
  {
    id: 'st3',
    type: 'SELL',
    symbol: 'VNM',
    quantity: 200,
    price: 82_000,
    grossAmount: 16_400_000,
    fee: 41_000,
    tax: 16_400,
    netReceived: 16_342_600,
    note: 'Chốt lời một phần',
    createdAt: now - 10 * DAY,
  },
  {
    id: 'st4',
    type: 'BUY',
    symbol: 'VIC',
    quantity: 300,
    price: 45_000,
    grossAmount: 13_500_000,
    fee: 33_750,
    totalCost: 13_533_750,
    note: '',
    createdAt: now - 5 * DAY,
  },
];
