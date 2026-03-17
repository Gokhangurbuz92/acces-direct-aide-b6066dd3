import { useEffect, useRef, useState, useCallback } from 'react';
import { Compass, Send, X, Loader2, RefreshCw, ExternalLink, MapPin, Sparkles } from 'lucide-react';
import FeedbackButtons from '@/components/assistant/FeedbackButtons';
import { getCsrfHeaders } from '@/lib/csrf';

/**
 * ChatAssistant v2 — La Boussole Sociale
 *
 * Widget flottant (FAB) d'orientation contextuelle et territoriale.
 * Rebrandé du chatbot technique vers un assistant empathique.
 *
 * @param {{ embedded?: boolean }} props
 *   - embedded: if true, renders inline (for Orientation page); default false = floating widget
 */

const INITIAL_PROMPTS = [
  "J'ai besoin d'aide pour mon loyer",
  "Je suis en situation de handicap",
  "Où trouver une aide alimentaire ?",
];

const BOUSSOLE_GREETING = {
  id: 1,
  role: 'assistant',
  content:
    'Bonjour 👋 Je suis la Boussole Sociale. Je peux vous orienter vers les aides et les structures adaptées à votre situation. Posez-moi votre question !',
};

export default function ChatAssistant({ embedded = false }) {
  const [isOpen, setIsOpen] = useState(embedded);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(/** @type {string | null} */(null));
  const [messages, setMessages] = useState([BOUSSOLE_GREETING]);
  const [territory, setTerritory] = useState(/** @type {string | null} */(null));
  const [sessionId] = useState(() => `compass-${Date.now()}`);
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

  /** Send a message to the Boussole orient endpoint */
  const handleSubmit = useCallback(
    async (event) => {
      if (event) event.preventDefault();
      const trimmedValue = typeof event === 'string' ? event : inputValue.trim();
      if (!trimmedValue || isLoading) return;

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
        const res = await fetch('/api/public/assistant/orient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
          body: JSON.stringify({
            message: trimmedValue,
            territory,
            sessionId,
          }),
          signal: controller.signal,
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || 'Une erreur est survenue.');
          return;
        }

        // Update territory if detected
        if (data.meta?.territory && data.meta.territory !== 'national') {
          setTerritory(data.meta.territory);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            role: 'assistant',
            content: data.answer,
            links: data.links || [],
            suggestions: data.suggestions || [],
            logId: null,
          },
        ]);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError('Une erreur inattendue est survenue. Veuillez réessayer.');
      } finally {
        setIsLoading(false);
      }
    },
    [inputValue, isLoading, territory, sessionId],
  );

  /** Send a pre-defined prompt */
  const handlePromptClick = useCallback(
    (prompt) => {
      if (isLoading) return;
      setInputValue('');
      // Build a fake event to reuse handleSubmit
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: 'user', content: prompt },
      ]);
      setIsLoading(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      fetch('/api/public/assistant/orient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
        body: JSON.stringify({ message: prompt, territory, sessionId }),
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.meta?.territory && data.meta.territory !== 'national') {
            setTerritory(data.meta.territory);
          }
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              role: 'assistant',
              content: data.answer,
              links: data.links || [],
              suggestions: data.suggestions || [],
              logId: null,
            },
          ]);
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          setError('Erreur de connexion. Réessayez.');
        })
        .finally(() => setIsLoading(false));
    },
    [isLoading, territory, sessionId],
  );

  const handleRetry = useCallback(() => {
    setError(null);
    inputRef.current?.focus();
  }, []);

  // Auto-focus input when chat opens + restore focus to FAB on close
  useEffect(() => {
    if (!embedded) {
      if (isOpen) {
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
          'button:not([disabled]), input:not([disabled]), a[href], textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
        aria-label="Discussion avec la Boussole Sociale"
      >
        <CompassHeader />
        <CompassMessages
          messages={messages}
          isLoading={isLoading}
          error={error}
          onRetry={handleRetry}
          onPromptClick={handlePromptClick}
          endOfMessagesRef={endOfMessagesRef}
          territory={territory}
        />
        <CompassInput
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
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-teal-700 text-white shadow-lg transition-all hover:bg-teal-800 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 group"
        aria-label={isOpen ? "Fermer la Boussole Sociale" : "Ouvrir la Boussole Sociale"}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Compass className="h-6 w-6 group-hover:rotate-45 transition-transform duration-500" />
        )}
      </button>

      {isOpen && (
        <section
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Fenêtre de discussion avec la Boussole Sociale"
          className="fixed bottom-24 right-0 z-50 flex h-[540px] w-full max-h-[calc(100dvh-7rem)] flex-col overflow-hidden border border-slate-200 bg-white shadow-2xl sm:right-6 sm:w-[400px] sm:rounded-2xl safe-area-bottom"
        >
          <CompassHeader onClose={() => setIsOpen(false)} territory={territory} />
          <CompassMessages
            messages={messages}
            isLoading={isLoading}
            error={error}
            onRetry={handleRetry}
            onPromptClick={handlePromptClick}
            endOfMessagesRef={endOfMessagesRef}
            territory={territory}
          />
          <CompassInput
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
// Sub-components — Boussole Sociale Branding
// ---------------------------------------------------------------------------

function CompassHeader({ onClose, territory }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-teal-700 px-4 py-3 text-white">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-white/20 p-1.5">
          <Compass className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold">Boussole Sociale</h2>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-[10px] font-medium text-teal-100">
              {territory ? (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Dept. {territory}
                </span>
              ) : (
                'IA Inclusive Active'
              )}
            </span>
          </div>
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          aria-label="Fermer la Boussole Sociale"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </header>
  );
}

function CompassMessages({ messages, isLoading, error, onRetry, onPromptClick, endOfMessagesRef, territory }) {
  const showInitialPrompts = messages.length <= 1 && !isLoading;

  return (
    <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4" role="log" aria-live="polite">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${message.role === 'user'
                ? 'bg-teal-700 text-white'
                : 'border border-slate-200 bg-white text-slate-700'
              }`}
          >
            <p className="leading-relaxed">{message.content}</p>

            {/* Smart Links */}
            {message.links && message.links.length > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2">
                {message.links.map((link, j) => (
                  <a
                    key={j}
                    href={link.url}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-50"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {link.type === 'structure' ? (
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                      ) : (
                        <Sparkles className="h-3 w-3 flex-shrink-0" />
                      )}
                      {link.title}
                    </span>
                    <ExternalLink className="h-3 w-3 flex-shrink-0 ml-1" />
                  </a>
                ))}
              </div>
            )}

            {/* Suggested follow-up questions */}
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
                {message.suggestions.map((s, j) => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => onPromptClick(s)}
                    className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-700 transition-colors hover:bg-teal-100"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {message.role === 'assistant' && message.logId && (
              <FeedbackButtons logId={message.logId} />
            )}
          </div>
        </div>
      ))}

      {/* Initial suggested prompts */}
      {showInitialPrompts && (
        <div className="space-y-2 pt-2">
          <p className="text-center text-xs font-medium text-slate-400">
            Comment puis-je vous guider ?
          </p>
          {INITIAL_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onPromptClick(prompt)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left text-xs font-medium text-slate-600 shadow-sm transition-all hover:border-teal-300 hover:text-teal-700"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-start">
          <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-400" />
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-500 [animation-delay:0.15s]" />
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-600 [animation-delay:0.3s]" />
            <span className="ml-1">Orientation en cours…</span>
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
                  className="inline-flex items-center gap-1 self-start rounded-md bg-teal-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-teal-700"
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

function CompassInput({ inputValue, setInputValue, isLoading, onSubmit, inputRef }) {
  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-slate-200 bg-white p-3">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        placeholder="Décrivez votre situation…"
        maxLength={800}
        disabled={isLoading}
        className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Message utilisateur"
      />
      <button
        type="submit"
        disabled={!inputValue.trim() || isLoading}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-teal-700 text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
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
