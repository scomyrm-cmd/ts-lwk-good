import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  Maximize2,
  Minimize2,
  Trash2,
  Bot,
  User as UserIcon,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChatMessage, Conversation } from '../../types';
import { buildComprehensiveAISchoolContext, buildSanitizedAISchoolContext } from '../../utils/analytics';
import { speechController } from '../../utils/speechVoice';

export const CampusAIFloatingWidget: React.FC = () => {
  const {
    isAuthenticated,
    activeTab,
    setActiveTab,
    students,
    attendance,
    lostFoundItems,
    activities,
    currentDate,
    conversations,
    saveConversation,
    settings,
    adminProfile,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isRtlText = (text: string) => {
    return /[\u0600-\u06FF]/.test(text || '');
  };

  const activeConv = conversations[0] || {
    id: 'floating_conv',
    title: 'School Administration Assistant',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, activeConv.messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isLoading) return;

    setInputPrompt('');

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
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
      const schoolContext = settings.aiAssistant.strictPrivacyMode
        ? buildSanitizedAISchoolContext(students, attendance, lostFoundItems, activities, currentDate)
        : buildComprehensiveAISchoolContext(students, attendance, lostFoundItems, activities, currentDate);

      const response = await fetch('/api/campus-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          schoolContext,
          history: updatedMessages.slice(-8),
          language: settings.language,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        sender: 'assistant',
        content: data.text || 'No response generated.',
        timestamp: new Date().toISOString(),
      };

      saveConversation({
        ...updatedConv,
        messages: [...updatedMessages, assistantMessage],
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
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

  const sampleStudent = students[0];

  // If already on the full-page campus-ai view or not authenticated, hide floating widget
  if (!isAuthenticated || activeTab === 'campus-ai') {
    return null;
  }

  return (
    <div className="fixed bottom-5 end-5 z-40 flex flex-col items-end">
      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[520px] max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden mb-3 animate-in zoom-in-95 fade-in duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  <span>Campus AI Assistant</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                </h4>
                <p className="text-[10px] text-blue-100 leading-tight">
                  Student & School Intelligence Online
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setActiveTab('campus-ai');
                }}
                className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                title="Expand to Full Hub"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40">
            {activeConv.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                  <Bot className="w-5 h-5" />
                </div>
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  How can I help you today?
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                  Ask me anything about registered students, who is absent today, class rosters, or drafting letters to guardians.
                </p>

                {/* Quick start suggestions */}
                <div className="mt-4 w-full space-y-1.5 text-start">
                  <button
                    type="button"
                    onClick={() => handleSendMessage('Who is absent today and what are their guardian phone numbers?')}
                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 text-[11px] text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:border-blue-400 transition-all text-start cursor-pointer"
                  >
                    📋 Who is marked absent today?
                  </button>
                  {sampleStudent && (
                    <button
                      type="button"
                      onClick={() => handleSendMessage(`Tell me about student ${sampleStudent.firstName} ${sampleStudent.lastName} (${sampleStudent.studentId})`)}
                      className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 text-[11px] text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:border-blue-400 transition-all text-start cursor-pointer"
                    >
                      🎓 Tell me about {sampleStudent.firstName} {sampleStudent.lastName}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSendMessage('Which students have the highest absence count?')}
                    className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 text-[11px] text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:border-blue-400 transition-all text-start cursor-pointer"
                  >
                    ⚠️ Show top students with absences
                  </button>
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
                        <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center">
                          {adminProfile.displayName.slice(0, 1).toUpperCase()}
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-amber-500 to-blue-600 text-white flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-none'
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

                      {!isUser && !msg.isError && (
                        <div className="mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleSpeak(msg.content, msg.id)}
                            className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-0.5 rounded cursor-pointer"
                            title={speakingMsgId === msg.id ? 'Stop speaking' : 'Read aloud'}
                          >
                            {speakingMsgId === msg.id ? (
                              <VolumeX className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
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
                <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-500" />
                <span>Campus AI is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
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
                placeholder="Ask about students, absences, guardians..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isLoading || !inputPrompt.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/25 transition-all duration-200 hover:scale-105 cursor-pointer font-medium text-xs select-none border border-white/20"
          aria-label="Open Campus AI Assistant"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="absolute -top-1 -end-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-blue-600" />
          </div>
          <span className="font-semibold tracking-wide">Campus AI</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-bold uppercase tracking-wider">
            Ask
          </span>
        </button>
      )}
    </div>
  );
};
