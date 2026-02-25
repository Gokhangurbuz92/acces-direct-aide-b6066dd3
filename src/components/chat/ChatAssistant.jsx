import { useEffect, useRef, useState, useCallback } from 'react';
import { MessageCircle, Send, X, Loader2, RefreshCw } from 'lucide-react';
import { sendMessage, AssistantError } from '@/lib/assistant/client';

/**
 * @param {{ embedded?: boolean }} props
 *   - embedded: if true, renders inline (for Orientation page); default false = floating widget
 */
export default function ChatAssistant({ embedded = false }) {
  const [isOpen, setIsOpen] = useState(embedded);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(/** @type {string | null} */(null));
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Bonjour, je peux vous aider à trouver les aides adaptées à votre situation.',
    },
  ]);
  const endOfMessagesRef = useRef(null);
  const inputRef = useRef(null);
  const fabRef = useRef(null);
  const dialogRef = useRef(null);
  /** @type {import('react').MutableRefObject<AbortController | null>} */
  const abortRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isLoading]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const trimmedValue = inputValue.trim();
      if (!trimmedValue || isLoading) return;

      // Clear any previous error
      setError(null);
      setInputValue('');

      const userMessageId = Date.now();
      setMessages((prev) => [
        ...prev,
        { id: userMessageId, role: 'user', content: trimmedValue },
      ]);

      setIsLoading(true);

      // Abort any previous in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await sendMessage(trimmedValue, undefined, {
          signal: controller.signal,
        });

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            role: 'assistant',
            content: response.answer,
          },
        ]);
      } catch (err) {
        if (err instanceof AssistantError) {
          if (err.status === 503 || err.code === 'service_unavailable') {
            setError('L\u2019assistant est temporairement indisponible. Utilisez le diagnostic d\u2019orientation pour un accompagnement personnalisé.');
          } else {
            setError(err.userMessage);
          }
        } else if (err instanceof DOMException && err.name === 'AbortError') {
          // Request was cancelled (e.g. new message sent), don't show error
          return;
        } else {
          setError('Une erreur inattendue est survenue. Veuillez réessayer.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [inputValue, isLoading],
  );

  const handleRetry = useCallback(() => {
    setError(null);
    // Focus input so user can re-type or modify
    inputRef.current?.focus();
  }, []);

  // Auto-focus input when chat opens + restore focus to FAB on close
  useEffect(() => {
    if (!embedded) {
      if (isOpen) {
        // Delay to let DOM mount
        requestAnimationFrame(() => inputRef.current?.focus());
      } else {
        fabRef.current?.focus();
      }
    }
  }, [isOpen, embedded]);

  // Focus trap + Esc handler for floating widget
  useEffect(() => {
    if (!isOpen || embedded) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    /** @param {KeyboardEvent} e */
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        return;
      }
      if (e.key === 'Tab') {
        const focusable = dialog.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), a[href], textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    dialog.addEventListener('keydown', handleKeyDown);
    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, embedded]);

  // --- Embedded mode: render inline, no FAB ---
  if (embedded) {
    return (
      <section
        className="flex h-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        aria-label="Discussion avec l'assistant"
      >
        <ChatHeader />
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          error={error}
          onRetry={handleRetry}
          endOfMessagesRef={endOfMessagesRef}
        />
        <ChatInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          inputRef={inputRef}
        />
      </section>
    );
  }

  // --- Floating widget mode ---
  return (
    <>
      <button
        ref={fabRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        aria-label={isOpen ? "Fermer l'assistant" : "Ouvrir l'assistant"}
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {isOpen && (
        <section
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Fenêtre de discussion avec l'assistant"
          className="fixed bottom-24 right-0 z-50 flex h-[500px] w-full max-h-[calc(100dvh-7rem)] flex-col overflow-hidden border border-slate-200 bg-white shadow-2xl sm:right-6 sm:w-[380px] sm:rounded-2xl safe-area-bottom"
        >
          <ChatHeader onClose={() => setIsOpen(false)} />
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            error={error}
            onRetry={handleRetry}
            endOfMessagesRef={endOfMessagesRef}
          />
          <ChatInput
            inputValue={inputValue}
            setInputValue={setInputValue}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            inputRef={inputRef}
          />
        </section>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ChatHeader({ onClose }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-blue-600 px-4 py-3 text-white">
      <div>
        <h2 className="text-sm font-semibold">Assistant AccesDirectAide</h2>
        <p className="text-xs text-blue-100">Propulsé par Gemini</p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          aria-label="Fermer la fenetre de discussion"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </header>
  );
}

function ChatMessages({ messages, isLoading, error, onRetry, endOfMessagesRef }) {
  return (
    <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4" role="log" aria-live="polite">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${message.role === 'user'
              ? 'bg-blue-600 text-white'
              : 'border border-slate-200 bg-white text-slate-700'
              }`}
          >
            {message.content}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Réflexion en cours…</span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex justify-start" data-testid="chat-error">
          <div className="flex max-w-[85%] flex-col gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <p>{error}</p>
            <div className="flex flex-wrap gap-2">
              {error.includes('indisponible') && (
                <a
                  href="/orientation"
                  className="inline-flex items-center gap-1 self-start rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Aller au diagnostic
                </a>
              )}
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1 self-start rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                Réessayer
              </button>
            </div>
          </div>
        </div>
      )}

      <div ref={endOfMessagesRef} />
    </div>
  );
}

function ChatInput({ inputValue, setInputValue, isLoading, onSubmit, inputRef }) {
  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-slate-200 bg-white p-3">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        placeholder="Ecrivez votre question…"
        maxLength={800}
        disabled={isLoading}
        className="h-10 flex-1 rounded-md border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Message utilisateur"
      />
      <button
        type="submit"
        disabled={!inputValue.trim() || isLoading}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Envoyer le message"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </button>
    </form>
  );
}
