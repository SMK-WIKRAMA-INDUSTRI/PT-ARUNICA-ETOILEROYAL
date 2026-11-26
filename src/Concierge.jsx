import { useEffect, useRef, useState } from 'react';

const AGENT_NAME = 'Fitri';
const CALL_RULES = [
  `Namamu ${AGENT_NAME}.`,
  'Pelanggan sedang menelepon, jadi jawabanmu akan dibacakan dengan suara.',
  'Pakai bahasa lisan sehari-hari yang tetap sopan, misalnya "oke", "nah", atau "ya".',
  'Jawab paling banyak tiga kalimat pendek dan langsung ke intinya.',
  'Jangan membuka jawaban dengan sapaan atau ucapan terima kasih sudah menunggu, karena aplikasi sudah mengucapkannya.',
  'Tulis angka, jam, dan harga dengan huruf, misalnya sepuluh ribu rupiah atau pukul sembilan pagi.',
  'Jangan memakai daftar, tanda bintang, atau simbol lain.',
].join('\\n');
const CHECKING_LINES_BY_LANG = {
  ID: ['Oke Kak, sebentar ya, saya cek dulu.', 'Baik Kak, saya cek terlebih dahulu ya.', 'Hmm, sebentar ya Kak, saya lihat datanya dulu.'],
  EN: ['Sure, one moment while I check.', 'Okay, let me look that up for you.', 'Hmm, just a second while I check.'],
};
const STILL_CHECKING_LINE_BY_LANG = {
  ID: 'Masih saya cek ya Kak, mohon ditunggu sebentar.',
  EN: 'Still checking, please hold on a moment.',
};
const THANKS_FOR_WAITING_LINES_BY_LANG = {
  ID: ['Makasih sudah menunggu ya Kak.', 'Oke Kak, sudah saya cek ya.'],
  EN: ['Thanks for waiting.', 'Alright, I checked that for you.'],
};
const SMALL_TALK_BY_LANG = {
  ID: /^(halo|hai|oke|ok|baik|siap|sip|iya|ya|makasih|terima kasih)\\b/i,
  EN: /^(hi|hello|hey|ok|okay|thanks|thank you|yes|yeah|sure)\\b/i,
};
const CHECKING_DELAY_MS = 1000;
const STILL_CHECKING_DELAY_MS = 6000;
const DEEPGRAM_SPEAK_URL = 'https://api.deepgram.com/v2/speak?model=flux-fitri-id&encoding=mp3';
const MAX_CALL_SECONDS = 300;
import { LANGUAGES, useI18n } from './i18n.jsx';
import { localizeDish, MENU_DATA } from './data.js';
import { askConcierge } from './concierge.js';
import { imageFor } from './foodImages.js';
import { useDialog } from './hooks.js';

export default function Concierge({ open, onClose, lang, onLang, currency, messages, typing, error, providerLabel, onSend, onAppendMessage, onPickDish, onAddDish }) {
  const { t, fmt } = useI18n();
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const endRef = useRef(null);
  const formRef = useRef(null);
  const [draft, setDraft] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('idle'); // idle | connecting | recording | transcribing
  const [voiceError, setVoiceError] = useState('');
  const voiceStatusRef = useRef('idle');
  const dictationRef = useRef({ socket: null, stream: null, recorder: null, typedText: '', finalText: '', interimText: '', stopping: false, timer: null });
  useEffect(() => { voiceStatusRef.current = voiceStatus; }, [voiceStatus]);

  const [callStatus, setCallStatus] = useState('off'); // off | connecting | listening | thinking | speaking
  const [callTranscript, setCallTranscript] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [callError, setCallError] = useState('');
  const callStatusRef = useRef('off');
  const callRef = useRef({ socket: null, stream: null, recorder: null, finalText: '', interimText: '', turnEnded: false, lineAudio: {}, keepAliveTimer: null, durationTimer: null, timer: null });
  useEffect(() => { callStatusRef.current = callStatus; }, [callStatus]);
  useEffect(() => {
    return () => {
      const d = dictationRef.current;
      clearTimeout(d.timer);
      if (d.recorder && d.recorder.state !== 'inactive') { try { d.recorder.stop(); } catch { /* ignore */ } }
      if (d.stream) d.stream.getTracks().forEach((track) => track.stop());
      if (d.socket && d.socket.readyState === WebSocket.OPEN) { try { d.socket.close(); } catch { /* ignore */ } }
    };
  }, []);
  useDialog({ open, onClose, containerRef: panelRef, initialRef: inputRef, trap: true });

  if (!open) return null;

  const quickPrompts = [t('quick1'), t('quick2'), t('quick3'), t('quick4')];

  const submit = (e) => {
    e.preventDefault();
    if (!draft.trim() || typing) return;
    onSend(draft);
    setDraft('');
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ block: 'end' }));
  };

  const collectTranscript = (data) => {
    const text = data?.channel?.alternatives?.[0]?.transcript || '';
    const d = dictationRef.current;
    if (data.is_final) {
      if (text) d.finalText = `${d.finalText} ${text}`.trim();
      d.interimText = '';
    } else {
      d.interimText = text;
    }
    return `${d.finalText} ${d.interimText}`.trim();
  };

  const envDeepgramKey = (import.meta.env.API_DIAGRAM_VOICE || '').trim();
  const getDeepgramKey = () => {
    if (envDeepgramKey) return envDeepgramKey;
    try { return localStorage.getItem('etoile.deepgramKey') || ''; } catch { return ''; }
  };
  const setDeepgramKey = (k) => { try { localStorage.setItem('etoile.deepgramKey', k); } catch { /* ignore */ } };

  const ensureDeepgramKey = () => {
    if (envDeepgramKey) return envDeepgramKey;
    let key = getDeepgramKey();
    if (!key) {
      key = window.prompt(t('deepgramKeyPrompt') || 'Tempel API key Deepgram (untuk input suara):');
      if (key) setDeepgramKey(key.trim());
    }
    return key ? key.trim() : '';
  };

  const getMicrophone = async () => {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error(t('micUnsupported') || 'Browser ini tidak mendukung mikrofon.');
    try { return await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { throw new Error(t('micPermissionDenied') || 'Izin mikrofon ditolak atau mikrofon tidak tersedia.'); }
  };

  const openDeepgramSocket = (apiKey) => {
    const language = lang === 'ID' ? 'id' : 'en';
    const url = `wss://api.deepgram.com/v1/listen?model=nova-3&language=${language}&smart_format=true&interim_results=true&endpointing=500&utterance_end_ms=1000`;
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url, ['token', apiKey]);
      socket.addEventListener('open', () => resolve(socket));
      socket.addEventListener('error', () => reject(new Error(t('deepgramConnectFailed') || 'Gagal tersambung ke Deepgram. Periksa API key Deepgram dan koneksi internet.')));
    });
  };

  const finishRecording = () => {
    const d = dictationRef.current;
    clearTimeout(d.timer);
    if (d.recorder && d.recorder.state !== 'inactive') { try { d.recorder.stop(); } catch { /* ignore */ } }
    if (d.stream) d.stream.getTracks().forEach((track) => track.stop());
    const { typedText, finalText, interimText, stopping } = d;
    const heard = stopping ? finalText : `${finalText} ${interimText}`.trim();
    const transcript = `${typedText} ${heard}`.trim();
    setDraft(transcript);
    setVoiceStatus('idle');
    if (!stopping) {
      setVoiceError(t('deepgramDisconnected') || 'Sambungan ke Deepgram terputus. Teks yang sudah terdengar ada di kolom pertanyaan.');
    } else if (!finalText && !interimText) {
      setVoiceError(t('voiceNotHeard') || 'Suara tidak terdengar jelas. Dekatkan mikrofon, lalu coba lagi.');
    } else if (transcript && !typing) {
      setDraft('');
      onSend(transcript);
    }
  };

  const stopRecording = () => {
    const d = dictationRef.current;
    if (voiceStatusRef.current !== 'recording') return;
    clearTimeout(d.timer);
    d.stopping = true;
    try { d.recorder.stop(); } catch { /* ignore */ }
    setVoiceStatus('transcribing');
  };

  const startRecording = async () => {
    const apiKey = ensureDeepgramKey();
    if (!apiKey) return;
    setVoiceError('');
    setVoiceStatus('connecting');
    const d = dictationRef.current;
    d.typedText = draft.trim();
    d.finalText = '';
    d.interimText = '';
    d.stopping = false;
    let stream;
    try { stream = await getMicrophone(); }
    catch (e) { setVoiceError(e.message); setVoiceStatus('idle'); return; }
    d.stream = stream;
    let socket;
    try { socket = await openDeepgramSocket(apiKey); }
    catch (e) {
      stream.getTracks().forEach((track) => track.stop());
      setVoiceError(e.message);
      setVoiceStatus('idle');
      return;
    }
    d.socket = socket;
    const recorder = new MediaRecorder(stream);
    d.recorder = recorder;
    socket.addEventListener('message', (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      if (data.type !== 'Results') return;
      const heard = collectTranscript(data);
      setDraft(`${d.typedText} ${heard}`.trim());
    });
    socket.addEventListener('close', () => finishRecording());
    recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) socket.send(event.data);
    });
    recorder.addEventListener('stop', () => {
      stream.getTracks().forEach((track) => track.stop());
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'CloseStream' }));
      setTimeout(() => { try { socket.close(); } catch { /* ignore */ } }, 5000);
    });
    recorder.start(250);
    d.timer = setTimeout(stopRecording, 30000);
    setVoiceStatus('recording');
  };

  const handleMic = () => {
    if (voiceStatus === 'recording') stopRecording();
    else if (voiceStatus === 'idle') startRecording();
  };

  // ---------- Tingkat 4: panggilan suara ----------
  const buildGreeting = () => {
    const hour = new Date().getHours();
    if (lang === 'ID') {
      const time = hour < 11 ? 'pagi' : hour < 15 ? 'siang' : hour < 18 ? 'sore' : 'malam';
      return `Halo, selamat ${time}! Dengan ${AGENT_NAME} dari customer service. Ada yang bisa saya bantu, Kak?`;
    }
    const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    return `Hello, good ${time}! This is ${AGENT_NAME} from customer service. How can I help you today?`;
  };

  const activeLang = lang === 'ID' ? 'ID' : 'EN';
  const needsChecking = (question) => !SMALL_TALK_BY_LANG[activeLang].test(question.trim());

  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const settlesWithin = (promise, ms) => {
    const settled = promise.then(() => true, () => true);
    const timeout = new Promise((resolve) => setTimeout(() => resolve(false), ms));
    return Promise.race([settled, timeout]);
  };

  const getDeepgramKeyForCall = () => {
    const k = (import.meta.env.API_DIAGRAM_VOICE || '').trim() || (getDeepgramKey ? getDeepgramKey() : '');
    return k;
  };

  const requestSpeech = async (apiKey, text) => {
    const response = await fetch(DEEPGRAM_SPEAK_URL, {
      method: 'POST',
      headers: { Authorization: `Token ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error('Gagal membuat suara agent.');
    return response;
  };

  const streamAudio = (response) => {
    const mediaSource = new MediaSource();
    const audio = new Audio(URL.createObjectURL(mediaSource));
    mediaSource.addEventListener('sourceopen', async () => {
      const buffer = mediaSource.addSourceBuffer('audio/mpeg');
      const reader = response.body.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer.appendBuffer(value);
          await new Promise((resolve) => buffer.addEventListener('updateend', resolve, { once: true }));
        }
        mediaSource.endOfStream();
      } catch {
        if (mediaSource.readyState === 'open') mediaSource.endOfStream('network');
      }
    }, { once: true });
    return audio;
  };

  const createAgentAudio = async (response) => {
    const blob = await response.blob();
    return new Audio(URL.createObjectURL(blob));
  };

  const playAudio = (audio) => new Promise((resolve, reject) => {
    audio.addEventListener('ended', resolve, { once: true });
    audio.addEventListener('error', reject, { once: true });
    audio.play().catch(reject);
  });

  const getLineAudio = async (apiKey, text) => {
    const cache = callRef.current.lineAudio;
    if (cache[text]) return cache[text];
    const res = await requestSpeech(apiKey, text);
    const blob = await res.blob();
    cache[text] = blob;
    return blob;
  };

  const speak = async (text, fromCache = false) => {
    const apiKey = getDeepgramKeyForCall();
    const audio = fromCache
      ? new Audio(URL.createObjectURL(await getLineAudio(apiKey, text)))
      : await createAgentAudio(await requestSpeech(apiKey, text));
    if (callStatusRef.current === 'off') return;
    setCallStatus('speaking');
    await playAudio(audio);
  };

  const agentSays = async (text) => {
    try { await speak(text); }
    catch (e) { endCall(e.message); return; }
    if (callStatusRef.current !== 'off') resumeListening();
  };

  const pauseListening = () => {
    const c = callRef.current;
    if (c.recorder?.state === 'recording') c.recorder.pause();
  };

  const resumeListening = () => {
    const c = callRef.current;
    c.finalText = '';
    c.interimText = '';
    c.turnEnded = false;
    if (c.recorder?.state === 'paused') c.recorder.resume();
    setCallStatus('listening');
    setCallTranscript('');
  };

  const answerCustomer = async (question) => {
    pauseListening();
    setCallStatus('thinking');
    onAppendMessage?.('user', question);
    const history = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: question },
    ];
    const replyPromise = (async () => {
      const r = await askConcierge({ messages: history, lang, currency, systemSuffix: CALL_RULES });
      return r.text;
    })();

    const checkingLines = CHECKING_LINES_BY_LANG[activeLang];
    const thanksLines = THANKS_FOR_WAITING_LINES_BY_LANG[activeLang];
    const stillLine = STILL_CHECKING_LINE_BY_LANG[activeLang];

    let waited = false;
    let chosenChecking = '';
    if (needsChecking(question) && !(await settlesWithin(replyPromise, CHECKING_DELAY_MS))) {
      waited = true;
      chosenChecking = pickRandom(checkingLines);
      setCallTranscript(chosenChecking);
      onAppendMessage?.('assistant', chosenChecking);
      await speak(chosenChecking, true);
      if (callStatusRef.current !== 'off' && !(await settlesWithin(replyPromise, STILL_CHECKING_DELAY_MS))) {
        setCallTranscript(stillLine);
        onAppendMessage?.('assistant', stillLine);
        await speak(stillLine, true);
      }
    }

    let reply;
    try { reply = await replyPromise; }
    catch (e) {
      console.error('answerCustomer failed:', e?.message || e);
      // Don't close the call on a failed answer; keep listening so Q&A continues.
      const detail = e?.message ? ` (${e.message})` : '';
      const errMsg = lang === 'ID'
        ? `Maaf Kak, saya belum bisa menjawab sekarang.${detail} Coba tanyakan lagi ya.`
        : `Sorry, I couldn't answer that right now.${detail} Please try again.`;
      setCallTranscript(errMsg);
      onAppendMessage?.('assistant', errMsg);
      if (callStatusRef.current !== 'off') await speak(errMsg);
      if (callStatusRef.current !== 'off') resumeListening();
      return;
    }
    if (waited) reply = `${pickRandom(thanksLines)} ${reply}`;
    onAppendMessage?.('assistant', reply);
    setCallTranscript('');
    if (callStatusRef.current !== 'off') await agentSays(reply);
  };

  const handleCallMessage = (event) => {
    if (callStatusRef.current !== 'listening') return;
    let data;
    try { data = JSON.parse(event.data); } catch { return; }
    const c = callRef.current;
    if (data.type === 'Results') {
      const text = data?.channel?.alternatives?.[0]?.transcript || '';
      if (data.is_final) {
        if (text) c.finalText = `${c.finalText} ${text}`.trim();
        c.interimText = '';
      } else {
        c.interimText = text;
      }
      setCallTranscript(`${c.finalText} ${c.interimText}`.trim());
    }
    if (data.type === 'UtteranceEnd' && (c.finalText || c.interimText)) c.turnEnded = true;
    if (c.turnEnded && !c.interimText && c.finalText && c.finalText.trim()) {
      const q = c.finalText.trim();
      c.finalText = '';
      c.interimText = '';
      c.turnEnded = false;
      answerCustomer(q);
    }
  };

  const startCall = async () => {
    const apiKey = getDeepgramKeyForCall();
    if (!apiKey) {
      setCallError(t('deepgramKeyPrompt') || 'Tempel API key Deepgram (untuk input suara):');
      return;
    }
    setCallError('');
    setCallStatus('connecting');
    setCallDuration(0);
    const c = callRef.current;
    c.finalText = '';
    c.interimText = '';
    c.turnEnded = false;
    c.lineAudio = {};
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { setCallStatus('off'); setCallError(t('micPermissionDenied') || 'Izin mikrofon ditolak.'); return; }
    c.stream = stream;
    let socket;
    try { socket = await openDeepgramSocket(apiKey); }
    catch (e) {
      stream.getTracks().forEach((tr) => tr.stop());
      setCallStatus('off');
      setCallError(e.message);
      return;
    }
    c.socket = socket;
    const recorder = new MediaRecorder(stream);
    c.recorder = recorder;
    socket.addEventListener('message', handleCallMessage);
    socket.addEventListener('close', () => {
      if (callStatusRef.current !== 'off') endCall(t('deepgramDisconnected') || 'Sambungan ke Deepgram terputus.');
    });
    recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) socket.send(event.data);
    });
    recorder.start(250);
    c.keepAliveTimer = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'KeepAlive' }));
    }, 5000);
    c.durationTimer = setInterval(() => setCallDuration((d) => d + 1), 1000);
    c.timer = setTimeout(() => endCall(), MAX_CALL_SECONDS * 1000);
    setCallStatus('listening');
    // preload checking lines audio
    const preloadLines = CHECKING_LINES_BY_LANG[activeLang];
    try { await Promise.all(preloadLines.map((l) => getLineAudio(apiKey, l))); } catch { /* ignore */ }
    // greeting
    const greeting = buildGreeting();
    onAppendMessage?.('assistant', greeting);
    await speak(greeting);
    if (callStatusRef.current !== 'off') resumeListening();
  };

  const endCall = (errorMsg) => {
    const c = callRef.current;
    clearTimeout(c.timer);
    clearInterval(c.keepAliveTimer);
    clearInterval(c.durationTimer);
    if (c.recorder && c.recorder.state !== 'inactive') { try { c.recorder.stop(); } catch { /* ignore */ } }
    if (c.stream) c.stream.getTracks().forEach((tr) => tr.stop());
    if (c.socket && c.socket.readyState === WebSocket.OPEN) { try { c.socket.close(); } catch { /* ignore */ } }
    c.socket = null; c.stream = null; c.recorder = null;
    setCallStatus('off');
    setCallTranscript('');
    if (errorMsg) setCallError(errorMsg);
  };

  const handlePhone = () => {
    if (callStatus === 'off') startCall();
    else endCall();
  };

  return (
    <section ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="ÉTOILE AI Sommelier" className="concierge">
      <header className="concierge-head">
        <div className="concierge-identity">
          <div className="sommelier-mark" aria-hidden="true"><span>✦</span></div>
          <div>
            <p className="concierge-kicker">ÉTOILE ROYALE · AI SOMMELIER</p>
            <h2 className="concierge-title">{t('chatTitle')}</h2>
            <p className="concierge-sub">{providerLabel}</p>
          </div>
        </div>
        <div className="concierge-tools">
          {LANGUAGES.map((l) => (
            <button key={l.code} type="button" className="btn btn-quiet btn-sm" aria-pressed={lang === l.code} onClick={() => onLang(l.code)}>
              {l.short}
            </button>
          ))}
          <button type="button" className={`btn btn-quiet btn-sm ${callStatus !== 'off' ? 'is-active' : ''}`} onClick={handlePhone} aria-label="Telepon" title="Telepon">
            {callStatus !== 'off' ? '📞' : '☎'}
          </button>
          <button type="button" className="btn btn-quiet btn-sm" onClick={onClose}>
            {t('close')}
          </button>
        </div>
      </header>

      {callStatus !== 'off' && (
        <div className="call-bar" role="status" aria-live="polite">
          <div className="call-status-text">
            <strong>{callStatus === 'connecting' ? 'Menghubungkan…' : callStatus === 'listening' ? 'Mendengarkan…' : callStatus === 'thinking' ? 'Berpikir…' : 'Berbicara…'}</strong>
            <span>{callTranscript || (callStatus === 'listening' ? 'Silakan bicara.' : '')}</span>
          </div>
          <div className="call-meta">
            <span>{Math.floor(callDuration / 60)}:{String(callDuration % 60).padStart(2, '0')}</span>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => endCall()}>Akhiri panggilan</button>
          </div>
          {callError && <p className="chat-error" role="alert">{callError}</p>}
        </div>
      )}

      <div className="chat-log" role="log" aria-live="polite" aria-label="Conversation">
        {messages.map((m, i) => (
          <div key={i} className={`msg msg-${m.role}`}>
            <p>{m.content}</p>
            {m.role === 'assistant' && m.recommendedIds?.length > 0 && (
              <div className="recommendation-grid">
                {m.recommendedIds.slice(0, 3).map((id, recommendationIndex) => {
                  const dish = localizeDish(MENU_DATA.find((d) => d.id === id), lang, currency);
                  return dish?.name ? (
                    <article key={id} className="recommendation-card">
                      <div className="recommendation-image">
                        <img src={imageFor(dish, recommendationIndex)} alt="" loading="lazy" />
                        <span>{t('chefTable')} · 0{recommendationIndex + 1}</span>
                      </div>
                      <div className="recommendation-copy">
                        <div className="recommendation-title"><h3>{dish.name}</h3><b>{fmt(dish.price)}</b></div>
                        <p>{dish.flavorProfile}</p>
                        <span className="recommendation-temp">{t('bestAt')} · {dish.recommendedTemp}</span>
                      </div>
                      <div className="recommendation-actions">
                        <button type="button" className="btn btn-quiet btn-sm" onClick={() => onPickDish(dish)}>{t('explore')}</button>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => onAddDish(dish)}>{t('addToReservation')}</button>
                      </div>
                    </article>
                  ) : null;
                })}
              </div>
            )}
          </div>
        ))}
        {typing && <p className="chat-status"><span className="typing-orbit" aria-hidden="true"><i /><i /><i /></span>{t('typing')}</p>}
        {error && (
          <p className="chat-error" role="alert">
            {error} {t('errorSuffix')}
          </p>
        )}
        <div ref={endRef} />
      </div>

      {callStatus === 'off' && (
        <div className="quick-prompts">
          {quickPrompts.map((q) => (
            <button key={q} type="button" className="chip" disabled={typing} onClick={() => onSend(q)}>
              {q}
            </button>
          ))}
        </div>
      )}

      {callStatus === 'off' && (
      <form ref={formRef} className="chat-form" onSubmit={submit}>
        <label htmlFor="concierge-input" className="sr-only">{t('messageLabel')}</label>
        <input
          id="concierge-input"
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('placeholder')}
          autoComplete="off"
          readOnly={voiceStatus === 'recording' || voiceStatus === 'transcribing'}
        />
        <button
          type="button"
          className="btn btn-quiet btn-sm mic-btn"
          style={{ padding: '0.45rem', minWidth: 'unset' }}
          onClick={handleMic}
          disabled={voiceStatus === 'connecting' || voiceStatus === 'transcribing' || typing}
          aria-label={voiceStatus === 'recording' ? 'Stop recording' : 'Record voice'}
          title={voiceStatus === 'recording' ? 'Stop' : 'Mic'}
        >
         {voiceStatus === 'recording' ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" width="26" height="26" style={{ width: 26, height: 26 }} fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" width="26" height="26" style={{ width: 26, height: 26 }} fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="9" y="2.5" width="6" height="12" rx="3" /><path d="M5 11.5a7 7 0 0 0 14 0M12 18.5V22M8 22h8" /></svg>
          )}
        </button>
        <button type="submit" className="btn btn-primary" disabled={typing || !draft.trim() || voiceStatus === 'recording'}>
          {t('send')}
        </button>
      </form>
      )}

      {(voiceStatus !== 'idle' || voiceError) && (
        <p className="chat-status" role="status" aria-live="polite">
          {voiceError || (voiceStatus === 'connecting' ? (t('voiceConnecting') || 'Menyambungkan ke Deepgram…')
            : voiceStatus === 'recording' ? (t('voiceRecording') || 'Merekam… tekan mic untuk berhenti.')
            : voiceStatus === 'transcribing' ? (t('voiceTranscribing') || 'Menunggu teks terakhir…') : '')}
        </p>
      )}
    </section>
  );
}
