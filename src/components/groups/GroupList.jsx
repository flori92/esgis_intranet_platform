import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Chip,
  Tooltip,
  CircularProgress,
  Divider,
  Menu,
  MenuItem,
  Avatar,
  Badge
} from '@mui/material';
import {
  Group as GroupIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  PersonAdd as PersonAddIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Composant pour afficher une liste de groupes de TP
 */
const GroupList = ({
  groups,
  title,
  loading,
  error,
  onView,
  onEdit,
  onDelete,
  onManageMembers,
  onManageDocuments,
  isProfessor = false
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Ouvrir le menu d'actions
  const handleOpenMenu = (event, group) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedGroup(group);
  };

  // Fermer le menu d'actions
  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setSelectedGroup(null);
  };

  // Gérer la visualisation d'un groupe
  const handleView = () => {
    if (selectedGroup && onView) {
      onView(selectedGroup);
    }
    handleCloseMenu();
  };

  // Gérer l'édition d'un groupe
  const handleEdit = () => {
    if (selectedGroup && onEdit) {
      onEdit(selectedGroup);
    }
    handleCloseMenu();
  };

  // Gérer la suppression d'un groupe
  const handleDelete = () => {
    if (selectedGroup && onDelete) {
      onDelete(selectedGroup);
    }
    handleCloseMenu();
  };

  // Gérer la gestion des membres
  const handleManageMembers = () => {
    if (selectedGroup && onManageMembers) {
      onManageMembers(selectedGroup);
    }
    handleCloseMenu();
  };

  // Gérer la gestion des documents
  const handleManageDocuments = () => {
    if (selectedGroup && onManageDocuments) {
      onManageDocuments(selectedGroup);
    }
    handleCloseMenu();
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            {title || 'Groupes de TP'}
          </Typography>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Typography color="error" sx={{ my: 2 }}>
            {error}
          </Typography>
        )}

        {!loading && !error && groups?.length === 0 && (
          <Typography sx={{ my: 2, textAlign: 'center', color: 'text.secondary' }}>
            Aucun groupe disponible
          </Typography>
        )}

        {!loading && !error && groups?.length > 0 && (
          <List>
            {groups.map((group) => (
              <React.Fragment key={group.id}>
                <ListItem>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    <GroupIcon />
                  </Avatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {group.name}
                        {!group.is_active && (
                          <Chip 
                            size="small" 
                            label="Inactif" 
                            color="error" 
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span" display="block">
                          {group.description}
                        </Typography>
                        <Typography variant="caption" component="span" display="block">
                          Cours: {group.courses?.name || 'Non spécifié'} • 
                          Créé le {formatDate(group.created_at)}
                          {group.max_students && ` • Max: ${group.max_students} étudiants`}
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Actions">
                      <IconButton edge="end" onClick={(e) => handleOpenMenu(e, group)}>
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        )}

        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleCloseMenu}
        >
          <MenuItem onClick={handleView}>
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Voir les détails" />
          </MenuItem>
          <MenuItem onClick={handleManageDocuments}>
            <ListItemIcon>
              <DescriptionIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Documents" />
          </MenuItem>
          {isProfessor && (
            <>
              <MenuItem onClick={handleManageMembers}>
                <ListItemIcon>
                  <PersonAddIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Gérer les membres" />
              </MenuItem>
              <MenuItem onClick={handleEdit}>
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Modifier" />
              </MenuItem>
              <MenuItem onClick={handleDelete}>
                <ListItemIcon>
                  <DeleteIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Supprimer" />
              </MenuItem>
            </>
          )}
        </Menu>
      </CardContent>
    </Card>
  );
};

GroupList.propTypes = {
  groups: PropTypes.array,
  title: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onManageMembers: PropTypes.func,
  onManageDocuments: PropTypes.func,
  isProfessor: PropTypes.bool
};

export default GroupList;
