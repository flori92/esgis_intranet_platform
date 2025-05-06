import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Chip,
  Tooltip,
  CircularProgress,
  Divider,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  Code as CodeIcon,
  Archive as ArchiveIcon,
  MoreVert as MoreVertIcon,
  GetApp as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Composant pour afficher une liste de documents
 */
const DocumentList = ({
  documents,
  title,
  loading,
  error,
  onDownload,
  onDelete,
  onEdit,
  onView,
  canEdit = false
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Ouvrir le menu d'actions
  const handleOpenMenu = (event, document) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedDocument(document);
  };

  // Fermer le menu d'actions
  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setSelectedDocument(null);
  };

  // Gérer le téléchargement d'un document
  const handleDownload = () => {
    if (selectedDocument && onDownload) {
      onDownload(selectedDocument);
    }
    handleCloseMenu();
  };

  // Gérer la suppression d'un document
  const handleDelete = () => {
    if (selectedDocument && onDelete) {
      onDelete(selectedDocument);
    }
    handleCloseMenu();
  };

  // Gérer l'édition d'un document
  const handleEdit = () => {
    if (selectedDocument && onEdit) {
      onEdit(selectedDocument);
    }
    handleCloseMenu();
  };

  // Gérer la visualisation d'un document
  const handleView = () => {
    if (selectedDocument && onView) {
      onView(selectedDocument);
    }
    handleCloseMenu();
  };

  // Obtenir l'icône en fonction du type de fichier
  const getFileIcon = (fileType) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf':
        return <PdfIcon />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ImageIcon />;
      case 'zip':
      case 'rar':
      case '7z':
        return <ArchiveIcon />;
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'html':
      case 'css':
      case 'php':
        return <CodeIcon />;
      default:
        return <FileIcon />;
    }
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr });
  };

  // Obtenir la couleur de la puce en fonction du type de document
  const getChipColor = (type) => {
    switch (type) {
      case 'course':
        return 'primary';
      case 'tp':
        return 'secondary';
      case 'exam':
        return 'error';
      case 'certificate':
      case 'attestation':
        return 'success';
      default:
        return 'default';
    }
  };

  // Obtenir le libellé du type de document
  const getTypeLabel = (type) => {
    switch (type) {
      case 'course':
        return 'Cours';
      case 'tp':
        return 'TP';
      case 'exam':
        return 'Examen';
      case 'certificate':
        return 'Certificat';
      case 'attestation':
        return 'Attestation';
      default:
        return 'Autre';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            {title || 'Documents'}
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

        {!loading && !error && documents?.length === 0 && (
          <Typography sx={{ my: 2, textAlign: 'center', color: 'text.secondary' }}>
            Aucun document disponible
          </Typography>
        )}

        {!loading && !error && documents?.length > 0 && (
          <List>
            {documents.map((document) => (
              <React.Fragment key={document.id}>
                <ListItem>
                  <ListItemIcon>
                    {getFileIcon(document.file_type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={document.title}
                    secondary={
                      <>
                        <Typography variant="body2" component="span" display="block">
                          {document.description}
                        </Typography>
                        <Typography variant="caption" component="span" display="block">
                          {formatFileSize(document.file_size)} • Modifié le {formatDate(document.updated_at)}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Chip 
                            size="small" 
                            label={getTypeLabel(document.type)} 
                            color={getChipColor(document.type)}
                            sx={{ mr: 1 }}
                          />
                          {document.is_public && (
                            <Chip size="small" label="Public" variant="outlined" />
                          )}
                        </Box>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Actions">
                      <IconButton edge="end" onClick={(e) => handleOpenMenu(e, document)}>
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
            <ListItemText primary="Visualiser" />
          </MenuItem>
          <MenuItem onClick={handleDownload}>
            <ListItemIcon>
              <DownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Télécharger" />
          </MenuItem>
          {canEdit && (
            <>
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

DocumentList.propTypes = {
  documents: PropTypes.array,
  title: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onDownload: PropTypes.func,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  onView: PropTypes.func,
  canEdit: PropTypes.bool
};

export default DocumentList;
