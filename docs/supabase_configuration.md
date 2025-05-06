# Configuration de Supabase pour les comptes de test

## Désactiver la vérification d'email pour les tests

Pour faciliter les tests de l'application sans avoir à gérer la vérification des emails, vous pouvez configurer Supabase pour désactiver cette vérification en environnement de développement.

### Étapes à suivre

1. Connectez-vous à votre [dashboard Supabase](https://app.supabase.io)
2. Sélectionnez votre projet
3. Allez dans **Authentication** > **Providers** dans le menu de gauche
4. Dans la section **Email**, désactivez l'option **Confirm email** (décochez la case)
5. Cliquez sur **Save** pour appliquer les changements

![Configuration de l'authentification Supabase](https://i.imgur.com/JYW3Gih.png)

> **Note de sécurité** : Cette configuration est recommandée uniquement pour les environnements de développement et de test. Pour la production, la vérification d'email devrait être activée.

## Créer des comptes de test via l'interface Supabase

Vous pouvez également créer manuellement des comptes de test directement depuis l'interface Supabase :

1. Allez dans **Authentication** > **Users** dans le menu de gauche
2. Cliquez sur **+ Add User**
3. Remplissez les informations (email, mot de passe)
4. Cochez l'option **Auto-confirm user** pour éviter la vérification d'email
5. Cliquez sur **Create User**

Ces comptes créés manuellement seront immédiatement utilisables dans l'application sans nécessiter de confirmation d'email.

## Utiliser l'API Admin via une fonction serverless

Si vous souhaitez automatiser la création de comptes de test tout en conservant la vérification d'email pour les utilisateurs normaux, vous pouvez créer une fonction serverless Supabase :

1. Allez dans **Database** > **Functions** dans le menu de gauche
2. Créez une nouvelle fonction qui utilisera l'API Admin pour créer des utilisateurs avec l'email déjà confirmé
3. Appelez cette fonction depuis votre application uniquement pour les comptes de test

Exemple de code pour une fonction serverless Supabase :

```sql
create or replace function create_test_account(email text, password text, role text)
returns json as $$
declare
  new_user_id uuid;
  result json;
begin
  -- Créer l'utilisateur avec l'email déjà confirmé
  insert into auth.users (email, email_confirmed_at, raw_user_meta_data)
  values (email, now(), json_build_object('role', role))
  returning id into new_user_id;
  
  -- Définir le mot de passe
  update auth.users
  set encrypted_password = crypt(password, gen_salt('bf'))
  where id = new_user_id;
  
  -- Retourner le résultat
  select json_build_object('id', new_user_id, 'email', email, 'role', role) into result;
  return result;
end;
$$ language plpgsql security definer;
```

Cette fonction peut ensuite être appelée depuis votre application via l'API Supabase.
