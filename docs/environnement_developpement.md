# Environnement de Développement - Intranet ESGIS

Ce document décrit la configuration de l'environnement de développement pour l'intranet étudiant ESGIS, incluant les outils, les dépendances et les étapes de mise en place.

## 1. Architecture technique

### 1.1 Stack technologique

- **Frontend** :
  - React 18.x avec TypeScript
  - Vite comme bundler/dev server
  - Material UI pour les composants d'interface
  - React Router pour la navigation
  - React Query pour la gestion des requêtes API
  - Context API pour la gestion d'état globale
  - Formik + Yup pour la gestion des formulaires et validation

- **Backend** :
  - Supabase (PostgreSQL)
  - Supabase Auth pour l'authentification
  - Supabase Storage pour le stockage de fichiers
  - Supabase Functions pour la logique métier serverless
  - Supabase Realtime pour les fonctionnalités temps réel

- **Outils de développement** :
  - Git pour le versioning
  - GitHub pour l'hébergement du code
  - ESLint + Prettier pour le linting et le formatage
  - Jest + React Testing Library pour les tests
  - GitHub Actions pour l'intégration continue

### 1.2 Structure du projet

```
intranet-esgis/
├── public/                  # Ressources statiques
│   ├── favicon.ico
│   ├── logo.svg
│   └── assets/
├── src/
│   ├── components/          # Composants React réutilisables
│   │   ├── common/          # Composants génériques
│   │   ├── layout/          # Composants de mise en page
│   │   ├── admin/           # Composants spécifiques à l'admin
│   │   ├── professor/       # Composants spécifiques aux professeurs
│   │   └── student/         # Composants spécifiques aux étudiants
│   ├── context/             # Contextes React
│   │   ├── AuthContext.tsx
│   │   └── ...
│   ├── hooks/               # Hooks personnalisés
│   ├── pages/               # Pages de l'application
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── professor/
│   │   └── student/
│   ├── services/            # Services (API, etc.)
│   │   ├── supabase.ts      # Client Supabase
│   │   └── ...
│   ├── types/               # Types TypeScript
│   ├── utils/               # Fonctions utilitaires
│   ├── App.tsx              # Composant racine
│   ├── main.tsx             # Point d'entrée
│   └── routes.tsx           # Configuration des routes
├── .env                     # Variables d'environnement (dev)
├── .env.production          # Variables d'environnement (prod)
├── .eslintrc.js             # Configuration ESLint
├── .prettierrc              # Configuration Prettier
├── tsconfig.json            # Configuration TypeScript
├── vite.config.ts           # Configuration Vite
├── package.json             # Dépendances et scripts
└── README.md                # Documentation
```

## 2. Prérequis

### 2.1 Outils à installer

- **Node.js** (v18.x ou supérieur)
- **npm** (v8.x ou supérieur) ou **yarn** (v1.22.x ou supérieur)
- **Git** (v2.x ou supérieur)
- **VS Code** (recommandé) avec les extensions :
  - ESLint
  - Prettier
  - TypeScript
  - Supabase
  - GitLens
  - Material Icon Theme

### 2.2 Compte Supabase

- Créer un compte sur [Supabase](https://supabase.com/)
- Créer un nouveau projet pour l'intranet ESGIS
- Noter l'URL et la clé API (anon key) du projet

## 3. Installation et configuration

### 3.1 Création du projet

```bash
# Cloner le dépôt GitHub (si existant)
git clone https://github.com/esgis/intranet.git
cd intranet

# OU créer un nouveau projet avec Vite
npm create vite@latest intranet-esgis -- --template react-ts
cd intranet-esgis
```

### 3.2 Installation des dépendances

```bash
# Installation des dépendances principales
npm install react-router-dom @tanstack/react-query @supabase/supabase-js

# Installation des dépendances UI
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled

# Installation des dépendances pour les formulaires
npm install formik yup

# Installation des dépendances pour les graphiques et visualisations
npm install recharts

# Installation des dépendances pour les dates
npm install date-fns

# Installation des dépendances de développement
npm install --save-dev eslint prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react eslint-plugin-react-hooks eslint-config-prettier eslint-plugin-prettier
```

### 3.3 Configuration de l'environnement

Créer un fichier `.env` à la racine du projet :

```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon
VITE_APP_NAME=Intranet ESGIS
```

### 3.4 Configuration de Supabase

1. **Créer les tables** dans Supabase selon le schéma défini dans le document de modélisation de la base de données.

2. **Configurer l'authentification** :
   - Activer l'authentification par email/mot de passe
   - Configurer les redirections après connexion/déconnexion
   - Personnaliser les emails de confirmation

3. **Configurer le stockage** :
   - Créer les buckets pour les différents types de fichiers (documents, profils, etc.)
   - Définir les politiques d'accès

4. **Configurer les politiques RLS** pour chaque table selon les spécifications du document de modélisation.

## 4. Mise en place du client Supabase

Créer un fichier `src/services/supabase.ts` :

```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined in .env file');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'intranet-esgis'
    }
  }
});

export default supabase;
```

## 5. Mise en place du contexte d'authentification

Créer un fichier `src/context/AuthContext.tsx` :

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import supabase from '../services/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any | null;
  isLoading: boolean;
  isAdmin: boolean;
  isProfessor: boolean;
  isStudent: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isProfessor, setIsProfessor] = useState<boolean>(false);
  const [isStudent, setIsStudent] = useState<boolean>(false);

  useEffect(() => {
    // Récupérer la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Charger le profil utilisateur quand l'utilisateur change
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Erreur lors du chargement du profil:', error);
        } else if (data) {
          setProfile(data);
          setIsAdmin(data.role === 'admin');
          setIsProfessor(data.role === 'professor');
          setIsStudent(data.role === 'student');
        }
        setIsLoading(false);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setIsProfessor(false);
        setIsStudent(false);
      }
    };

    loadUserProfile();
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    profile,
    isLoading,
    isAdmin,
    isProfessor,
    isStudent,
    signIn,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## 6. Configuration des routes

Créer un fichier `src/routes.tsx` :

```typescript
import React from 'react';
import { Navigate, RouteObject } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Pages communes
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import NotFoundPage from './pages/NotFoundPage';

// Pages étudiant
import StudentDashboardPage from './pages/student/DashboardPage';
import StudentSchedulePage from './pages/student/SchedulePage';
import StudentCoursesPage from './pages/student/CoursesPage';
import StudentGradesPage from './pages/student/GradesPage';
import StudentExamsPage from './pages/student/ExamsPage';
import StudentDocumentsPage from './pages/student/DocumentsPage';
import StudentInternshipsPage from './pages/student/InternshipsPage';

// Pages professeur
import ProfessorDashboardPage from './pages/professor/DashboardPage';
import ProfessorSchedulePage from './pages/professor/SchedulePage';
import ProfessorCoursesPage from './pages/professor/CoursesPage';
import ProfessorGradesPage from './pages/professor/GradesPage';
import ProfessorExamsPage from './pages/professor/ExamsPage';
import ProfessorStudentsPage from './pages/professor/StudentsPage';
import ProfessorDocumentsPage from './pages/professor/DocumentsPage';

// Pages admin
import AdminDashboardPage from './pages/admin/DashboardPage';
import AdminUsersPage from './pages/admin/UsersPage';
import AdminDepartmentsPage from './pages/admin/DepartmentsPage';
import AdminCoursesPage from './pages/admin/CoursesPage';
import AdminSchedulePage from './pages/admin/SchedulePage';
import AdminDocumentsPage from './pages/admin/DocumentsPage';
import AdminInternshipsPage from './pages/admin/InternshipsPage';
import AdminPaymentsPage from './pages/admin/PaymentsPage';
import AdminReportsPage from './pages/admin/ReportsPage';

// Composant de protection des routes
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredRole?: 'admin' | 'professor' | 'student';
}> = ({ children, requiredRole }) => {
  const { user, isLoading, isAdmin, isProfessor, isStudent } = useAuth();

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredRole === 'professor' && !(isProfessor || isAdmin)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredRole === 'student' && !(isStudent || isAdmin)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Routes publiques
const publicRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: '', element: <Navigate to="/login" replace /> }
    ]
  }
];

// Routes étudiant
const studentRoutes: RouteObject[] = [
  {
    path: '/student',
    element: (
      <ProtectedRoute requiredRole="student">
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <StudentDashboardPage /> },
      { path: 'schedule', element: <StudentSchedulePage /> },
      { path: 'courses', element: <StudentCoursesPage /> },
      { path: 'grades', element: <StudentGradesPage /> },
      { path: 'exams', element: <StudentExamsPage /> },
      { path: 'documents', element: <StudentDocumentsPage /> },
      { path: 'internships', element: <StudentInternshipsPage /> },
      { path: '', element: <Navigate to="/student/dashboard" replace /> }
    ]
  }
];

// Routes professeur
const professorRoutes: RouteObject[] = [
  {
    path: '/professor',
    element: (
      <ProtectedRoute requiredRole="professor">
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <ProfessorDashboardPage /> },
      { path: 'schedule', element: <ProfessorSchedulePage /> },
      { path: 'courses', element: <ProfessorCoursesPage /> },
      { path: 'grades', element: <ProfessorGradesPage /> },
      { path: 'exams', element: <ProfessorExamsPage /> },
      { path: 'students', element: <ProfessorStudentsPage /> },
      { path: 'documents', element: <ProfessorDocumentsPage /> },
      { path: '', element: <Navigate to="/professor/dashboard" replace /> }
    ]
  }
];

// Routes admin
const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: (
      <ProtectedRoute requiredRole="admin">
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <AdminDashboardPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'departments', element: <AdminDepartmentsPage /> },
      { path: 'courses', element: <AdminCoursesPage /> },
      { path: 'schedule', element: <AdminSchedulePage /> },
      { path: 'documents', element: <AdminDocumentsPage /> },
      { path: 'internships', element: <AdminInternshipsPage /> },
      { path: 'payments', element: <AdminPaymentsPage /> },
      { path: 'reports', element: <AdminReportsPage /> },
      { path: '', element: <Navigate to="/admin/dashboard" replace /> }
    ]
  }
];

// Routes communes
const commonRoutes: RouteObject[] = [
  { path: '/unauthorized', element: <div>Non autorisé</div> },
  { path: '*', element: <NotFoundPage /> }
];

// Redirection en fonction du rôle
const RoleRedirect: React.FC = () => {
  const { isAdmin, isProfessor, isStudent } = useAuth();

  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (isProfessor) {
    return <Navigate to="/professor/dashboard" replace />;
  }

  if (isStudent) {
    return <Navigate to="/student/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

// Route de redirection
const redirectRoute: RouteObject = {
  path: '/dashboard',
  element: <RoleRedirect />
};

// Toutes les routes
const routes: RouteObject[] = [
  ...publicRoutes,
  ...studentRoutes,
  ...professorRoutes,
  ...adminRoutes,
  redirectRoute,
  ...commonRoutes
];

export default routes;
```

## 7. Configuration de l'application principale

Modifier le fichier `src/App.tsx` :

```tsx
import React from 'react';
import { BrowserRouter, useRoutes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import routes from './routes';

// Création du client React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// Création du thème Material UI
const theme = createTheme({
  palette: {
    primary: {
      main: '#C4161C', // Rouge ESGIS
    },
    secondary: {
      main: '#1976D2', // Bleu
    },
    background: {
      default: '#F5F5F5',
    },
  },
  typography: {
    fontFamily: '"Open Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

// Composant de routage
const AppRoutes: React.FC = () => {
  const element = useRoutes(routes);
  return element;
};

// Composant principal
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
```

## 8. Scripts de développement

Ajouter les scripts suivants dans le fichier `package.json` :

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "test": "jest",
    "prepare": "husky install"
  }
}
```

## 9. Démarrage du développement

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

## 10. Déploiement

### 10.1 Préparation au déploiement

```bash
# Construire l'application pour la production
npm run build
```

### 10.2 Options de déploiement

- **Vercel** : Intégration simple avec GitHub
- **Netlify** : Intégration simple avec GitHub
- **GitHub Pages** : Déploiement manuel ou via GitHub Actions
- **Serveur dédié** : Déploiement via SSH ou FTP

### 10.3 Configuration pour Vercel

Créer un fichier `vercel.json` à la racine du projet :

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## 11. Bonnes pratiques de développement

### 11.1 Conventions de nommage

- **Composants** : PascalCase (ex: `UserProfile.tsx`)
- **Hooks** : camelCase avec préfixe "use" (ex: `useAuth.ts`)
- **Contextes** : PascalCase avec suffixe "Context" (ex: `AuthContext.tsx`)
- **Services** : camelCase (ex: `supabase.ts`)
- **Utilitaires** : camelCase (ex: `formatDate.ts`)

### 11.2 Structure des composants

```tsx
// Exemple de structure de composant
import React from 'react';
import { Typography, Box } from '@mui/material';

interface UserProfileProps {
  userId: string;
  showDetails?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, showDetails = false }) => {
  // Logique du composant

  return (
    <Box>
      <Typography variant="h4">Profil utilisateur</Typography>
      {/* Contenu du composant */}
    </Box>
  );
};

export default UserProfile;
```

### 11.3 Gestion des erreurs

```tsx
// Exemple de gestion d'erreur avec React Query
import { useQuery } from '@tanstack/react-query';
import { Alert, CircularProgress } from '@mui/material';
import { fetchUserProfile } from '../services/userService';

export const UserProfileContainer: React.FC<{ userId: string }> = ({ userId }) => {
  const { data, isLoading, error } = useQuery(['userProfile', userId], () => fetchUserProfile(userId));

  if (isLoading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">Erreur lors du chargement du profil: {(error as Error).message}</Alert>;
  }

  return <UserProfile user={data} />;
};
```

---

Document préparé le 3 mai 2025
