#!/usr/bin/env node

/**
 * Script de correction automatique des erreurs TypeScript et des recommandations Sourcery
 * Ce script parcourt les fichiers source et applique des correctifs pour les erreurs courantes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Configuration pour ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const typesFile = path.join(srcDir, 'types/supabase.types.ts');
const authContextFile = path.join(srcDir, 'context/AuthContext.tsx');
const testsDir = path.join(srcDir, '__tests__');

console.log('🔧 Correction automatique des erreurs TypeScript et Sourcery...');

// 1. Mise à jour de l'interface Student pour inclure les propriétés manquantes
function updateStudentInterface() {
  console.log('📝 Mise à jour de l\'interface Student...');
  
  let typesContent = fs.readFileSync(typesFile, 'utf8');
  
  // Vérifie si les propriétés sont déjà ajoutées
  if (!typesContent.includes('graduation_year?:')) {
    // Recherche la définition de l'interface Student
    const studentInterfacePattern = /export interface Student {([^}]*)}/s;
    const studentInterfaceMatch = typesContent.match(studentInterfacePattern);
    
    if (studentInterfaceMatch) {
      const updatedInterface = `export interface Student {${studentInterfaceMatch[1]}
  // Propriétés étendues utilisées dans l'application
  graduation_year?: string | number | null;
  specialization?: string | null;
  status?: 'active' | 'suspended' | 'graduated' | 'expelled';
  student_number?: string;
  entry_year?: number;
  level?: string;
}`;
      
      typesContent = typesContent.replace(studentInterfacePattern, updatedInterface);
      fs.writeFileSync(typesFile, typesContent);
      console.log('✅ Interface Student mise à jour avec succès');
    } else {
      console.log('⚠️ Interface Student non trouvée dans le fichier types');
    }
  } else {
    console.log('ℹ️ L\'interface Student contient déjà les propriétés requises');
  }
}

// 2. Correction des blocs if sans accolades dans AuthContext.tsx
function fixAuthContextIfBlocks() {
  console.log('🔄 Correction des blocs if sans accolades...');
  
  let authContent = fs.readFileSync(authContextFile, 'utf8');
  
  // Patterns pour identifier les if sans accolades
  const patterns = [
    // if (condition) action;
    { pattern: /if\s*\(([^)]+)\)\s+([^{\n;]+);(?!\s*else)/g, 
      replacement: 'if ($1) {\n    $2;\n  }' },
    
    // if (condition) throw error;
    { pattern: /if\s*\(([^)]+)\)\s+throw\s+([^;]+);/g, 
      replacement: 'if ($1) {\n    throw $2;\n  }' },
      
    // if (error) professorError;
    { pattern: /if\s*\(([^)]+)\)\s+([^{;]+);/g, 
      replacement: 'if ($1) {\n    $2;\n  }' }
  ];
  
  for (const { pattern, replacement } of patterns) {
    authContent = authContent.replace(pattern, replacement);
  }
  
  fs.writeFileSync(authContextFile, authContent);
  console.log('✅ Blocs if corrigés dans AuthContext.tsx');
}

// 3. Correction des tests qui enveloppent inutilement les composants dans BrowserRouter et AuthProvider
function fixTestRenderCalls() {
  console.log('🧪 Correction des appels renderWithProviders dans les tests...');
  
  const testFiles = findFiles(testsDir, '.test.tsx');
  let filesFixed = 0;
  
  for (const file of testFiles) {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;
    
    // Pattern pour identifier les renderWithProviders avec BrowserRouter et AuthProvider
    const nestedProvidersPattern = /renderWithProviders\(\s*<BrowserRouter>\s*<AuthProvider>\s*<([A-Za-z0-9]+)\s*\/>\s*<\/AuthProvider>\s*<\/BrowserRouter>\s*\)/g;
    
    // Simplifie les appels en utilisant uniquement renderWithProviders
    content = content.replace(nestedProvidersPattern, 'renderWithProviders(<$1 />)');
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content);
      filesFixed++;
    }
  }
  
  console.log(`✅ ${filesFixed} fichiers de test corrigés`);
}

// Fonction utilitaire pour trouver récursivement des fichiers par extension
function findFiles(dir, extension) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(findFiles(filePath, extension));
    } else if (filePath.endsWith(extension)) {
      results.push(filePath);
    }
  }
  
  return results;
}

// 4. Mise à jour de l'interface Professor pour correspondre à la structure de la BD
function updateProfessorInterface() {
  console.log('📝 Mise à jour de l\'interface Professor...');
  
  let typesContent = fs.readFileSync(typesFile, 'utf8');
  
  // Vérifie si les propriétés sont déjà correctes
  if (!typesContent.includes('employee_number:')) {
    // Recherche la définition de l'interface Professor
    const professorInterfacePattern = /export interface Professor {([^}]*)}/s;
    const professorInterfaceMatch = typesContent.match(professorInterfacePattern);
    
    if (professorInterfaceMatch) {
      const updatedInterface = `export interface Professor {
  id?: number | string;
  profile_id: string;
  employee_number: string;  // Renommé de professor_id pour correspondre au schéma de la BD
  hire_date: string;
  specialties?: string[];   // Renommé de specialty et adapté en tableau
  status?: string;
  department_id?: number;   // Rendu optionnel car pas dans le schéma de base
  created_at?: string;
  updated_at?: string;
  profile?: Profile;
}`;
      
      typesContent = typesContent.replace(professorInterfacePattern, updatedInterface);
      fs.writeFileSync(typesFile, typesContent);
      console.log('✅ Interface Professor mise à jour avec succès');
    } else {
      console.log('⚠️ Interface Professor non trouvée dans le fichier types');
    }
  } else {
    console.log('ℹ️ L\'interface Professor contient déjà les propriétés correctes');
  }
}

// 5. Corriger les occurrences de professor_id dans AuthContext.tsx
function fixProfessorInsert() {
  console.log('🔄 Correction des insertions de professeurs dans AuthContext.tsx...');
  
  let authContent = fs.readFileSync(authContextFile, 'utf8');
  
  // Si professor_id est toujours utilisé, corrigeons-le
  if (authContent.includes('professor_id:')) {
    const professorInsertPattern = /professor_id:\s*`PROF-[^`]*`/g;
    authContent = authContent.replace(professorInsertPattern, 'employee_number: `PROF-${Date.now().toString().slice(-6)}`');
    
    // Si specialty est toujours utilisé, corrigeons-le aussi
    if (authContent.includes('specialty:')) {
      authContent = authContent.replace(/specialty:\s*['"]['"]/g, 'specialties: []');
    }
    
    fs.writeFileSync(authContextFile, authContent);
    console.log('✅ Insertions de professeurs corrigées dans AuthContext.tsx');
  } else {
    console.log('ℹ️ Les insertions de professeurs semblent déjà être correctes');
  }
}

// Exécution des corrections
try {
  updateStudentInterface();
  updateProfessorInterface();
  fixAuthContextIfBlocks();
  fixTestRenderCalls();
  fixProfessorInsert();
  
  console.log('\n✨ Corrections terminées avec succès!');
  console.log('📋 Vérifiez les modifications avec git diff avant de commit');
} catch (error) {
  console.error('❌ Erreur lors de l\'exécution des corrections:', error);
  process.exit(1);
}
