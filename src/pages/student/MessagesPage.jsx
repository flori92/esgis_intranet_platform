import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  TextField,
  Button,
  IconButton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Message as MessageIcon,
  Send as SendIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
  Inbox as InboxIcon,
  Outbox as OutboxIcon,
  Drafts as DraftsIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import MainLayout from '@/components/layout/MainLayout';

/**
 * Page de messagerie pour les étudiants
 * @returns {JSX.Element} Composant de page de messagerie
 */
const StudentMessagesPage = () => {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [newMessageDialogOpen, setNewMessageDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({
    recipient: '',
    subject: '',
    content: ''
  });
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchMessages();
  }, [tabValue]);

  useEffect(() => {
    if (tabValue === 0) {
      setFilteredMessages(messages);
    } else if (tabValue === 1) {
      setFilteredMessages(messages.filter(msg => msg.is_read === false));
    } else if (tabValue === 2) {
      setFilteredMessages(messages.filter(msg => msg.is_read === true));
    }
  }, [tabValue, messages]);

  /**
   * Récupérer les messages
   */
  const fetchMessages = async () => {
    setLoading(true);
    try {
      // Vérifier si l'utilisateur est connecté et est un étudiant
      if (!authState.user || !authState.isStudent) {
        throw new Error('Accès non autorisé');
      }

      // Tenter de récupérer les données depuis Supabase
      try {
        let query;
        
        // Filtrer en fonction de l'onglet sélectionné
        switch (tabValue) {
          case 0: // Reçus
            {
              query = supabase
                .from('messages')
                .select('*, sender:sender_id(id, email, full_name, avatar_url)')
                .eq('recipient_id', authState.user.id)
                .order('created_at', { ascending: false });
            }
            break;
          case 1: // Envoyés
            {
              query = supabase
                .from('messages')
                .select('*, recipient:recipient_id(id, email, full_name, avatar_url)')
                .eq('sender_id', authState.user.id)
                .order('created_at', { ascending: false });
            }
            break;
          default:
            {
              query = supabase
                .from('messages')
                .select('*, sender:sender_id(id, email, full_name, avatar_url)')
                .eq('recipient_id', authState.user.id)
                .order('created_at', { ascending: false });
            }
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (data) {
          setMessages(data);
        } else {
          // Si aucune donnée n'est trouvée, utiliser des données fictives
          setMessages([
            {
              id: 1,
              subject: 'Bienvenue sur la plateforme',
              content: 'Bonjour et bienvenue sur la plateforme ESGIS Intranet. N\'hésitez pas à explorer les différentes fonctionnalités.',
              created_at: new Date().toISOString(),
              sender: {
                id: 'admin',
                full_name: 'Administration ESGIS',
                email: 'admin@esgis.org',
                avatar_url: null
              },
              recipient_id: authState.user.id,
              read: false
            },
            {
              id: 2,
              subject: 'Rappel - Remise de projet',
              content: 'Bonjour, n\'oubliez pas de remettre votre projet final avant la date limite du 15 mai.',
              created_at: new Date(Date.now() - 86400000).toISOString(), // Hier
              sender: {
                id: 'prof1',
                full_name: 'Prof. Martin',
                email: 'martin@esgis.org',
                avatar_url: null
              },
              recipient_id: authState.user.id,
              read: true
            }
          ]);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        // En cas d'erreur, utiliser des données fictives
        setMessages([
          {
            id: 1,
            subject: 'Bienvenue sur la plateforme',
            content: 'Bonjour et bienvenue sur la plateforme ESGIS Intranet. N\'hésitez pas à explorer les différentes fonctionnalités.',
            created_at: new Date().toISOString(),
            sender: {
              id: 'admin',
              full_name: 'Administration ESGIS',
              email: 'admin@esgis.org',
              avatar_url: null
            },
            recipient_id: authState.user.id,
            read: false
          },
          {
            id: 2,
            subject: 'Rappel - Remise de projet',
            content: 'Bonjour, n\'oubliez pas de remettre votre projet final avant la date limite du 15 mai.',
            created_at: new Date(Date.now() - 86400000).toISOString(), // Hier
            sender: {
              id: 'prof1',
              full_name: 'Prof. Martin',
              email: 'martin@esgis.org',
              avatar_url: null
            },
            recipient_id: authState.user.id,
            read: true
          }
        ]);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formater la date pour l'affichage
   * @param {string} dateString - Date au format ISO
   * @returns {string} Date formatée
   */
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch (error) {
      return dateString || 'Date non spécifiée';
    }
  };

  /**
   * Gérer le changement d'onglet
   * @param {object} event - Événement de changement
   * @param {number} newValue - Nouvel index d'onglet
   */
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  /**
   * Sélectionner un message
   * @param {object} message - Message sélectionné
   */
  const handleSelectMessage = async (message) => {
    setSelectedMessage(message);
    
    // Marquer le message comme lu si ce n'est pas déjà fait
    if (!message.read && message.recipient_id === authState.user.id) {
      try {
        const { error } = await supabase
          .from('messages')
          .update({ read: true })
          .eq('id', message.id);
        
        if (error) {
          throw error;
        }
        
        // Mettre à jour l'état local
        setMessages(messages.map(msg => 
          msg.id === message.id ? { ...msg, read: true } : msg
        ));
      } catch (error) {
        console.error('Erreur lors du marquage du message comme lu:', error);
      }
    }
  };

  /**
   * Ouvrir le dialogue de nouveau message
   */
  const handleOpenNewMessageDialog = () => {
    setNewMessageDialogOpen(true);
  };

  /**
   * Fermer le dialogue de nouveau message
   */
  const handleCloseNewMessageDialog = () => {
    setNewMessageDialogOpen(false);
    setNewMessage({
      recipient: '',
      subject: '',
      content: ''
    });
  };

  /**
   * Gérer le changement des champs du nouveau message
   * @param {object} event - Événement de changement
   */
  const handleNewMessageChange = (event) => {
    const { name, value } = event.target;
    setNewMessage(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Envoyer un nouveau message
   */
  const handleSendMessage = async () => {
    try {
      // Vérifier que tous les champs sont remplis
      if (!newMessage.recipient || !newMessage.subject || !newMessage.content) {
        alert('Veuillez remplir tous les champs');
        return;
      }
      
      // Envoyer le message via Supabase
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: authState.user.id,
          recipient_id: newMessage.recipient,
          subject: newMessage.subject,
          content: newMessage.content,
          created_at: new Date().toISOString(),
          read: false
        });
      
      if (error) {
        throw error;
      }
      
      // Fermer le dialogue et rafraîchir les messages
      handleCloseNewMessageDialog();
      fetchMessages();
      
      alert('Message envoyé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      alert('Erreur lors de l\'envoi du message. Veuillez réessayer.');
    }
  };

  return (
    <Box>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <MessageIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h4" component="h1">
              Messagerie
            </Typography>
          </Box>
          <Fab
            color="primary"
            aria-label="add"
            onClick={handleOpenNewMessageDialog}
          >
            <AddIcon />
          </Fab>
        </Box>

        <Paper elevation={3} sx={{ mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
            aria-label="onglets de messagerie"
          >
            <Tab icon={<InboxIcon />} label="Reçus" />
            <Tab icon={<OutboxIcon />} label="Envoyés" />
          </Tabs>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ height: '70vh', overflow: 'auto' }}>
                <List>
                  {filteredMessages.length > 0 ? (
                    filteredMessages.map((message) => (
                      <React.Fragment key={message.id}>
                        <ListItem 
                          button 
                          selected={selectedMessage?.id === message.id}
                          onClick={() => handleSelectMessage(message)}
                          sx={{ 
                            bgcolor: (!message.read && message.recipient_id === authState.user.id) 
                              ? 'action.hover' 
                              : 'inherit'
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar>
                              {tabValue === 0 
                                ? message.sender?.full_name?.charAt(0) || <PersonIcon />
                                : message.recipient?.full_name?.charAt(0) || <PersonIcon />
                              }
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography
                                  variant="subtitle1"
                                  sx={{ 
                                    fontWeight: (!message.read && message.recipient_id === authState.user.id) 
                                      ? 'bold' 
                                      : 'normal'
                                  }}
                                >
                                  {message.subject}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography variant="body2" component="span">
                                  {tabValue === 0 
                                    ? `De: ${message.sender?.full_name || 'Inconnu'}`
                                    : `À: ${message.recipient?.full_name || 'Inconnu'}`
                                  }
                                </Typography>
                                <br />
                                <Typography variant="body2" component="span" color="text.secondary">
                                  {formatDate(message.created_at)}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </React.Fragment>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText 
                        primary="Aucun message" 
                        secondary={tabValue === 0 ? "Votre boîte de réception est vide" : "Vous n'avez envoyé aucun message"}
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>
            <Grid item xs={12} md={8}>
              <Paper elevation={3} sx={{ height: '70vh', p: 3, overflow: 'auto' }}>
                {selectedMessage ? (
                  <>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h5" gutterBottom>
                        {selectedMessage.subject}
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {tabValue === 0 
                          ? `De: ${selectedMessage.sender?.full_name || 'Inconnu'} (${selectedMessage.sender?.email || 'Adresse inconnue'})`
                          : `À: ${selectedMessage.recipient?.full_name || 'Inconnu'} (${selectedMessage.recipient?.email || 'Adresse inconnue'})`
                        }
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        {formatDate(selectedMessage.created_at)}
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedMessage.content}
                    </Typography>
                  </>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '100%'
                  }}>
                    <MessageIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                      Sélectionnez un message pour le lire
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Dialogue de nouveau message */}
        <Dialog 
          open={newMessageDialogOpen} 
          onClose={handleCloseNewMessageDialog}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>Nouveau message</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="recipient"
              label="Destinataire (ID ou email)"
              type="text"
              fullWidth
              variant="outlined"
              value={newMessage.recipient}
              onChange={handleNewMessageChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="subject"
              label="Sujet"
              type="text"
              fullWidth
              variant="outlined"
              value={newMessage.subject}
              onChange={handleNewMessageChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="content"
              label="Message"
              multiline
              rows={6}
              fullWidth
              variant="outlined"
              value={newMessage.content}
              onChange={handleNewMessageChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseNewMessageDialog}>Annuler</Button>
            <Button 
              onClick={handleSendMessage} 
              variant="contained" 
              color="primary"
              startIcon={<SendIcon />}
            >
              Envoyer
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default StudentMessagesPage;
