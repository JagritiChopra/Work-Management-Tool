import { APP_THEME } from './appTheme';

export const AUTH_THEME = {
  pageStyle: {
    background: APP_THEME.colors.authPage,
    fontFamily: APP_THEME.fonts.sans,
  },
  brandStyle: {
    fontFamily: APP_THEME.fonts.serif,
  },
  titleStyle: {
    fontFamily: APP_THEME.fonts.serif,
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: 300,
  },
  subtitleStyle: {
    color: APP_THEME.colors.muted,
  },
  fieldLabelStyle: {
    color: APP_THEME.colors.muted,
  },
  inputStyle: {
    background: '#0e0e0e',
    border: '1px solid rgba(62,73,68,0.3)',
    fontFamily: APP_THEME.fonts.sans,
  },
  focusBorder: 'rgba(143,246,208,0.4)',
  blurBorder: 'rgba(62,73,68,0.3)',
  primaryLinkStyle: {
    color: APP_THEME.colors.mintStrong,
  },
  goldButtonStyle: {
    background: 'linear-gradient(to right, #ffe16d, #e9c400)',
    color: '#221b00',
    boxShadow: '0 0 20px rgba(233,196,0,0.2)',
    fontFamily: APP_THEME.fonts.sans,
  },
  successStyle: {
    background: 'rgba(0,114,87,0.2)',
    color: APP_THEME.colors.mintStrong,
    border: '1px solid rgba(115,217,181,0.2)',
  },
  errorStyle: {
    background: 'rgba(147,0,10,0.3)',
    color: '#ffb4ab',
    border: '1px solid rgba(255,180,171,0.2)',
  },
};
