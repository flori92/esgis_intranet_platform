/**
 * API Forums par matière — ESGIS Campus §3.8
 */
import { supabase } from '../supabase';

/** Récupère les forums accessibles à un utilisateur */
export const getForums = async (userId, role) => {
  try {
    let query = supabase
      .from('forums')
      .select(`
        id, created_at,
        cours:cours_id(
          id, code, name,
          professeur:professeur_id(id, full_name),
          niveau:niveau_id(id, code, name)
        )
      `);

    const { data, error } = await query;
    if (error) throw error;

    // Enrichir avec le nombre de posts et les non-lus
    const enriched = await Promise.all((data || []).map(async (forum) => {
      const { count: postsCount } = await supabase
        .from('forum_posts')
        .select('id', { count: 'exact', head: true })
        .eq('forum_id', forum.id);

      const { data: lastPost } = await supabase
        .from('forum_posts')
        .select('created_at')
        .eq('forum_id', forum.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        ...forum,
        posts_count: postsCount || 0,
        last_activity: lastPost?.created_at || forum.created_at,
      };
    }));

    return { data: enriched, error: null };
  } catch (error) {
    console.error('getForums:', error);
    return { data: null, error };
  }
};

/** Récupère les posts d'un forum */
export const getForumPosts = async (forumId) => {
  try {
    const { data, error } = await supabase
      .from('forum_posts')
      .select(`
        id, content, pinned, likes_count, created_at, updated_at,
        author:author_id(id, full_name, avatar_url, role)
      `)
      .eq('forum_id', forumId)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Charger les réponses pour chaque post
    const postsWithReplies = await Promise.all((data || []).map(async (post) => {
      const { data: replies } = await supabase
        .from('forum_replies')
        .select(`
          id, content, likes_count, created_at,
          author:author_id(id, full_name, avatar_url, role)
        `)
        .eq('post_id', post.id)
        .order('created_at');

      return { ...post, replies: replies || [] };
    }));

    return { data: postsWithReplies, error: null };
  } catch (error) {
    console.error('getForumPosts:', error);
    return { data: null, error };
  }
};

/** Crée un nouveau post */
export const createForumPost = async (forumId, authorId, content) => {
  try {
    const { data, error } = await supabase
      .from('forum_posts')
      .insert({ forum_id: forumId, author_id: authorId, content })
      .select(`*, author:author_id(id, full_name, avatar_url, role)`);
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Crée une réponse à un post */
export const createForumReply = async (postId, authorId, content) => {
  try {
    const { data, error } = await supabase
      .from('forum_replies')
      .insert({ post_id: postId, author_id: authorId, content })
      .select(`*, author:author_id(id, full_name, avatar_url, role)`);
    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Basculer le like sur un post ou une réponse */
export const toggleLike = async (userId, postId = null, replyId = null) => {
  try {
    const filter = postId ? { user_id: userId, post_id: postId } : { user_id: userId, reply_id: replyId };
    const { data: existing } = await supabase
      .from('forum_likes')
      .select('id')
      .match(filter)
      .single();

    if (existing) {
      await supabase.from('forum_likes').delete().eq('id', existing.id);
      if (postId) await supabase.rpc('decrement_post_likes', { pid: postId });
      if (replyId) await supabase.rpc('decrement_reply_likes', { rid: replyId });
      return { liked: false };
    } else {
      await supabase.from('forum_likes').insert(filter);
      if (postId) await supabase.rpc('increment_post_likes', { pid: postId });
      if (replyId) await supabase.rpc('increment_reply_likes', { rid: replyId });
      return { liked: true };
    }
  } catch (error) {
    console.error('toggleLike:', error);
    return { liked: false, error };
  }
};

/** Épingler / Désépingler un post (professeur/admin) */
export const togglePin = async (postId) => {
  try {
    const { data: post } = await supabase
      .from('forum_posts')
      .select('pinned')
      .eq('id', postId)
      .single();

    const { error } = await supabase
      .from('forum_posts')
      .update({ pinned: !post?.pinned })
      .eq('id', postId);
    if (error) throw error;
    return { pinned: !post?.pinned, error: null };
  } catch (error) {
    return { error };
  }
};

/** Supprimer un post */
export const deleteForumPost = async (postId) => {
  try {
    const { error } = await supabase.from('forum_posts').delete().eq('id', postId);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};
