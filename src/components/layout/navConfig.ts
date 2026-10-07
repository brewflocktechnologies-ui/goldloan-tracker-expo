export interface NavItem {
  name: string;
  route: string;
  title: string;
  shortTitle: string;
  icon: string;
  activeIcon: string;
  iconSet?: 'Ionicons' | 'MaterialCommunityIcons';
}

export const NAV_ITEMS: NavItem[] = [
  {
    name: 'index',
    route: '/(tabs)',
    title: 'Dashboard',
    shortTitle: 'Dashboard',
    icon: 'pie-chart-outline',
    activeIcon: 'pie-chart',
  },
  {
    name: 'users',
    route: '/(tabs)/users',
    title: 'Users',
    shortTitle: 'Users',
    icon: 'account-group-outline',
    activeIcon: 'account-group-outline',
    iconSet: 'MaterialCommunityIcons',
  },
  {
    name: 'bank-accounts',
    route: '/(tabs)/bank-accounts',
    title: 'Bank Accounts',
    shortTitle: 'Banks',
    icon: 'business-outline',
    activeIcon: 'business',
  },
  {
    name: 'ornaments',
    route: '/(tabs)/ornaments',
    title: 'Ornaments',
    shortTitle: 'Ornaments',
    icon: 'ring',
    activeIcon: 'ring',
    iconSet: 'MaterialCommunityIcons',
  },
  {
    name: 'loans',
    route: '/(tabs)/loans',
    title: 'Active Loans',
    shortTitle: 'Loans',
    icon: 'cash-outline',
    activeIcon: 'cash',
  },
  {
    name: 'closure',
    route: '/(tabs)/closure',
    title: 'Settlements',
    shortTitle: 'Closure',
    icon: 'checkmark-done-circle-outline',
    activeIcon: 'checkmark-done-circle',
  },
  {
    name: 'menu',
    route: '/(tabs)/menu',
    title: 'Menu & Settings',
    shortTitle: 'Menu',
    icon: 'menu-outline',
    activeIcon: 'menu',
  },
];

export const MOBILE_NAV_ITEMS: NavItem[] = [
  {
    name: 'index',
    route: '/(tabs)',
    title: 'Dashboard',
    shortTitle: 'Home',
    icon: 'home-outline',
    activeIcon: 'home',
  },
  {
    name: 'users',
    route: '/(tabs)/users',
    title: 'Users',
    shortTitle: 'Users',
    icon: 'people-outline',
    activeIcon: 'people',
  },
  {
    name: 'ornaments',
    route: '/(tabs)/ornaments',
    title: 'Ornaments',
    shortTitle: 'Ornaments',
    icon: 'ring',
    activeIcon: 'ring',
    iconSet: 'MaterialCommunityIcons',
  },
  {
    name: 'loans',
    route: '/(tabs)/loans',
    title: 'Active Loans',
    shortTitle: 'Loans',
    icon: 'document-text-outline',
    activeIcon: 'document-text',
  },
  {
    name: 'menu',
    route: '/(tabs)/menu',
    title: 'Menu',
    shortTitle: 'Menu',
    icon: 'menu-outline',
    activeIcon: 'menu',
  },
];

export const TAB_METADATA: Record<string, { title: string; subtitle: string }> = {
  index: {
    title: 'Financial Overview',
    subtitle: 'Real-time portfolio valuation & gold vault status',
  },
  users: {
    title: 'Customers & Borrowers',
    subtitle: 'KYC profiles, pledged assets & credit tracking',
  },
  'bank-accounts': {
    title: 'Lending Bank Accounts',
    subtitle: 'Manage credit limits, lenders & utilized balances',
  },
  ornaments: {
    title: 'Ornaments',
    subtitle: 'Physical inventory, karat purity & ornament details',
  },
  loans: {
    title: 'Active Loans Portfolio',
    subtitle: 'Disbursements, interest tenure & repayments',
  },
  closure: {
    title: 'Loan Closure & Settlements',
    subtitle: 'Settle active loans & release vault collateral',
  },
  menu: {
    title: 'Menu',
    subtitle: 'Quick access to all features',
  },
  'admin-users': {
    title: 'Staff & Admin Accounts',
    subtitle: 'Configure staff roles, read-only permissions & access credentials',
  },
};
