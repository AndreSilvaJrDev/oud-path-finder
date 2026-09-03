/**
 * Tracking central do funil Kit Árabe.
 *
 * Meta Pixel:
 * 1665264508543209
 *
 * Eventos:
 * PageView
 * QuizStarted
 * QuizQuestionAnswered
 * Quiz25
 * Quiz50
 * Quiz75
 * QuizCompleted
 * ViewOffer
 * CheckoutClick
 * InitiateCheckout
 */

type FbqFn = (...args: unknown[]) => void;

const STANDARD_EVENTS = new Set([
  "PageView",
  "InitiateCheckout",
  "Lead",
  "Purchase",
  "ViewContent",
]);

export type QuizEvent =
  | "PageView"
  | "QuizStarted"
  | "QuizQuestionAnswered"
  | "Quiz25"
  | "Quiz50"
  | "Quiz75"
  | "QuizCompleted"
  | "ViewOffer"
  | "CheckoutClick"
  | "InitiateCheckout";

const EVENT_SESSION_PREFIX = "kit-arabe-event:";

function getFbq(): FbqFn | undefined {
  if (typeof window === "undefined") return undefined;

  return (window as typeof window & { fbq?: FbqFn }).fbq;
}

/**
 * Tracking normal.
 */
export function track(event: QuizEvent, data?: Record<string, unknown>) {
  const fbq = getFbq();

  if (typeof fbq === "function") {
    fbq(
      STANDARD_EVENTS.has(event) ? "track" : "trackCustom",
      event,
      data ?? {},
    );
  }

  if (import.meta.env.DEV) {
    console.info("[meta-pixel]", event, data ?? {});
  }
}

/**
 * Dispara determinado evento apenas uma vez por sessão do navegador.
 * Útil para marcos como Quiz25 / Quiz50 / Quiz75 / ViewOffer.
 */
export function trackOnce(
  event: QuizEvent,
  data?: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;

  const key = `${EVENT_SESSION_PREFIX}${event}`;

  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // Caso sessionStorage esteja indisponível, ainda tentamos rastrear.
  }

  track(event, data);
}

/**
 * Limpa apenas os marcadores do funil.
 * Útil para iniciar um novo teste manual do quiz.
 */
export function resetTrackingSession() {
  if (typeof window === "undefined") return;

  try {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith(EVENT_SESSION_PREFIX))
      .forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // ignora
  }
}

/* ============================================================
 * UTMs
 * ============================================================ */

const UTM_STORAGE_KEY = "kit-arabe-attribution";

const TRACKING_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "src",
  "sck",
  "vtid",
] as const;

type TrackingKey = (typeof TRACKING_KEYS)[number];
type Attribution = Partial<Record<TrackingKey, string>>;

export function captureAttribution() {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const current: Attribution = {};

  for (const key of TRACKING_KEYS) {
    const value = params.get(key);
    if (value) current[key] = value;
  }

  if (!Object.keys(current).length) return;

  try {
    const previousRaw = localStorage.getItem(UTM_STORAGE_KEY);
    const previous = previousRaw
      ? (JSON.parse(previousRaw) as Attribution)
      : {};

    localStorage.setItem(
      UTM_STORAGE_KEY,
      JSON.stringify({
        ...previous,
        ...current,
      }),
    );
  } catch {
    // ignora
  }
}

export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(UTM_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : {};
  } catch {
    return {};
  }
}

/**
 * Acrescenta os parâmetros de atribuição ao checkout da Lastlink.
 */
export function withAttribution(url: string): string {
  if (typeof window === "undefined") return url;

  try {
    const target = new URL(url);
    const attribution = getAttribution();

    for (const [key, value] of Object.entries(attribution)) {
      if (value) target.searchParams.set(key, value);
    }

    return target.toString();
  } catch {
    return url;
  }
}
