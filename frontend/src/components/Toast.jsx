import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

// corner notifications for action feedback (success / error).
// usage: const toast = useToast(); toast.success("Kaydedildi.");
const ToastContext = createContext(null);

// components can be rendered without the provider (e.g. in tests);
// notifications become no-ops instead of crashing
const noopToast = { success: () => {}, error: () => {} };

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="8.5 12.5 11 15 15.5 9.5" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="7.5" x2="12" y2="13" />
      <line x1="12" y1="16.5" x2="12.01" y2="16.5" />
    </svg>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const remove = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (type, message) => {
      const id = ++nextId.current;
      setToasts((current) => [...current, { id, type, message }]);
      setTimeout(() => remove(id), 4500);
    },
    [remove]
  );

  const api = useMemo(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`} role="status">
            {toast.type === "success" ? <CheckIcon /> : <AlertIcon />}
            <span className="toast-message">{toast.message}</span>
            <button
              type="button"
              className="toast-close"
              aria-label="Bildirimi kapat"
              onClick={() => remove(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext) || noopToast;
}
