import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button,
  TextField, Chip, IconButton, Tooltip, Divider, Snackbar, Card,
  CardContent, Avatar, Badge
} from '@mui/material';
import {
  Forum as ForumIcon, Send as SendIcon, Reply as ReplyIcon,
  Delete as DeleteIcon, ThumbUp as ThumbUpIcon, PushPin as PinIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import {
  getForums, getForumPosts, createForumPost, createForumReply,
  toggleLike, togglePin, deleteForumPost
} from '@/api/forums';

const ForumPage = () => {
  const { authState } = useAuth();
  const userRole = authState.isProfessor ? 'professor' : 'student';
  const userId = authState.user?.id || authState.profile?.id;
  const userName = authState.profile?.full_name || 'Utilisateur';

  const [forums, setForums] = useState([]);
  const [selectedForum, setSelectedForum] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [posting, setPosting] = useState(false);

  const loadForums = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: apiError } = await getForums(userId, userRole);
      if (apiError) throw apiError;
      setForums((data || []).map(f => ({
        id: f.id,
        course_id: f.course_id,
        matiere: f.course?.name || f.cours?.name || '-',
        code: f.course?.code || f.cours?.code || '-',
        niveau: f.course?.level || '',
        professeur: '-',
        posts_count: f.posts_count || 0,
        last_activity: f.last_activity || f.created_at,
      })));
    } catch (err) {
      setError('Erreur lors du chargement des forums');
      setForums([]);
    } finally {
      setLoading(false);
    }
  }, [userId, userRole]);

  useEffect(() => { loadForums(); }, [loadForums]);

  const handleSelectForum = async (forum) => {
    setSelectedForum(forum);
    setLoadingPosts(true);
    try {
      const { data, error: apiError } = await getForumPosts(forum.id);
      if (apiError) throw apiError;
      setPosts((data || []).map(p => ({
        id: p.id,
        forum_id: p.forum_id,
        author: p.author?.full_name || 'Anonyme',
        author_id: p.author_id,
        role: p.author?.role || 'student',
        content: p.content,
        created_at: p.created_at,
        likes: p.likes_count || 0,
        pinned: p.pinned || false,
        replies: (p.replies || []).map(r => ({
          id: r.id,
          author: r.author?.full_name || 'Anonyme',
          author_id: r.author_id,
          role: r.author?.role || 'student',
          content: r.content,
          created_at: r.created_at,
          likes: r.likes_count || 0,
        })),
      })));
    } catch (err) {
      setError('Erreur lors du chargement des messages');
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleNewPost = async () => {
    if (!newPostContent.trim() || !selectedForum) return;
    setPosting(true);
    try {
      const { error: apiError } = await createForumPost(selectedForum.id, userId, newPostContent);
      if (apiError) throw apiError;
      setNewPostContent('');
      setSuccessMessage('Message publié.');
      await handleSelectForum(selectedForum);
    } catch (err) {
      setError('Erreur lors de la publication');
    } finally {
      setPosting(false);
    }
  };

  const handleReply = async (postId) => {
    if (!replyContent.trim()) return;
    try {
      const { error: apiError } = await createForumReply(postId, userId, replyContent);
      if (apiError) throw apiError;
      setReplyTo(null);
      setReplyContent('');
      setSuccessMessage('Réponse publiée.');
      await handleSelectForum(selectedForum);
    } catch (err) {
      setError('Erreur lors de la réponse');
    }
  };

  const handleLike = async (postId, replyId = null) => {
    try {
      await toggleLike(userId, postId, replyId);
      await handleSelectForum(selectedForum);
    } catch (err) {
      // silently fail likes
    }
  };

  const handlePin = async (postId) => {
    if (userRole !== 'professor') return;
    try {
      await togglePin(postId);
      await handleSelectForum(selectedForum);
    } catch (err) {
      setError('Erreur lors de l\'épinglage');
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await deleteForumPost(postId);
      setSuccessMessage('Message supprimé.');
      await handleSelectForum(selectedForum);
    } catch (err) {
      setError('Erreur lors de la suppression');
    }
  };

  const formatDate = (d) => {
    try { return format(new Date(d), "dd MMM yyyy 'à' HH:mm", { locale: fr }); } catch { return d || ''; }
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
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <ForumIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
            <Typography variant="h5" fontWeight="bold">Forums par matière</Typography>
          </Box>

          {forums.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <ForumIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography color="text.secondary">Aucun forum disponible pour le moment.</Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {forums.map(forum => (
                <Grid item xs={12} md={6} key={forum.id}>
                  <Card elevation={2} sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
                    onClick={() => handleSelectForum(forum)}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold">{forum.matiere}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {forum.code} {forum.niveau ? `— ${forum.niveau}` : ''}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Chip label={`${forum.posts_count} messages`} size="small" variant="outlined" />
                        {forum.last_activity && (
                          <Typography variant="caption" color="text.secondary">
                            Dernière activité : {formatDate(forum.last_activity)}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      ) : (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
            <IconButton onClick={() => { setSelectedForum(null); setPosts([]); }}><BackIcon /></IconButton>
            <Box>
              <Typography variant="h5" fontWeight="bold">{selectedForum.matiere}</Typography>
              <Typography variant="body2" color="text.secondary">{selectedForum.code}</Typography>
            </Box>
          </Box>

          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <TextField fullWidth multiline rows={2} placeholder="Écrire un message..."
              value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button variant="contained" startIcon={<SendIcon />} onClick={handleNewPost}
                disabled={posting || !newPostContent.trim()}>
                {posting ? 'Publication...' : 'Publier'}
              </Button>
            </Box>
          </Paper>

          {loadingPosts ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : posts.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">Aucun message dans ce forum. Soyez le premier !</Typography>
            </Paper>
          ) : (
            [...posts].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)).map(post => (
              <Paper key={post.id} elevation={1} sx={{
                p: 2, mb: 2,
                borderLeft: post.pinned ? '4px solid' : 'none',
                borderColor: post.pinned ? 'warning.main' : 'transparent',
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
                    {userRole === 'professor' && (
                      <Tooltip title={post.pinned ? 'Désépingler' : 'Épingler'}>
                        <IconButton size="small" onClick={() => handlePin(post.id)}>
                          <PinIcon fontSize="small" color={post.pinned ? 'warning' : 'action'} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {(userRole === 'professor' || post.author_id === userId) && (
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
                  <Button size="small" startIcon={<ThumbUpIcon />} onClick={() => handleLike(post.id)}>{post.likes}</Button>
                  <Button size="small" startIcon={<ReplyIcon />} onClick={() => setReplyTo(replyTo === post.id ? null : post.id)}>
                    Répondre ({post.replies?.length || 0})
                  </Button>
                </Box>

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
            ))
          )}
        </>
      )}
    </Box>
  );
};

export default ForumPage;
