import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Reply as ReplyIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { useAuth } from '@/context/AuthContext';
import { getContacts as fetchContactsApi, getMessages as fetchMessagesApi, markMessageAsRead, sendMessage } from '@/api/messages';

const defaultDraft = {
  recipient_id: '',
  subject: '',
  content: ''
};

const MessagesPage = () => {
  const { authState } = useAuth();
  const currentProfileId = authState.profile?.id || authState.user?.id || '';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [draft, setDraft] = useState(defaultDraft);

  const filteredContacts = useMemo(() => {
    if (!authState.profile?.role) {
      return contacts;
    }

    if (authState.isStudent) {
      return contacts.filter((contact) => ['professor', 'admin'].includes(contact.role));
    }

    if (authState.isProfessor) {
      return contacts.filter((contact) => ['student', 'admin'].includes(contact.role));
    }

    return contacts;
  }, [authState.isProfessor, authState.isStudent, authState.profile?.role, contacts]);

  const formatDate = (dateString) => {
    if (!dateString) {
      return 'Date inconnue';
    }

    try {
      return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: fr });
    } catch (_error) {
      return dateString;
    }
  };

  const getCounterparty = (message) => {
    if (!message) {
      return null;
    }

    return tabValue === 0 ? message.sender : message.recipient;
  };

  const fetchContacts = async () => {
    if (!currentProfileId) {
      return;
    }

    try {
      let roleFilter;
      if (authState.isStudent) {
        roleFilter = ['professor', 'admin'];
      } else if (authState.isProfessor) {
        roleFilter = ['student', 'admin'];
      }

      const { contacts: data, error: contactsError } = await fetchContactsApi(currentProfileId, { roleFilter });

      if (contactsError) {
        throw contactsError;
      }

      setContacts(data);
    } catch (contactsError) {
      console.error('Erreur lors du chargement des contacts:', contactsError);
      setContacts([]);
    }
  };

  const fetchMessages = async () => {
    if (!currentProfileId) {
      setError('Utilisateur non connecté');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const direction = tabValue === 0 ? 'received' : 'sent';
      const { messages: data, error: messagesError } = await fetchMessagesApi(currentProfileId, direction);

      if (messagesError) {
        throw messagesError;
      }

      const nextMessages = data;
      setMessages(nextMessages);

      if (selectedMessage) {
        const refreshedSelection = nextMessages.find((message) => message.id === selectedMessage.id) || null;
        setSelectedMessage(refreshedSelection);
      }
    } catch (messagesError) {
      console.error('Erreur lors du chargement des messages:', messagesError);
      setMessages([]);
      setSelectedMessage(null);
      setError(messagesError.message || 'Impossible de charger la messagerie');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [currentProfileId]);

  useEffect(() => {
    fetchMessages();
  }, [currentProfileId, tabValue]);

  const handleSelectMessage = async (message) => {
    setSelectedMessage(message);

    if (tabValue !== 0 || message.read || message.recipient_id !== currentProfileId) {
      return;
    }

    try {
      const { error: updateError } = await markMessageAsRead(message.id);

      if (updateError) {
        throw updateError;
      }

      setMessages((prevMessages) => prevMessages.map((item) => (
        item.id === message.id
          ? { ...item, read: true }
          : item
      )));
      setSelectedMessage((prevMessage) => (
        prevMessage?.id === message.id
          ? { ...prevMessage, read: true }
          : prevMessage
      ));
    } catch (updateError) {
      console.error('Erreur lors du marquage du message comme lu:', updateError);
    }
  };

  const openCompose = (prefill = {}) => {
    setDraft({
      recipient_id: prefill.recipient_id || '',
      subject: prefill.subject || '',
      content: prefill.content || ''
    });
    setComposeOpen(true);
  };

  const closeCompose = () => {
    setComposeOpen(false);
    setDraft(defaultDraft);
  };

  const handleReply = () => {
    if (!selectedMessage) {
      return;
    }

    const recipientId = tabValue === 0 ? selectedMessage.sender_id : selectedMessage.recipient_id;
    const subject = selectedMessage.subject?.startsWith('Re: ')
      ? selectedMessage.subject
      : `Re: ${selectedMessage.subject || 'Sans objet'}`;

    openCompose({
      recipient_id: recipientId,
      subject,
      content: ''
    });
  };

  const handleSendMessage = async () => {
    if (!currentProfileId) {
      setError('Utilisateur non connecté');
      return;
    }

    if (!draft.recipient_id || !draft.subject.trim() || !draft.content.trim()) {
      setError('Destinataire, objet et contenu sont obligatoires');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await sendMessage({
        sender_id: currentProfileId,
        recipient_id: draft.recipient_id,
        subject: draft.subject.trim(),
        content: draft.content.trim()
      });

      if (insertError) {
        throw insertError;
      }

      closeCompose();
      setSuccessMessage('Message envoyé');

      if (tabValue !== 1) {
        setTabValue(1);
      } else {
        fetchMessages();
      }
    } catch (insertError) {
      console.error('Erreur lors de l’envoi du message:', insertError);
      setError(insertError.message || 'Impossible d’envoyer le message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ py: 4, px: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Messagerie
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openCompose()}
        >
          Nouveau message
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: '72vh', display: 'flex', flexDirection: 'column' }}>
            <Tabs
              value={tabValue}
              onChange={(_event, newValue) => setTabValue(newValue)}
              variant="fullWidth"
            >
              <Tab label="Reçus" />
              <Tab label="Envoyés" />
            </Tabs>
            <Divider />

            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <CircularProgress />
                </Box>
              ) : messages.length === 0 ? (
                <Box sx={{ p: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Aucun message dans cette boîte.
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {messages.map((message) => {
                    const counterparty = getCounterparty(message);

                    return (
                      <ListItemButton
                        key={message.id}
                        selected={selectedMessage?.id === message.id}
                        onClick={() => handleSelectMessage(message)}
                        divider
                        sx={{
                          alignItems: 'flex-start',
                          backgroundColor: tabValue === 0 && !message.read ? 'action.hover' : 'inherit'
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar src={counterparty?.avatar_url || undefined}>
                            {counterparty?.full_name?.charAt(0) || '?'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={(
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: tabValue === 0 && !message.read ? 700 : 500 }}
                            >
                              {message.subject || 'Sans objet'}
                            </Typography>
                          )}
                          secondary={(
                            <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                              <Typography component="span" variant="body2" color="text.secondary">
                                {counterparty?.full_name || counterparty?.email || 'Utilisateur inconnu'}
                              </Typography>
                              <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block' }}>
                                {message.content?.slice(0, 90) || 'Aucun contenu'}
                              </Typography>
                              <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {formatDate(message.created_at)}
                              </Typography>
                            </Box>
                          )}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ height: '72vh', p: 3, display: 'flex', flexDirection: 'column' }}>
            {selectedMessage ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 2 }}>
                  <Box>
                    <Typography variant="h5">
                      {selectedMessage.subject || 'Sans objet'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {tabValue === 0 ? 'De' : 'À'} {getCounterparty(selectedMessage)?.full_name || getCounterparty(selectedMessage)?.email || 'Utilisateur inconnu'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(selectedMessage.created_at)}
                    </Typography>
                  </Box>
                  <Box>
                    <Button
                      variant="outlined"
                      startIcon={<ReplyIcon />}
                      onClick={handleReply}
                    >
                      Répondre
                    </Button>
                  </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedMessage.content}
                </Typography>
              </>
            ) : (
              <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Sélectionnez un message pour l’afficher.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={composeOpen}
        onClose={closeCompose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Nouveau message</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel id="recipient-label">Destinataire</InputLabel>
            <Select
              labelId="recipient-label"
              label="Destinataire"
              value={draft.recipient_id}
              onChange={(event) => setDraft((prev) => ({ ...prev, recipient_id: event.target.value }))}
            >
              {filteredContacts.map((contact) => (
                <MenuItem key={contact.id} value={contact.id}>
                  {contact.full_name} ({contact.role})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Objet"
            fullWidth
            value={draft.subject}
            onChange={(event) => setDraft((prev) => ({ ...prev, subject: event.target.value }))}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Message"
            fullWidth
            multiline
            minRows={6}
            value={draft.content}
            onChange={(event) => setDraft((prev) => ({ ...prev, content: event.target.value }))}
          />

          {filteredContacts.length === 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Aucun destinataire disponible pour le moment.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCompose}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSendMessage}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
            disabled={submitting || filteredContacts.length === 0}
          >
            Envoyer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MessagesPage;
