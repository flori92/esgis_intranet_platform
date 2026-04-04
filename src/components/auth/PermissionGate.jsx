/**
 * Composant de contrôle d'accès basé sur les permissions
 * Masque ou affiche ses enfants selon les permissions de l'utilisateur.
 *
 * Usage:
 *   <PermissionGate resource="students" action="delete">
 *     <DeleteButton />
 *   </PermissionGate>
 *
 *   <PermissionGate resource="grades" action="publish" fallback={<Alert>Accès refusé</Alert>}>
 *     <PublishPanel />
 *   </PermissionGate>
 */
import { usePermissions } from '../../hooks/usePermissions';

const PermissionGate = ({ resource, action, fallback = null, children }) => {
  const { hasPermission, canAccess } = usePermissions();

  const allowed = action
    ? hasPermission(resource, action)
    : canAccess(resource);

  if (!allowed) return fallback;

  return children;
};

export default PermissionGate;
