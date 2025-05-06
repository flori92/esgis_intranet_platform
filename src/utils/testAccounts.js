/**
 * Comptes de test pour l'application
 * Ce fichier contient les informations des comptes de test pour les différents rôles
 * À utiliser uniquement en développement
 */

// Comptes de test pour chaque rôle
export const TEST_ACCOUNTS = {
  // Compte administrateur
  admin: {
    email: 'admin.esgis@mailinator.com',
    password: 'Admin123!',
    profile: {
      first_name: 'Admin',
      last_name: 'ESGIS',
      role: 'admin',
      phone: '+22990123456',
      avatar_url: null
    }
  },
  
  // Compte professeur
  professor: {
    email: 'prof.esgis@mailinator.com',
    password: 'Prof123!',
    profile: {
      first_name: 'Floraice',
      last_name: 'FAVI',
      role: 'professor',
      phone: '+22991234567',
      speciality: 'Cloud Computing',
      avatar_url: null
    }
  },
  
  // Compte étudiant
  student: {
    email: 'etudiant.esgis@mailinator.com',
    password: 'Etudiant123!',
    profile: {
      first_name: 'Marie',
      last_name: 'Koné',
      role: 'student',
      phone: '+22992345678',
      student_id: 'INF2025001',
      level: 'Licence 3',
      avatar_url: null
    }
  }
};

/**
 * Crée les comptes de test dans Supabase
 * @param {Object} supabase - Instance Supabase
 * @returns {Promise<Object>} Résultat de la création des comptes
 */
export const createTestAccounts = async (supabase) => {
  const results = {
    success: [],
    errors: []
  };

  // Vérifier si la table profiles est accessible
  try {
    const { data: profileColumns, error: schemaError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.error("Erreur lors de la récupération du schéma:", schemaError);
      
      // Vérifier si l'erreur est liée à une récursion infinie dans la politique
      if (schemaError.message && schemaError.message.includes('infinite recursion')) {
        console.warn("Détection d'une erreur de récursion infinie dans la politique de la table profiles.");
        console.warn("Les profils seront stockés uniquement dans les métadonnées utilisateur.");
      }
    } else {
      console.log("Colonnes disponibles dans profiles:", profileColumns.length > 0 ? Object.keys(profileColumns[0]) : []);
    }
  } catch (e) {
    console.error("Erreur lors de la vérification du schéma:", e);
  }

  // Créer les comptes avec un délai entre chaque création pour éviter les limitations de taux
  for (const [role, account] of Object.entries(TEST_ACCOUNTS)) {
    try {
      console.log(`Tentative de création du compte ${role}...`);
      
      // Vérifier si le compte existe déjà dans Supabase Auth
      const { data: existingAuth } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password
      });
      
      if (existingAuth && existingAuth.user) {
        console.log(`Le compte ${role} existe déjà dans Auth.`);
        results.success.push(`${role} (déjà existant)`);
        
        // Mettre à jour les métadonnées utilisateur pour s'assurer qu'elles sont correctes
        await supabase.auth.updateUser({
          data: {
            role: account.profile.role,
            first_name: account.profile.first_name,
            last_name: account.profile.last_name,
            ...account.profile
          }
        });
        
        console.log(`Métadonnées du compte ${role} mises à jour.`);
        
        // Attendre avant de passer au compte suivant
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      // Vérifier si le profil existe déjà dans la table profiles
      try {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', account.email)
          .maybeSingle();

        if (existingUser) {
          console.log(`Le profil ${role} existe déjà dans la table profiles.`);
          results.success.push(`${role} (profil existant)`);
          
          // Attendre avant de passer au compte suivant
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      } catch (profileError) {
        console.warn(`Impossible de vérifier si le profil ${role} existe déjà:`, profileError);
        // Continuer malgré l'erreur
      }

      // Créer le compte dans Auth
      console.log(`Création du compte ${role} dans Auth...`);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          data: {
            role: account.profile.role,
            first_name: account.profile.first_name,
            last_name: account.profile.last_name,
            ...account.profile
          }
        }
      });

      if (authError) {
        // Si l'erreur est due à une limitation de taux, attendre et réessayer
        if (authError.message && authError.message.includes('For security purposes, you can only request this after')) {
          console.warn(`Limitation de taux pour le compte ${role}. Attente de 31 secondes avant de réessayer...`);
          
          // Ajouter à la liste des erreurs mais continuer
          results.errors.push({ 
            role, 
            error: `Limitation de taux: ${authError.message}`,
            recoverable: true
          });
          
          // Attendre 31 secondes avant de passer au compte suivant
          await new Promise(resolve => setTimeout(resolve, 31000));
          continue;
        }
        
        // Si l'utilisateur existe déjà, essayer de se connecter
        if (authError.message && authError.message.includes('User already registered')) {
          console.log(`Le compte ${role} existe déjà. Tentative de connexion...`);
          
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: account.email,
            password: account.password
          });
          
          if (signInError) {
            throw signInError;
          }
          
          results.success.push(`${role} (déjà existant)`);
          
          // Attendre avant de passer au compte suivant
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        throw authError;
      }

      // Si nous arrivons ici, le compte a été créé avec succès
      const userId = authData.user.id;
      console.log(`Compte ${role} créé avec succès. ID: ${userId}`);

      // Tenter de créer le profil dans la table profiles
      try {
        const profileData = {
          id: userId,
          email: account.email,
          first_name: account.profile.first_name,
          last_name: account.profile.last_name,
          role: account.profile.role,
          phone: account.profile.phone,
          avatar_url: account.profile.avatar_url
        };
        
        if (role === 'professor' && account.profile.speciality) {
          profileData.speciality = account.profile.speciality;
        }
        
        if (role === 'student') {
          if (account.profile.student_id) {
            profileData.student_id = account.profile.student_id;
          }
          if (account.profile.level) {
            profileData.level = account.profile.level;
          }
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([profileData]);

        if (profileError) {
          console.warn(`Erreur lors de la création du profil ${role} dans la table profiles:`, profileError);
          console.log(`Les métadonnées utilisateur seront utilisées comme solution de secours.`);
        } else {
          console.log(`Profil ${role} créé avec succès dans la table profiles.`);
        }
      } catch (profileError) {
        console.warn(`Erreur lors de la création du profil ${role} dans la table profiles:`, profileError);
        console.log(`Les métadonnées utilisateur seront utilisées comme solution de secours.`);
      }

      results.success.push(role);
      
      // Attendre avant de passer au compte suivant pour éviter les limitations de taux
      console.log(`Attente de 5 secondes avant de traiter le compte suivant...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`Erreur lors de la création du compte ${role}:`, error);
      results.errors.push({ role, error: error.message });
      
      // Attendre avant de passer au compte suivant malgré l'erreur
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
};

export default {
  TEST_ACCOUNTS,
  createTestAccounts
};
