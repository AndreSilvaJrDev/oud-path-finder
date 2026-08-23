/**
 * Camada de tracking preparada para o Meta Pixel.
 * Enquanto o Pixel não estiver instalado (window.fbq indefinido),
 * os eventos apenas ficam registrados no console em modo dev.
 */

type FbqFn = (...args: unknown[]) => void;

const STANDARD_EVENTS = new Set(["InitiateCheckout", "Lead", "Purchase", "ViewContent"]);

export type QuizEvent =
  | "QuizStarted"
  | "QuizQuestionAnswered"
  | "QuizCompleted"
  | "ViewOffer"
  | "InitiateCheckout";

export function track(event: QuizEvent, data?: Record<string, unknown>) {
  const fbq = (globalThis as { fbq?: FbqFn }).fbq;
  if (typeof fbq === "function") {
    fbq(STANDARD_EVENTS.has(event) ? "track" : "trackCustom", event, data);
  } else if (import.meta.env.DEV) {
    console.info("[pixel]", event, data ?? {});
  }
}
