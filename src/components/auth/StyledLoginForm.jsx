import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { LOGO_ESGIS_PATH } from '../../utils/assetUtils';
import { supabase } from '../../supabase';
import { toast } from 'react-hot-toast';

/**
 * Formulaire de connexion et d'activation stylisé pour l'intranet ESGIS
 */
const StyledLoginForm = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  
  // Onglet actif : 'login' ou 'signup'
  const [mode, setMode] = useState('login');
  
  // États communs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Connexion classique
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      toast.success('Connexion réussie');
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError('Identifiants incorrects. Veuillez vérifier votre email et mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Activation de compte (Sign Up restreint)
   */
  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Vérifier si l'email est autorisé (pré-enregistré par l'admin)
      const { data: isAllowed, error: rpcError } = await supabase.rpc('is_email_allowed', { p_email: email });
      
      if (rpcError) throw rpcError;

      if (!isAllowed) {
        setError('Cet email n\'est pas autorisé à s\'inscrire. Veuillez contacter l\'administration.');
        setLoading(false);
        return;
      }

      // 2. Procéder à l'inscription réelle dans Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (signUpError) throw signUpError;

      if (data?.user?.identities?.length === 0) {
        setError('Ce compte est déjà activé. Essayez de vous connecter.');
      } else {
        toast.success('Compte activé ! Vérifiez vos emails pour confirmer votre adresse.');
        setMode('login');
      }
    } catch (err) {
      console.error('Erreur inscription:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'activation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledWrapper>
      <div className="form-container">
        <div className="logo-container">
          <img src={LOGO_ESGIS_PATH()} alt="Logo ESGIS" className="logo" />
        </div>
        
        <div className="tab-container">
          <button 
            className={`tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(null); }}
          >
            Connexion
          </button>
          <button 
            className={`tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(null); }}
          >
            Activer mon compte
          </button>
        </div>

        <p id="heading">{mode === 'login' ? 'Accès Personnel' : 'Première connexion'}</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form className="form" onSubmit={mode === 'login' ? handleLogin : handleSignUp}>
          <div className="field">
            <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="currentColor" viewBox="0 0 16 16">
              <path d="M13.106 7.222c0-2.967-2.249-5.032-5.482-5.032-3.35 0-5.646 2.318-5.646 5.702 0 3.493 2.235 5.708 5.762 5.708.862 0 1.689-.123 2.304-.335v-.862c-.43.199-1.354.328-2.29.328-2.926 0-4.813-1.88-4.813-4.798 0-2.844 1.921-4.881 4.594-4.881 2.735 0 4.608 1.688 4.608 4.156 0 1.682-.554 2.769-1.416 2.769-.492 0-.772-.28-.772-.76V5.206H8.923v.834h-.11c-.266-.595-.881-.964-1.6-.964-1.4 0-2.378 1.162-2.378 2.823 0 1.737.957 2.906 2.379 2.906.8 0 1.415-.39 1.709-1.087h.11c.081.67.703 1.148 1.503 1.148 1.572 0 2.57-1.415 2.57-3.643zm-7.177.704c0-1.197.54-1.907 1.456-1.907.93 0 1.524.738 1.524 1.907S8.308 9.84 7.371 9.84c-.895 0-1.442-.725-1.442-1.914z" />
            </svg>
            <input 
              autoComplete="email" 
              placeholder="Adresse email académique" 
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
              autoComplete={mode === 'login' ? "current-password" : "new-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {mode === 'signup' && (
            <div className="field">
              <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
              </svg>
              <input 
                placeholder="Confirmer le mot de passe" 
                className="input-field" 
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          <div className="btn-container">
            <button 
              type="submit" 
              className="button1" 
              disabled={loading}
            >
              {loading ? (mode === 'login' ? 'Connexion...' : 'Activation...') : (mode === 'login' ? 'Se connecter' : 'Créer mon mot de passe')}
            </button>
          </div>

          {mode === 'login' && (
            <button 
              type="button" 
              className="button3"
              onClick={() => navigate('/reset-password')}
            >
              Mot de passe oublié ?
            </button>
          )}
        </form>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .form-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 2.5em;
    background-color: #ffffff;
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
    border: 1px solid #f0f0f0;
  }

  .logo-container {
    display: flex;
    justify-content: center;
    margin-bottom: 1em;
  }
  
  .logo {
    height: 70px;
    object-fit: contain;
  }

  .tab-container {
    display: flex;
    background-color: #f5f5f5;
    padding: 5px;
    border-radius: 12px;
    margin-bottom: 10px;
  }

  .tab {
    flex: 1;
    padding: 10px;
    border: none;
    background: none;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9em;
    color: #666;
    border-radius: 8px;
    transition: all 0.3s;
  }

  .tab.active {
    background-color: #ffffff;
    color: #003366;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  #heading {
    text-align: center;
    color: #003366;
    font-size: 1.4em;
    font-weight: 800;
    margin-bottom: 5px;
  }
  
  .error-message {
    background-color: #fff1f0;
    color: #cf1322;
    padding: 10px;
    border-radius: 8px;
    font-size: 0.85em;
    text-align: center;
    border: 1px solid #ffa39e;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .field {
    display: flex;
    align-items: center;
    gap: 10px;
    border-radius: 10px;
    padding: 12px 15px;
    border: 1px solid #e8e8e8;
    background-color: #fcfcfc;
    transition: all 0.3s;
  }
  
  .field:focus-within {
    border-color: #003366;
    background-color: #fff;
    box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.1);
  }

  .input-icon {
    color: #003366;
    flex-shrink: 0;
  }

  .input-field {
    background: none;
    border: none;
    outline: none;
    width: 100%;
    color: #333;
    font-size: 0.95em;
  }

  .btn-container {
    margin-top: 10px;
  }

  .button1 {
    width: 100%;
    padding: 14px;
    border-radius: 10px;
    border: none;
    background-color: #003366;
    color: white;
    font-weight: 700;
    cursor: pointer;
    font-size: 1em;
    transition: transform 0.2s, background-color 0.2s;
  }

  .button1:hover {
    background-color: #002244;
    transform: translateY(-1px);
  }

  .button1:active {
    transform: translateY(0);
  }
  
  .button1:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }

  .button3 {
    background: none;
    border: none;
    color: #003366;
    font-size: 0.85em;
    cursor: pointer;
    text-align: center;
    margin-top: 5px;
    font-weight: 500;
  }

  .button3:hover {
    text-decoration: underline;
  }
`;

export default StyledLoginForm;
