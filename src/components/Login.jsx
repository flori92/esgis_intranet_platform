import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Lucide } from '../base-components';
import { useNavigate } from 'react-router-dom';

/**
 * Composant de connexion à l'application
 * Permet aux utilisateurs de se connecter avec leur email et mot de passe
 * @returns {JSX.Element} Formulaire de connexion
 */
const Login = () => {
  const navigate = useNavigate();
  const { login, authState } = useAuth();

  /**
   * @typedef {Object} LoginFormData
   * @property {string} email - Adresse email de l'utilisateur
   * @property {string} password - Mot de passe de l'utilisateur
   */

  /**
   * @typedef {Object} LoginErrors
   * @property {string} [email] - Message d'erreur pour l'email
   * @property {string} [password] - Message d'erreur pour le mot de passe
   */

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
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

  /**
   * Valide le formulaire de connexion
   * @returns {boolean} true si le formulaire est valide, false sinon
   */
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Veuillez entrer une adresse email valide';
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Gère la soumission du formulaire
   * @param {React.FormEvent} e - Événement de soumission du formulaire
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await login(formData.email, formData.password);
      toast.success('Connexion réussie');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gère les changements dans les champs du formulaire
   * @param {React.ChangeEvent} e - Événement de changement
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Gère la demande de réinitialisation du mot de passe
   * @param {React.MouseEvent} e - Événement de clic
   */
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      setError('Veuillez entrer votre email pour réinitialiser votre mot de passe');
      return;
    }
    
    try {
      // Rediriger vers la page de réinitialisation de mot de passe
      navigate(`/reset-password?email=${encodeURIComponent(formData.email)}`);
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
                  <div className="mb-4">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Email"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                  <div className="mb-4">
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mot de passe"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                  </div>
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
                      className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? 'Connexion en cours...' : 'Se connecter'}
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
