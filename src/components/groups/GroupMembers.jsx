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
  ListItemAvatar,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Chip,
  Tooltip,
  CircularProgress,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Person as PersonIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { GROUP_MEMBER_STATUS } from '@/types/groups';

/**
 * Composant pour gérer les membres d'un groupe de TP
 */
const GroupMembers = ({
  members,
  group,
  loading,
  error,
  onAccept,
  onReject,
  onRemove,
  onAddMember,
  availableStudents = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Gérer l'ouverture du dialogue d'ajout
  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
    setSearchTerm('');
    setSelectedStudents([]);
  };

  // Gérer la fermeture du dialogue d'ajout
  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };

  // Gérer la sélection d'un étudiant
  const handleSelectStudent = (student) => {
    if (selectedStudents.some(s => s.id === student.id)) {
      setSelectedStudents(selectedStudents.filter(s => s.id !== student.id));
    } else {
      setSelectedStudents([...selectedStudents, student]);
    }
  };

  // Gérer l'ajout des étudiants sélectionnés
  const handleAddMembers = () => {
    if (selectedStudents.length > 0 && onAddMember) {
      onAddMember(selectedStudents);
      handleCloseAddDialog();
    }
  };

  // Filtrer les étudiants disponibles
  const filteredStudents = availableStudents.filter(student => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const email = student.email.toLowerCase();
    const term = searchTerm.toLowerCase();
    return fullName.includes(term) || email.includes(term);
  });

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: fr });
  };

  // Obtenir la couleur de la puce en fonction du statut
  const getStatusColor = (status) => {
    switch (status) {
      case GROUP_MEMBER_STATUS.ACCEPTED:
        return 'success';
      case GROUP_MEMBER_STATUS.PENDING:
        return 'warning';
      case GROUP_MEMBER_STATUS.REJECTED:
        return 'error';
      default:
        return 'default';
    }
  };

  // Obtenir le libellé du statut
  const getStatusLabel = (status) => {
    switch (status) {
      case GROUP_MEMBER_STATUS.ACCEPTED:
        return 'Accepté';
      case GROUP_MEMBER_STATUS.PENDING:
        return 'En attente';
      case GROUP_MEMBER_STATUS.REJECTED:
        return 'Refusé';
      default:
        return 'Inconnu';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Membres du groupe {group?.name}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            Ajouter des membres
          </Button>
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

        {!loading && !error && members?.length === 0 && (
          <Typography sx={{ my: 2, textAlign: 'center', color: 'text.secondary' }}>
            Aucun membre dans ce groupe
          </Typography>
        )}

        {!loading && !error && members?.length > 0 && (
          <List>
            {members.map((member) => (
              <React.Fragment key={member.id}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {member.profiles?.first_name} {member.profiles?.last_name}
                        <Chip 
                          size="small" 
                          label={getStatusLabel(member.status)} 
                          color={getStatusColor(member.status)}
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="caption" component="span" display="block">
                          {member.profiles?.email}
                        </Typography>
                        <Typography variant="caption" component="span" display="block">
                          Rejoint le {formatDate(member.joined_at)}
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    {member.status === GROUP_MEMBER_STATUS.PENDING && (
                      <>
                        <Tooltip title="Accepter">
                          <IconButton edge="end" onClick={() => onAccept(member)} color="success" sx={{ mr: 1 }}>
                            <CheckIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Refuser">
                          <IconButton edge="end" onClick={() => onReject(member)} color="error" sx={{ mr: 1 }}>
                            <CloseIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    <Tooltip title="Supprimer">
                      <IconButton edge="end" onClick={() => onRemove(member)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Dialogue pour ajouter des membres */}
        <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="md" fullWidth>
          <DialogTitle>Ajouter des membres au groupe</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Rechercher des étudiants"
              type="text"
              fullWidth
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            {filteredStudents.length === 0 ? (
              <Typography sx={{ textAlign: 'center', color: 'text.secondary', my: 2 }}>
                Aucun étudiant disponible
              </Typography>
            ) : (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {filteredStudents.map((student) => {
                  const isSelected = selectedStudents.some(s => s.id === student.id);
                  return (
                    <ListItem
                      key={student.id}
                      button
                      onClick={() => handleSelectStudent(student)}
                      selected={isSelected}
                    >
                      <ListItemAvatar>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${student.first_name} ${student.last_name}`}
                        secondary={student.email}
                      />
                      {isSelected && (
                        <ListItemSecondaryAction>
                          <CheckIcon color="primary" />
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  );
                })}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddDialog}>Annuler</Button>
            <Button
              onClick={handleAddMembers}
              variant="contained"
              color="primary"
              disabled={selectedStudents.length === 0}
            >
              Ajouter ({selectedStudents.length})
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

GroupMembers.propTypes = {
  members: PropTypes.array,
  group: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onAccept: PropTypes.func,
  onReject: PropTypes.func,
  onRemove: PropTypes.func,
  onAddMember: PropTypes.func,
  availableStudents: PropTypes.array
};

export default GroupMembers;
