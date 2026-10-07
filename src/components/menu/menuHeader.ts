import { MenuView } from './menuTypes';

export const getMenuHeaderMeta = (currentView: MenuView, goldRatesUpdatedAt?: string | number | Date | null) => {
  switch (currentView) {
    case 'reports':
      return {
        title: 'Reports',
        subtitle: 'As of today',
      };
    case 'gold-rates':
      const timeStr = goldRatesUpdatedAt
        ? new Date(goldRatesUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '12:00';
      return {
        title: 'Gold rates',
        subtitle: `Last update today at ${timeStr}`,
      };
    case 'settings':
      return {
        title: 'Settings',
        subtitle: undefined,
      };
    case 'help':
      return {
        title: 'Help & Support',
        subtitle: undefined,
      };
    case 'about':
      return {
        title: 'About',
        subtitle: undefined,
      };
    case 'main':
    default:
      return {
        title: 'Menu',
        subtitle: 'Quick access to all features',
      };
  }
};
