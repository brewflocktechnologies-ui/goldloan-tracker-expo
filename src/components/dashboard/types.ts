import { useRouter } from 'expo-router';
import { ThemeColors } from '../../constants/theme';
import { useToast } from '../../context/ToastContext';
import { useAppStore } from '../../services/store';
import { getStyles } from './dashboardStyles';

export type DashboardStyles = ReturnType<typeof getStyles>;
export type DashboardStore = ReturnType<typeof useAppStore>;
export type DashboardData = DashboardStore['dashboardData'];
export type GoldRates = DashboardStore['goldRates'];
export type DashboardRouter = ReturnType<typeof useRouter>;
export type DashboardToast = ReturnType<typeof useToast>;
export type DashboardColors = ThemeColors;
