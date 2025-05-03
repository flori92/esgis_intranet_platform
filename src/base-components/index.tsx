// Composants de base réutilisables
import React from 'react';

// Composant Lucide pour les icônes
export interface LucideProps {
  icon: string;
  className?: string;
}

// Implémentation simple du composant Lucide qui affiche le nom de l'icône
// Ceci est une version de remplacement pour les tests et le build
export const Lucide: React.FC<LucideProps> = ({ icon, className = '' }) => {
  return <div className={`lucide lucide-${icon} ${className}`} data-icon={icon} />;
};

// Exporter d'autres composants de base au besoin
export default {
  Lucide
};
