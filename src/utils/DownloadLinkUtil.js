/**
 * Utilitaire pour déclencher le téléchargement d'un fichier via un lien dynamique
 * @param {Object} params
 * @param {string} params.url - URL du fichier à télécharger
 * @param {string} params.filename - Nom du fichier à sauvegarder
 * @param {number} [params.cleanupDelay=1000] - Délai en ms avant suppression du lien du DOM
 */
export function triggerDownload({ url, filename, cleanupDelay = 1000 }) {
  if (!url || !filename) {
    throw new Error('URL et nom de fichier requis pour le téléchargement');
  }
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
  }, cleanupDelay);
}
