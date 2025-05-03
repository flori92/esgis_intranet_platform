import React from 'react';
import { useParams } from 'react-router-dom';

/**
 * Page permettant à un étudiant de passer un examen
 * Note: Implémentation temporaire pour résoudre les erreurs de build
 */
const TakeExamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Passer l'examen</h1>
      <p className="mb-4">ID de l'examen: {id}</p>
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
        <p className="text-yellow-700">
          Cette page est en cours de développement. Veuillez revenir ultérieurement.
        </p>
      </div>
    </div>
  );
};

export default TakeExamPage;
