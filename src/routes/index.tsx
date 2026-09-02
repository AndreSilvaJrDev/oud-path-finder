import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import heroImg from "@/assets/perfumes-hero.png";
import boxesImg from "@/assets/perfumes-boxes.jpg";
import mockupImg from "@/assets/kit-mockup.png";

import { BackButton, OptionCard, PrimaryButton, Shell, TopBar } from "@/components/quiz/QuizUI";
import {
  BREAK_AFTER_INDEX,
  CHECKOUT_URL,
  QUESTIONS,
  channelLine,
  personalizedInsight,
  type Answers,
} from "@/lib/quiz-data";
import { track } from "@/lib/tracking";

const TITLE = "Quiz: comece a vender perfumes árabes | Kit Fornecedores";
const DESCRIPTION =
  "Responda 8 perguntas rápidas e descubra o caminho mais simples para começar a vender perfumes árabes com fornecedores organizados.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuizPage,
});

type Screen =
  | { kind: "intro" }
  | { kind: "question"; index: number }
  | { kind: "break" }
  | { kind: "analyzing" }
  | { kind: "result" };

const SCREENS: Screen[] = [
  { kind: "intro" },
  ...QUESTIONS.slice(0, BREAK_AFTER_INDEX + 1).map((_, i) => ({
    kind: "question" as const,
    index: i,
  })),
  { kind: "break" },
  ...QUESTIONS.slice(BREAK_AFTER_INDEX + 1).map((_, i) => ({
    kind: "question" as const,
    index: BREAK_AFTER_INDEX + 1 + i,
  })),
  { kind: "analyzing" },
  { kind: "result" },
];

const STORAGE_KEY = "quiz-perfumes-arabes-v1";

function QuizPage() {
  const [pos, setPos] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [pending, setPending] = useState<string | null>(null);
  const started = useRef(false);

  // Recupera progresso salvo
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { pos?: number; answers?: Answers };
      if (saved.answers) setAnswers(saved.answers);
      if (typeof saved.pos === "number" && saved.pos > 0 && saved.pos < SCREENS.length) {
        const target = SCREENS[saved.pos]!;
        // nunca restaurar direto na tela de análise
        setPos(target.kind === "analyzing" ? saved.pos + 1 : saved.pos);
        started.current = true;
      }
    } catch {
      /* ignora */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ pos, answers }));
    } catch {
      /* ignora */
    }
  }, [pos, answers]);

  const screen = SCREENS[pos]!;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pos]);

  useEffect(() => {
    if (screen.kind === "result") track("ViewOffer");
  }, [screen.kind]);

  const go = useCallback((delta: number) => {
    setPending(null);
    setPos((p) => Math.min(SCREENS.length - 1, Math.max(0, p + delta)));
  }, []);

  const questionNumber = screen.kind === "question" ? screen.index + 1 : undefined;

  const handleSelect = (qIndex: number, value: string) => {
    const q = QUESTIONS[qIndex]!;
    setPending(value);
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    track("QuizQuestionAnswered", { question: q.id, answer: value, step: qIndex + 1 });
    window.setTimeout(() => {
      if (qIndex === QUESTIONS.length - 1) track("QuizCompleted");
      go(1);
    }, 280);
  };

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-background">
      <TopBar step={questionNumber} total={QUESTIONS.length} />
      <Shell>
        <div key={pos} className="animate-[var(--animate-rise)]">
          {screen.kind === "intro" && (
            <Intro
              onStart={() => {
                if (!started.current) {
                  started.current = true;
                  track("QuizStarted");
                }
                go(1);
              }}
            />
          )}

          {screen.kind === "question" && (
            <QuestionView
              index={screen.index}
              selected={answers[QUESTIONS[screen.index]!.id] ?? ""}
              pending={pending}
              onSelect={handleSelect}
              onBack={() => go(-1)}
            />
          )}

          {screen.kind === "break" && (
            <BreakScreen onContinue={() => go(1)} onBack={() => go(-1)} />
          )}

          {screen.kind === "analyzing" && <Analyzing onDone={() => go(1)} />}

          {screen.kind === "result" && <Result answers={answers} />}
        </div>
      </Shell>
    </main>
  );
}

/* ---------------------------------------------------------------- Intro */

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <section className="pt-2 text-center">
      <h1 className="text-[1.72rem] leading-[1.2] text-ink sm:text-[2rem]">
        Descubra qual é o melhor caminho para você começar a lucrar com perfumes árabes
      </h1>
      <p className="mx-auto mt-4 max-w-[420px] text-[0.98rem] leading-relaxed text-muted-foreground">
        Responda algumas perguntas rápidas e descubra como você pode começar mesmo sem experiência e
        sem precisar investir milhares de reais em estoque.
      </p>

      <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
        <img
          src={heroImg}
          alt="Frascos de perfumes árabes em preto e dourado"
          width={1024}
          height={768}
          className="h-auto w-full"
        />
      </div>

      <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-accent/50 px-4 py-2 text-[0.78rem] font-semibold tracking-wide text-accent-foreground">
        ⏱ Leva menos de 1 minuto
      </p>

      <div className="mt-6">
        <PrimaryButton onClick={onStart}>Começar o teste →</PrimaryButton>
      </div>
      <p className="mt-4 text-[0.74rem] text-muted-foreground">
        8 perguntas · resultado personalizado
      </p>
    </section>
  );
}

/* ------------------------------------------------------------- Question */

function QuestionView({
  index,
  selected,
  pending,
  onSelect,
  onBack,
}: {
  index: number;
  selected: string;
  pending: string | null;
  onSelect: (i: number, v: string) => void;
  onBack: () => void;
}) {
  const q = QUESTIONS[index]!;
  return (
    <section>
      {q.eyebrow && (
        <p className="mb-3 text-[0.78rem] font-bold tracking-[0.2em] text-gold uppercase">
          {q.eyebrow}
        </p>
      )}
      <h2 className="text-[1.4rem] leading-[1.28] text-ink sm:text-[1.55rem]">{q.title}</h2>
      <div className="mt-7 flex flex-col gap-3">
        {q.options.map((opt) => (
          <OptionCard
            key={opt}
            label={opt}
            selected={pending ? pending === opt : selected === opt}
            onSelect={() => onSelect(index, opt)}
          />
        ))}
      </div>
      <BackButton onClick={onBack} />
    </section>
  );
}

/* ---------------------------------------------------------------- Break */

function BreakScreen({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  return (
    <section className="text-center">
      <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[0.76rem] font-bold tracking-wide text-accent-foreground uppercase">
        Análise parcial
      </span>
      <h2 className="mt-5 text-[1.5rem] leading-[1.25] text-ink">
        Ótimo! Pelas suas respostas, perfumes árabes podem fazer sentido para o seu perfil.
      </h2>
      <p className="mt-4 text-[0.96rem] leading-relaxed text-muted-foreground">
        Um dos maiores erros de quem começa nesse mercado é comprar os primeiros produtos sem saber
        quais fornecedores são confiáveis, quais perfumes possuem procura e quanto realmente precisa
        investir.
      </p>

      <div className="mt-7 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
        <img
          src={boxesImg}
          alt="Perfumes árabes ao lado de caixas de envio"
          width={1024}
          height={704}
          loading="lazy"
          className="h-auto w-full"
        />
      </div>

      <div className="mt-7">
        <PrimaryButton onClick={onContinue}>Continuar →</PrimaryButton>
      </div>
      <BackButton onClick={onBack} />
    </section>
  );
}

/* ------------------------------------------------------------ Analyzing */

const STEPS = [
  { doing: "Analisando seu perfil empreendedor...", done: "Perfil identificado" },
  { doing: "Analisando seu objetivo...", done: "Objetivo identificado" },
  { doing: "Calculando sua melhor forma de começar...", done: "Estratégia encontrada" },
];

function Analyzing({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setStage(1), 900),
      window.setTimeout(() => setStage(2), 1800),
      window.setTimeout(() => setStage(3), 2700),
      window.setTimeout(onDone, 3200),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [onDone]);

  return (
    <section className="pt-6 text-center">
      <div className="mx-auto grid size-16 place-items-center">
        <span className="size-16 rounded-full border-2 border-secondary border-t-gold animate-[var(--animate-shimmer)]" />
      </div>
      <h2 className="mt-6 text-[1.35rem] text-ink">
        {stage < 3 ? "Analisando suas respostas..." : "Resultado pronto!"}
      </h2>

      <ul className="mx-auto mt-8 flex max-w-[400px] flex-col gap-3 text-left">
        {STEPS.map((s, i) => {
          const done = stage > i;
          const active = stage === i;
          return (
            <li
              key={s.doing}
              className={[
                "flex items-center gap-3 rounded-2xl border bg-card px-4 py-3.5 text-[0.9rem] transition-all duration-300",
                done
                  ? "border-gold/50 text-foreground"
                  : active
                    ? "border-border text-foreground"
                    : "border-border text-muted-foreground opacity-50",
              ].join(" ")}
            >
              <span
                className={[
                  "grid size-6 shrink-0 place-items-center rounded-full text-[0.7rem] transition-colors duration-300",
                  done ? "bg-gold text-primary-foreground" : "bg-secondary text-transparent",
                ].join(" ")}
                aria-hidden
              >
                ✓
              </span>
              <span className="min-w-0 font-medium">{done ? s.done : s.doing}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* --------------------------------------------------------------- Result */

function Result({ answers }: { answers: Answers }) {
  const insight = useMemo(() => personalizedInsight(answers), [answers]);
  const channel = useMemo(() => channelLine(answers), [answers]);

  const goCheckout = () => {
    track("InitiateCheckout", { product: "kit-fornecedores-perfumes-arabes" });
  };

  return (
    <section className="pt-2">
      <p className="text-[0.76rem] font-bold tracking-[0.24em] text-gold uppercase">
        Seu resultado
      </p>
      <h1 className="mt-3 text-[1.55rem] leading-[1.24] text-ink">
        Seu perfil é compatível com quem pode começar a vender perfumes árabes mesmo sendo
        iniciante.
      </h1>
      <p className="mt-4 text-[0.96rem] leading-relaxed text-muted-foreground">
        E existe uma forma muito mais simples de começar do que tentar encontrar fornecedores
        sozinho na internet.
      </p>

      <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-[1.1rem] text-ink">Seu diagnóstico</h2>
        <div className="mt-2 h-px w-12 bg-gold/60" />
        <ul className="mt-5 flex flex-col gap-3">
          {[
            "Você demonstrou interesse em gerar renda com perfumes",
            "Você não precisa começar com um estoque enorme",
            "Ter acesso aos fornecedores certos pode reduzir bastante a dificuldade inicial",
            channel,
          ].map((item) => (
            <li key={item} className="flex gap-3 text-[0.92rem] leading-snug">
              <span className="text-gold" aria-hidden>
                ✓
              </span>
              <span className="min-w-0 text-foreground">{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 rounded-2xl bg-accent/60 p-4 text-[0.9rem] leading-relaxed text-accent-foreground">
          {insight}
        </p>
      </div>

      <div className="mt-10">
        <h2 className="text-[1.35rem] text-ink">Mas existe um problema...</h2>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">
          Quando alguém decide entrar nesse mercado, normalmente começa pesquisando fornecedores
          aleatórios no Google, Instagram, grupos ou marketplaces.
        </p>
        <p className="mt-3 text-[0.95rem] font-semibold text-foreground">
          O problema é que isso pode gerar:
        </p>
        <ul className="mt-4 flex flex-col gap-2.5">
          {[
            "horas pesquisando",
            "dificuldade para comparar fornecedores",
            "risco de comprar de vendedores pouco confiáveis",
            "dúvida sobre quais perfumes escolher",
            "dinheiro parado em produtos errados",
          ].map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-[0.92rem] leading-snug shadow-[var(--shadow-card)]"
            >
              <span aria-hidden>❌</span>
              <span className="min-w-0">{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[0.98rem] leading-relaxed font-medium text-ink">
          Foi justamente para evitar isso que criamos o{" "}
          <strong className="font-bold">Kit Fornecedores de Perfumes Árabes</strong>.
        </p>
      </div>

      {/* Solução */}
      <div className="mt-12 rounded-3xl border border-gold/35 bg-gradient-to-b from-accent/50 to-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-[1.3rem] leading-[1.3] text-ink">
          Receba uma lista organizada de fornecedores e tenha um caminho muito mais simples para
          começar.
        </h2>
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          <img
            src={mockupImg}
            alt="Kit Fornecedores de Perfumes Árabes em tablet e celular"
            width={1024}
            height={768}
            loading="lazy"
            className="h-auto w-full"
          />
        </div>
        <p className="mt-6 text-[0.95rem] font-bold tracking-wide text-ink uppercase">
          Dentro do Kit você encontra:
        </p>
        <ul className="mt-4 flex flex-col gap-3">
          {[
            "Lista organizada de fornecedores de perfumes árabes",
            "Informações para facilitar sua pesquisa e contato",
            "Opções para quem está começando",
            "Material que pode evitar horas procurando fornecedores sozinho",
            "Guia para entender melhor como começar",
            /* Bônus adicionais podem ser incluídos nesta lista. */
          ].map((item) => (
            <li key={item} className="flex gap-3 text-[0.93rem] leading-snug">
              <span className="text-gold" aria-hidden>
                ✓
              </span>
              <span className="min-w-0">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Transformação */}
      <div className="mt-12">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <p className="text-[0.78rem] font-bold tracking-[0.2em] text-muted-foreground uppercase">
            Sem o Kit
          </p>
          <ul className="mt-4 flex flex-col gap-2.5 text-[0.92rem] text-muted-foreground">
            {[
              "Pesquisar fornecedores sozinho",
              "Não saber em quem confiar",
              "Perder horas procurando",
              "Comprar sem estratégia",
              "Não saber por onde começar",
            ].map((i) => (
              <li key={i}>— {i}</li>
            ))}
          </ul>
        </div>
        <div className="py-3 text-center text-xl text-gold" aria-hidden>
          ↓
        </div>
        <div className="rounded-3xl border border-gold/40 bg-ink p-6 shadow-[var(--shadow-lift)]">
          <p className="text-[0.78rem] font-bold tracking-[0.2em] text-gold uppercase">Com o Kit</p>
          <ul className="mt-4 flex flex-col gap-2.5 text-[0.94rem] text-primary-foreground">
            {[
              "Fornecedores organizados",
              "Pesquisa muito mais rápida",
              "Maior clareza para começar",
              "Possibilidade de comparar opções",
              "Próximo passo definido",
            ].map((i) => (
              <li key={i} className="flex gap-3">
                <span className="text-gold" aria-hidden>
                  ✓
                </span>
                <span className="min-w-0">{i}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-12 rounded-3xl border border-gold/50 bg-card p-6 text-center shadow-[var(--shadow-lift)]">
        <h2 className="text-[1.3rem] leading-[1.3] text-ink">
          Quer ter acesso à lista e começar sua pesquisa pelos fornecedores certos?
        </h2>
        <div className="mt-6">
          <PrimaryButton as="a" href={CHECKOUT_URL} onClick={goCheckout}>
            Quero acessar os fornecedores →
          </PrimaryButton>
        </div>
        <ul className="mt-5 flex flex-col gap-1.5 text-[0.82rem] text-muted-foreground">
          <li>🔒 Pagamento seguro</li>
          <li>⚡ Acesso digital</li>
          <li>📱 Acesse pelo celular ou computador</li>
        </ul>
      </div>
    </section>
  );
}
