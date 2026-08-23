import { type ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[520px] px-5 pb-16 sm:px-6">{children}</div>
  );
}

export function TopBar({ step, total }: { step: number | undefined; total: number }) {
  const showProgress = typeof step === "number";
  const pct = showProgress ? Math.round((step! / total) * 100) : 0;

  return (
    <header className="sticky top-0 z-20 -mx-5 mb-8 bg-background/90 px-5 pb-4 pt-6 backdrop-blur-sm sm:-mx-6 sm:px-6">
      <div className="mx-auto w-full max-w-[520px]">
        <p className="text-center font-display text-[0.78rem] tracking-[0.42em] text-ink uppercase">
          Perfumes Árabes
        </p>
        <div className="mx-auto mt-1 h-px w-14 bg-gold/60" />
        {showProgress && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-[0.72rem] font-semibold tracking-wide text-muted-foreground uppercase">
              <span>
                Pergunta {step} de {total}
              </span>
              <span className="text-gold">{pct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-to-r from-ink to-gold transition-[width] duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export function OptionCard({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "group flex w-full items-center gap-3 rounded-2xl border bg-card px-5 py-4 text-left",
        "shadow-[var(--shadow-card)] transition-all duration-200 active:scale-[0.99]",
        selected
          ? "border-gold bg-accent/60 shadow-[var(--shadow-lift)]"
          : "border-border hover:border-gold/60 hover:shadow-[var(--shadow-lift)]",
      ].join(" ")}
    >
      <span
        className={[
          "grid size-6 shrink-0 place-items-center rounded-full border text-[0.7rem] transition-all duration-200",
          selected
            ? "border-gold bg-gold text-primary-foreground"
            : "border-border text-transparent group-hover:border-gold/60",
        ].join(" ")}
        aria-hidden
      >
        ✓
      </span>
      <span className="min-w-0 text-[0.98rem] leading-snug font-medium text-foreground">
        {label}
      </span>
    </button>
  );
}

export function PrimaryButton({
  children,
  onClick,
  as,
  href,
}: {
  children: ReactNode;
  onClick?: () => void;
  as?: "a";
  href?: string | undefined;
}) {
  const cls =
    "block w-full rounded-2xl bg-primary px-6 py-4 text-center text-[0.95rem] font-bold tracking-[0.12em] text-primary-foreground uppercase shadow-[var(--shadow-lift)] transition-all duration-200 hover:brightness-125 active:scale-[0.99]";
  if (as === "a") {
    return (
      <a href={href} onClick={onClick} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-8 w-full text-center text-[0.8rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      ← Voltar
    </button>
  );
}
