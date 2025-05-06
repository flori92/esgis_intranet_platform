import { supabase } from '../supabase';
import { TEST_ACCOUNTS } from './testAccounts';

/**
 * Récupère les informations des comptes de test
 * @returns {Array} Informations des comptes de test
 */
export const getTestAccountsInfo = () => {
  return Object.entries(TEST_ACCOUNTS).map(([role, account]) => ({
    role,
    email: account.email,
    password: account.password,
    fullName: `${account.profile.first_name} ${account.profile.last_name}`
  }));
};

/**
 * Initialise les comptes de test dans Supabase
 * @returns {Promise<Object>} Résultat de l'initialisation
 */
export const initializeTestAccounts = async () => {
  const results = {
    success: [],
    errors: []
  };

  // Vérifier d'abord la structure de la table profiles
  try {
    console.log("Vérification de la structure de la table profiles...");
    
    // Récupérer un profil existant pour voir les colonnes disponibles
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error("Erreur lors de la récupération des profils:", profilesError);
      results.errors.push({role: 'schema', error: profilesError.message});
    } else {
      // Afficher les colonnes disponibles
      const availableColumns = existingProfiles.length > 0 
        ? Object.keys(existingProfiles[0]) 
        : [];
      
      console.log("Colonnes disponibles dans la table profiles:", availableColumns);
      
      // Créer chaque compte de test
      for (const [role, account] of Object.entries(TEST_ACCOUNTS)) {
        try {
          // Vérifier si l'utilisateur existe déjà par email
          const { data: authUsers, error: authError } = await supabase.auth
            .signInWithPassword({
              email: account.email,
              password: account.password,
            });
          
          if (!authError && authUsers) {
            console.log(`Le compte ${role} existe déjà dans auth.`);
            results.success.push(`${role} (déjà existant)`);
            continue;
          }
          
          // Créer l'utilisateur dans auth
          const { data: newUser, error: signUpError } = await supabase.auth.signUp({
            email: account.email,
            password: account.password,
            options: {
              data: {
                role: account.profile.role
              }
            }
          });
          
          if (signUpError) {
            throw signUpError;
          }
          
          const userId = newUser.user.id;
          
          // Créer un profil minimal avec seulement id, email et role
          // Ces champs devraient exister dans toutes les implémentations de Supabase
          const profileData = {
            id: userId,
            email: account.email,
            role: account.profile.role
          };
          
          // Ajouter d'autres champs seulement s'ils existent dans la table
          if (availableColumns.includes('first_name')) {
            profileData.first_name = account.profile.first_name;
          }
          
          if (availableColumns.includes('last_name')) {
            profileData.last_name = account.profile.last_name;
          }
          
          if (availableColumns.includes('phone')) {
            profileData.phone = account.profile.phone;
          }
          
          if (availableColumns.includes('avatar_url')) {
            profileData.avatar_url = account.profile.avatar_url;
          }
          
          // Champs spécifiques au rôle
          if (role === 'professor' && availableColumns.includes('speciality')) {
            profileData.speciality = account.profile.speciality;
          }
          
          if (role === 'student') {
            if (availableColumns.includes('student_id')) {
              profileData.student_id = account.profile.student_id;
            }
            if (availableColumns.includes('level')) {
              profileData.level = account.profile.level;
            }
          }
          
          // Insérer le profil
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([profileData]);
          
          if (insertError) {
            throw insertError;
          }
          
          console.log(`Compte ${role} créé avec succès.`);
          results.success.push(role);
        } catch (error) {
          console.error(`Erreur lors de la création du compte ${role}:`, error);
          results.errors.push({role, error: error.message});
        }
      }
    }
  } catch (error) {
    console.error("Erreur globale:", error);
    results.errors.push({role: 'global', error: error.message});
  }
  
  return results;
};

export default initializeTestAccounts;
