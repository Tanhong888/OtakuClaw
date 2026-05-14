import live2dCoreUrl from './live2d/core/live2dcubismcore.js?url';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App.jsx';
import {
  THEME_MODE_DARK,
  ThemeModeProvider,
  useThemeMode,
} from './theme/ThemeModeContext.jsx';
import './styles.css';
import './styles-responsive.css';

async function ensureLive2dCoreScript() {
  if (typeof window === 'undefined' || window.Live2DCubismCore) {
    return;
  }

  const existingScript = document.querySelector('script[data-live2d-core="true"]');
  if (existingScript) {
    await new Promise((resolve, reject) => {
      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', reject, { once: true });
    });
    return;
  }

  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = live2dCoreUrl;
    script.async = false;
    script.dataset.live2dCore = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Live2D Cubism Core.'));
    document.head.appendChild(script);
  });
}

function ThemedApp() {
  const { resolvedThemeMode } = useThemeMode();

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme-mode', resolvedThemeMode);

    return () => {
      document.documentElement.removeAttribute('data-theme-mode');
    };
  }, [resolvedThemeMode]);

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: resolvedThemeMode,
          primary: {
            main: resolvedThemeMode === THEME_MODE_DARK ? '#60a5fa' : '#C23A30',
            light: '#D4544A',
            dark: '#A03028',
            contrastText: '#FFFFFF',
          },
          secondary: {
            main: resolvedThemeMode === THEME_MODE_DARK ? '#7dd3fc' : '#2B5F75',
            light: '#4A7A8E',
            dark: '#1E4555',
          },
          background: {
            default: 'transparent',
            paper: resolvedThemeMode === THEME_MODE_DARK ? '#101826' : '#F7F3EB',
          },
          text: {
            primary: '#2C2419',
            secondary: '#5A5248',
          },
        },
        shape: {
          borderRadius: 4,
        },
        typography: {
          fontFamily: "'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', sans-serif",
          h1: { fontFamily: "'Noto Serif SC', 'Source Han Serif SC', 'SimSun', serif" },
          h2: { fontFamily: "'Noto Serif SC', 'Source Han Serif SC', 'SimSun', serif" },
          h3: { fontFamily: "'Noto Serif SC', 'Source Han Serif SC', 'SimSun', serif" },
          h4: { fontFamily: "'Noto Serif SC', 'Source Han Serif SC', 'SimSun', serif" },
          h5: { fontFamily: "'Noto Serif SC', 'Source Han Serif SC', 'SimSun', serif" },
          h6: { fontFamily: "'Noto Serif SC', 'Source Han Serif SC', 'SimSun', serif" },
          subtitle1: { fontFamily: "'Noto Serif SC', 'Source Han Serif SC', 'SimSun', serif" },
          button: {
            fontFamily: "'Noto Serif SC', 'Source Han Serif SC', 'SimSun', serif",
            letterSpacing: '0.06em',
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              html: {
                backgroundColor: 'transparent',
              },
              body: {
                backgroundColor: 'transparent',
              },
              '#root': {
                backgroundColor: 'transparent',
              },
            },
          },
        },
      }),
    [resolvedThemeMode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

void ensureLive2dCoreScript()
  .then(() => {
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <ThemeModeProvider>
          <ThemedApp />
        </ThemeModeProvider>
      </React.StrictMode>,
    );
  })
  .catch((error) => {
    console.error(error);
  });
