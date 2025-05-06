import * as React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { checkSupabaseConnection } from './supabase';
import { SnackbarProvider } from 'notistack';

/**
 * Fichier principal d'initialisation de l'application React
 * Vérifie la connexion à Supabase et monte l'application dans le DOM
 */

// Vérifier la connexion à Supabase au démarrage
checkSupabaseConnection()
  .then(connected => {
    console.log('Connexion à Supabase:', connected ? 'Établie' : 'Échouée');
  })
  .catch(error => {
    console.error('Erreur lors de la vérification de la connexion à Supabase:', error);
  });

// Récupérer l'élément racine et rendre l'application
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.Fragment>
      <SnackbarProvider maxSnack={3}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SnackbarProvider>
    </React.Fragment>
  );
}
