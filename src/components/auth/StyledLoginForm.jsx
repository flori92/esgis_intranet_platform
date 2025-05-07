import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { LOGO_ESGIS_PATH } from '../../utils/assetUtils';

/**
 * Formulaire de connexion stylisé pour l'intranet ESGIS
 * @returns {JSX.Element} Composant React
 */
const StyledLoginForm = ({ onTestAccountsClick }) => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  
  // États pour le formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Gestion de la soumission du formulaire
   * @param {React.FormEvent} e - Événement de soumission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        throw error;
      }
      
      // La redirection sera gérée par l'effet useEffect dans la page de connexion
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError('Identifiants incorrects. Veuillez vérifier votre email et mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledWrapper>
      <form className="form" onSubmit={handleSubmit}>
        <div className="logo-container">
          <img 
            src={LOGO_ESGIS_PATH()} 
            alt="Logo ESGIS" 
            className="logo"
          />
        </div>
        <p id="heading">Connexion à l'Intranet ESGIS</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="field">
          <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="currentColor" viewBox="0 0 16 16">
            <path d="M13.106 7.222c0-2.967-2.249-5.032-5.482-5.032-3.35 0-5.646 2.318-5.646 5.702 0 3.493 2.235 5.708 5.762 5.708.862 0 1.689-.123 2.304-.335v-.862c-.43.199-1.354.328-2.29.328-2.926 0-4.813-1.88-4.813-4.798 0-2.844 1.921-4.881 4.594-4.881 2.735 0 4.608 1.688 4.608 4.156 0 1.682-.554 2.769-1.416 2.769-.492 0-.772-.28-.772-.76V5.206H8.923v.834h-.11c-.266-.595-.881-.964-1.6-.964-1.4 0-2.378 1.162-2.378 2.823 0 1.737.957 2.906 2.379 2.906.8 0 1.415-.39 1.709-1.087h.11c.081.67.703 1.148 1.503 1.148 1.572 0 2.57-1.415 2.57-3.643zm-7.177.704c0-1.197.54-1.907 1.456-1.907.93 0 1.524.738 1.524 1.907S8.308 9.84 7.371 9.84c-.895 0-1.442-.725-1.442-1.914z" />
          </svg>
          <input 
            autoComplete="off" 
            placeholder="Email" 
            className="input-field" 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
          </svg>
          <input 
            placeholder="Mot de passe" 
            className="input-field" 
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="btn">
          <button 
            type="submit" 
            className="button1" 
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </div>
        <button 
          type="button" 
          className="button3"
          onClick={() => navigate('/reset-password')}
        >
          Mot de passe oublié
        </button>
        
        <button 
          type="button" 
          className="button-test-accounts"
          onClick={onTestAccountsClick}
        >
          Comptes de test
        </button>
      </form>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-left: 2em;
    padding-right: 2em;
    padding-bottom: 1.5em;
    background-color: #ffffff;
    border-radius: 15px;
    transition: .4s ease-in-out;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    min-width: 320px;
    max-width: 400px;
    margin: 0 auto;
  }

  .form:hover {
    transform: scale(1.02);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }
  
  .logo-container {
    display: flex;
    justify-content: center;
    margin-top: 1.5em;
  }
  
  .logo {
    height: 80px;
    max-width: 100%;
  }

  #heading {
    text-align: center;
    margin: 1em 0;
    color: #003366;
    font-size: 1.3em;
    font-weight: bold;
  }
  
  .error-message {
    background-color: #ffebee;
    color: #c62828;
    padding: 0.8em;
    border-radius: 8px;
    font-size: 0.9em;
    text-align: center;
    margin-bottom: 1em;
  }

  .field {
    display: flex;
    align-items: center;
    gap: 0.5em;
    border-radius: 8px;
    padding: 0.8em;
    border: 1px solid #e0e0e0;
    outline: none;
    color: #333;
    background-color: #f5f5f5;
    transition: all 0.3s;
  }
  
  .field:focus-within {
    border-color: #003366;
    background-color: #fff;
    box-shadow: 0 0 0 2px rgba(0, 51, 102, 0.2);
  }

  .input-icon {
    height: 1.3em;
    width: 1.3em;
    fill: #003366;
  }

  .input-field {
    background: none;
    border: none;
    outline: none;
    width: 100%;
    color: #333;
    font-size: 1em;
  }
  
  .input-field::placeholder {
    color: #999;
  }

  .form .btn {
    display: flex;
    justify-content: center;
    margin-top: 1.5em;
  }

  .button1 {
    width: 100%;
    padding: 0.8em;
    border-radius: 8px;
    border: none;
    outline: none;
    transition: .3s ease-in-out;
    background-color: #003366;
    color: white;
    font-weight: bold;
    cursor: pointer;
    font-size: 1em;
  }

  .button1:hover {
    background-color: #002244;
  }
  
  .button1:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  .button3 {
    margin-top: 0.5em;
    padding: 0.6em;
    border-radius: 8px;
    border: none;
    outline: none;
    transition: .3s ease-in-out;
    background-color: transparent;
    color: #003366;
    cursor: pointer;
  }

  .button3:hover {
    background-color: rgba(0, 51, 102, 0.1);
    text-decoration: underline;
  }
  
  .button-test-accounts {
    margin-top: 1em;
    padding: 0.6em;
    border-radius: 8px;
    border: 1px dashed #003366;
    outline: none;
    transition: .3s ease-in-out;
    background-color: rgba(0, 51, 102, 0.05);
    color: #003366;
    cursor: pointer;
  }
  
  .button-test-accounts:hover {
    background-color: rgba(0, 51, 102, 0.1);
  }
`;

export default StyledLoginForm;
