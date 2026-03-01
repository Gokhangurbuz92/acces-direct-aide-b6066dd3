import { useState, useRef, useEffect } from 'react';
import { client } from '@/api/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Bonjour ! Je suis l'assistant AccesDirectAide. Je peux vous aider à trouver des aides, des démarches ou des structures près de chez vous. Comment puis-je vous aider ?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const initConversation = async () => {
      try {
        const conv = await client.agents.createConversation({
          agent_name: 'assistant_aide',
          metadata: { name: 'Conversation utilisateur' }
        });
        setConversationId(conv.id);
      } catch {
        void('Agent non disponible, utilisation du mode de secours');
      }
    };

    if (isOpen && !conversationId) {
      initConversation();
    }
  }, [isOpen, conversationId]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (conversationId) {
        const conv = await client.agents.getConversation(conversationId);
        await client.agents.addMessage(conv, userMessage);

        // Subscribe to updates
        const unsubscribe = client.agents.subscribeToConversation(conversationId, (data) => {
          setMessages([
            { role: 'assistant', content: "Bonjour ! Je suis l'assistant AccesDirectAide. Je peux vous aider à trouver des aides, des démarches ou des structures près de chez vous. Comment puis-je vous aider ?" },
            ...data.messages
          ]);
        });

        setTimeout(() => {
          unsubscribe();
          setIsLoading(false);
        }, 30000);
      } else {
        // Fallback avec InvokeLLM
        const response = await client.integrations.Core.InvokeLLM({
          prompt: `Tu es l'assistant AccesDirectAide. L'utilisateur demande : "${input}"
          
          Règles :
          - Réponds en langage simple et clair (FALC)
          - Si tu n'es pas sûr, dis-le clairement
          - Propose de consulter le site pour plus d'informations
          - Sois chaleureux et rassurant`,
        });

        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        setIsLoading(false);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Je suis désolé, je n'ai pas pu traiter votre demande. Vous pouvez utiliser la recherche du site ou contacter une structure d'aide."
      }]);
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "Comment obtenir la prime d'activité ?",
    "Où trouver de l'aide pour un logement ?",
    "Quelles aides pour les personnes handicapées ?"
  ];

  return (
    <>
      {/* Bouton flottant */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
              aria-label="Ouvrir l'assistant"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fenêtre de chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* En-tête */}
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Assistant AccesDirectAide</h3>
                  <p className="text-sm text-blue-100">Je suis là pour vous aider</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="text-sm">{msg.content}</p>
                    ) : (
                      <div className="text-sm prose prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            a: ({ children, href }) => (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                                {children}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ),
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="px-4 py-3 border-t border-slate-200 bg-white">
                <p className="text-xs text-slate-500 mb-2">Questions fréquentes :</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(q)}
                      className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Posez votre question..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
