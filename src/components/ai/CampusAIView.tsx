import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Copy,
  Check,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  Bot,
  User as UserIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChatMessage, Conversation } from '../../types';
import { buildComprehensiveAISchoolContext, buildSanitizedAISchoolContext } from '../../utils/analytics';
import { ReportModal } from './ReportModal';

export const CampusAIView: React.FC = () => {
  const {
    students,
    attendance,
    lostFoundItems,
    activities,
    currentDate,
    conversations,
    saveConversation,
    deleteConversation,
    clearAllConversations,
    adminProfile,
    settings,
    pendingAIPrompt,
    setPendingAIPrompt,
    t,
  } = useApp();

  const [activeConvId, setActiveConvId] = useState<string>(() => {
    return conversations[0]?.id || 'conv_' + Date.now();
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId) || {
    id: activeConvId,
    title: 'School Administration Assistant',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConv.messages, isLoading]);

  // Handle incoming prompt requests from other tabs/modals (e.g. Student Profile)
  useEffect(() => {
    if (pendingAIPrompt) {
      const promptToRun = pendingAIPrompt;
      setPendingAIPrompt(null);
      handleSendMessage(promptToRun);
    }
  }, [pendingAIPrompt]);

  const handleStartNewChat = () => {
    const newId = 'conv_' + Date.now();
    setActiveConvId(newId);
    setInputPrompt('');
    inputRef.current?.focus();
  };

  const handleCopy = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

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
      title: activeConv.messages.length === 0 ? (query.length > 36 ? query.slice(0, 36) + '...' : query) : activeConv.title,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    };
    saveConversation(updatedConv);

    setIsLoading(true);

    try {
      // Build school administration context with full student intelligence
      const schoolContext = settings.aiAssistant.strictPrivacyMode
        ? buildSanitizedAISchoolContext(
            students,
            attendance,
            lostFoundItems,
            activities,
            currentDate
          )
        : buildComprehensiveAISchoolContext(
            students,
            attendance,
            lostFoundItems,
            activities,
            currentDate
          );

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
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${response.status}`);
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

  // Generate intelligent suggestions referencing real students in the database
  const sampleStudent = students[0];
  const dynamicStudentPrompt = sampleStudent
    ? `Tell me about student ${sampleStudent.firstName} ${sampleStudent.lastName} (${sampleStudent.studentId})`
    : 'Tell me about student Marcus Vance (STU-1002)';

  const dynamicDraftPrompt = sampleStudent
    ? `Draft an absence letter to the parents of ${sampleStudent.firstName} ${sampleStudent.lastName}`
    : 'Draft an absence notice for parents';

  const suggestedPrompts = [
    dynamicStudentPrompt,
    'Who is marked absent today and what are their guardian contacts?',
    'List all students enrolled in Grade 10-A',
    dynamicDraftPrompt,
    'Which students have the highest number of absences?',
    'Summarize this week\'s school attendance rate and trends',
  ];

  const getInitials = (name: string) => {
    if (!name) return 'AD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Conversations Drawer Sidebar (Desktop & Mobile toggle) */}
      <div
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } md:block w-64 border-e border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3 flex flex-col shrink-0`}
      >
        <button
          type="button"
          onClick={handleStartNewChat}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer mb-3"
        >
          <Plus className="w-4 h-4" />
          <span>{t.aiNewChat}</span>
        </button>

        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-1">
          Recent Conversations
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 mt-1">
          {conversations.length === 0 ? (
            <p className="text-xs text-slate-400 italic p-3 text-center">
              No previous chats
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  setActiveConvId(conv.id);
                  setSidebarOpen(false);
                }}
                className={`group flex items-center justify-between p-2.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  activeConvId === conv.id
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{conv.title}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer transition-opacity"
                  title="Delete chat"
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
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Chat Toolbar */}
        <div className="h-14 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-blue-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  Campus AI
                </h3>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block leading-tight">
                  ● Gemini 3.8 Flash Online
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">{t.aiGenerateReport}</span>
            </button>

            <button
              type="button"
              onClick={handleStartNewChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title={t.aiNewChat}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {activeConv.messages.length === 0 ? (
            /* Welcome Screen */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 animate-in zoom-in-95 duration-200">
                <Sparkles className="w-7 h-7 text-amber-300" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {t.aiWelcomeTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                {t.aiWelcomeSubtitle}
              </p>

              {/* Privacy / Intelligence Badge */}
              <div className="mt-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[11px] text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Full Student Intelligence Active: Ask anything about students, absences, guardians, or classes</span>
              </div>

              {/* Suggested Questions Grid */}
              <div className="mt-8 w-full">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 text-start">
                  Suggested Queries
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-start">
                  {suggestedPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="p-3 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 transition-all hover:border-blue-400 text-start cursor-pointer group"
                    >
                      <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                    {isUser ? (
                      adminProfile.profilePictureUrl ? (
                        <img
                          src={adminProfile.profilePictureUrl}
                          alt="Admin"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                          {getInitials(adminProfile.displayName)}
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-amber-500 to-blue-600 text-white flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[85%] md:max-w-2xl rounded-2xl p-4 text-xs md:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : msg.isError
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900/40 rounded-tl-none'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/60 rounded-tl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                    {!isUser && (
                      <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
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
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Thinking / Loading indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-blue-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-slate-500 dark:text-slate-400 ms-1 font-medium">
                  Campus AI is analyzing live school metrics...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 md:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-2">
          {activeConv.messages.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Quick:
              </span>
              <button
                type="button"
                onClick={() => handleSendMessage('Who is absent today and what are their guardian phone numbers?')}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Who is absent today?
              </button>
              {students[0] && (
                <button
                  type="button"
                  onClick={() => handleSendMessage(`Tell me about student ${students[0].firstName} ${students[0].lastName} (${students[0].studentId})`)}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  About {students[0].firstName} {students[0].lastName}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSendMessage('Which students have the most absences?')}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Top Absentees
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('Show all students in Grade 10-A')}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Grade 10-A Roster
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
            <input
              ref={inputRef}
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={t.aiInputPlaceholder}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-medium text-xs md:text-sm rounded-xl transition-colors shadow-xs cursor-pointer disabled:cursor-not-allowed"
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
