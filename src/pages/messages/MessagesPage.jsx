import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  TextField, 
  IconButton,
  Divider,
  CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
// Import unique Supabase – toute référence doit passer par '@/services/supabase'
import { supabase } from '@/services/supabase';

/**
 * @typedef {Object} Profile
 * @property {string} id - ID du profil utilisateur
 * @property {string} full_name - Nom complet de l'utilisateur
 */

/**
 * @typedef {Object} Message
 * @property {number|string} id - ID du message
 * @property {string} content - Contenu du message
 * @property {number|string} conversation_id - ID de la conversation
 * @property {string} sender_id - ID de l'expéditeur
 * @property {boolean} read - Statut de lecture du message
 * @property {string} created_at - Date de création du message
 */

/**
 * @typedef {Object} Conversation
 * @property {number|string} id - ID de la conversation
 * @property {string} title - Titre de la conversation
 * @property {string[]} participant_ids - IDs des participants
 * @property {number|string} last_message_id - ID du dernier message
 * @property {string} created_at - Date de création
 * @property {string} updated_at - Date de mise à jour
 */

/**
 * @typedef {Object} ExtendedConversation
 * @property {number|string} id - ID de la conversation
 * @property {string} title - Titre de la conversation
 * @property {string[]} participant_ids - IDs des participants
 * @property {Profile[]} participants - Profils des participants
 * @property {string} [last_message] - Dernier message
 * @property {number} last_message_id - ID du dernier message
 * @property {string} [last_message_date] - Date du dernier message
 * @property {string} created_at - Date de création
 * @property {string} updated_at - Date de mise à jour
 */

/**
 * Page de messagerie permettant de voir et d'envoyer des messages
 * @returns {JSX.Element} Composant de la page de messagerie
 */
const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  /**
   * Récupère les conversations de l'utilisateur connecté
   */
  const fetchConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Utilisateur non authentifié');
        return;
      }
      
      setCurrentUserId(user.id);
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*, participants:user_profiles(id, full_name)');
        
      if (error) {
        throw error;
      }
      
      // Transformation des données pour correspondre à l'interface ExtendedConversation
      const formattedData = data.map((conv) => ({
        ...conv,
        participants: conv.participants || [],
        participant_ids: conv.participant_ids || [],
        last_message: 'Chargement...',
        last_message_id: conv.last_message_id,
        last_message_date: conv.updated_at
      }));
      
      setConversations(formattedData);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
      setLoading(false);
    }
  };

  /**
   * Envoie un nouveau message
   * @param {React.FormEvent<HTMLFormElement>} e - Événement de soumission du formulaire
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!selectedConversation || !newMessage.trim()) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: newMessage,
          conversation_id: typeof selectedConversation.id === 'string' 
            ? parseInt(selectedConversation.id, 10) 
            : selectedConversation.id,
          sender_id: currentUserId,
          read: false
        });
        
      if (error) {
        throw error;
      }
      
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  /**
   * Gère la touche Entrée pour envoyer le message
   * @param {React.KeyboardEvent} e - Événement clavier
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const formEvent = { preventDefault: () => {} };
      handleSendMessage(formEvent);
    }
  };

  /**
   * Récupère les messages de la conversation sélectionnée
   */
  const fetchMessages = async () => {
    if (!selectedConversation) {
      return;
    }
      
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', typeof selectedConversation.id === 'string' 
          ? parseInt(selectedConversation.id, 10) 
          : selectedConversation.id)
        .order('created_at', { ascending: true });
          
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        setMessages(data);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
    }
  }, [selectedConversation]);

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Liste des conversations */}
      <Box sx={{ width: 300, borderRight: '1px solid #e0e0e0', p: 2, overflowY: 'auto' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Conversations</Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {conversations.map((conv) => (
              <ListItem 
                button 
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                selected={selectedConversation?.id === conv.id}
                sx={{ 
                  mb: 1, 
                  borderRadius: 1,
                  bgcolor: selectedConversation?.id === conv.id ? 'rgba(0, 0, 0, 0.08)' : 'transparent'
                }}
              >
                <ListItemText 
                  primary={conv.title || 'Sans titre'} 
                  secondary={conv.last_message || 'Aucun message'}
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
      
      {/* Zone de chat */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        {selectedConversation ? (
          <>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {selectedConversation.title || 'Sans titre'}
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            {/* Messages */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2 }}>
              {messages.map((message) => (
                <Box 
                  key={message.id}
                  sx={{ 
                    display: 'flex',
                    justifyContent: message.sender_id === currentUserId ? 'flex-end' : 'flex-start',
                    mb: 1
                  }}
                >
                  <Box 
                    sx={{ 
                      maxWidth: '70%',
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: message.sender_id === currentUserId ? 'primary.main' : 'grey.200',
                      color: message.sender_id === currentUserId ? 'white' : 'text.primary'
                    }}
                  >
                    <Typography variant="body1">{message.content}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            
            {/* Formulaire d'envoi */}
            <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex' }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Écrivez votre message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                size="small"
                sx={{ mr: 1 }}
              />
              <IconButton type="submit" color="primary" disabled={!newMessage.trim()}>
                <SendIcon />
              </IconButton>
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body1" color="text.secondary">
              Sélectionnez une conversation pour commencer à discuter
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MessagesPage;
