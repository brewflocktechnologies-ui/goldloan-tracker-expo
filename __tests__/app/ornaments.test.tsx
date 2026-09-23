import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Ornament } from '../../src/types';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
}));

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
    colors: {
      textSecondary: '#64748b',
      text: '#0f172a',
      background: '#ffffff',
    },
  }),
}));

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ isSuperAdmin: true }),
}));

jest.mock('../../src/context/ToastContext', () => ({
  useToast: () => ({
    success: jest.fn(),
    danger: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    showToast: jest.fn(),
  }),
}));

jest.mock('../../src/services/api', () => ({
  getDriveImageUrl: jest.fn(() => ''),
}));

const ORNAMENTS: Ornament[] = [
  {
    OrnamentId: 'ORN001',
    OrnamentName: 'Gold Necklace',
    OrnamentType: 'Traditional',
    OrnamentCategory: 'Necklace',
    Purity: '22karate (91.6%)',
    GrossWeight: 20,
    NetWeight: 18,
    StoneWeight: 2,
    Quantity: 1,
    BuyingPricePerGram: 5000,
    CurrentPricePerGram: 5500,
    BuyingCost: 90000,
    MarketValue: 99000,
    Status: 'Available',
    HallmarkNumber: 'HM1',
    MakerName: 'Maker A',
  } as Ornament,
  {
    OrnamentId: 'ORN002',
    OrnamentName: 'Bridal Bangles',
    OrnamentType: 'Bridal',
    OrnamentCategory: 'Bangles',
    Purity: '22karate (91.6%)',
    GrossWeight: 30,
    NetWeight: 28,
    StoneWeight: 0,
    Quantity: 2,
    BuyingPricePerGram: 5000,
    CurrentPricePerGram: 5500,
    BuyingCost: 140000,
    MarketValue: 154000,
    Status: 'Pledged',
    LoanNumber: 'LN-1001',
  } as Ornament,
  {
    OrnamentId: 'ORN003',
    OrnamentName: 'Antique Ring',
    OrnamentType: 'Antique',
    OrnamentCategory: 'Ring',
    Purity: '18karate (75%)',
    GrossWeight: 5,
    NetWeight: 4.5,
    StoneWeight: 0.2,
    Quantity: 1,
    BuyingPricePerGram: 4000,
    CurrentPricePerGram: 4200,
    BuyingCost: 18000,
    MarketValue: 18900,
    Status: 'Released',
  } as Ornament,
];

const mockStore = {
  ornaments: ORNAMENTS,
  users: [],
  loans: [],
  goldRates: { gold22k: { rate1g: 5500 } },
  syncFromBackend: jest.fn(),
  addOrnament: jest.fn(),
  updateOrnament: jest.fn(),
  deleteOrnament: jest.fn(),
};

jest.mock('../../src/services/store', () => ({
  useAppStore: () => mockStore,
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const OrnamentsScreen = require('../../src/app/(tabs)/ornaments').default;

describe('OrnamentsScreen (list view)', () => {
  it('renders every ornament with the correct total count', () => {
    render(<OrnamentsScreen />);
    expect(screen.getByText('03')).toBeTruthy();
    expect(screen.getByText('Gold Necklace')).toBeTruthy();
    expect(screen.getByText('Bridal Bangles')).toBeTruthy();
    expect(screen.getByText('Antique Ring')).toBeTruthy();
  });

  it('shows correct per-status counts on the filter pills', () => {
    render(<OrnamentsScreen />);
    expect(screen.getByText('All (3)')).toBeTruthy();
    expect(screen.getByText('Available (1)')).toBeTruthy();
    expect(screen.getByText('Pledged (1)')).toBeTruthy();
    expect(screen.getByText('Released (1)')).toBeTruthy();
  });

  it('filters the list down to a single status when a filter pill is pressed', () => {
    render(<OrnamentsScreen />);
    fireEvent.press(screen.getByText('Pledged (1)'));

    expect(screen.getByText('Bridal Bangles')).toBeTruthy();
    expect(screen.queryByText('Gold Necklace')).toBeNull();
    expect(screen.queryByText('Antique Ring')).toBeNull();
  });

  it('filters the list by the search query across name/type/category/hallmark/maker', () => {
    render(<OrnamentsScreen />);
    fireEvent.changeText(
      screen.getByPlaceholderText('Search by name, type, hallmark or ID...'),
      'antique'
    );

    expect(screen.getByText('Antique Ring')).toBeTruthy();
    expect(screen.queryByText('Gold Necklace')).toBeNull();
    expect(screen.queryByText('Bridal Bangles')).toBeNull();
  });

  it('shows the empty state when no ornament matches the search', () => {
    render(<OrnamentsScreen />);
    fireEvent.changeText(
      screen.getByPlaceholderText('Search by name, type, hallmark or ID...'),
      'no-such-ornament'
    );

    expect(screen.getByText('No ornaments found')).toBeTruthy();
  });

  it('defaults to Newest First order (highest OrnamentId first)', () => {
    render(<OrnamentsScreen />);
    const ids = screen.getAllByText(/^ORN\d{3}$/).map(node => node.props.children);
    expect(ids).toEqual(['ORN003', 'ORN002', 'ORN001']);
  });

  it('re-sorts the list to Oldest First via the sort options modal', () => {
    render(<OrnamentsScreen />);

    fireEvent.press(screen.getByLabelText('Sort and filter options'));
    expect(screen.getByText('Sort By')).toBeTruthy();

    fireEvent.press(screen.getByText('Oldest First'));

    const ids = screen.getAllByText(/^ORN\d{3}$/).map(node => node.props.children);
    expect(ids).toEqual(['ORN001', 'ORN002', 'ORN003']);
  });

  it('sorts by Weight (High-Low) via the sort options modal', () => {
    render(<OrnamentsScreen />);

    fireEvent.press(screen.getByLabelText('Sort and filter options'));
    fireEvent.press(screen.getByText('Weight (High-Low)'));

    // NetWeight: Bridal Bangles 28 > Gold Necklace 18 > Antique Ring 4.5
    const ids = screen.getAllByText(/^ORN\d{3}$/).map(node => node.props.children);
    expect(ids).toEqual(['ORN002', 'ORN001', 'ORN003']);
  });

  it('opens the details view when an ornament card is pressed', () => {
    render(<OrnamentsScreen />);
    fireEvent.press(screen.getByText('Gold Necklace'));

    expect(screen.getByText('Market Value')).toBeTruthy();
  });
});
