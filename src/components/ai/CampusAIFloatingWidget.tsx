import { AIProposalCard } from './AIProposalCard';
import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Maximize2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChatMessage, Conversation } from '../../types';
import { speechController } from '../../utils/speechVoice';

export const CampusAIFloatingWidget: React.FC = () => {
  const {
    isAuthenticated,
    currentUser,
    t,
    activeTab,
    setActiveTab,
    conversations,
    saveConversation,
    askCampusAI,
    settings,
    adminProfile,
  } = useApp();

  const isAdmin = currentUser?.role === 'admin';
  const [isOpen, setIsOpen] = useState(false);
  const [threadId] = useState(() => crypto.randomUUID());
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messageLog = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isRtlText = (text: string) => {
    return /[\u0600-\u06FF]/.test(text || '');
  };

  const activeConv = conversations[0] || {
    id: threadId,
    title: 'School Administration Assistant',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    return () => {
      speechController.stop();
      speechController.stopListening();
    };
  }, []);

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
      return;
    }

    if (!speechController.isSTTSupported()) {
      return;
    }

    setIsListening(true);
    const lang = settings.language === 'ar' ? 'ar-SA' : settings.language === 'fr' ? 'fr-FR' : 'en-US';

    speechController.startListening({
      lang,
      onResult: (transcript, isFinal) => {
        setInputPrompt(transcript);
        if (isFinal && transcript.trim().length > 0) {
          setIsListening(false);
        }
      },
      onEnd: () => setIsListening(false),
      onError: () => setIsListening(false),
    });
  };

  useEffect(() => {
    const log = messageLog.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [isOpen, activeConv.messages, isLoading]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

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
    } catch (err: any) {
      if (err?.name === 'SessionChangedError') return;
      const errorMessage: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        sender: 'assistant',
        content: `Error communicating with Campus AI: ${err.message}`,
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

  if (!isAuthenticated || !isAdmin || activeTab === 'campus-ai' || !settings.aiAssistant.enabled) return null;

  const prompts = [t.aiSuggestedPrompt1, t.aiSuggestedPrompt2, t.aiSuggestedPrompt3];

  return (
    <div className="ai-floating fixed end-4 z-40 flex flex-col items-end sm:end-5">
      {isOpen && (
        <section aria-label={t.navCampusAI} className="workspace-panel workspace-popover flex h-[min(31rem,calc(100dvh-8rem))] w-[min(25rem,calc(100vw-2rem))] flex-col overflow-hidden shadow-xl">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-3.5 py-2 dark:border-slate-800">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles size={17} className="text-brand-600 dark:text-brand-300" aria-hidden="true" />
              {t.navCampusAI}
            </h2>
            <div className="flex items-center gap-1">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setActiveTab('campus-ai');
                  }}
                  className="workspace-icon-button"
                  aria-label={t.aiExpand}
                  title={t.aiExpand}
                >
                  <Maximize2 size={16} />
                </button>
              )}
              <button type="button" onClick={() => setIsOpen(false)} className="workspace-icon-button" aria-label={t.close}>
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div ref={messageLog} className="flex-1 space-y-3.5 overflow-y-auto p-4" role="log" aria-label={t.navCampusAI}>
            {activeConv.messages.length === 0 ? (
              <div className="flex min-h-full flex-col justify-center gap-2 py-3">
                <p className="text-sm font-semibold">{t.aiWelcomeTitle}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t.aiWelcomeSubtitle}
                </p>
                <div className="mt-3 grid gap-2">
                  {prompts.map((prompt) => (
                    <button key={prompt} type="button" onClick={() => handleSendMessage(prompt)} className="workspace-button justify-start text-start">
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              activeConv.messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 items-start ${
                      isUser ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-bold">
                      {isUser ? (
                        <div className="w-full h-full bg-brand-600 text-white flex items-center justify-center">
                          {adminProfile.displayName.slice(0, 1).toUpperCase()}
                        </div>
                      ) : (
                        <div className="w-full h-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-brand-600 text-white rounded-tr-none'
                          : msg.isError
                          ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900/40 rounded-tl-none'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none shadow-2xs'
                      }`}
                    >
                      <div
                        dir={isRtlText(msg.content) ? 'rtl' : 'ltr'}
                        className={`whitespace-pre-wrap font-sans ${
                          isRtlText(msg.content) ? 'text-right' : 'text-start'
                        }`}
                      >
                        {msg.content}
                      </div>
                    {msg.proposal && <AIProposalCard proposal={msg.proposal} />}

                      {!isUser && !msg.isError && (
                        <div className="mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleSpeak(msg.content, msg.id)}
                            className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 p-0.5 rounded cursor-pointer"
                            title={speakingMsgId === msg.id ? 'Stop speaking' : 'Read aloud'}
                          >
                            {speakingMsgId === msg.id ? (
                              <VolumeX className="w-3.5 h-3.5 text-brand-600 animate-pulse" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 italic ps-8">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-brand-500" />
                <span>Campus AI is thinking...</span>
              </div>
            )}

          </div>

          {/* Footer Input */}
          <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
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
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title={isListening ? 'Stop recording' : 'Speak to AI'}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
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
                className="workspace-button workspace-button-primary size-11 shrink-0 p-0"
                aria-label={t.aiSend}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="workspace-button workspace-button-primary shadow-lg"
          aria-label={t.openAssistant}
        >
          <Sparkles size={16} aria-hidden="true" />
          <span className="hidden sm:inline">{t.navCampusAI}</span>
        </button>
      )}
    </div>
  );
};
