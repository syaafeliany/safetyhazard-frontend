"use client";

import { useEffect, useRef, useState } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  HardHat,
  Siren,
  FlaskConical,
  Settings2,
  Zap,
  Flame,
  ArrowDownToLine,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { ChipButton } from "./ChipButton";

interface ChatOption {
  label: string;
  value: string;
  type: "CATEGORY" | "QUESTION" | "NAVIGATION";
  icon?: React.ReactNode;
}

interface ChatSource {
  section: string;
  category: string;
  excerpt: string;
}

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  options?: ChatOption[];
  sources?: ChatSource[];
};

interface ChatResponse {
  answer: string;
  sources?: ChatSource[];
}

// Translations object for bilingual UI
const TRANSLATIONS = {
  en: {
    welcome_message:
      "Hello! I am the EHSS Safety Assistant. Select a topic below or type your question directly.",
    input_placeholder: "Ask about safety procedures, hazards, PPE...",
    search_other: "Search Another Topic",
    back_to_menu: "Back to Main Menu",
    sources_title: "Sources",
    submenu_intro: "Here are some questions about",
    categories: {
      PPE: "PPE",
      Housekeeping: "Housekeeping",
      Emergency: "Emergency",
      "Chemical Safety": "Chemical Safety",
      "Machine Safety": "Machine Safety",
      "Electrical Safety": "Electrical Safety",
      "Fire Safety": "Fire Safety",
      "Fall Protection": "Fall Protection",
    },
    questions: {
      PPE: [
        "What PPE is required in the Spray/Decoration Area?",
        "What PPE is required in the Central Staging Area?",
        "What are the general PPE requirements under OSHA 1910.132?",
        "How should PPE be inspected before use?",
      ],
      Housekeeping: [
        "What are the housekeeping standards for production areas?",
        "How should spills be handled immediately?",
        "What is the procedure for wet floor hazard reporting?",
      ],
      Emergency: [
        "What is the emergency evacuation procedure?",
        "Where are the emergency exits located?",
        "What are the requirements for emergency action plans under OSHA 1910.38?",
      ],
      "Chemical Safety": [
        "What are the chemical handling requirements in the Spray Area?",
        "How should hazardous chemicals be stored?",
        "What does OSHA 1910.1200 require for hazard communication?",
      ],
      "Machine Safety": [
        "What are the machine guarding requirements under OSHA 1910.212?",
        "What is the lockout/tagout procedure?",
        "How should machinery be inspected before operation?",
      ],
      "Electrical Safety": [
        "What are the electrical safety requirements under OSHA 1910.303?",
        "How should electrical hazards be reported?",
        "What PPE is required for electrical work?",
      ],
      "Fire Safety": [
        "What are the fire prevention requirements under OSHA 1910.39?",
        "How should fire extinguishers be maintained?",
        "What is the fire evacuation procedure?",
      ],
      "Fall Protection": [
        "What are the fall protection requirements under OSHA 1910.28?",
        "When is a safety harness required?",
        "How should ladders be used safely?",
      ],
    },
  },
  id: {
    welcome_message:
      "Halo! Saya EHSS Safety Assistant. Pilih topik di bawah atau ketik pertanyaan Anda langsung.",
    input_placeholder: "Tanya tentang prosedur keselamatan, bahaya, APD...",
    search_other: "Cari Topik Lain",
    back_to_menu: "Kembali ke Menu Utama",
    sources_title: "Sumber",
    submenu_intro: "Berikut beberapa pertanyaan tentang",
    categories: {
      PPE: "APD",
      Housekeeping: "Kebersihan",
      Emergency: "Darurat",
      "Chemical Safety": "Keselamatan Bahan Kimia",
      "Machine Safety": "Keselamatan Mesin",
      "Electrical Safety": "Keselamatan Listrik",
      "Fire Safety": "Keselamatan Kebakaran",
      "Fall Protection": "Perlindungan Jatuh",
    },
    questions: {
      PPE: [
        "APD apa yang wajib digunakan di Area Spray/Dekorasi?",
        "APD apa yang wajib digunakan di Central Staging Area?",
        "Apa persyaratan APD umum berdasarkan OSHA 1910.132?",
        "Bagaimana cara memeriksa APD sebelum digunakan?",
      ],
      Housekeeping: [
        "Apa standar kebersihan untuk area produksi?",
        "Bagaimana cara menangani tumpahan dengan segera?",
        "Apa prosedur pelaporan bahaya lantai basah?",
      ],
      Emergency: [
        "Apa prosedur evakuasi darurat?",
        "Di mana letak pintu darurat?",
        "Apa persyaratan rencana tindakan darurat berdasarkan OSHA 1910.38?",
      ],
      "Chemical Safety": [
        "Apa persyaratan penanganan bahan kimia di Area Spray?",
        "Bagaimana cara menyimpan bahan kimia berbahaya?",
        "Apa yang disyaratkan OSHA 1910.1200 untuk komunikasi bahaya?",
      ],
      "Machine Safety": [
        "Apa persyaratan pengaman mesin berdasarkan OSHA 1910.212?",
        "Apa prosedur lockout/tagout?",
        "Bagaimana cara memeriksa mesin sebelum dioperasikan?",
      ],
      "Electrical Safety": [
        "Apa persyaratan keselamatan listrik berdasarkan OSHA 1910.303?",
        "Bagaimana cara melaporkan bahaya listrik?",
        "APD apa yang diperlukan untuk pekerjaan kelistrikan?",
      ],
      "Fire Safety": [
        "Apa persyaratan pencegahan kebakaran berdasarkan OSHA 1910.39?",
        "Bagaimana cara merawat alat pemadam kebakaran?",
        "Apa prosedur evakuasi kebakaran?",
      ],
      "Fall Protection": [
        "Apa persyaratan perlindungan jatuh berdasarkan OSHA 1910.28?",
        "Kapan harness keselamatan wajib digunakan?",
        "Bagaimana cara menggunakan tangga dengan aman?",
      ],
    },
  },
};

// Category definitions with icons (internal keys only - labels come from translations)
const CATEGORY_KEYS = [
  "PPE",
  "Housekeeping",
  "Emergency",
  "Chemical Safety",
  "Machine Safety",
  "Electrical Safety",
  "Fire Safety",
  "Fall Protection",
] as const;

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  PPE: <HardHat className="size-3.5" />,
  Housekeeping: <Sparkles className="size-3.5" />,
  Emergency: <Siren className="size-3.5" />,
  "Chemical Safety": <FlaskConical className="size-3.5" />,
  "Machine Safety": <Settings2 className="size-3.5" />,
  "Electrical Safety": <Zap className="size-3.5" />,
  "Fire Safety": <Flame className="size-3.5" />,
  "Fall Protection": <ArrowDownToLine className="size-3.5" />,
};

export function ChatAssistant() {
  const [lang, setLang] = useState<"en" | "id">("en");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang];

  // Generate welcome message based on current language
  const getWelcomeMessage = (): ChatMessage => ({
    id: "welcome",
    role: "assistant",
    content: t.welcome_message,
    options: CATEGORY_KEYS.map((key) => ({
      label: t.categories[key],
      value: key,
      type: "CATEGORY" as const,
      icon: CATEGORY_ICONS[key],
    })),
  });

  // Initialize with welcome message
  useEffect(() => {
    setMessages([getWelcomeMessage()]);
  }, [lang]);

  // Toggle language and reset chat
  const toggleLang = () => {
    setLang((prev) => (prev === "en" ? "id" : "en"));
  };

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  // Handle chip button clicks
  const handleOptionClick = (option: ChatOption) => {
    if (option.type === "CATEGORY") {
      // Show submenu with suggested questions
      const categoryKey = option.value;
      const translatedQuestions = t.questions[categoryKey as keyof typeof t.questions];
      
      if (!translatedQuestions) return;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: option.label, // Display the translated category label
      };

      const submenuOptions: ChatOption[] = [
        ...translatedQuestions.map((q) => ({
          label: q,
          value: q,
          type: "QUESTION" as const,
        })),
        {
          label: t.back_to_menu,
          value: "MAIN_MENU",
          type: "NAVIGATION" as const,
        },
      ];

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: `${t.submenu_intro} ${option.label}:`,
        options: submenuOptions,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
    } else if (option.type === "QUESTION") {
      // Send question to RAG API (in the user's selected language)
      sendToRAG(option.label);
    } else if (option.type === "NAVIGATION") {
      if (option.value === "MAIN_MENU") {
        // Reset to welcome state
        setMessages([getWelcomeMessage()]);
      } else if (option.value === "SEARCH") {
        // Focus the input field
        inputRef.current?.focus();
      }
    }
  };

  // Send question to RAG API
  const sendToRAG = async (question: string) => {
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: question,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    // Tanya ke RAG lewat proxy backend (/knowledge/chat).
    const { data, ok } = await api.post<ChatResponse>("/knowledge/chat", {
      question,
    });

    const answer =
      ok && data?.answer
        ? data.answer
        : "Sorry, I couldn't reach the knowledge base right now. Please try again in a moment.";

    // Post-answer navigation options (translated)
    const postAnswerOptions: ChatOption[] = [
      {
        label: t.search_other,
        value: "SEARCH",
        type: "NAVIGATION",
      },
      {
        label: t.back_to_menu,
        value: "MAIN_MENU",
        type: "NAVIGATION",
      },
    ];

    const assistantMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content: answer,
      sources: data?.sources,
      options: postAnswerOptions,
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setTyping(false);
  };

  // Handle text input submission
  const send = async () => {
    const text = input.trim();
    if (!text || typing) return;
    sendToRAG(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <span className="flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Bot className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground">
            EHSS AI Assistant
          </h2>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Powered by your knowledge base
          </p>
        </div>
        <Sparkles className="size-5 text-brand" strokeWidth={1.75} />
        
        {/* Language Toggle */}
        <div className="flex items-center gap-1 rounded-full border border-gray-300 bg-white p-0.5">
          <button
            onClick={toggleLang}
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
              lang === "en"
                ? "bg-[#E3000F] text-white"
                : "bg-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <Globe className="size-3" />
            EN
          </button>
          <button
            onClick={toggleLang}
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
              lang === "id"
                ? "bg-[#E3000F] text-white"
                : "bg-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <Globe className="size-3" />
            ID
          </button>
        </div>
      </div>

      {/* Riwayat pesan (scrollable) */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5"
      >
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div key={msg.id} className="space-y-3">
              <div
                className={cn(
                  "flex items-start gap-3",
                  isUser && "flex-row-reverse"
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    isUser
                      ? "bg-brand text-white"
                      : "bg-foreground/5 text-foreground"
                  )}
                >
                  {isUser ? (
                    <User className="size-4" strokeWidth={1.75} />
                  ) : (
                    <Bot className="size-4" strokeWidth={1.75} />
                  )}
                </span>
                <div
                  className={cn(
                    "max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    isUser
                      ? "rounded-tr-sm bg-brand text-white"
                      : "rounded-tl-sm bg-foreground/5 text-foreground"
                  )}
                >
                  {msg.content}
                </div>
              </div>

              {/* Options (chips) below assistant messages */}
              {!isUser && msg.options && msg.options.length > 0 && (
                <div className="ml-11 flex flex-wrap gap-2">
                  {msg.options.map((option, idx) => (
                    <ChipButton
                      key={`${msg.id}-opt-${idx}`}
                      label={option.label}
                      icon={option.icon}
                      onClick={() => handleOptionClick(option)}
                      variant={
                        option.type === "NAVIGATION" ? "navigation" : "default"
                      }
                    />
                  ))}
                </div>
              )}

              {/* Sources below options */}
              {!isUser && msg.sources && msg.sources.length > 0 && (
                <div className="ml-11 text-xs text-muted">
                  <details className="cursor-pointer">
                    <summary className="font-medium">
                      {t.sources_title} ({msg.sources.length})
                    </summary>
                    <ul className="mt-2 space-y-1 pl-4">
                      {msg.sources.map((source, idx) => (
                        <li key={idx}>
                          {source.section}
                          {source.category && ` (${source.category})`}
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              )}
            </div>
          );
        })}

        {/* Indikator mengetik */}
        {typing && (
          <div className="flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground">
              <Bot className="size-4" strokeWidth={1.75} />
            </span>
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-foreground/5 px-4 py-3">
              <span className="size-2 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
              <span className="size-2 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
              <span className="size-2 animate-bounce rounded-full bg-muted" />
            </div>
          </div>
        )}
      </div>

      {/* Input menempel di bawah */}
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2 rounded-xl border border-border bg-background p-2 focus-within:border-brand">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={t.input_placeholder}
            className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted/60"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim()}
            aria-label="Send message"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="size-4.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
