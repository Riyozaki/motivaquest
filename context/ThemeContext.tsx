import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

interface ThemeContextType {
  toggleColorMode: () => void;
  mode: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType>({
  toggleColorMode: () => {},
  mode: 'dark', // Default to dark for RPG style
});

export const useColorMode = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
      mode,
    }),
    [mode],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'dark', // Force dark base
          primary: {
            main: '#8b5cf6', // Violet
            light: '#a78bfa',
            dark: '#7c3aed',
          },
          secondary: {
            main: '#f59e0b', // Amber/Gold
            light: '#fbbf24',
            dark: '#d97706',
          },
          background: {
            default: '#0f172a', // Slate 900
            paper: '#1e293b', // Slate 800
          },
          text: {
            primary: '#f1f5f9',
            secondary: '#94a3b8',
          },
        },
        typography: {
          fontFamily: '"Exo 2", "Roboto", sans-serif',
          h1: { fontFamily: 'Cinzel, serif', fontWeight: 700 },
          h2: { fontFamily: 'Cinzel, serif', fontWeight: 700 },
          h3: { fontFamily: 'Cinzel, serif', fontWeight: 600 },
          h4: { fontFamily: 'Cinzel, serif', fontWeight: 600 },
          button: { textTransform: 'none', fontWeight: 600, fontFamily: '"Exo 2", sans-serif' },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: '0.75rem',
                padding: '0.6rem 1.5rem',
                backgroundImage: 'linear-gradient(to right, #7c3aed, #6d28d9)',
                color: 'white',
                boxShadow: '0 4px 14px 0 rgba(124, 58, 237, 0.39)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(124, 58, 237, 0.23)',
                },
              },
              outlined: {
                backgroundImage: 'none',
                borderColor: '#7c3aed',
                color: '#a78bfa',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                backgroundColor: 'rgba(30, 41, 59, 0.6)',
                backdropFilter: 'blur(12px)',
                borderRadius: '1rem',
                border: '1px solid rgba(148, 163, 184, 0.1)',
              },
            },
          },
        },
      }),
    [mode],
  );

  return (
    <ThemeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};