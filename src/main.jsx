import * as React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import App from './App';
import theme from './theme';
import './index.css';
import { checkSupabaseConnection } from './supabase';

/**
 * Fichier principal d'initialisation de l'application React
 * Monte l'application avec le thème MUI, le provider de notifications
 * et vérifie la connexion Supabase au démarrage.
 */

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
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3}>
          <App />
        </SnackbarProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}
