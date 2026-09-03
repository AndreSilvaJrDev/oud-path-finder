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

        // Se o quiz já terminou, uma nova visita começa pela introdução.
        if (target.kind === "analyzing" || target.kind === "result") {
          localStorage.removeItem(STORAGE_KEY);
          setAnswers({});
          setPos(0);
          started.current = false;
          return;
        }

        // Durante o quiz, preserva o progresso do usuário.
        setPos(saved.pos);
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

const DELIVERABLES = [
  {
    title: "Guia Primeira Revenda de Perfumes Árabes",
    description: "Um passo a passo para entender os primeiros movimentos antes de investir.",
  },
  {
    title: "Lista de Fornecedores de Perfumes Árabes",
    description: "Fornecedores pesquisados e organizados para facilitar sua comparação.",
  },
  {
    title: "Calculadora de Precificação",
    description: "Organize custos, margem e preço de venda sem depender de contas no papel.",
  },
  {
    title: "Calendário de Conteúdo para 30 Dias",
    description: "Ideias para começar a divulgar seus produtos com mais consistência.",
  },
  {
    title: "Pack de Anúncios e Roteiros",
    description: "Copies, mensagens e roteiros para facilitar sua divulgação.",
  },
  {
    title: "Plano de 7 Dias + Checklist",
    description: "Uma sequência prática para transformar pesquisa em próximos passos claros.",
  },
];

function Result({ answers }: { answers: Answers }) {
  const insight = useMemo(() => personalizedInsight(answers), [answers]);
  const channel = useMemo(() => channelLine(answers), [answers]);

  const goCheckout = () => {
    track("InitiateCheckout", {
      product: "kit-fornecedores-perfumes-arabes",
      price: 37,
    });
  };

  return (
    <section className="pt-2 pb-24 sm:pb-2">
      <p className="text-[0.76rem] font-bold tracking-[0.24em] text-gold uppercase">
        Seu resultado
      </p>

      <h1 className="mt-3 text-[1.55rem] leading-[1.24] text-ink">
        Você pode começar com mais clareza — evitando o erro de comprar no escuro.
      </h1>

      <p className="mt-4 text-[0.96rem] leading-relaxed text-muted-foreground">
        Pelas suas respostas, o ponto mais importante agora não é montar um estoque enorme. É saber
        onde pesquisar, como comparar as opções e quanto precisa cobrar para a revenda fazer sentido.
      </p>

      <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-[1.1rem] text-ink">Seu diagnóstico</h2>
        <div className="mt-2 h-px w-12 bg-gold/60" />

        <ul className="mt-5 flex flex-col gap-3">
          {[
            "Você demonstrou interesse em gerar renda com perfumes",
            "Você não precisa começar com um estoque enorme",
            "Comparar fornecedor, custo e margem reduz decisões no escuro",
            channel,
          ].map((item) => (
            <li key={item} className="flex gap-3 text-[0.92rem] leading-snug">
              <span className="text-gold" aria-hidden>✓</span>
              <span className="min-w-0 text-foreground">{item}</span>
            </li>
          ))}
        </ul>

        <p className="mt-5 rounded-2xl bg-accent/60 p-4 text-[0.9rem] leading-relaxed text-accent-foreground">
          {insight}
        </p>
      </div>

      <div className="mt-10">
        <h2 className="text-[1.35rem] text-ink">
          O primeiro erro costuma acontecer antes da venda.
        </h2>

        <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">
          Muita gente começa procurando fornecedores aleatórios no Google, Instagram, grupos ou
          marketplaces e compra antes de comparar condições, custos e estratégia.
        </p>

        <div className="mt-5 rounded-3xl border border-gold/35 bg-accent/45 p-5">
          <p className="text-[0.94rem] leading-relaxed font-semibold text-ink">
            O pior começo é montar estoque antes de comparar fornecedor, custo e margem.
          </p>
        </div>

        <p className="mt-5 text-[0.98rem] leading-relaxed text-muted-foreground">
          A boa notícia é que você não precisa organizar toda essa pesquisa do zero.
        </p>
      </div>

      <div className="mt-12 text-center">
        <p className="text-[0.76rem] font-bold tracking-[0.22em] text-gold uppercase">
          Por isso criamos o Kit Árabe
        </p>

        <h2 className="mt-3 text-[1.45rem] leading-[1.25] text-ink">
          Um caminho mais organizado para começar sua revenda de perfumes árabes
        </h2>

        <p className="mx-auto mt-4 max-w-[460px] text-[0.95rem] leading-relaxed text-muted-foreground">
          Em vez de passar horas juntando informações espalhadas, tenha os principais materiais para
          pesquisar fornecedores, calcular preços e planejar seus primeiros passos.
        </p>
      </div>

      <div className="mt-7 overflow-hidden rounded-3xl border border-gold/35 bg-card shadow-[var(--shadow-lift)]">
        <img
          src={mockupImg}
          alt="Kit Árabe com os materiais para começar a revender perfumes árabes"
          width={1024}
          height={768}
          loading="lazy"
          className="h-auto w-full"
        />
      </div>

      <div className="mt-10">
        <p className="text-center text-[0.76rem] font-bold tracking-[0.22em] text-gold uppercase">
          Acesso completo
        </p>

        <h2 className="mt-3 text-center text-[1.4rem] leading-[1.25] text-ink">
          Tudo o que você recebe no Kit Árabe
        </h2>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {DELIVERABLES.map((item, index) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start gap-3">
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-[0.78rem] font-bold text-gold"
                  aria-hidden
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div>
                  <h3 className="text-[0.98rem] leading-snug font-bold text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[0.84rem] leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <p className="text-[0.78rem] font-bold tracking-[0.2em] text-muted-foreground uppercase">
            Sem o Kit
          </p>
          <ul className="mt-4 flex flex-col gap-2.5 text-[0.92rem] text-muted-foreground">
            {[
              "Pesquisar fornecedores sozinho",
              "Comparar preços sem um processo claro",
              "Tentar calcular margem no improviso",
              "Não saber o que divulgar primeiro",
              "Ficar sem um próximo passo definido",
            ].map((item) => (
              <li key={item}>— {item}</li>
            ))}
          </ul>
        </div>

        <div className="py-3 text-center text-xl text-gold" aria-hidden>↓</div>

        <div className="rounded-3xl border border-gold/40 bg-ink p-6 shadow-[var(--shadow-lift)]">
          <p className="text-[0.78rem] font-bold tracking-[0.2em] text-gold uppercase">
            Com o Kit
          </p>
          <ul className="mt-4 flex flex-col gap-2.5 text-[0.94rem] text-primary-foreground">
            {[
              "Fornecedores pesquisados e organizados",
              "Ferramenta para estruturar sua precificação",
              "Materiais para orientar a primeira revenda",
              "Conteúdo e roteiros para divulgação",
              "Plano de ação para organizar os próximos passos",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-gold" aria-hidden>✓</span>
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        id="oferta-kit-arabe"
        className="mt-12 overflow-hidden rounded-3xl border border-gold/50 bg-card shadow-[var(--shadow-lift)]"
      >
        <div className="bg-ink px-6 py-5 text-center">
          <p className="text-[0.74rem] font-bold tracking-[0.22em] text-gold uppercase">
            Acesso completo ao Kit Árabe
          </p>
          <h2 className="mt-2 text-[1.35rem] leading-[1.25] text-primary-foreground">
            Comece com mais clareza e organização
          </h2>
        </div>

        <div className="p-6 text-center">
          <p className="text-[0.82rem] font-semibold tracking-wide text-muted-foreground uppercase">
            Pagamento único
          </p>

          <div className="mt-2 flex items-end justify-center gap-1 text-ink">
            <span className="mb-1 text-[1rem] font-semibold">R$</span>
            <span className="text-[3.35rem] leading-none font-black tracking-[-0.05em]">37</span>
          </div>

          <p className="mt-2 text-[0.84rem] text-muted-foreground">
            Acesso digital aos materiais após a confirmação do pagamento.
          </p>

          <div className="mt-6">
            <PrimaryButton as="a" href={CHECKOUT_URL} onClick={goCheckout}>
              Quero acessar o Kit Árabe →
            </PrimaryButton>
          </div>

          <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[0.78rem] text-muted-foreground">
            <li>🔒 Pagamento seguro</li>
            <li>⚡ Produto digital</li>
            <li>📱 Celular ou computador</li>
          </ul>

          <p className="mx-auto mt-5 max-w-[400px] text-[0.72rem] leading-relaxed text-muted-foreground">
            Material educacional e de pesquisa. Resultados dependem da execução, das condições de
            compra e do mercado; não há garantia de lucro.
          </p>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gold/30 bg-ink/95 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-[520px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.68rem] font-bold tracking-[0.16em] text-gold uppercase">
              Kit Árabe
            </p>
            <p className="mt-0.5 text-[1.12rem] font-black text-primary-foreground">R$ 37</p>
          </div>

          <a
            href={CHECKOUT_URL}
            onClick={goCheckout}
            className="shrink-0 rounded-xl bg-gold px-4 py-3 text-[0.78rem] font-black tracking-wide text-primary-foreground uppercase shadow-[var(--shadow-card)] transition-transform active:scale-[0.98]"
          >
            Quero acessar →
          </a>
        </div>
      </div>
    </section>
  );
}

