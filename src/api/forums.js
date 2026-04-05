/**
 * API Forums par matière — ESGIS Campus §3.8
 */
import { supabase } from '../supabase';

const getAccessibleCourseIds = async (userId, role) => {
  if (!userId) return [];

  if (role === 'student') {
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('student_courses')
      .select('course_id')
      .eq('student_id', userId);

    if (enrollmentError) throw enrollmentError;
    return [...new Set((enrollments || []).map((item) => item.course_id).filter(Boolean))];
  }

  if (role === 'professor') {
    const { data: assignments, error: assignmentError } = await supabase
      .from('professor_courses')
      .select('course_id')
      .eq('professor_id', userId);

    if (assignmentError) throw assignmentError;
    return [...new Set((assignments || []).map((item) => item.course_id).filter(Boolean))];
  }

  return [];
};

/** Récupère les forums accessibles à un utilisateur */
export const getForums = async (userId, role) => {
  try {
    const accessibleCourseIds = await getAccessibleCourseIds(userId, role);
    if ((role === 'student' || role === 'professor') && accessibleCourseIds.length === 0) {
      return { data: [], error: null };
    }

    let query = supabase
      .from('forums')
      .select('id, created_at, course_id');

    if (accessibleCourseIds.length) {
      query = query.in('course_id', accessibleCourseIds);
    }

    const { data, error } = await query;
    if (error) throw error;

    const courseIds = [...new Set((data || []).map((forum) => forum.course_id).filter(Boolean))];
    const [{ data: courses, error: coursesError }, { data: assignments, error: assignmentsError }] = await Promise.all([
      courseIds.length
        ? supabase
            .from('courses')
            .select('id, code, name, level')
            .in('id', courseIds)
        : Promise.resolve({ data: [], error: null }),
      courseIds.length
        ? supabase
            .from('professor_courses')
            .select(`
              course_id,
              is_principal,
              professors(
                id,
                profile_id,
                profiles(
                  full_name
                )
              )
            `)
            .in('course_id', courseIds)
            .order('is_principal', { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (coursesError) throw coursesError;
    if (assignmentsError) throw assignmentsError;

    const courseMap = new Map((courses || []).map((course) => [course.id, course]));
    const professorByCourse = new Map();
    (assignments || []).forEach((assignment) => {
      if (!professorByCourse.has(assignment.course_id)) {
        professorByCourse.set(assignment.course_id, assignment.professors?.profiles?.full_name || '-');
      }
    });

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

      const course = courseMap.get(forum.course_id);
      return {
        ...forum,
        cours: course ? {
          id: course.id,
          code: course.code,
          name: course.name,
          professeur: {
            full_name: professorByCourse.get(course.id) || '-',
          },
          niveau: {
            code: course.level,
            name: course.level,
          },
        } : null,
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
        author:profiles!author_id(id, full_name, avatar_url, role)
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
          author:profiles!author_id(id, full_name, avatar_url, role)
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
      .select(`*, author:profiles!author_id(id, full_name, avatar_url, role)`);
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
      .select(`*, author:profiles!author_id(id, full_name, avatar_url, role)`);
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

/** Modifier un post */
export const updateForumPost = async (postId, content) => {
  try {
    const { data, error } = await supabase
      .from('forum_posts')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', postId)
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/** Rechercher dans les posts d'un forum */
export const searchForumPosts = async (forumId, query) => {
  try {
    const searchTerm = `%${query}%`;
    const { data, error } = await supabase
      .from('forum_posts')
      .select(`
        id, content, pinned, likes_count, created_at, updated_at,
        author:profiles!author_id(id, full_name, role)
      `)
      .eq('forum_id', forumId)
      .ilike('content', searchTerm)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
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
