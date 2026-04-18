import { alpha } from '@mui/material/styles';

export const DASHBOARD_CARD_RADIUS = 2;

const BASE_SHADOW = '0 10px 28px rgba(15, 23, 42, 0.06)';

const hoverShadow = (accent) => `0 18px 36px ${alpha(accent, 0.12)}`;

export const getDashboardPanelSx = (accent = '#003366') => ({
  borderRadius: DASHBOARD_CARD_RADIUS,
  border: `1px solid ${alpha(accent, 0.18)}`,
  bgcolor: '#FFFFFF',
  boxShadow: BASE_SHADOW
});

export const getDashboardInteractiveCardSx = (accent = '#003366') => ({
  ...getDashboardPanelSx(accent),
  transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, background-color 0.25s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: hoverShadow(accent),
    borderColor: alpha(accent, 0.42),
    bgcolor: alpha(accent, 0.025)
  }
});

export const getDashboardIconSx = (accent = '#003366') => ({
  width: 44,
  height: 44,
  borderRadius: DASHBOARD_CARD_RADIUS,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  bgcolor: alpha(accent, 0.1),
  color: accent,
  border: `1px solid ${alpha(accent, 0.16)}`
});

export const getDashboardInsetSx = (accent = '#003366') => ({
  borderRadius: DASHBOARD_CARD_RADIUS,
  border: `1px solid ${alpha(accent, 0.16)}`,
  bgcolor: alpha(accent, 0.04)
});
