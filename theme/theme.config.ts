import { createTheme } from '@mui/material/styles';
import { tokens } from './tokens';
export const theme = createTheme({
  palette: {
    primary: { main: tokens.colors.blue },
    secondary: { main: tokens.colors.navy },
    background: { default: tokens.colors.background, paper: '#fff' },
    text: { primary: tokens.colors.text, secondary: tokens.colors.muted },
    success: { main: tokens.colors.success },
  },
  typography: {
    fontFamily: tokens.font,
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: tokens.radius.small },
  spacing: tokens.spacing,
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTextField: {
      defaultProps: { fullWidth: true, variant: 'outlined', size: 'small' },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
});
