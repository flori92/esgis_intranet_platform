/**
 * Utilitaires pour la génération de certificats de scolarité
 * @module utils/certificateUtils
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../supabase';

/**
 * Génère un certificat de scolarité pour un étudiant
 * @param {Object} studentData - Données de l'étudiant
 * @param {string} studentData.id - ID de l'étudiant
 * @param {string} studentData.firstName - Prénom de l'étudiant
 * @param {string} studentData.lastName - Nom de l'étudiant
 * @param {string} studentData.email - Email de l'étudiant
 * @param {string} studentData.studentId - Numéro d'étudiant
 * @param {Object} studentData.metadata - Métadonnées de l'étudiant
 * @param {string} studentData.metadata.program - Programme d'études
 * @param {string} studentData.metadata.academicYear - Année académique
 * @param {string} studentData.metadata.level - Niveau d'études
 * @returns {Promise<Uint8Array>} Données binaires du PDF généré
 */
export const generateCertificate = async (studentData) => {
  try {
    // Création d'un nouveau document PDF
    const pdfDoc = await PDFDocument.create();
    
    // Ajout d'une page au format A4
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 en points
    
    // Chargement des polices
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    
    // Dimensions de la page
    const { width, height } = page.getSize();
    
    // Date du jour formatée en français
    const currentDate = format(new Date(), "dd MMMM yyyy", { locale: fr });
    
    // Année académique (par défaut l'année en cours si non spécifiée)
    const academicYear = studentData.metadata?.academicYear || `${new Date().getFullYear()-1}-${new Date().getFullYear()}`;
    
    // Programme d'études (par défaut "Informatique" si non spécifié)
    const program = studentData.metadata?.program || "Informatique";
    
    // Niveau d'études (par défaut "Licence" si non spécifié)
    const level = studentData.metadata?.level || "Licence";
    
    // Numéro d'étudiant
    const studentId = studentData.studentId || studentData.id.substring(0, 8).toUpperCase();
    
    // Entête du document
    page.drawText("ÉCOLE SUPÉRIEURE DE GESTION ET D'INFORMATIQUE SYSTÈMES", {
      x: 50,
      y: height - 50,
      size: 16,
      font: timesBoldFont,
      color: rgb(0, 0, 0.7)
    });
    
    // Logo (à remplacer par une image réelle)
    page.drawRectangle({
      x: width - 150,
      y: height - 100,
      width: 100,
      height: 50,
      color: rgb(0, 0, 0.7),
      opacity: 0.1
    });
    
    // Titre du document
    page.drawText("CERTIFICAT DE SCOLARITÉ", {
      x: 150,
      y: height - 150,
      size: 24,
      font: timesBoldFont,
      color: rgb(0, 0, 0.7)
    });
    
    // Année académique
    page.drawText(`Année académique : ${academicYear}`, {
      x: 150,
      y: height - 180,
      size: 12,
      font: timesRomanFont
    });
    
    // Corps du certificat
    page.drawText("Je soussigné(e), Directeur de l'École Supérieure de Gestion et d'Informatique Systèmes,", {
      x: 50,
      y: height - 250,
      size: 12,
      font: timesRomanFont
    });
    
    page.drawText("certifie que :", {
      x: 50,
      y: height - 270,
      size: 12,
      font: timesRomanFont
    });
    
    // Informations de l'étudiant
    page.drawText(`M./Mme ${studentData.firstName} ${studentData.lastName.toUpperCase()}`, {
      x: 100,
      y: height - 310,
      size: 14,
      font: timesBoldFont
    });
    
    page.drawText(`Numéro d'étudiant : ${studentId}`, {
      x: 100,
      y: height - 330,
      size: 12,
      font: timesRomanFont
    });
    
    page.drawText(`est régulièrement inscrit(e) en ${level} ${program}`, {
      x: 100,
      y: height - 350,
      size: 12,
      font: timesRomanFont
    });
    
    page.drawText("pour l'année académique en cours.", {
      x: 100,
      y: height - 370,
      size: 12,
      font: timesRomanFont
    });
    
    // Mention légale
    page.drawText("Ce certificat est délivré pour servir et valoir ce que de droit.", {
      x: 50,
      y: height - 430,
      size: 12,
      font: timesRomanFont
    });
    
    // Date et signature
    page.drawText(`Fait à Lomé, le ${currentDate}`, {
      x: 350,
      y: height - 500,
      size: 12,
      font: timesRomanFont
    });
    
    page.drawText("Le Directeur", {
      x: 400,
      y: height - 550,
      size: 12,
      font: timesBoldFont
    });
    
    // Signature (simulée par un rectangle)
    page.drawRectangle({
      x: 380,
      y: height - 600,
      width: 100,
      height: 30,
      color: rgb(0, 0, 0.7),
      opacity: 0.1
    });
    
    // Pied de page
    page.drawText("ESGIS - École Supérieure de Gestion et d'Informatique Systèmes", {
      x: 150,
      y: 50,
      size: 10,
      font: timesRomanFont
    });
    
    page.drawText("Tél: +228 22 22 22 22 - Email: contact@esgis.org - www.esgis.org", {
      x: 150,
      y: 35,
      size: 10,
      font: timesRomanFont
    });
    
    // Génération et retour direct du PDF
    return await pdfDoc.save();
  } catch (error) {
    console.error("Erreur lors de la génération du certificat:", error);
    throw new Error("Impossible de générer le certificat de scolarité");
  }
};

/**
 * Récupère les données complètes d'un étudiant
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Données de l'étudiant
 */
export const getStudentData = async (userId) => {
  try {
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) {
      throw userError;
    }
    
    // Si les données sont incomplètes, on récupère les métadonnées de l'utilisateur
    if (!userData.program || !userData.level) {
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw authError;
      }
      
      // Fusion des données et retour
      return {
        ...userData,
        metadata: authUser.user?.user_metadata || {}
      };
    }
    
    // Retour direct des données avec la structure metadata
    return {
      ...userData,
      metadata: {
        program: userData.program,
        level: userData.level,
        academicYear: userData.academicYear
      }
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des données de l'étudiant:", error);
    throw new Error("Impossible de récupérer les données de l'étudiant");
  }
};
