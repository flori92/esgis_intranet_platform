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
import { supabase } from '../../utils/supabase';
import { Conversation, Message } from '../../types/supabase.types';

interface Participant {
  id: string;
  name: string;
}

interface ExtendedConversation extends Conversation {
  participants: Participant[];
}

const MessagesPage: React.FC = () => {
  const [conversations, setConversations] = useState<ExtendedConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ExtendedConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, participants:user_profiles(id, name)');

      if (error) throw error;
      setConversations(data as ExtendedConversation[]);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      // Obtenir l'ID utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id ?? '';

      if (!currentUserId) {
        console.error("Utilisateur non connecté");
        return;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: newMessage,
          conversation_id: selectedConversation.id,
          sender_id: currentUserId
        })
        .select();

      if (error) throw error;
      
      setMessages([...messages, data[0] as Message]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Gérer la touche Entrée pour envoyer le message
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) return;
      
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', selectedConversation.id)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        setMessages(data as Message[]);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [selectedConversation]);

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ p: 2 }}>Conversations</Typography>
        <Divider />
        {loading ? (
          <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />
        ) : (
          <List>
            {conversations.map((conv) => (
              <ListItem 
                button 
                key={conv.id}
                selected={selectedConversation?.id === conv.id}
                onClick={() => setSelectedConversation(conv)}
              >
                <ListItemText 
                  primary={conv.title} 
                  secondary={conv.participants.map(p => p.name).join(', ')}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Chat area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedConversation && (
          <>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">{selectedConversation.title}</Typography>
              <Typography variant="subtitle2">
                Participants: {selectedConversation.participants.map(p => p.name).join(', ')}
              </Typography>
            </Box>
            
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {messages.map((msg) => (
                <Box key={msg.id} sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(msg.created_at).toLocaleString()}
                  </Typography>
                  <Typography>{msg.content}</Typography>
                </Box>
              ))}
            </Box>
            
            <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Type a message"
                value={newMessage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.currentTarget.value)}
                onKeyPress={handleKeyPress}
                InputProps={{
                  endAdornment: (
                    <IconButton type="submit" color="primary">
                      <SendIcon />
                    </IconButton>
                  )
                }}
              />
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default MessagesPage;
