import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  TextField, Chip, IconButton, Tooltip, Divider, Snackbar, Card,
  CardContent, Avatar, List, ListItem, ListItemAvatar, ListItemText,
  FormControl, InputLabel, Select, MenuItem, Badge
} from '@mui/material';
import {
  Forum as ForumIcon,
  Send as SendIcon,
  Reply as ReplyIcon,
  Delete as DeleteIcon,
  ThumbUp as ThumbUpIcon,
  Pin as PinIcon,
  ArrowBack as BackIcon,
  School as SchoolIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';

const MOCK_FORUMS = [
  { id: 'f1', matiere: 'Développement Web Frontend', code: 'INFO-345', niveau: 'L3', professeur: 'Prof. MENSAH', posts_count: 24, last_activity: '2026-04-03T09:15:00Z', unread: 3 },
  { id: 'f2', matiere: 'Algorithmique Avancée', code: 'INFO-221', niveau: 'L2', professeur: 'Prof. DOSSEH', posts_count: 12, last_activity: '2026-04-02T16:00:00Z', unread: 0 },
  { id: 'f3', matiere: 'Base de Données Relationnelles', code: 'INFO-234', niveau: 'L2', professeur: 'Prof. AGBEKO', posts_count: 18, last_activity: '2026-04-01T11:30:00Z', unread: 1 },
];

const MOCK_POSTS = [
  { id: 'p1', forum_id: 'f1', author: 'KPOMASSE Yao', role: 'student', avatar: null, content: 'Bonjour, est-ce que quelqu\'un peut m\'expliquer la différence entre useEffect et useLayoutEffect en React ?', created_at: '2026-04-03T09:15:00Z', likes: 5, pinned: false, replies: [
    { id: 'r1', author: 'Prof. MENSAH', role: 'professor', content: 'Bonne question ! useEffect s\'exécute après le rendu, tandis que useLayoutEffect s\'exécute de manière synchrone après les mutations du DOM mais avant le paint. Utilisez useLayoutEffect uniquement si vous devez mesurer le DOM.', created_at: '2026-04-03T09:30:00Z', likes: 8 },
    { id: 'r2', author: 'DOSSEH Ama', role: 'student', content: 'Merci Prof ! Donc en pratique, useEffect suffit dans 95% des cas ?', created_at: '2026-04-03T09:45:00Z', likes: 2 },
  ]},
  { id: 'p2', forum_id: 'f1', author: 'Prof. MENSAH', role: 'professor', avatar: null, content: '📌 Rappel : le TP3 sur les hooks React est à rendre pour vendredi 5 avril. Déposez votre archive ZIP sur la plateforme.', created_at: '2026-04-02T14:00:00Z', likes: 0, pinned: true, replies: [] },
  { id: 'p3', forum_id: 'f1', author: 'AMEGAH Komi', role: 'student', avatar: null, content: 'Pour le projet final, est-ce qu\'on peut utiliser Next.js au lieu de React pur ?', created_at: '2026-04-01T10:00:00Z', likes: 3, pinned: false, replies: [
    { id: 'r3', author: 'Prof. MENSAH', role: 'professor', content: 'Oui, Next.js est accepté. C\'est même encouragé pour ceux qui veulent aller plus loin.', created_at: '2026-04-01T11:00:00Z', likes: 6 },
  ]},
];

/**
 * Page Forums par matière — ESGIS Campus §3.8
 */
const ForumPage = () => {
  const { authState } = useAuth();
  const { isProfessor } = authState;
  const [forums, setForums] = useState([]);
  const [selectedForum, setSelectedForum] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => { setForums(MOCK_FORUMS); setLoading(false); }, 300);
  }, []);

  const handleSelectForum = (forum) => {
    setSelectedForum(forum);
    setPosts(MOCK_POSTS.filter(p => p.forum_id === forum.id));
  };

  const handleNewPost = () => {
    if (!newPostContent.trim()) return;
    setPosting(true);
    const newPost = {
      id: `p${Date.now()}`, forum_id: selectedForum.id,
      author: isProfessor ? 'Prof. Vous' : 'Vous',
      role: isProfessor ? 'professor' : 'student',
      content: newPostContent, created_at: new Date().toISOString(),
      likes: 0, pinned: false, replies: []
    };
    setPosts(prev => [newPost, ...prev]);
    setNewPostContent('');
    setPosting(false);
    setSuccessMessage('Message publié.');
  };

  const handleReply = (postId) => {
    if (!replyContent.trim()) return;
    const newReply = {
      id: `r${Date.now()}`,
      author: isProfessor ? 'Prof. Vous' : 'Vous',
      role: isProfessor ? 'professor' : 'student',
      content: replyContent,
      created_at: new Date().toISOString(), likes: 0
    };
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, replies: [...p.replies, newReply] } : p
    ));
    setReplyTo(null);
    setReplyContent('');
    setSuccessMessage('Réponse publiée.');
  };

  const handleLike = (postId, replyId = null) => {
    if (replyId) {
      setPosts(prev => prev.map(p => p.id === postId
        ? { ...p, replies: p.replies.map(r => r.id === replyId ? { ...r, likes: r.likes + 1 } : r) }
        : p
      ));
    } else {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
    }
  };

  const handlePin = (postId) => {
    if (!isProfessor) return;
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, pinned: !p.pinned } : p));
  };

  const handleDeletePost = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setSuccessMessage('Message supprimé.');
  };

  const formatDate = (d) => {
    try { return format(new Date(d), "dd MMM yyyy 'à' HH:mm", { locale: fr }); } catch { return d; }
  };

  const getRoleChip = (role) => {
    if (role === 'professor') return <Chip label="Professeur" size="small" color="info" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />;
    return null;
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage('')} message={successMessage} />

      {!selectedForum ? (
        /* === LISTE DES FORUMS === */
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <ForumIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
            <Typography variant="h5" fontWeight="bold">Forums par matière</Typography>
          </Box>
          <Grid container spacing={2}>
            {forums.map(forum => (
              <Grid item xs={12} md={6} key={forum.id}>
                <Card elevation={2} sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
                  onClick={() => handleSelectForum(forum)}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">{forum.matiere}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {forum.code} — {forum.niveau} • {forum.professeur}
                        </Typography>
                      </Box>
                      {forum.unread > 0 && (
                        <Badge badgeContent={forum.unread} color="error">
                          <ForumIcon color="action" />
                        </Badge>
                      )}
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Chip label={`${forum.posts_count} messages`} size="small" variant="outlined" />
                      <Typography variant="caption" color="text.secondary">
                        Dernière activité : {formatDate(forum.last_activity)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      ) : (
        /* === FORUM SÉLECTIONNÉ === */
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
            <IconButton onClick={() => setSelectedForum(null)}><BackIcon /></IconButton>
            <Box>
              <Typography variant="h5" fontWeight="bold">{selectedForum.matiere}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedForum.code} — {selectedForum.professeur}
              </Typography>
            </Box>
          </Box>

          {/* Nouveau message */}
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <TextField fullWidth multiline rows={2} placeholder="Écrire un message..."
              value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button variant="contained" startIcon={<SendIcon />} onClick={handleNewPost}
                disabled={posting || !newPostContent.trim()}>
                Publier
              </Button>
            </Box>
          </Paper>

          {/* Posts épinglés en premier */}
          {[...posts].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)).map(post => (
            <Paper key={post.id} elevation={1} sx={{
              p: 2, mb: 2,
              borderLeft: post.pinned ? '4px solid' : 'none',
              borderColor: post.pinned ? 'warning.main' : 'transparent',
              bgcolor: post.pinned ? 'warning.50' : 'transparent'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: post.role === 'professor' ? '#003366' : '#CC0000', fontSize: '0.9rem' }}>
                    {post.author?.[0]}
                  </Avatar>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle2" fontWeight="bold">{post.author}</Typography>
                      {getRoleChip(post.role)}
                      {post.pinned && <Chip icon={<PinIcon />} label="Épinglé" size="small" color="warning" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />}
                    </Box>
                    <Typography variant="caption" color="text.secondary">{formatDate(post.created_at)}</Typography>
                  </Box>
                </Box>
                <Box>
                  {isProfessor && (
                    <Tooltip title={post.pinned ? 'Désépingler' : 'Épingler'}>
                      <IconButton size="small" onClick={() => handlePin(post.id)}>
                        <PinIcon fontSize="small" color={post.pinned ? 'warning' : 'action'} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {(isProfessor || post.author?.includes('Vous')) && (
                    <Tooltip title="Supprimer">
                      <IconButton size="small" color="error" onClick={() => handleDeletePost(post.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>

              <Typography variant="body1" sx={{ mt: 1, mb: 1.5, whiteSpace: 'pre-wrap' }}>{post.content}</Typography>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" startIcon={<ThumbUpIcon />} onClick={() => handleLike(post.id)}>
                  {post.likes}
                </Button>
                <Button size="small" startIcon={<ReplyIcon />} onClick={() => setReplyTo(replyTo === post.id ? null : post.id)}>
                  Répondre ({post.replies?.length || 0})
                </Button>
              </Box>

              {/* Réponses */}
              {post.replies && post.replies.length > 0 && (
                <Box sx={{ ml: 4, mt: 1, borderLeft: '2px solid', borderColor: 'grey.200', pl: 2 }}>
                  {post.replies.map(reply => (
                    <Box key={reply.id} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: reply.role === 'professor' ? '#003366' : '#999' }}>
                          {reply.author?.[0]}
                        </Avatar>
                        <Typography variant="caption" fontWeight="bold">{reply.author}</Typography>
                        {getRoleChip(reply.role)}
                        <Typography variant="caption" color="text.secondary">{formatDate(reply.created_at)}</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ ml: 4, mt: 0.5 }}>{reply.content}</Typography>
                      <Button size="small" startIcon={<ThumbUpIcon />} sx={{ ml: 3 }}
                        onClick={() => handleLike(post.id, reply.id)}>{reply.likes}</Button>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Zone de réponse */}
              {replyTo === post.id && (
                <Box sx={{ ml: 4, mt: 1, display: 'flex', gap: 1 }}>
                  <TextField size="small" fullWidth placeholder="Votre réponse..."
                    value={replyContent} onChange={(e) => setReplyContent(e.target.value)} />
                  <Button variant="contained" size="small" onClick={() => handleReply(post.id)}
                    disabled={!replyContent.trim()}>
                    <SendIcon fontSize="small" />
                  </Button>
                </Box>
              )}
            </Paper>
          ))}
        </>
      )}
    </Box>
  );
};

export default ForumPage;
