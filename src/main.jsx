import * as React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import theme from './theme';
import './index.css';
import { checkSupabaseConnection } from './supabase';

/**
 * Fichier principal d'initialisation de l'application React
 * Monte l'application avec le thème MUI, le provider de notifications
 * et vérifie la connexion Supabase au démarrage.
 */

// Créer une instance de QueryClient pour React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes par défaut
      gcTime: 1000 * 60 * 30,    // 30 minutes de cache
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Vérifier la connexion à Supabase au démarrage
checkSupabaseConnection()
  .then(connected => {
    console.log('Connexion Supabase:', connected ? '✅ Établie' : '❌ Échouée');
  })
  .catch(error => {
    console.error('Erreur vérification Supabase:', error);
  });

// Récupérer l'élément racine et rendre l'application
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <SnackbarProvider maxSnack={3}>
            <App />
          </SnackbarProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}
