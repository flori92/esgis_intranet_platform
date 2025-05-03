import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

const Login: React.FC = () => {
  const [name, setName] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [showAdminField, setShowAdminField] = useState(false);
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const success = login(name, adminCode === "admin123"); // Simple admin code for demo
      if (success) {
        setName("");
        setAdminCode("");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ESGIS Exam Platform</h1>
          <p className="text-gray-600">Virtualization Cloud & Datacenter Advanced</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Entrez votre nom complet"
              required
            />
          </div>
          
          <div className="flex items-center">
            <input
              id="admin-toggle"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={showAdminField}
              onChange={() => setShowAdminField(!showAdminField)}
            />
            <label htmlFor="admin-toggle" className="ml-2 block text-sm text-gray-700">
              Je suis un administrateur
            </label>
          </div>
          
          {showAdminField && (
            <div>
              <label htmlFor="adminCode" className="block text-sm font-medium text-gray-700 mb-1">
                Code administrateur
              </label>
              <input
                type="password"
                id="adminCode"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Entrez le code administrateur"
              />
            </div>
          )}
          
          <div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Se connecter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;