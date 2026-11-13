"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { AnimatePresence, animate, motion, usePresence, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type ShareRecipient = { id: string; name: string; email: string; avatarUrl?: string };

export type SharePanelColors = {
  background: string;
  text: string;
  accent: string;
};

export type SharePanelProps = {
  title?: string;
  link?: string;
  maxRecipients?: number;
  allowAnyone?: boolean;
  recipients?: ShareRecipient[];
  colors?: Partial<SharePanelColors>;
  onAllowAnyoneChange?: (allow: boolean) => void;
  onRecipientsChange?: (recipients: ShareRecipient[]) => void;
  onCopyLink?: (link: string) => void;
  onInvite?: (recipient: ShareRecipient) => void | Promise<void>;
  onRemove?: (id: string) => void;
};

const COLORS: SharePanelColors = { background: "#FFFFFF", text: "#121212", accent: "#121212" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CHIP_SPRING = { type: "spring", stiffness: 500, damping: 20, mass: 0.6 } as const;
const LIST_SPRING = { type: "spring", stiffness: 380, damping: 34 } as const;
const SHAKE = { x: [0, -6, 6, -4, 4, -2, 0] };
const HEADING = "text-base font-medium";
const BODY = "text-xs";
const MIX = (pct: number) => `color-mix(in srgb, var(--sp-text) ${pct}%, var(--sp-bg))`;
const MESSAGES = {
  invalid: "Invalid email address. Please enter correctly",
  duplicate: "This email has already been invited.",
  server: "Something went wrong. Please try again.",
};

const springOr = (reduce: boolean | null, spring: object) => (reduce ? { duration: 0 } : spring);

function useControllableState<T>(controlled: T | undefined, initial: T, onChange?: (value: T) => void) {
  const [inner, setInner] = useState(initial);
  const value = controlled !== undefined ? controlled : inner;
  function setValue(next: T | ((prev: T) => T)) {
    const resolved = typeof next === "function" ? (next as (prev: T) => T)(value) : next;
    if (controlled === undefined) setInner(resolved);
    onChange?.(resolved);
  }
  return [value, setValue] as const;
}

const nameFromEmail = (email: string) =>
  (email.split("@")[0] ?? email).replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function Asset({ name, className }: { name: string; className?: string }) {
  return <img src={`/share-panel/${name}.svg`} alt="" aria-hidden className={className} />;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path d="M4.5 10.5L8 14L15.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RemoveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 11 11" fill="none" className={className} aria-hidden>
      <path d="M4.53025 6L7 3.53025L6.46975 3L4 5.46975L1.53025 3L1 3.53025L3.46975 6L1 8.46975L1.53025 9L4 6.53025L6.46975 9L7 8.46975L4.53025 6Z" fill="currentColor" />
    </svg>
  );
}

function CautionIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M8 5.33333V8.66667M8 9.66667V10.6667M3.16667 8C3.16667 7.36528 3.29168 6.73677 3.53458 6.15036C3.77748 5.56396 4.1335 5.03113 4.58232 4.58232C5.03113 4.1335 5.56396 3.77748 6.15036 3.53458C6.73677 3.29168 7.36528 3.16667 8 3.16667C8.63472 3.16667 9.26323 3.29168 9.84964 3.53458C10.436 3.77748 10.9689 4.1335 11.4177 4.58232C11.8665 5.03113 12.2225 5.56396 12.4654 6.15036C12.7083 6.73677 12.8333 7.36528 12.8333 8C12.8333 9.28188 12.3241 10.5113 11.4177 11.4177C10.5113 12.3241 9.28188 12.8333 8 12.8333C6.71812 12.8333 5.48874 12.3241 4.58232 11.4177C3.67589 10.5113 3.16667 9.28188 3.16667 8Z" stroke="currentColor" strokeLinejoin="round" />
    </svg>
  );
}

function Avatar({ recipient, size }: { recipient: ShareRecipient; size: number }) {
  if (recipient.avatarUrl) {
    return <img src={recipient.avatarUrl} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-[color:var(--sp-setting-bg)] font-medium [color:var(--sp-muted)]"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {recipient.name.trim().slice(0, 1).toUpperCase() || "?"}
    </span>
  );
}

function AccessSwitch({ checked, onChange }: { checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Allow anyone with the link to access"
      onClick={() => onChange(!checked)}
      className="relative h-6 w-11 shrink-0 rounded-full bg-[color:var(--sp-switch-off)] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[color:var(--sp-accent)] focus-visible:ring-offset-2 motion-reduce:transition-none"
      style={{ background: checked ? "var(--sp-accent)" : undefined }}
    >
      <span
        className={cn(
          "absolute top-1/2 left-[3px] size-[18px] -translate-y-1/2 rounded-full bg-[color:var(--sp-bg)] transition-transform duration-200 motion-reduce:transition-none",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

function RecipientChip({ recipient, onRemove }: { recipient: ShareRecipient; onRemove: () => void }) {
  const reduce = useReducedMotion();
  const [isPresent, safeToRemove] = usePresence();
  const ref = useRef<HTMLSpanElement>(null);
  const [exitStyle, setExitStyle] = useState<CSSProperties>();

  useLayoutEffect(() => {
    if (!isPresent && ref.current && !exitStyle) {
      setExitStyle({ position: "absolute", left: ref.current.offsetLeft, top: ref.current.offsetTop });
    }
  }, [isPresent, exitStyle]);

  return (
    <motion.span
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.5, x: -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.5, x: -10 }}
      transition={springOr(reduce, CHIP_SPRING)}
      onAnimationComplete={() => {
        if (!isPresent) safeToRemove();
      }}
      style={exitStyle}
      className={cn("inline-flex items-center gap-0.5 rounded-full border border-[color:var(--sp-border)] p-0.5 [color:var(--sp-muted)]", BODY)}
    >
      <Avatar recipient={recipient} size={18} />
      <span className="max-w-[160px] truncate">{recipient.name}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${recipient.name}`}
        className="outline-none [color:var(--sp-muted)] hover:[color:var(--sp-text)] focus-visible:[color:var(--sp-text)]"
      >
        <RemoveIcon className="size-[11px]" />
      </button>
    </motion.span>
  );
}

export function SharePanel({
  title = "Share",
  link = "xyz.com/previewlink/note/453",
  maxRecipients = 5,
  allowAnyone: allowAnyoneProp,
  recipients: recipientsProp,
  colors,
  onAllowAnyoneChange,
  onRecipientsChange,
  onCopyLink,
  onInvite,
  onRemove,
}: SharePanelProps) {
  const [allowAnyone, setAllowAnyone] = useControllableState(allowAnyoneProp, true, onAllowAnyoneChange);
  const [recipients, setRecipients] = useControllableState<ShareRecipient[]>(recipientsProp, [], onRecipientsChange);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<"invalid" | "limit" | "duplicate" | "server" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const shake = useRef<ReturnType<typeof animate> | null>(null);
  const reduce = useReducedMotion();
  const { background, text, accent } = { ...COLORS, ...colors };

  useEffect(
    () => () => {
      clearTimeout(copyTimer.current);
      shake.current?.stop();
    },
    [],
  );

  function reject(kind: "invalid" | "duplicate") {
    setError(kind);
    if (reduce) return;
    shake.current?.stop();
    shake.current = animate(formRef.current!, SHAKE, { duration: 0.4, ease: "easeInOut" });
  }

  async function invite(e: FormEvent) {
    e.preventDefault();
    if (recipients.length >= maxRecipients) return setError("limit");
    const email = draft.trim();
    if (!EMAIL_RE.test(email)) return reject("invalid");
    if (recipients.some((r) => r.email.toLowerCase() === email.toLowerCase())) return reject("duplicate");
    const recipient: ShareRecipient = { id: email.toLowerCase(), name: nameFromEmail(email), email };
    setSubmitting(true);
    try {
      await onInvite?.(recipient);
      setRecipients((list) => [...list, recipient]);
      setDraft("");
      setError(null);
    } catch {
      setError("server");
    } finally {
      setSubmitting(false);
    }
  }

  function remove(id: string) {
    setRecipients((list) => list.filter((r) => r.id !== id));
    onRemove?.(id);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      onCopyLink?.(link);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyState("idle"), 1500);
  }

  const vars = {
    "--sp-bg": background,
    "--sp-text": text,
    "--sp-accent": accent,
    "--sp-border": MIX(8),
    "--sp-muted": MIX(70),
    "--sp-setting-bg": MIX(5),
    "--sp-link-bg": MIX(2),
    "--sp-switch-off": MIX(35),
    "--sp-input-border-hover": MIX(6),
    "--sp-danger": "#B20202",
  } as CSSProperties;

  return (
    <div className="w-full max-w-[373px] rounded-3xl border bg-[color:var(--sp-bg)] px-4 py-5 [border-color:var(--sp-border)]" style={vars}>
      <h2 className="text-[20px] font-medium [color:var(--sp-text)]">{title}</h2>

      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center gap-2.5 rounded-[20px] bg-[color:var(--sp-setting-bg)] p-2.5 [corner-shape:squircle]">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[16px] bg-[color:var(--sp-bg)] shadow-[0_2px_6.5px_0_rgba(0,0,0,0.05)] [corner-shape:squircle]">
            <Asset name="globe" className="size-6" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className={HEADING}>Anyone</p>
            <p className={cn(BODY, "[color:var(--sp-muted)]")}>Everyone with the link can access</p>
          </div>
          <AccessSwitch checked={allowAnyone} onChange={setAllowAnyone} />
        </div>

        <div className="flex items-center justify-between gap-2 rounded-[20px] bg-[color:var(--sp-link-bg)] px-2.5 py-[5px] [corner-shape:squircle]">
          <p className={cn(BODY, "truncate [color:var(--sp-muted)]")}>{link}</p>
          <button
            type="button"
            onClick={copy}
            aria-label={copyState === "error" ? "Copy link (failed, try again)" : "Copy link"}
            className={cn(
              "shrink-0 rounded outline-none hover:[color:var(--sp-text)] focus-visible:ring-2 focus-visible:ring-[color:var(--sp-text)] focus-visible:ring-offset-2",
              copyState === "error" ? "[color:var(--sp-danger)]" : "[color:var(--sp-muted)]",
            )}
          >
            {copyState === "copied" && <CheckIcon className="size-5" />}
            {copyState === "error" && <CautionIcon className="size-5" />}
            {copyState === "idle" && <Asset name="copy-link" className="size-5" />}
          </button>
        </div>
      </div>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
        style={{ gridTemplateRows: allowAnyone ? "0fr" : "1fr" }}
      >
        <div className="-mx-1 -my-1 overflow-hidden px-1 py-1">
          <div className="flex flex-col gap-4 pt-6">
            <p className="text-base [color:var(--sp-muted)]">Invite</p>

            <div className="flex flex-col gap-2">
              <form
                ref={formRef}
                onSubmit={invite}
                noValidate
                className="flex items-center justify-between gap-2 rounded-[10px] border py-1.5 pl-2.5 pr-1.5 transition-[box-shadow,border-color] duration-150 [border-color:var(--sp-border)] [&:hover:not(:focus-within)]:[box-shadow:0_0_0_1.5px_var(--sp-input-border-hover)] focus-within:[border-color:var(--sp-accent)] motion-reduce:transition-none"
                style={{ borderColor: error === "invalid" ? "var(--sp-danger)" : undefined }}
              >
                <div className="relative flex flex-1 flex-wrap items-center gap-1.5 pl-[22px]" onClick={() => inputRef.current?.focus()}>
                  <Asset name="add-recipient" className="-ml-[22px] size-4 shrink-0" />
                  <AnimatePresence initial={false}>
                    {recipients.map((r) => (
                      <RecipientChip key={r.id} recipient={r} onRemove={() => remove(r.id)} />
                    ))}
                  </AnimatePresence>
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && draft === "" && recipients.length > 0) {
                        e.preventDefault();
                        remove(recipients[recipients.length - 1].id);
                      }
                    }}
                    placeholder={recipients.length === 0 ? "Enter email address" : undefined}
                    aria-label="Recipient email"
                    aria-invalid={error === "invalid"}
                    aria-describedby={error ? "share-panel-invite-error" : undefined}
                    type="email"
                    autoComplete="off"
                    name="share-panel-invite-email"
                    className={cn(BODY, "h-4 min-w-[120px] flex-1 bg-transparent leading-4 text-[color:var(--sp-muted)] outline-none placeholder:[color:var(--sp-muted)]")}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-[31px] shrink-0 items-center justify-center gap-0.5 rounded-[14px] bg-[color:var(--sp-accent)] pl-2 pr-3 text-xs font-medium text-[color:var(--sp-bg)] outline-none [corner-shape:squircle] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[color:var(--sp-accent)] focus-visible:ring-offset-2 disabled:opacity-60"
                >
                  <Asset name="send-invite" className="size-4" />
                  {submitting ? "Inviting…" : "Invite"}
                </button>
              </form>
              <AnimatePresence>
                {error && (
                  <motion.p
                    id="share-panel-invite-error"
                    role="alert"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={springOr(reduce, { duration: 0.15 })}
                    className={cn("flex items-center gap-0.5 text-[10px]", error === "limit" ? "[color:var(--sp-muted)]" : "[color:var(--sp-danger)]")}
                  >
                    <CautionIcon className="size-4 shrink-0" />
                    {error === "limit" ? `You can add up to ${maxRecipients} email invites at once.` : MESSAGES[error]}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {recipients.length > 0 && (
                <motion.ul
                  initial={{ scale: 0.2, opacity: 0, originX: 0.5, originY: 0 }}
                  animate={{ scale: 1, opacity: 1, originX: 0.5, originY: 0 }}
                  exit={{ scale: 0.2, opacity: 0, originX: 0, originY: 0 }}
                  transition={springOr(reduce, LIST_SPRING)}
                  className="flex flex-col gap-2"
                >
                  <AnimatePresence initial={false} mode="popLayout">
                    {recipients.map((r) => (
                      <motion.li
                        key={r.id}
                        layout
                        initial={{ opacity: 0, scale: 0.6, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={springOr(reduce, LIST_SPRING)}
                        className="flex items-center gap-2.5 rounded-[16px] border px-2.5 py-2 [border-color:var(--sp-border)]"
                      >
                        <Avatar recipient={r} size={40} />
                        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                          <p className={cn(HEADING, "truncate")}>{r.name}</p>
                          <p className={cn(BODY, "truncate [color:var(--sp-muted)]")}>{r.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(r.id)}
                          aria-label={`Remove ${r.name}`}
                          className={cn(BODY, "shrink-0 [color:var(--sp-danger)] outline-none hover:underline focus-visible:underline")}
                        >
                          Remove
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
