"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Inter } from "next/font/google";
import { AnimatePresence, animate, motion, usePresence, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CHIP_SPRING = { type: "spring", stiffness: 500, damping: 20, mass: 0.6 } as const;
const LIST_SPRING = { type: "spring", stiffness: 380, damping: 34 } as const;
const SHAKE = { x: [0, -6, 6, -4, 4, -2, 0] };

function springOr(reduceMotion: boolean | null, spring: object) {
  return reduceMotion ? { duration: 0 } : spring;
}

export type ShareRecipient = { id: string; name: string; email: string; avatarUrl?: string };

export type SharePanelColors = {
  background: string;
  border: string;
  text: string;
  mutedText: string;
  settingBackground: string;
  linkBackground: string;
  danger: string;
  iconColor: string;
  switchOff: string;
  switchOn: string;
  switchThumb: string;
  buttonBackground: string;
  buttonText: string;
  inputBorder: string;
  inputBorderHover: string;
  inputBorderFocus: string;
  chipBorder: string;
};

export type SharePanelTypography = {
  titleSize: number;
  titleWeight: number;
  headingSize: number;
  headingWeight: number;
  labelSize: number;
  labelWeight: number;
  bodySize: number;
  bodyWeight: number;
  buttonSize: number;
  buttonWeight: number;
  captionSize: number;
  captionWeight: number;
};

export type SharePanelSizes = {
  radius: number;
  paddingX: number;
  paddingY: number;
  iconBoxSize: number;
  buttonHeight: number;
  buttonPaddingLeft: number;
  buttonPaddingRight: number;
  buttonRadius: number;
  inputPaddingLeft: number;
  inputPaddingRight: number;
  inputPaddingY: number;
  inputRadius: number;
  avatarChipSize: number;
  avatarListSize: number;
};

export type SharePanelProps = {
  title?: string;
  link?: string;
  onCopyLink?: (link: string) => void;
  defaultAllowAnyone?: boolean;
  onAllowAnyoneChange?: (allow: boolean) => void;
  defaultRecipients?: ShareRecipient[];
  onInvite?: (recipient: ShareRecipient) => void;
  onRemove?: (id: string) => void;
  resolveAvatar?: (recipient: ShareRecipient, index: number) => string | undefined;
  maxRecipients?: number;
  duration?: number;
  colors?: Partial<SharePanelColors>;
  sizes?: Partial<SharePanelSizes>;
  typography?: Partial<SharePanelTypography>;
  className?: string;
};

const DEFAULT_COLORS: SharePanelColors = {
  background: "#FFFFFF",
  border: "#EBEBEB",
  text: "#121212",
  mutedText: "#515151",
  settingBackground: "#F4F4FB",
  linkBackground: "#FBFBFB",
  danger: "#B20202",
  iconColor: "#515151",
  switchOff: "#ADACB8",
  switchOn: "#121212",
  switchThumb: "#FFFFFF",
  buttonBackground: "#121212",
  buttonText: "#FFFFFF",
  inputBorder: "#EBEBEE",
  inputBorderHover: "#F0F0F0",
  inputBorderFocus: "#121212",
  chipBorder: "#EBEBEB",
};

const DEFAULT_TYPOGRAPHY: SharePanelTypography = {
  titleSize: 20,
  titleWeight: 500,
  headingSize: 16,
  headingWeight: 500,
  labelSize: 16,
  labelWeight: 400,
  bodySize: 12,
  bodyWeight: 400,
  buttonSize: 12,
  buttonWeight: 500,
  captionSize: 10,
  captionWeight: 400,
};

const DEFAULT_SIZES: SharePanelSizes = {
  radius: 24,
  paddingX: 16,
  paddingY: 20,
  iconBoxSize: 44,
  buttonHeight: 31,
  buttonPaddingLeft: 8,
  buttonPaddingRight: 12,
  buttonRadius: 14,
  inputPaddingLeft: 10,
  inputPaddingRight: 6,
  inputPaddingY: 6,
  inputRadius: 10,
  avatarChipSize: 18,
  avatarListSize: 40,
};

function nameFromEmail(email: string) {
  const local = email.split("@")[0] ?? email;
  return local.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function GlobeIcon({ className }: { className?: string }) {
  return <img src="/share-panel/globe.svg" alt="" aria-hidden className={className} />;
}

function CopyIcon({ className }: { className?: string }) {
  return <img src="/share-panel/copy-link.svg" alt="" aria-hidden className={className} />;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path d="M4.5 10.5L8 14L15.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AddRecipientIcon({ className }: { className?: string }) {
  return <img src="/share-panel/add-recipient.svg" alt="" aria-hidden className={className} />;
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

function SendIcon({ className }: { className?: string }) {
  return <img src="/share-panel/send-invite.svg" alt="" aria-hidden className={className} />;
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
      className="relative h-6 w-11 shrink-0 rounded-full bg-[color:var(--sp-switch-off)] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[color:var(--sp-switch-on)] focus-visible:ring-offset-2 motion-reduce:transition-none"
      style={{ background: checked ? "var(--sp-switch-on)" : undefined }}
    >
      <span
        className={cn(
          "absolute top-1/2 left-[3px] size-[18px] -translate-y-1/2 rounded-full bg-[color:var(--sp-switch-thumb)] transition-transform duration-200 motion-reduce:transition-none",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

function RecipientChip({
  recipient,
  size,
  textStyle,
  onRemove,
}: {
  recipient: ShareRecipient;
  size: number;
  textStyle: CSSProperties;
  onRemove: () => void;
}) {
  const reduceMotion = useReducedMotion();
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
      transition={springOr(reduceMotion, CHIP_SPRING)}
      onAnimationComplete={() => {
        if (!isPresent) safeToRemove();
      }}
      style={{ ...textStyle, ...exitStyle }}
      className="inline-flex items-center gap-0.5 rounded-full border border-[color:var(--sp-chip-border)] p-0.5 [color:var(--sp-muted)]"
    >
      <Avatar recipient={recipient} size={size} />
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
  onCopyLink,
  defaultAllowAnyone = true,
  onAllowAnyoneChange,
  defaultRecipients = [],
  onInvite,
  onRemove,
  resolveAvatar,
  maxRecipients = 5,
  duration = 0.3,
  colors,
  sizes,
  typography,
  className,
}: SharePanelProps) {
  const [allowAnyone, setAllowAnyone] = useState(defaultAllowAnyone);
  const [recipients, setRecipients] = useState(defaultRecipients);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<"invalid" | "limit" | null>(null);
  const [copied, setCopied] = useState(false);
  const nextId = useRef(0);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const shake = useRef<ReturnType<typeof animate> | null>(null);
  const reduceMotion = useReducedMotion();
  const c = { ...DEFAULT_COLORS, ...colors };
  const s = { ...DEFAULT_SIZES, ...sizes };
  const t = { ...DEFAULT_TYPOGRAPHY, ...typography };
  const heading = { fontSize: t.headingSize, fontWeight: t.headingWeight };
  const body = { fontSize: t.bodySize, fontWeight: t.bodyWeight };

  useEffect(() => () => {
    clearTimeout(copyTimer.current);
    shake.current?.stop();
  }, []);

  function toggleAccess(next: boolean) {
    setAllowAnyone(next);
    onAllowAnyoneChange?.(next);
  }

  function handleInvite(e: FormEvent) {
    e.preventDefault();
    if (recipients.length >= maxRecipients) {
      setError("limit");
      return;
    }
    const email = draft.trim();
    if (!EMAIL_RE.test(email)) {
      setError("invalid");
      if (!reduceMotion) {
        shake.current?.stop();
        shake.current = animate(formRef.current!, SHAKE, { duration: 0.4, ease: "easeInOut" });
      }
      return;
    }
    const base: ShareRecipient = { id: `r${nextId.current++}`, name: nameFromEmail(email), email };
    const recipient: ShareRecipient = { ...base, avatarUrl: resolveAvatar?.(base, recipients.length) };
    setRecipients((list) => [...list, recipient]);
    onInvite?.(recipient);
    setDraft("");
    setError(null);
  }

  function handleRemove(id: string) {
    setRecipients((list) => list.filter((r) => r.id !== id));
    onRemove?.(id);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // clipboard unavailable (unsupported browser or no permission); the link text is still visible
    }
    onCopyLink?.(link);
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1500);
  }

  const vars = {
    "--sp-bg": c.background,
    "--sp-border": c.border,
    "--sp-text": c.text,
    "--sp-muted": c.mutedText,
    "--sp-setting-bg": c.settingBackground,
    "--sp-link-bg": c.linkBackground,
    "--sp-danger": c.danger,
    "--sp-icon": c.iconColor,
    "--sp-switch-off": c.switchOff,
    "--sp-switch-on": c.switchOn,
    "--sp-switch-thumb": c.switchThumb,
    "--sp-btn-bg": c.buttonBackground,
    "--sp-btn-text": c.buttonText,
    "--sp-input-border": c.inputBorder,
    "--sp-input-border-hover": c.inputBorderHover,
    "--sp-input-border-focus": c.inputBorderFocus,
    "--sp-chip-border": c.chipBorder,
  } as CSSProperties;

  return (
    <div
      className={cn(inter.className, "w-full max-w-[373px] border bg-[color:var(--sp-bg)] [border-color:var(--sp-border)]", className)}
      style={{ ...vars, borderRadius: s.radius, paddingInline: s.paddingX, paddingBlock: s.paddingY }}
    >
      <h2 className="[color:var(--sp-text)]" style={{ fontSize: t.titleSize, fontWeight: t.titleWeight }}>
        {title}
      </h2>

      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center gap-2.5 rounded-[20px] bg-[color:var(--sp-setting-bg)] p-2.5 [corner-shape:squircle]">
          <div
            className="flex shrink-0 items-center justify-center rounded-[16px] bg-[color:var(--sp-bg)] [color:var(--sp-icon)] shadow-[0_2px_6.5px_0_rgba(0,0,0,0.05)] [corner-shape:squircle]"
            style={{ width: s.iconBoxSize, height: s.iconBoxSize }}
          >
            <GlobeIcon className="size-6" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-[0px]">
            <p className="[color:var(--sp-text)]" style={heading}>
              Anyone
            </p>
            <p className="[color:var(--sp-muted)]" style={body}>
              Everyone with the link can access
            </p>
          </div>
          <AccessSwitch checked={allowAnyone} onChange={toggleAccess} />
        </div>

        <div className="flex items-center justify-between gap-2 rounded-[20px] bg-[color:var(--sp-link-bg)] px-2.5 py-[5px] [corner-shape:squircle]">
          <p className="truncate [color:var(--sp-muted)]" style={body}>
            {link}
          </p>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy link"
            className="shrink-0 rounded outline-none [color:var(--sp-muted)] hover:[color:var(--sp-text)] focus-visible:ring-2 focus-visible:ring-[color:var(--sp-text)] focus-visible:ring-offset-2"
          >
            {copied ? <CheckIcon className="size-5" /> : <CopyIcon className="size-5" />}
          </button>
        </div>
      </div>

      <div
        className="grid transition-[grid-template-rows] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
        style={{ gridTemplateRows: allowAnyone ? "0fr" : "1fr", transitionDuration: `${duration}s` }}
      >
        <div className="-mx-1 -my-1 overflow-hidden px-1 py-1">
          <div className="flex flex-col gap-4 pt-6">
            <p className="[color:var(--sp-muted)]" style={{ fontSize: t.labelSize, fontWeight: t.labelWeight }}>
              Invite
            </p>

            <div className="flex flex-col gap-2">
              <form
                ref={formRef}
                onSubmit={handleInvite}
                noValidate
                className="flex items-center justify-between gap-2 border [border-color:var(--sp-input-border)] transition-[box-shadow,border-color] duration-150 [&:hover:not(:focus-within)]:[box-shadow:0_0_0_1.5px_var(--sp-input-border-hover)] focus-within:[border-color:var(--sp-input-border-focus)] motion-reduce:transition-none"
                style={{
                  borderRadius: s.inputRadius,
                  paddingLeft: s.inputPaddingLeft,
                  paddingRight: s.inputPaddingRight,
                  paddingBlock: s.inputPaddingY,
                  borderColor: error === "invalid" ? "var(--sp-danger)" : undefined,
                }}
              >
                <div
                  className="relative flex flex-1 flex-wrap items-center gap-1.5 pl-[22px]"
                  onClick={() => inputRef.current?.focus()}
                >
                  <AddRecipientIcon className="-ml-[22px] size-4 shrink-0 [color:var(--sp-icon)]" />
                  <AnimatePresence initial={false}>
                    {recipients.map((r) => (
                      <RecipientChip
                        key={r.id}
                        recipient={r}
                        size={s.avatarChipSize}
                        textStyle={body}
                        onRemove={() => handleRemove(r.id)}
                      />
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
                        handleRemove(recipients[recipients.length - 1].id);
                      }
                    }}
                    placeholder={recipients.length === 0 ? "Enter email address" : undefined}
                    aria-label="Recipient email"
                    aria-invalid={error === "invalid"}
                    aria-describedby={error ? "share-panel-invite-error" : undefined}
                    type="email"
                    autoComplete="off"
                    name="share-panel-invite-email"
                    className="min-w-[120px] flex-1 bg-transparent text-[color:var(--sp-muted)] outline-none placeholder:[color:var(--sp-muted)]"
                    style={{ ...body, height: Math.max(16, t.bodySize + 4), lineHeight: `${Math.max(16, t.bodySize + 4)}px` }}
                  />
                </div>
                <button
                  type="submit"
                  className="flex shrink-0 items-center justify-center gap-0.5 bg-[color:var(--sp-btn-bg)] text-[color:var(--sp-btn-text)] outline-none [corner-shape:squircle] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[color:var(--sp-btn-bg)] focus-visible:ring-offset-2"
                  style={{
                    height: s.buttonHeight,
                    paddingLeft: s.buttonPaddingLeft,
                    paddingRight: s.buttonPaddingRight,
                    borderRadius: s.buttonRadius,
                    fontSize: t.buttonSize,
                    fontWeight: t.buttonWeight,
                  }}
                >
                  <SendIcon className="size-4" />
                  Invite
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
                    transition={springOr(reduceMotion, { duration: 0.15 })}
                    className={cn("flex items-center gap-0.5", error === "invalid" ? "[color:var(--sp-danger)]" : "[color:var(--sp-muted)]")}
                    style={{ fontSize: t.captionSize, fontWeight: t.captionWeight }}
                  >
                    <CautionIcon className="size-4 shrink-0" />
                    {error === "invalid"
                      ? "Invalid email address. Please enter correctly"
                      : `You can add up to ${maxRecipients} email invites at once.`}
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
                  transition={springOr(reduceMotion, LIST_SPRING)}
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
                        transition={springOr(reduceMotion, LIST_SPRING)}
                        className="flex items-center gap-2.5 rounded-[16px] border [border-color:var(--sp-chip-border)] px-2.5 py-2"
                      >
                        <Avatar recipient={r} size={s.avatarListSize} />
                        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                          <p className="truncate [color:var(--sp-text)]" style={heading}>
                            {r.name}
                          </p>
                          <p className="truncate [color:var(--sp-muted)]" style={body}>
                            {r.email}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(r.id)}
                          aria-label={`Remove ${r.name}`}
                          className="shrink-0 [color:var(--sp-danger)] outline-none hover:underline focus-visible:underline"
                          style={body}
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
