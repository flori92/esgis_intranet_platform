# Configuration de GitHub Pages pour le projet ESGIS Intranet

## Étapes à suivre pour activer GitHub Pages

1. Accédez à votre dépôt GitHub à l'adresse : https://github.com/flori92/esgis_intranet_platform

2. Cliquez sur l'onglet "Settings" (Paramètres) en haut du dépôt.

3. Dans le menu latéral gauche, faites défiler jusqu'à la section "Code and automation" et cliquez sur "Pages".

4. Dans la section "Source", assurez-vous que les paramètres suivants sont configurés :
   - Branch: `gh-pages` (et non `main`)
   - Folder: `/ (root)`
   - Cliquez sur "Save"

5. Attendez quelques minutes que GitHub déploie votre site.

## Vérification des workflows GitHub Actions

Si vous utilisez GitHub Actions pour le déploiement, assurez-vous que :

1. Le workflow dans `.github/workflows/deploy.yml` a les permissions appropriées :
```yaml
permissions:
  contents: write
  pages: write
  id-token: write
```

2. Le workflow utilise l'action `actions/deploy-pages` ou publie correctement sur la branche `gh-pages`.

## Structure correcte de la branche gh-pages

Vérifiez que la branche `gh-pages` contient bien :

1. Un fichier `index.html` à la racine
2. Tous les assets nécessaires (JS, CSS)
3. Un fichier `.nojekyll` à la racine

## Dépannage courant

Si le site affiche toujours une erreur 404 après configuration correcte :

1. Assurez-vous que l'URL utilisée est exactement : `https://flori92.github.io/intranet-esgis/`
2. Vérifiez que les fichiers ont été correctement poussés sur la branche `gh-pages`
3. Consultez l'onglet "Actions" sur GitHub pour vérifier que le workflow de déploiement a réussi
4. Attendez 10-15 minutes, car la propagation des changements sur GitHub Pages peut prendre du temps

## Ressources utiles

- [Documentation officielle GitHub Pages](https://docs.github.com/en/pages)
- [Résolution des problèmes courants avec GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/troubleshooting-404-errors-for-github-pages-sites)
