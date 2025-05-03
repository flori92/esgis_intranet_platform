import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Lucide } from '../base-components';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { authState, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vérifier si l'utilisateur est déjà connecté
  React.useEffect(() => {
    if (authState.user) {
      // Rediriger selon le rôle
      if (authState.isAdmin) {
        navigate('/admin/dashboard');
      } else if (authState.isProfessor) {
        navigate('/professor/dashboard');
      } else if (authState.isStudent) {
        navigate('/student/dashboard');
      }
    }
  }, [authState, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        setError('Identifiants incorrects. Veuillez réessayer.');
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer plus tard.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    if (!email) {
      setError('Veuillez entrer votre email pour réinitialiser votre mot de passe');
      return;
    }
    
    try {
      // Rediriger vers la page de réinitialisation de mot de passe
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer plus tard.');
      console.error(err);
    }
  };

  return (
    <div className="login">
      <div className="container sm:px-10">
        <div className="block grid-cols-2 gap-4 xl:grid">
          {/* BEGIN: Login Info */}
          <div className="hidden min-h-screen flex-col xl:flex">
            <div className="my-auto">
              <img
                alt="Tailwind HTML Admin Template"
                className="w-1/2 -mt-16"
                src="/assets/images/logo.svg"
              />
              <div className="-mt-10 text-white">
                <div className="mt-4 text-4xl font-medium">
                  Connectez-vous à ESGIS Intranet
                </div>
                <div className="mt-4">
                  Plateforme interne de gestion des étudiants, des professeurs et des cours.
                </div>
              </div>
            </div>
          </div>
          {/* END: Login Info */}
          {/* BEGIN: Login Form */}
          <div className="flex h-screen py-5 my-10 xl:my-0 xl:h-auto xl:py-0">
            <div className="w-full px-5 py-8 mx-auto my-auto bg-white rounded-md shadow-md xl:ml-20 dark:bg-darkmode-600 xl:bg-transparent sm:px-8 xl:p-0 xl:shadow-none sm:w-3/4 lg:w-2/4 xl:w-auto">
              <h2 className="text-2xl font-bold text-center intro-x xl:text-3xl xl:text-left">
                Connexion
              </h2>
              <div className="mt-2 text-center intro-x text-slate-400 xl:hidden">
                Accédez à la plateforme de gestion de l'ESGIS
              </div>
              <div className="mt-8 intro-x">
                {error && (
                  <div className="px-4 py-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded">
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <input
                    type="text"
                    className="block px-4 py-3 intro-x min-w-full xl:min-w-[350px] border border-slate-300 rounded-md"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    type="password"
                    className="block px-4 py-3 mt-4 intro-x min-w-full xl:min-w-[350px] border border-slate-300 rounded-md"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="flex mt-4 text-xs intro-x text-slate-600 dark:text-slate-500 sm:text-sm">
                    <div className="flex items-center mr-auto">
                      <input
                        id="remember-me"
                        type="checkbox"
                        className="mr-2 border"
                      />
                      <label
                        className="cursor-pointer select-none"
                        htmlFor="remember-me"
                      >
                        Se souvenir de moi
                      </label>
                    </div>
                    <a 
                      href="#" 
                      onClick={handleForgotPassword}
                      className="ml-auto text-primary hover:underline"
                    >
                      Mot de passe oublié?
                    </a>
                  </div>
                  <div className="mt-5 text-center intro-x xl:mt-8 xl:text-left">
                    <button
                      type="submit"
                      className="w-full px-4 py-3 align-top btn btn-primary xl:w-32 xl:mr-3"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <Lucide icon="Loader" className="w-4 h-4 mr-2 animate-spin" />
                          Chargement...
                        </span>
                      ) : 'Se connecter'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          {/* END: Login Form */}
        </div>
      </div>
    </div>
  );
};

export default Login;