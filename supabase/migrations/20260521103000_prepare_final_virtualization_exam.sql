BEGIN;

UPDATE public.exams
SET title = 'Examen Final - Virtualisation Cloud et Data Center Avancée',
    description = 'Examen final QCM du cours Virtualisation Cloud et Data Center Avancée. Le sujet couvre les architectures datacenter, les modèles cloud, la virtualisation, les conteneurs, Kubernetes, l''automatisation, la sécurité, la scalabilité, la performance et les pratiques FinOps. Examen en brouillon: vérifier la planification avant publication.',
    duration = 90,
    total_points = 40,
    passing_grade = 24,
    exam_type = 'final',
    category = 'evaluation',
    is_practice = false,
    status = 'draft',
    max_cheating_alerts = 3,
    settings = jsonb_build_object(
      'anti_cheat', true,
      'lock_browser', true,
      'prevent_copy_paste', true,
      'timer_mode', 'room',
      'randomize_questions', true,
      'randomize_questions_per_student', true,
      'randomize_options', true,
      'randomize_options_per_student', true,
      'randomization_scope', 'per_student'
    ),
    updated_at = now()
WHERE id = 10;

DELETE FROM public.exam_questions
WHERE exam_id = 10;

INSERT INTO public.exam_questions (
  exam_id,
  question_number,
  question_text,
  question_type,
  points,
  options,
  correct_answer,
  rubric
)
VALUES
(
  10,
  1,
  $q$Quel est le principal avantage d'une topologie Spine-Leaf dans un datacenter moderne ?$q$,
  'multiple_choice',
  2,
  jsonb_build_array(
    'Reduire uniquement le nombre de cables physiques',
    'Obtenir une latence plus uniforme et faciliter la scalabilite horizontale',
    'Supprimer totalement le besoin de routage entre serveurs',
    'Imposer un fonctionnement avec un seul constructeur reseau'
  ),
  '1',
  $r$Spine-Leaf reduit les chemins asymetriques et facilite l'ajout de capacite.$r$
),
(
  10,
  2,
  $q$Pour heberger un registre d'images Docker a grande echelle, quel type de stockage est generalement le plus adapte ?$q$,
  'multiple_choice',
  2,
  jsonb_build_array(
    'Stockage local NVMe attache a un seul serveur',
    'Partage NFS unique sans replication',
    'Stockage objet compatible S3',
    'Disque USB externe attache au noeud principal'
  ),
  '2',
  $r$Le stockage objet convient aux blobs, a la durabilite et a la scalabilite des registres d'images.$r$
),
(
  10,
  3,
  $q$Quel modele cloud permet de deployer du code applicatif sans administrer directement les serveurs, le systeme d'exploitation ni le runtime sous-jacent ?$q$,
  'multiple_choice',
  2,
  jsonb_build_array(
    'IaaS',
    'SaaS',
    'PaaS',
    'Bare-metal on-premise'
  ),
  '2',
  $r$Le PaaS abstrait l'infrastructure et le runtime pour concentrer l'equipe sur l'application.$r$
),
(
  10,
  4,
  $q$Quelle affirmation decrit correctement un hyperviseur de type 1 ?$q$,
  'multiple_choice',
  2,
  jsonb_build_array(
    'Il s''execute directement sur le materiel physique sans systeme d''exploitation hote',
    'Il s''execute uniquement comme application sur un OS de bureau',
    'Il ne peut executer qu''une seule machine virtuelle',
    'Il est reserve aux postes personnels et non aux serveurs'
  ),
  '0',
  $r$Un hyperviseur de type 1, aussi appele bare-metal, s'execute directement sur le serveur physique.$r$
),
(
  10,
  5,
  $q$Quelle est la difference technique fondamentale entre un conteneur Docker et une machine virtuelle classique ?$q$,
  'multiple_choice',
  2,
  jsonb_build_array(
    'Un conteneur embarque toujours un noyau complet, contrairement a une VM',
    'Un conteneur partage le noyau de l''hote alors qu''une VM virtualise un systeme complet avec son propre noyau',
    'Une VM ne peut pas etre migree entre serveurs physiques',
    'Un conteneur necessite obligatoirement un hyperviseur de type 1'
  ),
  '1',
  $r$Le conteneur isole les processus mais partage le noyau de l'hote.$r$
),
(
  10,
  6,
  $q$Dans Kubernetes, quel est le role principal d'etcd dans le Control Plane ?$q$,
  'multiple_choice',
  2,
  jsonb_build_array(
    'Executer les conteneurs applicatifs sur les noeuds workers',
    'Distribuer le trafic HTTP entrant vers les pods',
    'Stocker l''etat et la configuration du cluster sous forme de base cle-valeur distribuee',
    'Compiler les images Docker avant leur deploiement'
  ),
  '2',
  $r$etcd conserve l'etat desire et observe du cluster Kubernetes.$r$
),
(
  10,
  7,
  $q$A quoi sert principalement un Service de type ClusterIP dans Kubernetes ?$q$,
  'multiple_choice',
  2,
  jsonb_build_array(
    'Fournir une adresse interne stable pour joindre un ensemble de pods',
    'Exposer directement l''application sur Internet avec une IP publique',
    'Creer automatiquement un certificat TLS externe',
    'Remplacer le scheduler Kubernetes'
  ),
  '0',
  $r$ClusterIP donne un point d'acces interne stable malgre le cycle de vie dynamique des pods.$r$
),
(
  10,
  8,
  $q$Quel est le role du fichier d'etat Terraform dans une infrastructure geree en Infrastructure as Code ?$q$,
  'multiple_choice',
  2,
  jsonb_build_array(
    'Stocker les logs applicatifs des machines virtuelles',
    'Executer les playbooks de configuration systeme',
    'Remplacer le controle de version Git',
    'Maintenir la correspondance entre les ressources decrites dans le code et les ressources reellement creees'
  ),
  '3',
  $r$Le state permet a Terraform de comparer le code, l'etat connu et l'infrastructure reelle.$r$
),
(
  10,
  9,
  $q$Dans une approche GitOps, quel est le principe operationnel central ?$q$,
  'multiple_choice',
  2,
  jsonb_build_array(
    'Effectuer les deploiements uniquement depuis la console du fournisseur cloud',
    'Utiliser un depot Git comme source de verite et synchroniser automatiquement l''environnement avec cet etat declaratif',
    'Generer les manifestes Kubernetes a partir des logs de production',
    'Remplacer les revues de code par des modifications manuelles sur les serveurs'
  ),
  '1',
  $r$GitOps fait de Git la source de verite de l'etat applicatif et infrastructurel.$r$
),
(
  10,
  10,
  $q$Une plateforme e-commerce doit absorber un pic de trafic massif et imprevisible pendant le Black Friday. Quelle strategie est la plus pertinente ?$q$,
  'multiple_choice',
  2,
  jsonb_build_array(
    'Acheter plusieurs serveurs physiques et les laisser inutilises le reste de l''annee',
    'Conserver une seule instance surdimensionnee sans mecanisme de reprise',
    'Utiliser un cloud public avec autoscaling et facturation a l''usage',
    'Desactiver temporairement la supervision pour economiser des ressources'
  ),
  '2',
  $r$L'autoscaling et le pay-per-use repondent aux charges variables et imprevisibles.$r$
),
(
  10,
  11,
  $q$Quel cas d'usage justifie le mieux une architecture de cloud hybride ?$q$,
  'multiple_choice',
  2,
  jsonb_build_array(
    'Conserver des donnees sensibles dans un cloud prive tout en utilisant l''elasticite du cloud public pour les charges fluctuantes',
    'Eviter toute forme de virtualisation',
    'Supprimer definitivement les contraintes de securite',
    'Executer toutes les applications sur un seul serveur physique'
  ),
  '0',
  $r$Le cloud hybride combine controle local et elasticite externe.$r$
),
(
  10,
  12,
  $q$Lors du dimensionnement d'un serveur bare-metal pour PostgreSQL intensif, pourquoi la topologie NUMA est-elle importante ?$q$,
  'multiple_choice',
  2,
  jsonb_build_array(
    'Elle permet de supprimer les sauvegardes de la base',
    'Elle rend inutile l''indexation SQL',
    'Elle remplace la haute disponibilite applicative',
    'Elle peut introduire une latence memoire lorsque les processus accedent a de la memoire situee sur un autre noeud NUMA'
  ),
  '3',
  $r$Les acces memoire inter-noeuds NUMA peuvent degrader les performances de workloads intensifs.$r$
),
(
  10,
  13,
  $q$Dans quel cas faut-il privilegier un StatefulSet plutot qu'un Deployment Kubernetes ?$q$,
  'multiple_choice',
  2,
  jsonb_build_array(
    'Pour une application stateless sans stockage persistant',
    'Pour une base de donnees ou un service necessitant une identite stable et un stockage persistant ordonne',
    'Pour forcer tous les pods a utiliser la meme adresse IP',
    'Pour remplacer les PersistentVolumeClaims'
  ),
  '1',
  $r$StatefulSet gere l'identite stable, l'ordre et le stockage persistant.$r$
),
(
  10,
  14,
  $q$Si une regle de Security Group geree par Terraform est modifiee manuellement depuis la console cloud, que detecte Terraform lors du prochain plan ?$q$,
  'multiple_choice',
  2,
  jsonb_build_array(
    'Terraform ignore toujours les modifications manuelles',
    'Terraform convertit automatiquement la modification en code source',
    'Terraform detecte un drift et propose de ramener la ressource vers l''etat decrit dans le code',
    'Terraform supprime automatiquement tout le compte cloud'
  ),
  '2',
  $r$Le drift correspond a un ecart entre l'etat attendu par le code et l'etat reel.$r$
),
(
  10,
  15,
  $q$Quelle articulation est la plus correcte entre Terraform et Ansible dans une chaine d'automatisation moderne ?$q$,
  'multiple_choice',
  2,
  jsonb_build_array(
    'Terraform provisionne l''infrastructure, tandis qu''Ansible configure les systemes et les logiciels',
    'Ansible cree uniquement les VPC et Terraform installe uniquement les paquets Linux',
    'Les deux outils sont strictement identiques et interchangeables dans tous les cas',
    'Terraform sert uniquement a superviser les logs applicatifs'
  ),
  '0',
  $r$Terraform gere surtout le provisionnement declaratif, Ansible la configuration et l'orchestration systeme.$r$
),
(
  10,
  16,
  $q$Dans Kubernetes, sur quelles donnees le Horizontal Pod Autoscaler s'appuie-t-il pour augmenter ou reduire le nombre de pods ?$q$,
  'multiple_choice',
  2,
  jsonb_build_array(
    'Le nom du namespace',
    'La taille de l''image Docker',
    'Le nombre de fichiers dans le conteneur',
    'Des metriques comme CPU, memoire ou metriques applicatives personnalisees'
  ),
  '3',
  $r$Le HPA ajuste les replicas selon des metriques observees.$r$
),
(
  10,
  17,
  $q$Quand le Cluster Autoscaler ajoute-t-il typiquement un nouveau noeud a un cluster Kubernetes ?$q$,
  'multiple_choice',
  2,
  jsonb_build_array(
    'Quand un pod change simplement de tag d''image',
    'Quand des pods restent en etat Pending faute de ressources planifiables',
    'Quand un ConfigMap est cree',
    'Quand un utilisateur lance kubectl get pods'
  ),
  '1',
  $r$Le Cluster Autoscaler reagit aux pods non planifiables par manque de capacite.$r$
),
(
  10,
  18,
  $q$Pendant un test de montee en charge, quel indicateur reflete le mieux la degradation percue par les utilisateurs ?$q$,
  'multiple_choice',
  2,
  jsonb_build_array(
    'Le nombre de fichiers dans le depot Git',
    'La taille de l''image Docker',
    'Les latences P95/P99 combinees au taux d''erreur',
    'Le nombre total de comptes administrateurs'
  ),
  '2',
  $r$Les percentiles eleves de latence et les erreurs montrent l'experience des utilisateurs les plus impactes.$r$
),
(
  10,
  19,
  $q$Lorsqu'une application subit surtout une montee en charge en lecture sur PostgreSQL, quelle premiere combinaison est souvent pertinente ?$q$,
  'multiple_choice',
  2,
  jsonb_build_array(
    'Desactiver les index pour accelerer les ecritures',
    'Remplacer tous les services par un monolithe unique',
    'Augmenter uniquement la taille du disque principal',
    'Mettre en place des replicas de lecture et un cache comme Redis'
  ),
  '3',
  $r$Les replicas et le cache repartissent les lectures et reduisent la pression sur la base primaire.$r$
),
(
  10,
  20,
  $q$Pourquoi preferer un gestionnaire de secrets comme HashiCorp Vault a un simple fichier .env stocke sur un serveur ?$q$,
  'multiple_choice',
  2,
  jsonb_build_array(
    'Pour centraliser les secrets, auditer les acces, gerer les rotations et limiter la duree de vie des secrets',
    'Pour supprimer le besoin de chiffrement TLS',
    'Pour remplacer completement les sauvegardes de donnees',
    'Pour rendre les mots de passe visibles dans les journaux applicatifs'
  ),
  '0',
  $r$Vault apporte controle d'acces, audit, rotation et secrets a duree de vie limitee.$r$
);

COMMIT;
