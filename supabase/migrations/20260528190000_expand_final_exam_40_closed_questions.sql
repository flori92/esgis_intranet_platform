BEGIN;

CREATE OR REPLACE FUNCTION public.exam_answer_text_array_sorted(p_value jsonb)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(array_agg(value ORDER BY value), ARRAY[]::text[])
  FROM (
    SELECT btrim(raw_value) AS value
    FROM (
      SELECT CASE
        WHEN p_value IS NULL THEN '[]'::jsonb
        WHEN jsonb_typeof(p_value) = 'array' THEN p_value
        ELSE jsonb_build_array(p_value #>> '{}')
      END AS normalized_value
    ) normalized
    CROSS JOIN LATERAL jsonb_array_elements_text(normalized.normalized_value) AS element(raw_value)
  ) extracted
  WHERE value <> '';
$$;

CREATE OR REPLACE FUNCTION public.exam_answer_order_array(p_value jsonb)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(array_agg(value ORDER BY ord), ARRAY[]::text[])
  FROM (
    SELECT
      element.ord,
      btrim(
        CASE
          WHEN jsonb_typeof(element.item) = 'object' THEN COALESCE(element.item ->> 'text', element.item ->> 'value', '')
          ELSE element.item #>> '{}'
        END
      ) AS value
    FROM jsonb_array_elements(
      CASE
        WHEN p_value IS NULL OR jsonb_typeof(p_value) <> 'array' THEN '[]'::jsonb
        ELSE p_value
      END
    ) WITH ORDINALITY AS element(item, ord)
  ) extracted
  WHERE value <> '';
$$;

CREATE OR REPLACE FUNCTION public.exam_answer_text_object(p_value jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(jsonb_object_agg(key, value ORDER BY key), '{}'::jsonb)
  FROM (
    SELECT key, lower(btrim(value)) AS value
    FROM jsonb_each_text(
      CASE
        WHEN p_value IS NULL OR jsonb_typeof(p_value) <> 'object' THEN '{}'::jsonb
        ELSE p_value
      END
    )
  ) extracted
  WHERE value <> '';
$$;

CREATE OR REPLACE FUNCTION public.score_exam_attempt(
  p_exam_id integer,
  p_answers jsonb
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_score numeric := 0;
BEGIN
  SELECT COALESCE(SUM(
    CASE
      WHEN q.question_type IN ('multiple_choice', 'qcm_single')
        AND btrim(COALESCE(p_answers ->> q.id::text, '')) = btrim(COALESCE(q.correct_answer, ''))
        THEN COALESCE(q.points, 0)
      WHEN q.question_type IN ('multiple_select', 'qcm_multiple')
        AND public.exam_answer_text_array_sorted(p_answers -> q.id::text) = public.exam_answer_text_array_sorted(q.correct_answer::jsonb)
        THEN COALESCE(q.points, 0)
      WHEN q.question_type IN ('true_false', 'short_answer')
        AND lower(btrim(COALESCE(p_answers ->> q.id::text, ''))) = lower(btrim(COALESCE(q.correct_answer, '')))
        THEN COALESCE(q.points, 0)
      WHEN q.question_type IN ('matching', 'fill_blank')
        AND public.exam_answer_text_object(p_answers -> q.id::text) = public.exam_answer_text_object(q.correct_answer::jsonb)
        THEN COALESCE(q.points, 0)
      WHEN q.question_type = 'ordering'
        AND public.exam_answer_order_array(p_answers -> q.id::text) = public.exam_answer_order_array(q.correct_answer::jsonb)
        THEN COALESCE(q.points, 0)
      ELSE 0
    END
  ), 0)
  INTO v_score
  FROM public.exam_questions q
  WHERE q.exam_id = p_exam_id;

  RETURN COALESCE(v_score, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.score_exam_attempt(integer, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.exam_answer_text_array_sorted(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.exam_answer_order_array(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.exam_answer_text_object(jsonb) FROM PUBLIC;

UPDATE public.exams
SET duration = 150,
    total_points = 40,
    passing_grade = 24,
    description = 'Examen final ferme du cours Virtualisation Cloud et Data Center Avancee. Le sujet couvre les architectures datacenter, les modeles cloud, la virtualisation, les conteneurs, Kubernetes, l''automatisation, la securite, la scalabilite, la performance, l''observabilite et les pratiques FinOps. L''epreuve contient 40 questions fermees: QCM a reponse unique, QCM a reponses multiples, vrai/faux, association et ordonnancement.',
    settings = COALESCE(settings, '{}'::jsonb) ||
      jsonb_build_object(
        'anti_cheat', true,
        'lock_browser', true,
        'prevent_copy_paste', true,
        'timer_mode', 'room',
        'randomize_questions', true,
        'randomize_questions_per_student', true,
        'randomize_options', false,
        'randomize_options_per_student', false,
        'randomization_scope', 'per_student',
        'server_side_grading', true
      ),
    updated_at = now()
WHERE id = 10;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.student_exams
    WHERE exam_id = 10
      AND COALESCE(attempt_status, 'not_started') <> 'not_started'
  ) THEN
    RAISE EXCEPTION 'Cannot replace exam 10 questions after attempts have started';
  END IF;
END $$;

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
(10, 1, 'Quel est l''objectif principal d''une topologie Spine-Leaf dans un datacenter moderne ?', 'qcm_single', 1, jsonb_build_array('Centraliser tout le trafic sur un seul switch coeur', 'Obtenir une latence plus previsible et faciliter l''extension horizontale', 'Remplacer totalement le routage IP', 'Supprimer le besoin de segmentation reseau'), '1', 'Spine-Leaf reduit les chemins asymetriques et facilite l''ajout de capacite.'),
(10, 2, 'Quel type de stockage convient le mieux a un registre d''images conteneurs a grande echelle ?', 'qcm_single', 1, jsonb_build_array('Stockage objet compatible S3', 'Disque USB local', 'Swap systeme', 'RAM volatile uniquement'), '0', 'Les registres manipulent des blobs et beneficient d''un stockage objet durable.'),
(10, 3, 'Dans une architecture cloud hybride, quel besoin justifie le plus souvent la conservation d''une partie on-premise ?', 'qcm_single', 1, jsonb_build_array('Eviter toute automatisation', 'Garder certaines donnees ou charges sensibles sous contraintes locales', 'Interdire la scalabilite', 'Supprimer les sauvegardes'), '1', 'Le cloud hybride combine contraintes locales et elasticite cloud.'),
(10, 4, 'Quel modele de service cloud fournit principalement des machines virtuelles, reseaux et volumes configurables ?', 'qcm_single', 1, jsonb_build_array('SaaS', 'PaaS', 'IaaS', 'FaaS'), '2', 'IaaS expose les briques d''infrastructure.'),
(10, 5, 'Quelle affirmation decrit un hyperviseur de type 1 ?', 'qcm_single', 1, jsonb_build_array('Il s''execute directement sur le materiel physique', 'Il s''execute uniquement dans un navigateur web', 'Il necessite toujours un OS hote de bureau', 'Il ne peut lancer qu''un seul systeme invite'), '0', 'Un hyperviseur de type 1 est bare-metal.'),
(10, 6, 'Quel est l''interet principal de SR-IOV dans la virtualisation reseau ?', 'qcm_single', 1, jsonb_build_array('Ajouter une interface graphique aux VM', 'Ameliorer les performances I/O en exposant des fonctions virtuelles du materiel', 'Desactiver les VLAN', 'Remplacer Kubernetes'), '1', 'SR-IOV reduit certains surcouts de virtualisation I/O.'),
(10, 7, 'Dans le SDN, que separe-t-on principalement ?', 'qcm_single', 1, jsonb_build_array('Le plan de controle et le plan de donnees', 'La RAM et le CPU', 'Le stockage chaud et froid', 'Les utilisateurs et les mots de passe'), '0', 'Le controle devient programmable et separe du forwarding.'),
(10, 8, 'Quelle difference fondamentale existe entre conteneur et machine virtuelle classique ?', 'qcm_single', 1, jsonb_build_array('Le conteneur partage le noyau de l''hote', 'La VM ne peut pas executer de systeme d''exploitation', 'Le conteneur embarque toujours un hyperviseur complet', 'La VM partage toujours le meme processus PID 1'), '0', 'Le conteneur isole les processus mais partage le noyau.'),
(10, 9, 'Quel composant Kubernetes stocke l''etat du cluster ?', 'qcm_single', 1, jsonb_build_array('kubelet', 'etcd', 'CoreDNS', 'containerd'), '1', 'etcd est la base cle-valeur du control plane.'),
(10, 10, 'Quel objet Kubernetes fournit une adresse interne stable vers un ensemble de Pods ?', 'qcm_single', 1, jsonb_build_array('Service ClusterIP', 'ConfigMap', 'Secret', 'Namespace'), '0', 'ClusterIP donne un point d''acces interne stable.'),
(10, 11, 'Quand faut-il privilegier un StatefulSet plutot qu''un Deployment ?', 'qcm_single', 1, jsonb_build_array('Pour une application stateless pure', 'Pour une charge necessitant identite stable et stockage persistant par replica', 'Pour supprimer tous les volumes', 'Pour empecher les redemarrages'), '1', 'StatefulSet gere identite et stockage stables.'),
(10, 12, 'Quel est le role principal du fichier state Terraform ?', 'qcm_single', 1, jsonb_build_array('Stocker les logs applicatifs', 'Faire correspondre ressources declarees et ressources reelles gerees', 'Remplacer Git', 'Compiler les images Docker'), '1', 'Le state permet le suivi des ressources gerees.'),
(10, 13, 'Que signifie l''idempotence dans Ansible ?', 'qcm_single', 1, jsonb_build_array('Une tache produit le meme etat cible meme si elle est rejouee', 'Une tache echoue toujours au second passage', 'Une tache ne peut etre lancee qu''une fois', 'Une tache supprime les fichiers inconnus'), '0', 'L''idempotence evite les changements inutiles.'),
(10, 14, 'Quel principe resume le mieux GitOps ?', 'qcm_single', 1, jsonb_build_array('Modifier la production uniquement via SSH manuel', 'Faire de Git la source de verite et reconciler automatiquement l''etat cible', 'Stocker les secrets en clair dans le depot', 'Desactiver les revues de changement'), '1', 'GitOps repose sur Git comme source de verite.'),
(10, 15, 'Dans une approche Zero Trust, quelle regle est centrale ?', 'qcm_single', 1, jsonb_build_array('Faire confiance au reseau interne par defaut', 'Verifier explicitement chaque acces', 'Donner les droits administrateur a tous', 'Supprimer les journaux d''audit'), '1', 'Zero Trust verifie chaque acces et limite les privileges.'),
(10, 16, 'En FinOps, que vise le right-sizing ?', 'qcm_single', 1, jsonb_build_array('Adapter les ressources provisionnees au besoin reel', 'Toujours choisir les plus grosses instances', 'Desactiver les tags', 'Payer uniquement en licences perpetuelles'), '0', 'Le right-sizing evite surdimensionnement et gaspillage.'),
(10, 17, 'Pour une application web stateless tres fluctuante, quel mecanisme est le plus adapte ?', 'qcm_single', 1, jsonb_build_array('Autoscaling horizontal', 'Serveur unique fixe', 'Sauvegarde manuelle quotidienne', 'Desactivation du load balancer'), '0', 'Le scaling horizontal absorbe les variations de charge.'),
(10, 18, 'Quel est le role d''un Load Balancer ?', 'qcm_single', 1, jsonb_build_array('Distribuer le trafic entre plusieurs instances saines', 'Chiffrer tous les disques locaux', 'Remplacer la base de donnees', 'Compiler le code source'), '0', 'Il repartit les requetes et ameliore disponibilite et capacite.'),
(10, 19, 'Que permet une politique de haute disponibilite multi-zone ?', 'qcm_single', 1, jsonb_build_array('Continuer le service malgre la panne d''une zone', 'Eviter toute replication', 'Forcer un point unique de defaillance', 'Supprimer les health checks'), '0', 'Le multi-zone reduit l''impact d''une panne locale.'),
(10, 20, 'Quel outil est principalement associe a la gestion centralisee des secrets ?', 'qcm_single', 1, jsonb_build_array('HashiCorp Vault', 'htop', 'rsync uniquement', 'curl uniquement'), '0', 'Vault gere secrets, rotation et acces controles.'),
(10, 21, 'Dans Kubernetes, quels objets participent directement a l''exposition d''une application HTTP vers l''exterieur ?', 'qcm_multiple', 1, jsonb_build_array('Ingress', 'Service', 'Secret TLS si HTTPS est utilise', 'etcd comme reverse proxy'), '["0","1","2"]', 'Ingress, Service et Secret TLS peuvent participer a l''exposition HTTP/HTTPS.'),
(10, 22, 'Quels elements sont typiquement surveilles par l''observabilite d''une plateforme cloud ?', 'qcm_multiple', 1, jsonb_build_array('Metriques', 'Logs', 'Traces distribuees', 'Couleur du logo uniquement'), '["0","1","2"]', 'L''observabilite combine metriques, logs et traces.'),
(10, 23, 'Quels benefices sont attendus de l''Infrastructure as Code ?', 'qcm_multiple', 1, jsonb_build_array('Reproductibilite', 'Revue des changements', 'Versionnement', 'Configuration manuelle non documentee'), '["0","1","2"]', 'IaC apporte reproductibilite, revue et versionnement.'),
(10, 24, 'Quels risques sont reduits par une gestion de secrets dediee ?', 'qcm_multiple', 1, jsonb_build_array('Secrets en clair dans les depots', 'Absence de rotation', 'Partage non controle des identifiants', 'Perte de performance CPU par defaut'), '["0","1","2"]', 'Une solution de secrets reduit exposition, rotation faible et partage non controle.'),
(10, 25, 'Quels elements sont importants pour une strategie de sauvegarde fiable ?', 'qcm_multiple', 1, jsonb_build_array('RPO/RTO definis', 'Tests de restauration', 'Copies hors zone ou hors region', 'Sauvegarde uniquement sur le meme disque'), '["0","1","2"]', 'Une sauvegarde vaut surtout si elle est restaurable selon RPO/RTO.'),
(10, 26, 'Quels signaux indiquent un possible surdimensionnement cloud ?', 'qcm_multiple', 1, jsonb_build_array('CPU durablement tres faible', 'Memoire peu consommee', 'Instances allumees hors horaires utiles', 'Saturation permanente des ressources'), '["0","1","2"]', 'Faible usage et ressources inutilisees signalent souvent du gaspillage.'),
(10, 27, 'Quels controles renforcent une architecture Zero Trust ?', 'qcm_multiple', 1, jsonb_build_array('MFA', 'Moindre privilege', 'Segmentation', 'Mot de passe partage pour toute l''equipe'), '["0","1","2"]', 'MFA, moindre privilege et segmentation renforcent Zero Trust.'),
(10, 28, 'Quels composants font partie du control plane Kubernetes ?', 'qcm_multiple', 1, jsonb_build_array('kube-apiserver', 'etcd', 'scheduler', 'Application metier du client'), '["0","1","2"]', 'Ces composants pilotent l''etat et la planification du cluster.'),
(10, 29, 'Un conteneur Docker isole les processus mais partage le noyau de l''hote.', 'true_false', 1, NULL::jsonb, 'true', 'C''est une difference centrale avec une VM.'),
(10, 30, 'Le PaaS oblige l''equipe applicative a administrer directement le noyau Linux des serveurs.', 'true_false', 1, NULL::jsonb, 'false', 'Le PaaS abstrait justement une partie de l''administration systeme.'),
(10, 31, 'Un fichier Terraform state peut contenir des informations sensibles et doit etre protege.', 'true_false', 1, NULL::jsonb, 'true', 'Le state peut contenir attributs et secrets de ressources.'),
(10, 32, 'Dans GitOps, la production doit etre modifiee prioritairement par des changements non traces en console.', 'true_false', 1, NULL::jsonb, 'false', 'GitOps privilegie les changements traces dans Git.'),
(10, 33, 'Quel service cloud est le plus adapte pour executer du code declenche par evenement sans gerer de serveur permanent ?', 'qcm_single', 1, jsonb_build_array('FaaS', 'Bare-metal dedie', 'NAS local', 'VLAN statique'), '0', 'FaaS execute des fonctions a la demande.'),
(10, 34, 'Pourquoi la notion NUMA peut-elle compter pour une base PostgreSQL intensive sur bare-metal ?', 'qcm_single', 1, jsonb_build_array('Elle influence les acces memoire entre sockets CPU', 'Elle remplace le systeme de fichiers', 'Elle chiffre automatiquement les donnees', 'Elle annule le besoin d''index SQL'), '0', 'NUMA peut impacter latence et performances memoire.'),
(10, 35, 'Quelle pratique reduit le risque lors d''un deploiement applicatif ?', 'qcm_single', 1, jsonb_build_array('Blue/green ou canary deployment', 'Suppression de tous les tests', 'Deploiement manuel non journalise', 'Desactivation du rollback'), '0', 'Canary et blue/green limitent le rayon d''impact.'),
(10, 36, 'Quel objectif poursuit le chaos engineering ?', 'qcm_single', 1, jsonb_build_array('Verifier la resilience en injectant des pannes controlees', 'Creer des pannes aleatoires sans mesure', 'Supprimer les sauvegardes', 'Eviter toute supervision'), '0', 'Le chaos engineering valide la resilience avec experimentation controlee.'),
(10, 37, 'Associez chaque modele cloud a sa description.', 'matching', 1, jsonb_build_object('left_items', jsonb_build_array('IaaS', 'PaaS', 'SaaS', 'FaaS'), 'right_items', jsonb_build_array('Execution de fonctions declenchees par evenement', 'Application complete consommee comme service', 'Machines virtuelles, reseaux et stockage configurables', 'Plateforme applicative avec runtime gere')), '{"0":"2","1":"3","2":"1","3":"0"}', 'IaaS, PaaS, SaaS et FaaS abstraient des niveaux differents.'),
(10, 38, 'Associez chaque outil a son usage principal.', 'matching', 1, jsonb_build_object('left_items', jsonb_build_array('Terraform', 'Ansible', 'ArgoCD', 'Vault'), 'right_items', jsonb_build_array('Gestion centralisee des secrets', 'Reconciliation GitOps', 'Provisionnement declaratif d''infrastructure', 'Configuration idempotente des systemes')), '{"0":"2","1":"3","2":"1","3":"0"}', 'Chaque outil couvre une couche differente de l''automatisation.'),
(10, 39, 'Remettez ces etapes dans un ordre logique pour un changement d''infrastructure maitrise.', 'ordering', 1, jsonb_build_object('items', jsonb_build_array('Configurer le monitoring', 'Provisionner l''infrastructure', 'Deployer l''application', 'Ecrire l''IaC et faire relire le changement')), '["Ecrire l''IaC et faire relire le changement","Provisionner l''infrastructure","Deployer l''application","Configurer le monitoring"]', 'On decrit et revise, on provisionne, on deploie, puis on surveille.'),
(10, 40, 'Remettez ces actions de reponse a incident dans un ordre logique.', 'ordering', 1, jsonb_build_object('items', jsonb_build_array('Faire le retour d''experience', 'Contenir l''incident', 'Detecter et qualifier l''alerte', 'Restaurer le service')), '["Detecter et qualifier l''alerte","Contenir l''incident","Restaurer le service","Faire le retour d''experience"]', 'La reponse suit detection, containment, restauration puis retour d''experience.');

COMMIT;
