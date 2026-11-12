import { AIProposalCard } from './AIProposalCard';
import { DocumentScanner } from './DocumentScanner';
import { studentTools } from '../../i18n/studentTools';
import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Copy,
  Check,
  FileSpreadsheet,
  RefreshCw,
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChatMessage, Conversation } from '../../types';
import { speechController } from '../../utils/speechVoice';
import { ReportModal } from './ReportModal';
import { WorkspaceAvatar } from '../common/WorkspaceUI';

export const CampusAIView: React.FC = () => {
  const {
    conversations,
    saveConversation,
    askCampusAI,
    deleteConversation,
    clearAllConversations,
    adminProfile,
    settings,
    updateSettings,
    pendingAIPrompt,
    setPendingAIPrompt,
    t,
  } = useApp();

  const [activeConvId, setActiveConvId] = useState<string>(() => {
    return conversations[0]?.id || crypto.randomUUID();
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Voice & Speech states
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(Boolean(settings.aiAssistant.autoSpeak));
  useEffect(()=>{setAutoSpeak(Boolean(settings.aiAssistant.autoSpeak));},[settings.aiAssistant.autoSpeak]);
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      speechController.stop();
      speechController.stopListening();
    };
  }, []);

  const messageLog = useRef<HTMLDivElement>(null);
  const conversationsTrigger = useRef<HTMLButtonElement>(null);
  const closeConversationsButton = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId) || {
    id: activeConvId,
    title: 'School Administration Assistant',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  useEffect(() => {
    const log = messageLog.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [activeConv.messages, isLoading]);

  useEffect(() => {
    if (sidebarOpen) closeConversationsButton.current?.focus();
  }, [sidebarOpen]);

  const closeConversations = () => {
    setSidebarOpen(false);
    conversationsTrigger.current?.focus();
  };

  // Handle incoming prompt requests from other tabs/modals (e.g. Student Profile)
  useEffect(() => {
    if (pendingAIPrompt) {
      const promptToRun = pendingAIPrompt;
      setPendingAIPrompt(null);
      handleSendMessage(promptToRun);
    }
  }, [pendingAIPrompt]);

  const handleStartNewChat = () => {
    const newId = crypto.randomUUID();
    setActiveConvId(newId);
    setSidebarOpen(false);
    setInputPrompt('');
    inputRef.current?.focus();
  };

  const handleCopy = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleToggleAutoSpeak = () => {
    setAutoSpeak((prev) => {
      const next = !prev;
      updateSettings({aiAssistant:{...settings.aiAssistant,autoSpeak:next}});
      if (!next) speechController.stop();
      return next;
    });
  };

  const handleSpeak = (text: string, msgId: string) => {
    if (speakingMsgId === msgId) {
      speechController.stop();
      setSpeakingMsgId(null);
      return;
    }

    setSpeakingMsgId(msgId);
    speechController.speak(text, {
      lang: settings.language === 'ar' ? 'ar-SA' : settings.language === 'fr' ? 'fr-FR' : 'en-US',
      onStart: () => setSpeakingMsgId(msgId),
      onEnd: () => setSpeakingMsgId(null),
      onError: () => setSpeakingMsgId(null),
    });
  };

  const handleToggleMic = () => {
    if (isListening) {
      speechController.stopListening();
      setIsListening(false);
      setVoiceNotice(null);
      return;
    }

    if (!speechController.isSTTSupported()) {
      setVoiceNotice('Microphone speech recognition is not supported in this browser. Please type your message.');
      setTimeout(() => setVoiceNotice(null), 3500);
      return;
    }

    setIsListening(true);
    setVoiceNotice(t.aiVoiceListening);

    const lang = settings.language === 'ar' ? 'ar-SA' : settings.language === 'fr' ? 'fr-FR' : 'en-US';

    speechController.startListening({
      lang,
      onResult: (transcript, isFinal) => {
        setInputPrompt(transcript);
        if (isFinal && transcript.trim().length > 0) {
          setIsListening(false);
          setVoiceNotice(null);
        }
      },
      onEnd: () => {
        setIsListening(false);
        setVoiceNotice(null);
      },
      onError: (err) => {
        setIsListening(false);
        setVoiceNotice(`Microphone: ${err}`);
        setTimeout(() => setVoiceNotice(null), 3000);
      },
    });
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isLoading) return;

    setInputPrompt('');

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...activeConv.messages, userMessage];
    const updatedConv: Conversation = {
      ...activeConv,
      title: activeConv.messages.length === 0 ? (query.length > 36 ? query.slice(0, 36) + '...' : query) : activeConv.title,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    };
    saveConversation(updatedConv);

    setIsLoading(true);

    try {
      const data = await askCampusAI(activeConv.id, query, activeConv.messages);
      const assistantMessage: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        sender: 'assistant',
        content: data.text,
        proposal: data.proposal,
        timestamp: new Date().toISOString(),
      };

      saveConversation({
        ...updatedConv,
        messages: [...updatedMessages, assistantMessage],
        updatedAt: new Date().toISOString(),
      });

      if (autoSpeak && data.text) {
        handleSpeak(data.text, assistantMessage.id);
      }
    } catch (err: any) {
      if (err?.name === 'SessionChangedError') return;
      const errorMessage: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        sender: 'assistant',
        content: `Error communicating with AI service: ${err.message}. Please check that the server is active or review network status.`,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      saveConversation({
        ...updatedConv,
        messages: [...updatedMessages, errorMessage],
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const isRtlText = (text: string) => {
    return /[\u0600-\u06FF]/.test(text || '');
  };

  const suggestedPrompts = [t.aiSuggestedPrompt1, t.aiSuggestedPrompt2, t.aiSuggestedPrompt3, t.aiSuggestedPrompt4];

  return (
    <div className="workspace-panel ai-workspace relative flex min-h-[25rem] overflow-hidden">
      {sidebarOpen && (
        <div
          className="absolute inset-0 z-10 bg-slate-950/40 lg:hidden"
          onClick={closeConversations}
          aria-hidden="true"
        />
      )}
      {/* Conversations Drawer Sidebar (Desktop & Mobile toggle) */}
      <div
        id="chat-conversations"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && sidebarOpen) closeConversations();
        }}
        className={`${
          sidebarOpen ? 'flex' : 'hidden'
        } absolute inset-y-0 start-0 z-20 w-[min(15rem,88%)] shrink-0 flex-col border-e border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950 lg:static lg:flex`}
      >
        <div className="mb-3 flex items-center gap-1.5">
          <button type="button" onClick={handleStartNewChat} className="workspace-button flex-1">
            <Plus size={16} />
            {t.aiNewChat}
          </button>
          <button
            ref={closeConversationsButton}
            type="button"
            onClick={closeConversations}
            className="workspace-icon-button lg:hidden"
            aria-label={t.close}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
          {t.aiConversations}
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 mt-1">
          {conversations.length === 0 ? (
            <p className="p-2 text-xs text-slate-500 dark:text-slate-400">
              {t.aiNoConversations}
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center justify-between gap-1 rounded-lg px-2 py-1 text-sm font-medium transition-colors ${
                  activeConvId === conv.id
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-start"
                  aria-current={activeConvId === conv.id ? 'true' : undefined}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    closeConversations();
                  }}
                >
                  <MessageSquare size={15} className="shrink-0" />
                  <span className="truncate">{conv.title}</span>
                </button>
                <button
                  type="button"
                  onClick={() => deleteConversation(conv.id)}
                  className="rounded p-1.5 text-slate-500 hover:text-red-700 dark:text-slate-400 dark:hover:text-red-300"
                  aria-label={t.delete}
                  title={t.delete}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {conversations.length > 0 && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={clearAllConversations}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-400 hover:text-red-500 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>{t.aiClearChat}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Chat Toolbar */}
        <div className="h-14 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <button
              ref={conversationsTrigger}
              type="button"
              onClick={() => setSidebarOpen((value) => !value)}
              className="workspace-icon-button lg:hidden"
              aria-label={t.aiConversations}
              aria-expanded={sidebarOpen}
              aria-controls="chat-conversations"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <Sparkles size={17} className="hidden text-brand-600 dark:text-brand-300 sm:block" aria-hidden="true" />
              <h1 className="text-sm font-semibold">{t.navCampusAI}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-Talk Toggle */}
            <button
              type="button"
              onClick={handleToggleAutoSpeak}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                autoSpeak
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border-brand-200 dark:border-brand-900/60 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title={t.aiAutoSpeak}
              aria-label={t.aiAutoSpeak}
              aria-pressed={autoSpeak}
            >
              {autoSpeak ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span className="hidden xl:inline">{t.aiAutoSpeak}</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden xl:inline">{t.aiAutoSpeak}</span>
                </>
              )}
            </button>

            <DocumentScanner compact />
            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              aria-label={t.aiGenerateReport}
              title={t.aiGenerateReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span className="hidden sm:inline">{t.aiGenerateReport}</span>
            </button>

            <button
              type="button"
              onClick={handleStartNewChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title={t.aiNewChat}
              aria-label={t.aiNewChat}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">{studentTools[settings.language].assistantHelp}</p>
        {/* Message Stream */}
        <div ref={messageLog} className="flex-1 space-y-5 overflow-y-auto p-4 md:p-6" role="log" aria-label={t.navCampusAI}>
          {activeConv.messages.length === 0 ? (
            /* Welcome Screen */
            <div className="ai-welcome mx-auto flex min-h-full max-w-xl flex-col items-center justify-center py-5 text-center">
              <div className="ai-orb">
                <Sparkles size={22} className="text-brand-600 dark:text-brand-300" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {t.aiWelcomeTitle}
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                {t.aiWelcomeSubtitle}
              </p>

              {/* Suggested Questions Grid */}
              <div className="mt-8 w-full">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 text-start">
                  {t.aiSuggestions}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-start">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="workspace-button justify-start text-start"
                    >
                      <span className="group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {prompt}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Chat Messages List */
            activeConv.messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 items-start ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {isUser ? (
                    <WorkspaceAvatar name={adminProfile.displayName} photo={adminProfile.profilePictureUrl} />
                  ) : (
                    <div className="workspace-avatar"><Sparkles size={16} aria-hidden="true" /></div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`min-w-0 max-w-[85%] rounded-xl p-3.5 text-sm leading-relaxed sm:max-w-2xl ${
                      isUser
                        ? 'bg-brand-600 text-white'
                        : msg.isError
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900/40'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/60'
                    }`}
                  >
                    <div
                      dir={isRtlText(msg.content) ? 'rtl' : 'ltr'}
                      className={`break-words whitespace-pre-wrap ${
                        isRtlText(msg.content) ? 'text-right' : 'text-start'
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.proposal && <AIProposalCard proposal={msg.proposal} />}

                    {!isUser && (
                      <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleSpeak(msg.content, msg.id)}
                            className={`flex items-center gap-1 cursor-pointer transition-colors ${
                              speakingMsgId === msg.id
                                ? 'text-brand-600 dark:text-brand-400 font-semibold'
                                : 'hover:text-slate-600 dark:hover:text-slate-200'
                            }`}
                            title={speakingMsgId === msg.id ? t.aiVoiceStop : t.aiVoiceSpeak}
                          >
                            {speakingMsgId === msg.id ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 animate-pulse" />
                                <span className="text-brand-600 dark:text-brand-400">{t.aiVoiceStop}</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>{t.aiVoiceSpeak}</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopy(msg.content, msg.id)}
                            className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {copiedMsgId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-500">{t.aiCopied}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>{t.aiCopy}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isLoading && (
            <div role="status" className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <RefreshCw size={15} className="animate-spin" aria-hidden="true" />
              {t.loading}
            </div>
          )}

        </div>

        {/* Input Bar */}
        <div className="p-3 md:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-2">
          {voiceNotice && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
              <span className="font-semibold">{voiceNotice}</span>
            </div>
          )}

          {speakingMsgId && !voiceNotice && (
            <div className="flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/50 text-brand-700 dark:text-brand-300 text-xs">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 animate-bounce text-brand-600 dark:text-brand-400" />
                <span>AI is currently speaking aloud...</span>
              </div>
              <button
                type="button"
                onClick={() => handleSpeak('', speakingMsgId)}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                {t.aiVoiceStop}
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={handleToggleMic}
              className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-md ring-2 ring-red-400'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
              title={isListening ? 'Stop listening' : 'Speak to AI (Microphone)'}
              aria-label="Voice input"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <input
              ref={inputRef}
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={t.aiInputPlaceholder}
              aria-label={t.aiInputPlaceholder}
              disabled={isLoading}
              className="workspace-field min-w-0 flex-1 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="workspace-button workspace-button-primary min-h-11 shrink-0"
              aria-label={t.aiSend}
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{t.aiSend}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Structured Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reportType="daily"
      />
    </div>
  );
};
