import { supabase, isSupabaseConfigured } from './supabase.js';

let cachedSessionId = null;
let cachedUserId = null;

export async function ensureChatSession(lang = 'EN', currency = 'IDR') {
  if (!isSupabaseConfigured || !supabase) return null;
  if (cachedSessionId) return cachedSessionId;

  // anonymous sign-in (idempotent: SDK restores existing session)
  let { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    session = data.session;
  }
  cachedUserId = session.user.id;

  // latest session for this user
  const { data: sessions, error: listErr } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('user_id', cachedUserId)
    .order('updated_at', { ascending: false })
    .limit(1);
  if (listErr) throw listErr;

  if (sessions && sessions.length) {
    cachedSessionId = sessions[0].id;
    return cachedSessionId;
  }

  const { data: created, error: createErr } = await supabase
    .from('chat_sessions')
    .insert({ user_id: cachedUserId, lang, currency, title: 'Chat' })
    .select('id')
    .single();
  if (createErr) throw createErr;
  cachedSessionId = created.id;
  return cachedSessionId;
}

export async function loadChatMessages(sessionId) {
  if (!isSupabaseConfigured || !supabase || !sessionId) return null;
  const { data, error } = await supabase
    .from('chat_messages')
    .select('role,content,recommended_ids,provider')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((m) => ({
    role: m.role,
    content: m.content,
    recommendedIds: m.recommended_ids || [],
    provider: m.provider || undefined,
  }));
}

export async function saveChatMessage(sessionId, msg) {
  if (!isSupabaseConfigured || !supabase || !sessionId) return;
  try {
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role: msg.role,
      content: msg.content,
      recommended_ids: msg.recommendedIds || [],
      provider: msg.provider || null,
    });
    await supabase.from('chat_sessions').update({ lang: msg.lang, currency: msg.currency }).eq('id', sessionId);
  } catch (e) {
    console.error('saveChatMessage failed', e);
  }
}

export function resetCachedSession() {
  cachedSessionId = null;
  cachedUserId = null;
}
