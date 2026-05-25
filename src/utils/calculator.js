// src/utils/calculator.js

export const BUY_FEE_RATE = 0.0025;   // 0.25%
export const SELL_FEE_RATE = 0.0025;  // 0.25%
export const SELL_TAX_RATE = 0.001;   // 0.1%

/**
 * Tính chi phí giao dịch MUA
 * @param {number} quantity - Số lượng cổ phiếu
 * @param {number} price - Giá mua (VND/cp)
 * @returns {{ grossAmount, fee, totalCost }}
 */
export function calcBuy(quantity, price) {
  const grossAmount = quantity * price;
  const fee = Math.round(grossAmount * BUY_FEE_RATE);
  const totalCost = grossAmount + fee;
  return { grossAmount, fee, totalCost };
}

/**
 * Tính chi phí giao dịch BÁN
 * @param {number} quantity - Số lượng cổ phiếu
 * @param {number} price - Giá bán (VND/cp)
 * @returns {{ grossAmount, fee, tax, netReceived }}
 */
export function calcSell(quantity, price) {
  const grossAmount = quantity * price;
  const fee = Math.round(grossAmount * SELL_FEE_RATE);
  const tax = Math.round(grossAmount * SELL_TAX_RATE);
  const netReceived = grossAmount - fee - tax;
  return { grossAmount, fee, tax, netReceived };
}

/**
 * Tính danh mục (portfolio) từ danh sách giao dịch
 * @param {Array} transactions
 * @returns {Object} portfolio: { [symbol]: { quantity, avgCost, totalCost } }
 */
export function calcPortfolio(transactions) {
  const portfolio = {};

  // Process chronologically (oldest first)
  const sorted = [...transactions].sort((a, b) => a.createdAt - b.createdAt);

  for (const tx of sorted) {
    const sym = tx.symbol.toUpperCase();
    if (!portfolio[sym]) {
      portfolio[sym] = { quantity: 0, totalCost: 0, avgCost: 0 };
    }

    if (tx.type === 'BUY') {
      const prev = portfolio[sym];
      const newTotalQty = prev.quantity + tx.quantity;
      const newTotalCost = prev.totalCost + tx.totalCost;
      portfolio[sym] = {
        quantity: newTotalQty,
        totalCost: newTotalCost,
        avgCost: newTotalQty > 0 ? Math.round(newTotalCost / newTotalQty) : 0,
      };
    } else if (tx.type === 'SELL') {
      const prev = portfolio[sym];
      const soldCost = prev.avgCost * tx.quantity;
      const newQty = Math.max(0, prev.quantity - tx.quantity);
      const newTotalCost = Math.max(0, prev.totalCost - soldCost);
      portfolio[sym] = {
        quantity: newQty,
        totalCost: newTotalCost,
        avgCost: newQty > 0 ? Math.round(newTotalCost / newQty) : 0,
      };
    }
  }

  // Remove fully sold positions
  return Object.fromEntries(
    Object.entries(portfolio).filter(([, v]) => v.quantity > 0)
  );
}

/**
 * Tính lãi/lỗ đã thực hiện (realized PnL) từ giao dịch bán
 */
export function calcRealizedPnL(transactions) {
  const sorted = [...transactions].sort((a, b) => a.createdAt - b.createdAt);
  const holding = {}; // track avg cost per symbol
  let totalRealizedPnL = 0;

  for (const tx of sorted) {
    const sym = tx.symbol.toUpperCase();
    if (!holding[sym]) {
      holding[sym] = { quantity: 0, totalCost: 0, avgCost: 0 };
    }

    if (tx.type === 'BUY') {
      const prev = holding[sym];
      const newQty = prev.quantity + tx.quantity;
      const newCost = prev.totalCost + tx.totalCost;
      holding[sym] = {
        quantity: newQty,
        totalCost: newCost,
        avgCost: newQty > 0 ? newCost / newQty : 0,
      };
    } else if (tx.type === 'SELL') {
      const prev = holding[sym];
      const costBasis = prev.avgCost * tx.quantity;
      const pnl = tx.netReceived - costBasis;
      totalRealizedPnL += pnl;

      const newQty = Math.max(0, prev.quantity - tx.quantity);
      const newCost = Math.max(0, prev.totalCost - costBasis);
      holding[sym] = {
        quantity: newQty,
        totalCost: newCost,
        avgCost: newQty > 0 ? newCost / newQty : 0,
      };
    }
  }

  return Math.round(totalRealizedPnL);
}
