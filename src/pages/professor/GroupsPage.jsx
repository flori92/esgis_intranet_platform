import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Dialog, DialogContent, Tab, Tabs } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import GroupService from '@/services/GroupService';
import GroupList from '@/components/groups/GroupList';
import GroupForm from '@/components/groups/GroupForm';
import GroupMembers from '@/components/groups/GroupMembers';
import DocumentList from '@/components/documents/DocumentList';
import DocumentUpload from '@/components/documents/DocumentUpload';
import DocumentService from '@/services/DocumentService';

/**
 * Page de gestion des groupes de TP pour les professeurs
 */
const ProfessorGroupsPage = () => {
  const { user, profile } = useSupabaseAuth();
  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [dialogMode, setDialogMode] = useState('create'); // create, edit, members, documents
  const [groupMembers, setGroupMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState(null);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [groupDocuments, setGroupDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Charger les groupes du professeur
  useEffect(() => {
    const fetchGroups = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const professorGroups = await GroupService.getProfessorGroups(user.id);
        setGroups(professorGroups);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des groupes:', err);
        setError('Impossible de charger les groupes. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [user]);

  // Charger les cours du professeur
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?.id) return;
      
      try {
        // TODO: Implémenter le service pour récupérer les cours du professeur
        // const professorCourses = await CourseService.getProfessorCourses(user.id);
        // setCourses(professorCourses);
        
        // Pour le moment, utiliser des données fictives
        setCourses([
          { id: '1', name: 'Programmation Web' },
          { id: '2', name: 'Bases de données' },
          { id: '3', name: 'Algorithmes et structures de données' }
        ]);
      } catch (err) {
        console.error('Erreur lors du chargement des cours:', err);
      }
    };

    fetchCourses();
  }, [user]);

  // Charger les membres d'un groupe
  const fetchGroupMembers = async (groupId) => {
    try {
      setMembersLoading(true);
      const members = await GroupService.getGroupMembers(groupId);
      setGroupMembers(members);
      setMembersError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des membres:', err);
      setMembersError('Impossible de charger les membres. Veuillez réessayer plus tard.');
    } finally {
      setMembersLoading(false);
    }
  };

  // Charger les documents d'un groupe
  const fetchGroupDocuments = async (groupId) => {
    try {
      setDocumentsLoading(true);
      const documents = await DocumentService.getGroupDocuments(groupId);
      setGroupDocuments(documents);
      setDocumentsError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des documents:', err);
      setDocumentsError('Impossible de charger les documents. Veuillez réessayer plus tard.');
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Charger les étudiants disponibles
  const fetchAvailableStudents = async () => {
    try {
      // TODO: Implémenter le service pour récupérer les étudiants disponibles
      // const students = await UserService.getStudents();
      // setAvailableStudents(students);
      
      // Pour le moment, utiliser des données fictives
      setAvailableStudents([
        { id: '1', first_name: 'Jean', last_name: 'Dupont', email: 'jean.dupont@example.com' },
        { id: '2', first_name: 'Marie', last_name: 'Martin', email: 'marie.martin@example.com' },
        { id: '3', first_name: 'Pierre', last_name: 'Durand', email: 'pierre.durand@example.com' },
        { id: '4', first_name: 'Sophie', last_name: 'Lefebvre', email: 'sophie.lefebvre@example.com' },
        { id: '5', first_name: 'Lucas', last_name: 'Moreau', email: 'lucas.moreau@example.com' }
      ]);
    } catch (err) {
      console.error('Erreur lors du chargement des étudiants:', err);
    }
  };

  // Gérer le changement d'onglet
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Ouvrir le dialogue de création
  const handleOpenCreateDialog = () => {
    setOpenCreateDialog(true);
    setDialogMode('create');
    setSelectedGroup(null);
    setFormSuccess(false);
    setFormError(null);
  };

  // Ouvrir le dialogue d'édition
  const handleOpenEditDialog = (group) => {
    setOpenCreateDialog(true);
    setDialogMode('edit');
    setSelectedGroup(group);
    setFormSuccess(false);
    setFormError(null);
  };

  // Ouvrir le dialogue de gestion des membres
  const handleOpenMembersDialog = async (group) => {
    setOpenCreateDialog(true);
    setDialogMode('members');
    setSelectedGroup(group);
    await fetchGroupMembers(group.id);
    await fetchAvailableStudents();
  };

  // Ouvrir le dialogue de gestion des documents
  const handleOpenDocumentsDialog = async (group) => {
    setOpenCreateDialog(true);
    setDialogMode('documents');
    setSelectedGroup(group);
    setTabValue(0);
    await fetchGroupDocuments(group.id);
  };

  // Fermer le dialogue
  const handleCloseDialog = () => {
    setOpenCreateDialog(false);
  };

  // Gérer la création ou la mise à jour d'un groupe
  const handleSubmitGroup = async (formData, groupId) => {
    try {
      setFormLoading(true);
      setFormError(null);
      
      if (groupId) {
        // Mise à jour d'un groupe existant
        const updatedGroup = await GroupService.updateGroup(groupId, {
          ...formData,
          updated_at: new Date().toISOString()
        });
        
        // Mettre à jour la liste des groupes
        setGroups(prev => prev.map(g => g.id === groupId ? updatedGroup : g));
      } else {
        // Création d'un nouveau groupe
        const newGroup = await GroupService.createGroup({
          ...formData,
          professor_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        // Ajouter le nouveau groupe à la liste
        setGroups(prev => [newGroup, ...prev]);
      }
      
      setFormSuccess(true);
      
      // Fermer le dialogue après un délai
      setTimeout(() => {
        handleCloseDialog();
      }, 2000);
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement du groupe:', err);
      setFormError('Impossible d\'enregistrer le groupe. Veuillez réessayer plus tard.');
    } finally {
      setFormLoading(false);
    }
  };

  // Gérer la suppression d'un groupe
  const handleDeleteGroup = async (group) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) return;
    
    try {
      await GroupService.deleteGroup(group.id);
      setGroups(prev => prev.filter(g => g.id !== group.id));
    } catch (err) {
      console.error('Erreur lors de la suppression du groupe:', err);
      alert('Impossible de supprimer le groupe. Veuillez réessayer plus tard.');
    }
  };

  // Gérer l'acceptation d'une demande d'adhésion
  const handleAcceptMember = async (member) => {
    try {
      await GroupService.acceptJoinRequest(member.group_id, member.user_id);
      // Mettre à jour la liste des membres
      setGroupMembers(prev => prev.map(m => 
        m.id === member.id ? { ...m, status: 'accepted' } : m
      ));
    } catch (err) {
      console.error('Erreur lors de l\'acceptation de la demande:', err);
      alert('Impossible d\'accepter la demande. Veuillez réessayer plus tard.');
    }
  };

  // Gérer le rejet d'une demande d'adhésion
  const handleRejectMember = async (member) => {
    try {
      await GroupService.rejectJoinRequest(member.group_id, member.user_id);
      // Mettre à jour la liste des membres
      setGroupMembers(prev => prev.map(m => 
        m.id === member.id ? { ...m, status: 'rejected' } : m
      ));
    } catch (err) {
      console.error('Erreur lors du rejet de la demande:', err);
      alert('Impossible de rejeter la demande. Veuillez réessayer plus tard.');
    }
  };

  // Gérer la suppression d'un membre
  const handleRemoveMember = async (member) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre du groupe ?')) return;
    
    try {
      await GroupService.removeGroupMember(member.group_id, member.user_id);
      // Mettre à jour la liste des membres
      setGroupMembers(prev => prev.filter(m => m.id !== member.id));
    } catch (err) {
      console.error('Erreur lors de la suppression du membre:', err);
      alert('Impossible de supprimer le membre. Veuillez réessayer plus tard.');
    }
  };

  // Gérer l'ajout de membres
  const handleAddMembers = async (students) => {
    try {
      for (const student of students) {
        await GroupService.addGroupMember(selectedGroup.id, student.id);
      }
      
      // Recharger la liste des membres
      await fetchGroupMembers(selectedGroup.id);
    } catch (err) {
      console.error('Erreur lors de l\'ajout des membres:', err);
      alert('Impossible d\'ajouter les membres. Veuillez réessayer plus tard.');
    }
  };

  // Gérer le téléversement d'un document
  const handleUploadDocument = async (file, documentData) => {
    if (!user?.id || !selectedGroup) return;
    
    try {
      setUploadLoading(true);
      setUploadError(null);
      
      // Générer un chemin unique pour le fichier
      const timestamp = new Date().getTime();
      const filePath = `groups/${selectedGroup.id}/${timestamp}_${file.name}`;
      
      // Téléverser le fichier
      const uploadResult = await DocumentService.uploadFile(file, filePath);
      
      // Créer l'entrée du document dans la base de données
      const newDocument = await DocumentService.createDocument({
        ...documentData,
        file_url: uploadResult.publicUrl,
        created_by: user.id,
        group_id: selectedGroup.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      // Mettre à jour la liste des documents
      setGroupDocuments(prev => [newDocument, ...prev]);
      setUploadSuccess(true);
    } catch (err) {
      console.error('Erreur lors du téléversement du document:', err);
      setUploadError('Impossible de téléverser le document. Veuillez réessayer plus tard.');
    } finally {
      setUploadLoading(false);
    }
  };

  // Gérer le téléchargement d'un document
  const handleDownloadDocument = async (document) => {
    try {
      // Extraire le chemin du fichier de l'URL
      const url = document.file_url;
      
      // Ouvrir l'URL dans un nouvel onglet
      window.open(url, '_blank');
    } catch (err) {
      console.error('Erreur lors du téléchargement du document:', err);
      alert('Impossible de télécharger le document. Veuillez réessayer plus tard.');
    }
  };

  // Gérer la suppression d'un document
  const handleDeleteDocument = async (document) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;
    
    try {
      await DocumentService.deleteDocument(document.id);
      setGroupDocuments(prev => prev.filter(doc => doc.id !== document.id));
    } catch (err) {
      console.error('Erreur lors de la suppression du document:', err);
      alert('Impossible de supprimer le document. Veuillez réessayer plus tard.');
    }
  };

  // Gérer la visualisation d'un document
  const handleViewDocument = (document) => {
    // Ouvrir l'URL dans un nouvel onglet
    window.open(document.file_url, '_blank');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Mes Groupes de TP
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Créer un groupe
        </Button>
      </Box>

      <GroupList
        groups={groups}
        loading={loading}
        error={error}
        onView={handleOpenMembersDialog}
        onEdit={handleOpenEditDialog}
        onDelete={handleDeleteGroup}
        onManageMembers={handleOpenMembersDialog}
        onManageDocuments={handleOpenDocumentsDialog}
        isProfessor={true}
      />

      {/* Dialogue de création/édition/gestion */}
      <Dialog
        open={openCreateDialog}
        onClose={handleCloseDialog}
        maxWidth={dialogMode === 'documents' ? 'lg' : 'md'}
        fullWidth
      >
        <DialogContent>
          {dialogMode === 'create' || dialogMode === 'edit' ? (
            <GroupForm
              onSubmit={handleSubmitGroup}
              loading={formLoading}
              error={formError}
              success={formSuccess}
              group={selectedGroup}
              courses={courses}
            />
          ) : dialogMode === 'members' ? (
            <GroupMembers
              members={groupMembers}
              group={selectedGroup}
              loading={membersLoading}
              error={membersError}
              onAccept={handleAcceptMember}
              onReject={handleRejectMember}
              onRemove={handleRemoveMember}
              onAddMember={handleAddMembers}
              availableStudents={availableStudents}
            />
          ) : dialogMode === 'documents' ? (
            <Box>
              <Typography variant="h6" component="h2" gutterBottom>
                Documents du groupe {selectedGroup?.name}
              </Typography>

              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  variant="fullWidth"
                >
                  <Tab label="Documents" />
                  <Tab label="Ajouter un document" />
                </Tabs>
              </Box>

              {tabValue === 0 ? (
                <DocumentList
                  documents={groupDocuments}
                  loading={documentsLoading}
                  error={documentsError}
                  onDownload={handleDownloadDocument}
                  onDelete={handleDeleteDocument}
                  onView={handleViewDocument}
                  canEdit={true}
                />
              ) : (
                <DocumentUpload
                  onUpload={handleUploadDocument}
                  loading={uploadLoading}
                  error={uploadError}
                  success={uploadSuccess}
                  groupId={selectedGroup?.id}
                  courses={courses}
                />
              )}
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default ProfessorGroupsPage;
