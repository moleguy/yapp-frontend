"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Modal from "@/app/(main)/components/Modal";

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export type PromptOptions = {
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

export type AlertOptions = {
  title?: string;
  message: string;
  okLabel?: string;
};

type DialogRequest =
  | { kind: "confirm"; options: ConfirmOptions; resolve: (value: boolean) => void }
  | { kind: "prompt"; options: PromptOptions; resolve: (value: string | null) => void }
  | { kind: "alert"; options: AlertOptions; resolve: () => void };

type DialogContextValue = {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
  prompt: (options: PromptOptions | string, defaultValue?: string) => Promise<string | null>;
  alert: (options: AlertOptions | string) => Promise<void>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function normalizeConfirm(options: ConfirmOptions | string): ConfirmOptions {
  return typeof options === "string" ? { message: options } : options;
}

function normalizePrompt(
  options: PromptOptions | string,
  defaultValue?: string
): PromptOptions {
  if (typeof options === "string") {
    return { title: options, defaultValue: defaultValue ?? "" };
  }
  return options;
}

function normalizeAlert(options: AlertOptions | string): AlertOptions {
  return typeof options === "string" ? { message: options } : options;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<DialogRequest | null>(null);
  const [promptValue, setPromptValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const confirm = useCallback((options: ConfirmOptions | string) => {
    return new Promise<boolean>((resolve) => {
      setRequest({
        kind: "confirm",
        options: normalizeConfirm(options),
        resolve,
      });
    });
  }, []);

  const prompt = useCallback((options: PromptOptions | string, defaultValue?: string) => {
    return new Promise<string | null>((resolve) => {
      setRequest({
        kind: "prompt",
        options: normalizePrompt(options, defaultValue),
        resolve,
      });
    });
  }, []);

  const alert = useCallback((options: AlertOptions | string) => {
    return new Promise<void>((resolve) => {
      setRequest({
        kind: "alert",
        options: normalizeAlert(options),
        resolve,
      });
    });
  }, []);

  const closeRequest = useCallback((result?: boolean | string | null) => {
    setRequest((current) => {
      if (!current) return null;
      switch (current.kind) {
        case "alert":
          current.resolve();
          break;
        case "confirm":
          current.resolve(result === true);
          break;
        case "prompt":
          current.resolve(typeof result === "string" ? result : null);
          break;
      }
      return null;
    });
  }, []);

  useEffect(() => {
    if (request?.kind === "prompt") {
      setPromptValue(request.options.defaultValue ?? "");
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [request]);

  useEffect(() => {
    if (!request) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (request.kind === "alert") {
        if (e.key === "Enter") {
          e.preventDefault();
          closeRequest();
        }
        return;
      }
      if (request.kind === "prompt" && e.key === "Enter") {
        e.preventDefault();
        closeRequest(promptValue);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [request, promptValue, closeRequest]);

  const isConfirm = request?.kind === "confirm";
  const isAlert = request?.kind === "alert";
  const options = request?.options;
  const destructive = isConfirm && (options as ConfirmOptions).destructive;

  const handleBackdrop = () => {
    if (isAlert) closeRequest();
    else closeRequest(false);
  };

  return (
    <DialogContext.Provider value={{ confirm, prompt, alert }}>
      {children}
      {request && options && (
        <Modal
          isOpen
          onClose={handleBackdrop}
          ariaLabelledby="dialog-title"
          panelClassName="bg-surface-card rounded-xl border border-default shadow-lg w-full max-w-md p-6"
        >
            <h2 id="dialog-title" className="text-xl font-medium text-list-emphasis tracking-wide">
              {isAlert
                ? (options as AlertOptions).title ?? "Notice"
                : isConfirm
                  ? (options as ConfirmOptions).title ?? "Confirm"
                  : (options as PromptOptions).title}
            </h2>

            {isAlert ? (
              <p className="mt-3 text-sm text-list-muted leading-relaxed">
                {(options as AlertOptions).message}
              </p>
            ) : isConfirm ? (
              <p className="mt-3 text-sm text-list-muted leading-relaxed">
                {(options as ConfirmOptions).message}
              </p>
            ) : (
              <>
                {(options as PromptOptions).message && (
                  <p className="mt-2 text-sm text-list-muted">{(options as PromptOptions).message}</p>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder={(options as PromptOptions).placeholder}
                  className="mt-4 w-full py-2 px-3 border border-default rounded-lg text-list-emphasis focus:outline-none focus:border-primary"
                />
              </>
            )}

            <div className={`mt-6 flex ${isAlert ? "justify-end" : "justify-end gap-3"}`}>
              {!isAlert && (
              <button
                type="button"
                onClick={() => closeRequest(false)}
                className="px-4 py-2 rounded-lg border border-default text-list-emphasis hover:bg-surface-muted transition-colors"
              >
                {isConfirm
                  ? (options as ConfirmOptions).cancelLabel ?? "Cancel"
                  : (options as PromptOptions).cancelLabel ?? "Cancel"}
              </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (isAlert) {
                    closeRequest();
                  } else if (isConfirm) {
                    closeRequest(true);
                  } else {
                    closeRequest(promptValue);
                  }
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  destructive
                    ? "border border-destructive text-destructive hover:bg-destructive-muted"
                    : "bg-primary text-white hover:opacity-90"
                }`}
              >
                {isAlert
                  ? (options as AlertOptions).okLabel ?? "OK"
                  : isConfirm
                    ? (options as ConfirmOptions).confirmLabel ?? (destructive ? "Delete" : "Confirm")
                    : (options as PromptOptions).confirmLabel ?? "OK"}
              </button>
            </div>
        </Modal>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error("useDialog must be used within DialogProvider");
  }
  return ctx;
}
