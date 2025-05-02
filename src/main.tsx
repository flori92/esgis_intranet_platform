import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { checkSupabaseConnection } from './supabase';

// Vérifier la connexion à Supabase au démarrage
checkSupabaseConnection()
  .then(connected => {
    console.log(`Statut de connexion Supabase: ${connected ? 'Connecté' : 'Non connecté'}`);
  })
  .catch(err => {
    console.error('Erreur lors de la vérification de la connexion Supabase:', err);
  });

// Récupérer l'élément racine et rendre l'application
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <>
      <AuthProvider>
        <App />
      </AuthProvider>
    </>
  );
}