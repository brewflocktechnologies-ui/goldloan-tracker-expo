import { DashboardData } from '../../types';
import { calculateUserBankUtilization } from './calculations';
import { state } from './state';

export function getDashboardData(): DashboardData {
    const activeLoans = state.loans.filter(l => l.LoanStatus === 'Active');
    const closedLoans = state.loans.filter(l => l.LoanStatus === 'Closed');
    const totalLoanAmount = activeLoans.reduce((sum, l) => sum + (Number(l.LoanAmount) || 0), 0);

    const activeUsers = state.users.filter(u => u.Status === 'Active');
    const activeBankAccounts = state.bankAccounts.filter(b => b.Status === 'Active');
    const allOrnaments = state.ornaments.filter(o => o.Status !== 'Deleted');
    const pledgedOrnaments = allOrnaments.filter(o => o.Status === 'Pledged');

    const totalEligibleLoanAmount = activeBankAccounts.reduce((sum, b) => sum + (Number(b.MaxLoanAmount) || 0), 0);
    const totalAvailableLoanAmount = activeBankAccounts.reduce((sum, b) => {
      const maxL = Number(b.MaxLoanAmount) || 0;
      const util = calculateUserBankUtilization(b.UserId, b.BankAccountId);
      return sum + Math.max(0, maxL - util);
    }, 0);

    let totalGoldWeight = 0;
    let totalBuyingGoldValue = 0;
    allOrnaments.forEach(o => {
      const metal = Number(o.MetalWeight);
      const net = Number(o.NetWeight);
      const gross = Number(o.GrossWeight) || 0;
      const weight = !isNaN(metal) && metal > 0 ? metal : (!isNaN(net) && net > 0 ? net : gross);
      totalGoldWeight += weight;

      const buyPrice = Number(o.BuyingPricePerGram) || 0;
      const buyCost = Number(o.BuyingCost) || (weight * buyPrice);
      totalBuyingGoldValue += buyCost;
    });

    const pledgedGrams = pledgedOrnaments.reduce((sum, o) => {
      const gross = Number(o.GrossWeight) || 0;
      const net = Number(o.NetWeight) || 0;
      const metal = Number(o.MetalWeight) || 0;
      return sum + (metal > 0 ? metal : (net > 0 ? net : gross));
    }, 0);

    const recentTransactions = [...state.payments]
      .sort((a, b) => new Date(b.PaymentDate || b.CreatedDate || '').getTime() - new Date(a.PaymentDate || a.CreatedDate || '').getTime())
      .slice(0, 5);

    return {
      totalUsers: activeUsers.length,
      totalBankAccounts: activeBankAccounts.length,
      totalOrnaments: allOrnaments.length,
      pledgedOrnamentsCount: pledgedOrnaments.length,
      pledgedGrams: Math.round(pledgedGrams * 100) / 100,
      activeLoans: activeLoans.length,
      closedLoans: closedLoans.length,
      totalLoanAmount,
      totalEligibleLoanAmount,
      totalAvailableLoanAmount,
      totalGoldWeight: Math.round(totalGoldWeight * 100) / 100,
      totalBuyingGoldValue: Math.round(totalBuyingGoldValue),
      recentTransactions,
    };
}
