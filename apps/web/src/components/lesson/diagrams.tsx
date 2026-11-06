import type { CSSProperties, ReactNode } from "react";
import { BFP_DIAGRAMS } from "./diagrams-bfp";
import { DiagramFrame } from "./DiagramFrame";

/**
 * Animated diagrams for lessons, referenced from Markdown as ```diagram blocks.
 * Server components: motion is CSS-only (globals.css → "Lesson diagrams"). Each moving
 * part has a readable resting position in its transform attribute; the CSS animation
 * overrides it, and reduced-motion turns the animation off so that layout shows.
 * Labels stay English (technical terms); the localized caption comes from the Markdown.
 */

function Frame({ caption, viewBox, children }: { caption?: string; viewBox: string; children: ReactNode }) {
  return (
    <DiagramFrame caption={caption} viewBox={viewBox}>
      {children}
    </DiagramFrame>
  );
}

function Stick({ seated = false }: { seated?: boolean }) {
  return (
    <g className="dg-ink" strokeWidth={3} strokeLinecap="round" fill="none">
      <circle cx="0" cy={seated ? -58 : -70} r="10" />
      <path
        d={
          seated
            ? "M0 -48 L0 -22 L18 -22 L18 0 M0 -40 L16 -30"
            : "M0 -60 L0 -25 M0 -25 L-10 0 M0 -25 L10 0 M0 -50 L14 -44"
        }
      />
    </g>
  );
}

function HttpRestaurant({ caption }: { caption?: string }) {
  return (
    <Frame caption={caption} viewBox="0 0 640 210">
      <text x="320" y="34" className="dg-label dg-accent">
        HTTP = the ordering rules
      </text>
      {/* customer at a table */}
      <g transform="translate(70 160)">
        <Stick seated />
        <path
          d="M-40 -22 L60 -22 M40 -22 L40 0"
          className="dg-ink"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </g>
      <text x="80" y="192" className="dg-label">
        Browser (you)
      </text>
      {/* kitchen */}
      <g className="dg-ink" strokeWidth={3} fill="none" strokeLinejoin="round">
        <rect x="500" y="98" width="120" height="62" rx="8" />
        <path d="M528 98 C 520 78, 540 70, 546 82 C 552 64, 576 66, 574 84 C 588 74, 600 94, 590 98" />
        <path d="M524 126 h 72 M 524 142 h 48" className="dg-muted-stroke" />
      </g>
      <text x="560" y="192" className="dg-label">
        Server (kitchen)
      </text>
      <path d="M150 160 L470 160" className="dg-lane" />
      {/* the waiter carries the order there and the dish back */}
      <g className="dg-waiter" transform="translate(300 160)">
        <Stick />
        <g className="dg-slip">
          <rect
            x="12"
            y="-64"
            width="84"
            height="22"
            rx="4"
            className="dg-req-box"
          />
          <text x="54" y="-49" className="dg-code">
            GET /biryani
          </text>
        </g>
        <g className="dg-plate">
          <ellipse cx="40" cy="-46" rx="30" ry="7" className="dg-res-box" />
          <text x="40" y="-58" className="dg-code dg-res-text">
            200 OK
          </text>
        </g>
      </g>
    </Frame>
  );
}

function RequestResponse({ caption }: { caption?: string }) {
  return (
    <Frame caption={caption} viewBox="0 0 640 220">
      <g className="dg-ink" strokeWidth={2.5} fill="none">
        <rect x="20" y="40" width="150" height="120" rx="10" />
        <path d="M20 64 H170" />
      </g>
      <circle cx="34" cy="52" r="3" className="dg-dot" />
      <circle cx="44" cy="52" r="3" className="dg-dot" />
      <circle cx="54" cy="52" r="3" className="dg-dot" />
      <text x="95" y="104" className="dg-code dg-muted">
        app.codingfoding.com
      </text>
      <text x="95" y="190" className="dg-label">
        Browser
      </text>

      <g className="dg-ink" strokeWidth={2.5} fill="none">
        <rect x="470" y="46" width="150" height="30" rx="5" />
        <rect x="470" y="86" width="150" height="30" rx="5" />
        <rect x="470" y="126" width="150" height="30" rx="5" />
      </g>
      {[61, 101, 141].map((y) => (
        <circle key={y} cx="600" cy={y} r="4" className="dg-led" />
      ))}
      <text x="545" y="190" className="dg-label">
        Server
      </text>

      <path d="M176 100 H464" className="dg-lane" />
      <text x="320" y="212" className="dg-label dg-muted">
        one TCP connection
      </text>

      <g className="dg-req" transform="translate(185 44)">
        <rect width="150" height="44" rx="6" className="dg-req-box" />
        <text x="10" y="18" className="dg-code dg-left">
          GET /hello HTTP/1.1
        </text>
        <text x="10" y="34" className="dg-code dg-left dg-muted">
          Host: api.cf.dev
        </text>
      </g>
      <g className="dg-res" transform="translate(305 110)">
        <rect width="155" height="58" rx="6" className="dg-res-box" />
        <text x="10" y="18" className="dg-code dg-left">
          HTTP/1.1 200 OK
        </text>
        <text x="10" y="34" className="dg-code dg-left dg-muted">
          Content-Type: text/plain
        </text>
        <text x="10" y="50" className="dg-code dg-left">
          hello!
        </text>
      </g>
    </Frame>
  );
}

function HttpAnatomy({ caption }: { caption?: string }) {
  const rows: {
    y: number;
    h: number;
    lines: string[];
    label: string;
    kind: string;
  }[] = [
    {
      y: 28,
      h: 30,
      lines: ["POST /api/v1/login HTTP/1.1"],
      label: "Request line",
      kind: "a",
    },
    {
      y: 66,
      h: 66,
      lines: [
        "Host: api.codingfoding.com",
        "Content-Type: application/json",
        "Content-Length: 37",
      ],
      label: "Headers",
      kind: "b",
    },
    { y: 140, h: 22, lines: [""], label: "Blank line (\\r\\n)", kind: "gap" },
    {
      y: 170,
      h: 30,
      lines: ['{"email":"a@b.c","password":"secret"}'],
      label: "Body",
      kind: "c",
    },
  ];
  return (
    <Frame caption={caption} viewBox="0 0 640 220">
      <rect
        x="16"
        y="16"
        width="430"
        height="196"
        rx="10"
        className="dg-paper"
      />
      {rows.map((r) => (
        <g key={r.label}>
          <rect
            x="26"
            y={r.y}
            width="410"
            height={r.h}
            rx="5"
            className={`dg-band dg-band-${r.kind}`}
          />
          {r.lines.map((l, i) => (
            <text
              key={i}
              x="38"
              y={r.y + 20 + i * 20}
              className="dg-code dg-left"
            >
              {l}
            </text>
          ))}
          <path
            d={`M452 ${r.y + 2} q 8 0 8 8 V ${r.y + r.h / 2 - 6} l 6 6 l -6 6 V ${r.y + r.h - 10} q 0 8 -8 8`}
            className="dg-brace"
          />
          <text x="476" y={r.y + r.h / 2 + 4} className="dg-label dg-left">
            {r.label}
          </text>
        </g>
      ))}
    </Frame>
  );
}

function CorsPreflight({ caption }: { caption?: string }) {
  const steps = [
    {
      y: 100,
      dir: 1,
      top: "OPTIONS /api/v1/cart",
      sub: "Origin + Access-Control-Request-Method: PUT",
      kind: "req",
    },
    {
      y: 152,
      dir: -1,
      top: "204 No Content",
      sub: "Access-Control-Allow-Origin + Allow-Methods: PUT",
      kind: "res",
    },
    {
      y: 214,
      dir: 1,
      top: "PUT /api/v1/cart",
      sub: "the real request",
      kind: "req",
    },
    {
      y: 266,
      dir: -1,
      top: "200 OK",
      sub: "browser hands the response to your JS",
      kind: "res",
    },
  ];
  return (
    <Frame caption={caption} viewBox="0 0 640 300">
      {[
        { x: 110, title: "Browser", sub: "app.codingfoding.com" },
        { x: 500, title: "API", sub: "api.codingfoding.com" },
      ].map((p) => (
        <g key={p.title}>
          <rect
            x={p.x - 85}
            y="14"
            width="170"
            height="46"
            rx="8"
            className="dg-paper"
          />
          <text x={p.x} y="34" className="dg-label">
            {p.title}
          </text>
          <text x={p.x} y="51" className="dg-code dg-muted">
            {p.sub}
          </text>
          <path d={`M${p.x} 60 V 292`} className="dg-lane" />
        </g>
      ))}
      <path d="M590 84 q 10 0 10 10 V 160 q 0 10 -10 10" className="dg-brace" />
      <text
        x="612"
        y="130"
        className="dg-label dg-accent"
        transform="rotate(90 612 130)"
      >
        preflight
      </text>
      {steps.map((s, i) => {
        const [x1, x2] = s.dir > 0 ? [116, 494] : [494, 116];
        return (
          <g key={i} className={`dg-step dg-step-${i + 1}`}>
            <path
              d={`M${x1} ${s.y} H${x2}`}
              className={`dg-arrow dg-arrow-${s.kind}`}
            />
            <path
              d={
                s.dir > 0
                  ? `M${x2 - 10} ${s.y - 6} L${x2} ${s.y} L${x2 - 10} ${s.y + 6}`
                  : `M${x2 + 10} ${s.y - 6} L${x2} ${s.y} L${x2 + 10} ${s.y + 6}`
              }
              className={`dg-arrow dg-arrow-${s.kind}`}
            />
            <text x="305" y={s.y - 8} className="dg-code">
              {s.top}
            </text>
            <text x="305" y={s.y + 16} className="dg-code dg-muted dg-small">
              {s.sub}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}

const LAYERS = [
  { name: "Application", sub: "HTTP · what a message means", app: true },
  { name: "Security", sub: "TLS · encryption (HTTPS)" },
  { name: "Transport", sub: "TCP / QUIC · reliable delivery" },
  { name: "Network", sub: "IP · addresses & routing" },
  { name: "Link", sub: "Ethernet / Wi-Fi · the wire" },
];

function NetworkLayers({ caption }: { caption?: string }) {
  return (
    <Frame caption={caption} viewBox="0 0 640 320">
      {[
        { x: 20, title: "Client" },
        { x: 400, title: "Server" },
      ].map((stack) => (
        <g key={stack.title}>
          <text x={stack.x + 110} y="26" className="dg-label">
            {stack.title}
          </text>
          {LAYERS.map((l, i) => (
            <g key={l.name} transform={`translate(${stack.x} ${40 + i * 48})`}>
              <rect
                width="220"
                height="40"
                rx="8"
                className={l.app ? "dg-req-box" : "dg-paper"}
              />
              <text x="12" y="17" className="dg-label dg-left">
                {l.name}
              </text>
              <text x="12" y="32" className="dg-code dg-left dg-muted dg-small">
                {l.sub}
              </text>
            </g>
          ))}
        </g>
      ))}
      {/* your code talks HTTP to the other side's HTTP */}
      <path
        d="M246 60 H394"
        className="dg-arrow dg-arrow-req"
        strokeDasharray="5 5"
      />
      <text x="320" y="52" className="dg-code dg-accent">
        your code lives here
      </text>
      <path d="M130 280 V300 H510 V280" className="dg-lane" />
      <text x="320" y="316" className="dg-code dg-muted dg-small">
        the actual wire
      </text>
      <g className="dg-packet" transform="translate(117 46)">
        <rect width="26" height="18" rx="3" className="dg-res-box" />
        <path
          d="M2 3 L13 11 L24 3"
          className="dg-arrow dg-arrow-res"
          strokeWidth="1.5"
        />
      </g>
    </Frame>
  );
}

function Http1VsHttp2({ caption }: { caption?: string }) {
  const kinds = ["a", "b", "c"] as const;
  const big = kinds.map((k, i) => ({ k, x: i * 160, w: 150 }));
  const small = Array.from({ length: 9 }, (_, i) => ({
    k: kinds[i % 3]!,
    x: i * 53,
    w: 48,
  }));
  const row = (
    y: number,
    title: string,
    note: string,
    blocks: { k: string; x: number; w: number }[],
    cls: string,
  ) => (
    <g>
      <text x="20" y={y + 25} className="dg-label dg-left">
        {title}
      </text>
      <rect
        x="120"
        y={y}
        width="430"
        height="40"
        rx="20"
        className="dg-paper"
      />
      <g clipPath={`url(#pipe-${cls})`}>
        <g className={`dg-stream ${cls}`} transform="translate(130 0)">
          {blocks.map((b, i) => (
            <g key={i} transform={`translate(${b.x} ${y + 8})`}>
              <rect
                width={b.w}
                height="24"
                rx="5"
                className={`dg-band dg-band-${b.k === "a" ? "a" : b.k === "b" ? "b" : "c"}`}
              />
              <text x={b.w / 2} y="16" className="dg-code">
                {b.k.toUpperCase()}
              </text>
            </g>
          ))}
        </g>
      </g>
      <clipPath id={`pipe-${cls}`}>
        <rect x="120" y={y} width="430" height="40" rx="20" />
      </clipPath>
      <text x="335" y={y + 60} className="dg-code dg-muted dg-small">
        {note}
      </text>
    </g>
  );
  return (
    <Frame caption={caption} viewBox="0 0 640 230">
      <text x="135" y="22" className="dg-code dg-muted dg-small">
        server
      </text>
      <text x="565" y="22" className="dg-code dg-muted dg-small">
        browser →
      </text>
      {row(
        34,
        "HTTP/1.1",
        "one response at a time: C waits behind A and B",
        big,
        "dg-stream-1",
      )}
      {row(
        132,
        "HTTP/2",
        "frames of A, B and C interleave on one connection",
        small,
        "dg-stream-2",
      )}
    </Frame>
  );
}

// ── Operating Systems ──
// Motion is CSS-only (globals.css → "OS diagrams"): an outer <g> holds the resting
// position, the inner <g> is the animated part, so reduced motion shows a readable layout.

/** Programs on top, hardware below; the OS lets them through one at a time. */
function OsSandwich({ caption }: { caption?: string }) {
  const apps = ["Browser", "Editor", "Music", "Server"];
  const hw = [
    { name: "CPU", sub: "time" },
    { name: "RAM", sub: "memory" },
    { name: "Disk", sub: "storage" },
    { name: "NIC", sub: "network" },
  ];
  return (
    <Frame caption={caption} viewBox="0 0 640 320">
      <text x="20" y="24" className="dg-code dg-muted dg-small dg-left">
        programs
      </text>
      {apps.map((a, i) => (
        <g key={a} transform={`translate(${40 + i * 145} 34)`}>
          <rect width="125" height="44" rx="10" className="dg-req-box" />
          <text x="62" y="27" className="dg-label">
            {a}
          </text>
          <path
            d="M62 50 V 96"
            className="dg-arrow dg-arrow-req"
            strokeDasharray="4 5"
          />
        </g>
      ))}
      <rect
        x="30"
        y="128"
        width="580"
        height="84"
        rx="14"
        className="dg-res-box"
      />
      <circle cx="58" cy="194" r="6" className="dg-led" />
      <text x="320" y="190" className="dg-label">
        Operating System
      </text>
      <text x="320" y="204" className="dg-code dg-res-text dg-small">
        referee · illusionist · guard
      </text>
      <text x="20" y="246" className="dg-code dg-muted dg-small dg-left">
        hardware
      </text>
      {hw.map((h, i) => (
        <g key={h.name} transform={`translate(${40 + i * 145} 256)`}>
          <path d="M62 -40 V -4" className="dg-arrow dg-arrow-res" />
          <rect width="125" height="48" rx="10" className="dg-paper" />
          <rect
            width="125"
            height="48"
            rx="10"
            className={`dg-hw-glow dg-turn-${i + 1}`}
          />
          <text x="62" y="21" className="dg-label">
            {h.name}
          </text>
          <text x="62" y="37" className="dg-code dg-muted dg-small">
            {h.sub}
          </text>
        </g>
      ))}
      {/* requests wait under their program, then each takes its turn: into the OS, a pause, on to its hardware */}
      {apps.map((a, i) => (
        <g key={a} transform={`translate(${93 + i * 145} 84)`}>
          <g className={`dg-turn dg-turn-${i + 1}`}>
            <rect width="20" height="14" rx="3" className="dg-req-box" />
            <path
              d="M2 3 L10 9 L18 3"
              className="dg-arrow dg-arrow-req"
              strokeWidth="1.5"
            />
          </g>
        </g>
      ))}
    </Frame>
  );
}

/** The privilege line: a write() crosses into kernel mode, reaches hardware, and returns. */
function UserKernel({ caption }: { caption?: string }) {
  const parts = ["scheduler", "memory", "file systems", "network", "drivers"];
  return (
    <Frame caption={caption} viewBox="0 0 640 320">
      <text x="20" y="26" className="dg-label dg-left">
        User space
      </text>
      <text x="20" y="42" className="dg-code dg-muted dg-small dg-left">
        ring 3 · restricted
      </text>
      {["your program", "shell", "browser"].map((a, i) => (
        <g key={a} transform={`translate(${180 + i * 150} 18)`}>
          <rect width="130" height="40" rx="10" className="dg-req-box" />
          <text x="65" y="25" className="dg-code">
            {a}
          </text>
        </g>
      ))}
      <path d="M10 110 H 630" className="dg-lane" />
      <text
        x="620"
        y="102"
        className="dg-code dg-accent dg-small"
        style={{ textAnchor: "end" }}
      >
        system call boundary
      </text>
      {/* which mode the CPU is in right now */}
      <g transform="translate(20 120)">
        <rect width="132" height="24" rx="12" className="dg-paper" />
        <text x="66" y="16" className="dg-code dg-small dg-mode-user">
          CPU: user mode
        </text>
        <text
          x="66"
          y="16"
          className="dg-code dg-small dg-res-text dg-mode-kernel"
        >
          CPU: kernel mode
        </text>
      </g>
      <path d="M215 62 V 142" className="dg-arrow dg-arrow-req" />
      <path
        d="M207 132 L 215 144 L 223 132"
        className="dg-arrow dg-arrow-req"
      />
      <text
        x="258"
        y="84"
        className="dg-code dg-accent dg-left"
      >{`write(1, "hi", 2)`}</text>
      <path
        d="M245 142 V 66"
        className="dg-arrow dg-arrow-res"
        strokeDasharray="4 5"
      />
      <text x="258" y="134" className="dg-code dg-res-text dg-left dg-small">
        returns 2
      </text>
      <text x="20" y="176" className="dg-label dg-left">
        Kernel space
      </text>
      <text x="20" y="192" className="dg-code dg-muted dg-small dg-left">
        ring 0 · can do anything
      </text>
      <rect
        x="180"
        y="148"
        width="430"
        height="92"
        rx="14"
        className="dg-res-box"
      />
      <rect
        x="180"
        y="148"
        width="430"
        height="92"
        rx="14"
        className="dg-kernel-glow"
      />
      {parts.map((p, i) => (
        <g key={p} transform={`translate(${192 + i * 83} 176)`}>
          <rect width="76" height="36" rx="8" className="dg-paper" />
          <text x="38" y="22" className="dg-code dg-small">
            {p}
          </text>
        </g>
      ))}
      <rect
        x="180"
        y="262"
        width="430"
        height="44"
        rx="10"
        className="dg-paper"
      />
      <text x="395" y="289" className="dg-label">
        Hardware
      </text>
      <path d="M395 242 V 260" className="dg-arrow dg-arrow-res" />
      {/* the request: down from the program, through the kernel, to the hardware */}
      <g transform="translate(205 64)">
        <g className="dg-sys-req">
          <rect width="20" height="14" rx="3" className="dg-req-box" />
          <path
            d="M2 3 L10 9 L18 3"
            className="dg-arrow dg-arrow-req"
            strokeWidth="1.5"
          />
        </g>
      </g>
      {/* the answer: back up to the program */}
      <g transform="translate(235 150)">
        <g className="dg-sys-res">
          <rect width="20" height="14" rx="3" className="dg-res-box" />
          <text x="10" y="11" className="dg-code dg-small">
            2
          </text>
        </g>
      </g>
    </Frame>
  );
}

/** A driver crashes: the whole monolithic/hybrid kernel goes down, the microkernel restarts one service. */
function KernelTypes({ caption }: { caption?: string }) {
  const col = (
    x: number,
    title: string,
    who: string,
    body: ReactNode,
    laneY = 104,
  ) => (
    <g transform={`translate(${x} 0)`}>
      <text x="95" y="26" className="dg-label">
        {title}
      </text>
      <text x="95" y="42" className="dg-code dg-muted dg-small">
        {who}
      </text>
      <rect
        x="0"
        y="54"
        width="190"
        height="34"
        rx="8"
        className="dg-req-box"
      />
      <text x="95" y="75" className="dg-code">
        apps
      </text>
      <path d={`M0 ${laneY} H 190`} className="dg-lane" />
      {body}
    </g>
  );
  // `crash` names the timeline of a service that fails: the red sits between box and
  // label, and the label turns white while it's red, so it stays readable in every theme.
  const svc = (x: number, y: number, label: string, w = 82, crash?: string) => (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height="28" rx="7" className="dg-paper" />
      {crash && (
        <rect width={w} height="28" rx="7" className={`dg-fault ${crash}`} />
      )}
      <text
        x={w / 2}
        y="18"
        className={`dg-code dg-small ${crash ? `dg-fault-label ${crash}-label` : ""}`}
      >
        {label}
      </text>
    </g>
  );
  // red flash over a box; `kind` picks the timeline
  const fault = (
    x: number,
    y: number,
    w: number,
    h: number,
    kind: string,
    rx = 7,
  ) => (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={rx}
      className={`dg-fault ${kind}`}
    />
  );
  const panic = (
    <g className="dg-panic">
      <rect
        x="35"
        y="176"
        width="120"
        height="26"
        rx="13"
        className="dg-panic-pill"
      />
      <text x="95" y="193" className="dg-code dg-small dg-panic-text">
        kernel panic
      </text>
    </g>
  );
  return (
    <Frame caption={caption} viewBox="0 0 640 290">
      {col(
        10,
        "Monolithic",
        "Linux",
        <>
          <rect
            x="0"
            y="118"
            width="190"
            height="150"
            rx="12"
            className="dg-res-box"
          />
          <text x="95" y="138" className="dg-code dg-res-text dg-small">
            one kernel, ring 0
          </text>
          {fault(0, 118, 190, 150, "dg-fault-all", 12)}
          {svc(10, 150, "scheduler")}
          {svc(98, 150, "memory")}
          {svc(10, 186, "file sys")}
          {svc(98, 186, "network")}
          {svc(10, 222, "drivers", 170, "dg-fault-driver")}
          {panic}
        </>,
      )}
      {col(
        225,
        "Microkernel",
        "MINIX · QNX · seL4",
        <>
          {svc(4, 98, "fs", 54)}
          {svc(68, 98, "net", 54)}
          {svc(132, 98, "drv", 54, "dg-fault-micro")}
          <text
            x="95"
            y="282"
            className="dg-code dg-small dg-res-text dg-restarted"
          >
            drv restarted ✓ kernel still up
          </text>
          <rect
            x="45"
            y="206"
            width="100"
            height="56"
            rx="12"
            className="dg-res-box"
          />
          <text x="95" y="230" className="dg-code dg-res-text dg-small">
            tiny kernel
          </text>
          <text x="95" y="246" className="dg-code dg-small">
            IPC · sched
          </text>
          <path
            d="M31 128 V 202 M95 128 V 202 M159 128 V 202"
            className="dg-arrow dg-arrow-req"
            strokeDasharray="3 5"
          />
          {/* messages flowing between the services and the kernel */}
          {[31, 95, 159].map((cx, i) => (
            <g key={cx} transform={`translate(${cx} 132)`}>
              <circle r="4" className={`dg-msg dg-msg-${i + 1}`} />
            </g>
          ))}
          <text x="95" y="174" className="dg-code dg-accent dg-small">
            messages
          </text>
        </>,
        140,
      )}
      {col(
        440,
        "Hybrid",
        "Windows NT · macOS XNU",
        <>
          <rect
            x="0"
            y="118"
            width="190"
            height="150"
            rx="12"
            className="dg-res-box"
          />
          {fault(0, 118, 190, 150, "dg-fault-all", 12)}
          <rect
            x="45"
            y="200"
            width="100"
            height="56"
            rx="12"
            className="dg-paper"
          />
          <text x="95" y="232" className="dg-code dg-small">
            micro core
          </text>
          <text x="95" y="138" className="dg-code dg-res-text dg-small">
            most services in ring 0
          </text>
          {svc(10, 150, "file sys")}
          {svc(98, 150, "drivers", 82, "dg-fault-driver")}
          {panic}
        </>,
      )}
    </Frame>
  );
}

/** One write() from start to finish: five stops, the CPU's mode flipping on the way. */
function SyscallJourney({ caption }: { caption?: string }) {
  const stops = [
    {
      x: 30,
      y: 46,
      n: "1",
      title: "set up",
      lines: ["rax = 1  (write)", "rdi, rsi, rdx = args"],
      lane: "user",
    },
    {
      x: 196,
      y: 112,
      n: "2",
      title: "syscall",
      lines: ["ring 3 → ring 0", "save registers"],
      lane: "edge",
    },
    {
      x: 196,
      y: 196,
      n: "3",
      title: "look up",
      lines: ["sys_call_table[1]", "→ sys_write"],
      lane: "kernel",
    },
    {
      x: 380,
      y: 196,
      n: "4",
      title: "check & do",
      lines: ["is fd 1 yours?", "copy bytes out"],
      lane: "kernel",
    },
    {
      x: 446,
      y: 46,
      n: "5",
      title: "sysret",
      lines: ["ring 0 → ring 3", "rax = 3 (bytes)"],
      lane: "user",
    },
  ];
  return (
    <Frame caption={caption} viewBox="0 0 640 290">
      <text x="20" y="22" className="dg-code dg-muted dg-small dg-left">
        user mode · ring 3
      </text>
      <path d="M10 150 H 630" className="dg-lane" />
      <text x="20" y="276" className="dg-code dg-muted dg-small dg-left">
        kernel mode · ring 0
      </text>
      {/* the route the call takes */}
      <path
        d="M130 86 C 170 86, 196 110, 224 140 L 248 180 M 296 236 H 380 M 480 196 C 520 150, 540 120, 546 108"
        className="dg-arrow dg-arrow-req"
        strokeDasharray="4 6"
      />
      {stops.map((s, i) => (
        <g key={s.n} transform={`translate(${s.x} ${s.y})`}>
          <rect
            width="148"
            height="66"
            rx="12"
            className={s.lane === "kernel" ? "dg-res-box" : "dg-req-box"}
          />
          <rect
            width="148"
            height="66"
            rx="12"
            className={`dg-stop-glow dg-stop-${i + 1}`}
          />
          <circle cx="18" cy="18" r="11" className="dg-paper" />
          <text x="18" y="22" className="dg-code">
            {s.n}
          </text>
          <text x="36" y="23" className="dg-label dg-left">
            {s.title}
          </text>
          {s.lines.map((l, j) => (
            <text
              key={l}
              x="14"
              y={42 + j * 14}
              className="dg-code dg-small dg-left"
            >
              {l}
            </text>
          ))}
        </g>
      ))}
      <g transform="translate(20 166)">
        <rect width="150" height="26" rx="13" className="dg-paper" />
        <text x="75" y="17" className="dg-code dg-small dg-mode-user-j">
          CPU: user mode
        </text>
        <text
          x="75"
          y="17"
          className="dg-code dg-small dg-res-text dg-mode-kernel-j"
        >
          CPU: kernel mode
        </text>
      </g>
      {/* the call itself, hopping stop to stop */}
      <g transform="translate(96 30)">
        <g className="dg-hop">
          <circle r="9" className="dg-hop-dot" />
        </g>
      </g>
    </Frame>
  );
}

/** Three ways into the kernel: a program asks (trap), trips (exception), or hardware calls (interrupt). */
function TrapsInterrupts({ caption }: { caption?: string }) {
  const rows = [
    {
      y: 26,
      title: "Trap",
      sub: "program asks",
      event: "syscall",
      note: "on purpose · synchronous",
      cls: "dg-ev-trap",
    },
    {
      y: 112,
      title: "Exception",
      sub: "program trips",
      event: "page fault",
      note: "by accident · synchronous",
      cls: "dg-ev-fault",
    },
    {
      y: 198,
      title: "Interrupt",
      sub: "hardware calls",
      event: "key pressed",
      note: "any time · asynchronous",
      cls: "dg-ev-irq",
    },
  ];
  return (
    <Frame caption={caption} viewBox="0 0 640 290">
      {rows.map((r) => (
        <g key={r.title} transform={`translate(0 ${r.y})`}>
          <text x="20" y="24" className="dg-label dg-left">
            {r.title}
          </text>
          <text x="20" y="40" className="dg-code dg-muted dg-small dg-left">
            {r.sub}
          </text>
          <rect
            x="140"
            y="6"
            width="150"
            height="46"
            rx="10"
            className="dg-req-box"
          />
          <text x="215" y="27" className="dg-code">
            program
          </text>
          <text x="215" y="42" className="dg-code dg-small dg-muted">
            running…
          </text>
          <rect
            x="400"
            y="6"
            width="130"
            height="46"
            rx="10"
            className="dg-res-box"
          />
          <text x="465" y="27" className="dg-code">
            kernel
          </text>
          <text x="465" y="42" className="dg-code dg-small dg-res-text">
            handles it
          </text>
          <path d="M296 22 H 394 M 394 38 H 296" className="dg-lane" />
          <text x="345" y="66" className="dg-code dg-muted dg-small">
            {r.note}
          </text>
          {r.cls === "dg-ev-irq" && (
            <g transform="translate(560 8)">
              <rect width="58" height="40" rx="8" className="dg-paper" />
              <path
                d="M10 14 h 38 M 10 22 h 38 M 18 30 h 22"
                className="dg-arrow dg-muted-stroke"
                strokeWidth="2"
              />
              <text x="29" y="56" className="dg-code dg-small dg-muted">
                keyboard
              </text>
            </g>
          )}
          {/* the event travelling to the kernel and the program resuming */}
          <g transform={`translate(${r.cls === "dg-ev-irq" ? 560 : 290} 22)`}>
            <g className={`dg-ev ${r.cls}`}>
              <rect
                x="-4"
                y="-10"
                width="86"
                height="20"
                rx="10"
                className={
                  r.cls === "dg-ev-fault" ? "dg-ev-pill-fault" : "dg-ev-pill"
                }
              />
              <text x="39" y="4" className="dg-code dg-small dg-ev-text">
                {r.event}
              </text>
            </g>
          </g>
          <rect
            x="140"
            y="6"
            width="150"
            height="46"
            rx="10"
            className={`dg-pause ${r.cls}-pause`}
          />
          {/* the kernel lights up while it handles the event */}
          <rect
            x="400"
            y="6"
            width="130"
            height="46"
            rx="10"
            className={`dg-kglow ${r.cls}-pause`}
          />
        </g>
      ))}
    </Frame>
  );
}

/** getpid() crosses into the kernel and back; clock_gettime() is answered in user space by the vDSO. */
function VdsoFastPath({ caption }: { caption?: string }) {
  return (
    <Frame caption={caption} viewBox="0 0 640 270">
      <text x="20" y="22" className="dg-code dg-muted dg-small dg-left">
        user space
      </text>
      <rect
        x="40"
        y="38"
        width="170"
        height="50"
        rx="10"
        className="dg-req-box"
      />
      <text x="125" y="60" className="dg-code">
        your program
      </text>
      <text x="125" y="76" className="dg-code dg-small dg-muted">
        asks the time, a lot
      </text>
      <rect
        x="380"
        y="38"
        width="220"
        height="50"
        rx="10"
        className="dg-res-box"
      />
      <text x="490" y="60" className="dg-code">
        vDSO page
      </text>
      <text x="490" y="76" className="dg-code dg-small dg-res-text">
        kernel code, mapped read-only
      </text>
      <path d="M10 130 H 630" className="dg-lane" />
      <text x="20" y="150" className="dg-code dg-muted dg-small dg-left">
        kernel
      </text>
      <rect
        x="230"
        y="180"
        width="180"
        height="50"
        rx="10"
        className="dg-res-box"
      />
      <text x="320" y="210" className="dg-code">
        sys_getpid
      </text>
      {/* fast path: stays above the line */}
      <path d="M214 56 H 374" className="dg-arrow dg-arrow-res" />
      <text x="294" y="26" className="dg-code dg-small dg-res-text">
        clock_gettime() · no mode switch
      </text>
      {/* slow path: down through the boundary and back */}
      <path
        d="M125 92 V 205 H 224"
        className="dg-arrow dg-arrow-req"
        strokeDasharray="4 6"
      />
      <text x="134" y="168" className="dg-code dg-small dg-accent dg-left">
        getpid()
      </text>
      <text x="134" y="182" className="dg-code dg-small dg-accent dg-left">
        · syscall
      </text>
      <g transform="translate(214 56)">
        <g className="dg-fast">
          <circle r="7" className="dg-hop-dot-res" />
        </g>
      </g>
      <g transform="translate(125 92)">
        <g className="dg-slow">
          <circle r="7" className="dg-hop-dot" />
        </g>
      </g>
    </Frame>
  );
}

/* ───────── Blog: LLM ecosystem ───────── */

function LlmTokens({ caption }: { caption?: string }) {
  const toks = [
    { t: "Learn", id: 46_255, w: 70 },
    { t: "ing", id: 287, w: 50 },
    { t: "␣how", id: 1_268, w: 62 },
    { t: "␣to", id: 311, w: 50 },
    { t: "␣learn", id: 3_449, w: 76 },
  ];
  let x = 60;
  const placed = toks.map((tk) => {
    const at = x;
    x += tk.w + 12;
    return { ...tk, x: at };
  });
  return (
    <Frame caption={caption} viewBox="0 0 640 230">
      <text x="238" y="36" className="dg-label">
        &quot;Learning how to learn&quot;
      </text>
      <path d="M238 48 V68" className="dg-arrow dg-arrow-req" />
      <path d="M232 62 L238 70 L244 62" className="dg-arrow dg-arrow-req" />
      {placed.map((tk, i) => (
        <g key={tk.t} transform={`translate(${tk.x} 84)`}>
          <g className="dg-tok" style={{ animationDelay: `${i * 0.7}s` }}>
            <rect
              width={tk.w}
              height="34"
              rx="8"
              className={i % 2 ? "dg-res-box" : "dg-req-box"}
            />
            <text x={tk.w / 2} y="22">
              {tk.t}
            </text>
            <text x={tk.w / 2} y="56" className="dg-muted dg-small">
              {tk.id}
            </text>
          </g>
        </g>
      ))}
      <text x="238" y="176" className="dg-muted">
        tokens → numbers: what the model actually reads
      </text>

      <path d="M424 101 H476" className="dg-arrow dg-arrow-res" />
      <path d="M468 95 L477 101 L468 107" className="dg-arrow dg-arrow-res" />
      <g className="dg-ink" strokeWidth={2.5} fill="none">
        <rect x="484" y="72" width="130" height="58" rx="12" />
      </g>
      <text x="549" y="98" className="dg-label">
        LLM
      </text>
      <text x="549" y="116" className="dg-muted dg-small">
        guess the next token
      </text>
      <g className="dg-tok dg-tok-next">
        <rect x="502" y="148" width="94" height="32" rx="8" className="dg-res-box" />
        <text x="549" y="169" className="dg-res-text">
          ␣fast ✓
        </text>
      </g>
      <text x="320" y="216" className="dg-muted dg-small">
        token ids are illustrative; every model has its own vocabulary
      </text>
    </Frame>
  );
}

function ContextWindow({ caption }: { caption?: string }) {
  const words = [
    "system",
    "hi!",
    "CORS?",
    "answer",
    "huge",
    "log…",
    "log…",
    "fix?",
    "code",
    "test",
    "again",
    "thanks",
  ];
  const step = 62;
  const strip = [...words, ...words];
  return (
    <Frame caption={caption} viewBox="0 0 640 200">
      <defs>
        <clipPath id="dg-ctx-clip">
          <rect x="20" y="60" width="600" height="70" />
        </clipPath>
      </defs>
      <g clipPath="url(#dg-ctx-clip)">
        <g transform="translate(24 76)">
          <g className="dg-ctx-strip">
            {strip.map((w, i) => (
              <g key={i} transform={`translate(${i * step} 0)`}>
                <rect width="54" height="38" rx="7" className="dg-paper" />
                <text x="27" y="24">
                  {w}
                </text>
              </g>
            ))}
          </g>
        </g>
        {/* Everything left of the window is out of sight for the model. */}
        <rect x="20" y="60" width="226" height="70" className="dg-ctx-fog" />
      </g>
      <rect x="250" y="64" width="366" height="62" rx="12" className="dg-ctx-window" />
      <text x="433" y="50" className="dg-label dg-res-text">
        context window = working memory
      </text>
      <text x="132" y="50" className="dg-label dg-muted">
        forgotten
      </text>
      <text x="433" y="152" className="dg-muted">
        new tokens enter here →
      </text>
      <text x="132" y="152" className="dg-muted">
        ← slides out of view
      </text>
      <text x="320" y="186" className="dg-muted dg-small">
        keep it lean: every pasted line takes a seat at the table
      </text>
    </Frame>
  );
}

function LossyZip({ caption }: { caption?: string }) {
  const docs = [
    [30, 40],
    [62, 52],
    [38, 92],
    [74, 104],
    [28, 144],
    [66, 150],
  ] as const;
  const out = [
    { w: 150, fuzzy: false },
    { w: 120, fuzzy: true },
    { w: 160, fuzzy: false },
    { w: 100, fuzzy: false },
    { w: 140, fuzzy: true },
  ];
  return (
    <Frame caption={caption} viewBox="0 0 640 230">
      {docs.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <rect width="34" height="40" rx="4" className="dg-paper" />
          <path d="M7 12 H27 M7 20 H27 M7 28 H20" className="dg-muted-stroke" strokeWidth={2} />
        </g>
      ))}
      <text x="70" y="214" className="dg-label">
        the internet
      </text>

      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          r="6"
          className={`dg-zip-bit dg-zip-bit-${i + 1}`}
          transform="translate(130 110)"
        />
      ))}
      <path d="M128 110 H246" className="dg-lane" />

      <g className="dg-ink" strokeWidth={2.5} fill="none">
        <rect x="256" y="62" width="120" height="96" rx="14" />
      </g>
      <text x="316" y="182" className="dg-label">
        model
      </text>
      <text x="316" y="198" className="dg-muted dg-small">
        squeezed, not stored
      </text>
      <text x="316" y="116" className="dg-label dg-accent">
        .zip
      </text>

      <path d="M384 110 H432" className="dg-arrow dg-arrow-res" />
      <path d="M424 104 L433 110 L424 116" className="dg-arrow dg-arrow-res" />
      {out.map((o, i) => (
        <rect
          key={i}
          x="446"
          y={58 + i * 24}
          width={o.w}
          height="12"
          rx="6"
          className={o.fuzzy ? "dg-fuzzy" : "dg-solid"}
        />
      ))}
      <text x="530" y="196" className="dg-label">
        answer
      </text>
      <text x="530" y="212" className="dg-small dg-warn-text">
        mostly right · some bits made up
      </text>
    </Frame>
  );
}

function ModelCouncil({ caption }: { caption?: string }) {
  const models = [
    { y: 34, name: "Model A", says: "42", agree: true },
    { y: 100, name: "Model B", says: "42", agree: true },
    { y: 166, name: "Model C", says: "41?", agree: false },
  ];
  return (
    <Frame caption={caption} viewBox="0 0 640 230">
      <g className="dg-step dg-step-1">
        <rect x="20" y="92" width="120" height="44" rx="10" className="dg-req-box" />
        <text x="80" y="119" className="dg-label">
          your question
        </text>
      </g>
      {models.map((m) => (
        <g key={m.name}>
          <g className="dg-step dg-step-2">
            <path d={`M142 114 C 180 114, 190 ${m.y + 22}, 236 ${m.y + 22}`} className="dg-arrow dg-arrow-req" />
            <rect x="240" y={m.y} width="120" height="44" rx="10" className="dg-paper" />
            <text x="300" y={m.y + 27} className="dg-label">
              {m.name}
            </text>
          </g>
          <g className="dg-step dg-step-3">
            <path d={`M362 ${m.y + 22} C 400 ${m.y + 22}, 410 114, 446 114`} className="dg-arrow dg-arrow-res" />
            <text x="400" y={m.y + 16} className={m.agree ? "dg-res-text" : "dg-warn-text"}>
              {m.says}
            </text>
          </g>
        </g>
      ))}
      <g className="dg-step dg-step-4">
        <rect x="450" y="70" width="170" height="88" rx="12" className="dg-res-box" />
        <text x="535" y="98" className="dg-label">
          compare
        </text>
        <text x="535" y="120" className="dg-res-text">
          2 agree → keep ✓
        </text>
        <text x="535" y="140" className="dg-warn-text">
          1 differs → verify ?
        </text>
      </g>
    </Frame>
  );
}

function ToolLoop({ caption }: { caption?: string }) {
  return (
    <Frame caption={caption} viewBox="0 0 640 245">
      <g className="dg-step dg-step-1">
        <rect x="20" y="30" width="160" height="48" rx="10" className="dg-req-box" />
        <text x="100" y="51" className="dg-small">
          What is 48,213 × 7,919
        </text>
        <text x="100" y="66" className="dg-small">
          − 1,000,000?
        </text>
        <path d="M182 54 H224" className="dg-arrow dg-arrow-req" />
        <path d="M217 48 L226 54 L217 60" className="dg-arrow dg-arrow-req" />
      </g>
      <g className="dg-ink" strokeWidth={2.5} fill="none">
        <rect x="230" y="26" width="140" height="56" rx="12" />
      </g>
      <text x="300" y="51" className="dg-label">
        LLM
      </text>
      <text x="300" y="68" className="dg-muted dg-small">
        don&apos;t guess: compute
      </text>

      <g className="dg-step dg-step-2">
        <path d="M372 54 H412" className="dg-arrow dg-arrow-req" />
        <path d="M405 48 L414 54 L405 60" className="dg-arrow dg-arrow-req" />
        <rect x="418" y="26" width="204" height="56" rx="10" className="dg-paper" />
        <text x="430" y="48" className="dg-code dg-left dg-muted">
          # python, by the model
        </text>
        <text x="430" y="68" className="dg-code dg-left dg-accent">
          print(48213*7919-1_000_000)
        </text>
      </g>
      <g className="dg-step dg-step-3">
        <path d="M520 84 V114" className="dg-arrow dg-arrow-res" />
        <path d="M514 107 L520 116 L526 107" className="dg-arrow dg-arrow-res" />
        <rect x="440" y="120" width="160" height="48" rx="10" className="dg-res-box" />
        <text x="520" y="140" className="dg-small dg-muted">
          sandbox runs it
        </text>
        <text x="520" y="158" className="dg-res-text">
          380,798,747
        </text>
        <path d="M438 144 H340 V88" className="dg-arrow dg-arrow-res" />
        <path d="M334 95 L340 86 L346 95" className="dg-arrow dg-arrow-res" />
        <text x="390" y="136" className="dg-muted dg-small">
          result
        </text>
      </g>
      <g className="dg-step dg-step-4">
        <path d="M260 84 V180" className="dg-arrow dg-arrow-res" />
        <path d="M254 173 L260 182 L266 173" className="dg-arrow dg-arrow-res" />
        <rect x="60" y="186" width="400" height="40" rx="10" className="dg-res-box" />
        <text x="260" y="211" className="dg-label">
          Answer: 380,798,747 (computed, not recalled)
        </text>
      </g>
    </Frame>
  );
}

/* ───────── Blog: Habitat (OpenAI storage) ───────── */

function LibraryVsService({ caption }: { caption?: string }) {
  const rows = [0, 1, 2, 3];
  return (
    <Frame caption={caption} viewBox="0 0 640 270">
      <text x="160" y="28" className="dg-label">
        library in every service
      </text>
      {rows.map((i) => {
        const y = 48 + i * 48;
        const rollback = i === 2;
        return (
          <g key={i}>
            <rect x="30" y={y} width="150" height="36" rx="8" className="dg-paper" />
            <text x="105" y={y + 22}>
              {`service ${String.fromCharCode(65 + i)}`}
            </text>
            <g>
              <rect x="196" y={y + 6} width="96" height="24" rx="12" className="dg-bad-pill" />
              <text x="244" y={y + 22} className="dg-small dg-warn-text">
                v1 · bug
              </text>
            </g>
            <g className={`dg-ship dg-ship-${i + 1} ${rollback ? "dg-ship-rollback" : ""}`}>
              <rect x="196" y={y + 6} width="96" height="24" rx="12" className="dg-res-box" />
              <text x="244" y={y + 22} className="dg-small dg-res-text">
                v2 · fixed
              </text>
            </g>
            {rollback && (
              <text x="244" y={y + 2} className="dg-small dg-warn-text dg-rollback-note">
                ↶ rolled back
              </text>
            )}
          </g>
        );
      })}
      <text x="160" y="256" className="dg-muted dg-small">
        days to roll out · one rollback brings the bug back
      </text>

      <path d="M320 40 V250" className="dg-lane" />

      <text x="480" y="28" className="dg-label">
        one storage service
      </text>
      <g className="dg-ink" strokeWidth={2.5} fill="none">
        <rect x="420" y="112" width="120" height="48" rx="12" />
      </g>
      <text x="480" y="134" className="dg-label">
        Habitat
      </text>
      <g className="dg-ship dg-ship-all">
        <text x="480" y="151" className="dg-small dg-res-text">
          v2 · fixed
        </text>
      </g>
      {rows.map((i) => {
        const y = 52 + i * 48;
        const x = i % 2 ? 588 : 372;
        return (
          <g key={i}>
            <path
              d={i % 2 ? `M540 136 L${x - 22} ${y + 18}` : `M420 136 L${x + 22} ${y + 18}`}
              className="dg-lane"
            />
            <circle cx={x} cy={y + 18} r="20" className="dg-paper" />
            <circle cx={x} cy={y + 18} r="6" className="dg-bad-dot" />
            <circle cx={x} cy={y + 18} r="6" className="dg-ship dg-ship-all dg-good-dot" />
          </g>
        );
      })}
      <text x="480" y="256" className="dg-muted dg-small">
        deploy once · every product gets it
      </text>
    </Frame>
  );
}

function TailLatency({ caption }: { caption?: string }) {
  // Call durations (ms, illustrative). The response leaves after the slowest one.
  const calls = [38, 52, 41, 60, 47, 230, 44, 55];
  const scale = 1.55;
  const x0 = 170;
  const slowest = Math.max(...calls);
  const end = x0 + slowest * scale;
  return (
    <Frame caption={caption} viewBox="0 0 640 270">
      <rect x="20" y="104" width="110" height="44" rx="10" className="dg-req-box" />
      <text x="75" y="124" className="dg-label">
        1 message
      </text>
      <text x="75" y="140" className="dg-small dg-muted">
        → many DB calls
      </text>
      {calls.map((ms, i) => {
        const y = 34 + i * 24;
        const slow = ms === slowest;
        return (
          <g key={i}>
            <path d={`M132 126 L${x0 - 6} ${y + 7}`} className="dg-lane" />
            <rect
              x={x0}
              y={y}
              width={ms * scale}
              height="14"
              rx="7"
              className={slow ? "dg-fuzzy-solid" : "dg-solid"}
            />
            <text x={x0 + ms * scale + 8} y={y + 11} className={`dg-small dg-left ${slow ? "dg-warn-text" : "dg-muted"}`}>
              {ms} ms
            </text>
          </g>
        );
      })}
      {/* A curtain slides right at constant speed: short calls finish early, one keeps going.
          It rests off to the right, so with reduced motion every bar stays visible. */}
      <rect x={x0 - 2 + 470} y="28" width="470" height="196" className="dg-curtain" />
      <path d={`M${end} 26 V228`} className="dg-arrow dg-arrow-res" strokeDasharray="5 5" />
      <text x={end} y="246" className="dg-small dg-res-text">
        response can leave only now
      </text>
      {/* p50 as ticks above and below, so the line never crosses a label. */}
      <path
        d={`M${x0 + 48 * scale} 24 V30 M${x0 + 48 * scale} 222 V228`}
        className="dg-muted-stroke"
        strokeWidth={2}
      />
      <text x={x0 + 48 * scale} y="20" className="dg-small dg-muted">
        p50 ≈ 48 ms
      </text>
      <text x={end} y="20" className="dg-small dg-warn-text">
        you feel the slowest: {slowest} ms
      </text>
    </Frame>
  );
}

function QueryGuardrail({ caption }: { caption?: string }) {
  return (
    <Frame caption={caption} viewBox="0 0 640 260">
      <text x="160" y="28" className="dg-label">
        shared SQL database
      </text>
      <g className="dg-heavy">
        <rect x="24" y="58" width="150" height="34" rx="8" className="dg-bad-pill" />
        <text x="99" y="80" className="dg-small dg-warn-text">
          SELECT * … JOIN … JOIN
        </text>
      </g>
      {[0, 1, 2].map((i) => (
        <g key={i} className="dg-stuck" style={{ animationDelay: `${i * 0.2}s` }}>
          <rect x={40 + i * 44} y="120" width="36" height="24" rx="6" className="dg-paper" />
          <text x={58 + i * 44} y="136" className="dg-small">
            get
          </text>
        </g>
      ))}
      <text x="88" y="166" className="dg-small dg-muted">
        everyone else waits
      </text>
      <g className="dg-ink" strokeWidth={2.5} fill="none">
        <rect x="200" y="54" width="100" height="120" rx="14" />
      </g>
      <text x="250" y="120" className="dg-label">
        DB
      </text>
      <rect x="212" y="190" width="76" height="12" rx="6" className="dg-paper" />
      <rect x="212" y="190" width="76" height="12" rx="6" className="dg-gauge dg-gauge-hot" />
      <text x="250" y="222" className="dg-small dg-warn-text">
        CPU 100%
      </text>

      <path d="M320 40 V240" className="dg-lane" />

      <text x="480" y="28" className="dg-label">
        Habitat: simple get / put
      </text>
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${350 + (i >> 1) * 70} ${60 + (i % 2) * 34})`}>
          <g className="dg-flow" style={{ animationDelay: `${i * 0.75}s` }}>
            <rect width="44" height="24" rx="6" className={i % 2 ? "dg-res-box" : "dg-req-box"} />
            <text x="22" y="16" className="dg-small">
              {i % 2 ? "put" : "get"}
            </text>
          </g>
        </g>
      ))}
      <g className="dg-ink" strokeWidth={2.5} fill="none">
        <rect x="540" y="54" width="80" height="120" rx="14" />
      </g>
      <text x="580" y="120" className="dg-label">
        DB
      </text>
      <rect x="542" y="190" width="76" height="12" rx="6" className="dg-paper" />
      <rect x="542" y="190" width="76" height="12" rx="6" className="dg-gauge dg-gauge-calm" />
      <text x="580" y="222" className="dg-small dg-res-text">
        CPU steady
      </text>
      <text x="440" y="160" className="dg-small dg-muted">
        every request: one key,
      </text>
      <text x="440" y="174" className="dg-small dg-muted">
        a known, small cost
      </text>
    </Frame>
  );
}

function RustRewrite({ caption }: { caption?: string }) {
  const full = 380;
  const rows = [
    { label: "CPU", y: 50, rust: full / 6, note: "6× less" },
    { label: "Memory", y: 140, rust: full / 15, note: "15× less" },
  ];
  return (
    <Frame caption={caption} viewBox="0 0 640 230">
      {rows.map((r) => (
        <g key={r.label}>
          <text x="40" y={r.y + 26} className="dg-label dg-left">
            {r.label}
          </text>
          <text x="150" y={r.y + 12} className="dg-small dg-left dg-muted">
            Python
          </text>
          <rect x="210" y={r.y} width={full} height="16" rx="8" className="dg-bad-pill dg-grow" />
          <text x="150" y={r.y + 40} className="dg-small dg-left dg-muted">
            Rust
          </text>
          <rect x="210" y={r.y + 28} width={r.rust} height="16" rx="8" className="dg-solid dg-grow dg-grow-late" />
          <text x={220 + r.rust} y={r.y + 41} className="dg-small dg-left dg-res-text dg-grow-note">
            {r.note}
          </text>
        </g>
      ))}
      <text x="320" y="218" className="dg-muted dg-small">
        same API, same behaviour · rewritten by 2 engineers with Codex
      </text>
    </Frame>
  );
}

/* ───────── DevOps: Linux for servers ───────── */

function PipeFlow({ caption }: { caption?: string }) {
  const stages = [
    { x: 16, cmd: "cat access.log", rows: 9, label: "9 lines" },
    { x: 172, cmd: "grep ' 500 '", rows: 3, label: "only 500s" },
    { x: 328, cmd: "awk '{print $7}'", rows: 3, label: "just the path" },
    { x: 484, cmd: "sort | uniq -c", rows: 1, label: "the answer" },
  ];
  return (
    <Frame caption={caption} viewBox="0 0 640 250">
      {stages.map((st, i) => (
        <g key={st.cmd}>
          <rect x={st.x} y="28" width="140" height="36" rx="8" className={i === 3 ? "dg-res-box" : "dg-req-box"} />
          <text x={st.x + 70} y="51">
            {st.cmd}
          </text>
          {i < 3 && <path d={`M${st.x + 142} 46 H${st.x + 154}`} className="dg-arrow dg-arrow-req" />}
          <g className={`dg-step dg-step-${i + 1}`}>
            {Array.from({ length: st.rows }, (_, r) => (
              <rect
                key={r}
                x={st.x + 14}
                y={82 + r * 14}
                width={i === 0 ? 112 - (r % 3) * 18 : i === 3 ? 112 : 84}
                height="8"
                rx="4"
                className={i === 0 ? "dg-paper" : "dg-solid"}
              />
            ))}
            {i === 2 && (
              <text x={st.x + 70} y="140" className="dg-small dg-muted">
                /api/orders ×3
              </text>
            )}
            {i === 3 && (
              <text x={st.x + 70} y="112" className="dg-res-text">
                3 /api/orders
              </text>
            )}
            <text x={st.x + 70} y="226" className="dg-small dg-muted">
              {st.label}
            </text>
          </g>
        </g>
      ))}
      {[0, 1, 2].map((i) => (
        <circle key={i} r="4" className={`dg-pipe-dot dg-pipe-dot-${i + 1}`} transform={`translate(${stages[i]!.x + 148} 46)`} />
      ))}
    </Frame>
  );
}

function PermissionBits({ caption }: { caption?: string }) {
  const people = [
    { y: 46, who: "deploy", role: "owner", verdict: "✓ read · write · run", ok: true, chunk: 0 },
    { y: 112, who: "rafi", role: "group devs", verdict: "✓ read · run   ✗ write", ok: true, chunk: 1 },
    { y: 178, who: "guest", role: "others", verdict: "✗ permission denied", ok: false, chunk: 2 },
  ];
  const chunkX = [436, 490, 544];
  return (
    <Frame caption={caption} viewBox="0 0 640 250">
      {people.map((p, i) => (
        <g key={p.who}>
          <g transform={`translate(52 ${p.y + 50}) scale(0.6)`}>
            <Stick />
          </g>
          <text x="104" y={p.y + 18} className="dg-label dg-left">
            {p.who}
          </text>
          <text x="104" y={p.y + 34} className="dg-small dg-left dg-muted">
            {p.role}
          </text>
          <g className={`dg-step dg-step-${i + 1}`}>
            <path d={`M190 ${p.y + 24} L398 ${p.y < 112 ? 112 : p.y > 112 ? 140 : 126}`} className={`dg-arrow ${p.ok ? "dg-arrow-res" : "dg-arrow-bad"}`} />
            <text x="196" y={p.y + 12} className={`dg-small dg-left ${p.ok ? "dg-res-text" : "dg-warn-text"}`}>
              {p.verdict}
            </text>
            {/* Lights up the triplet that applies, behind its letters. */}
            <rect x={chunkX[p.chunk]! - 26} y="176" width="52" height="28" rx="6" className={p.ok ? "dg-res-box" : "dg-bad-pill"} />
          </g>
        </g>
      ))}
      <rect x="402" y="84" width="196" height="80" rx="10" className="dg-paper" />
      <text x="500" y="112" className="dg-label">
        deploy.sh
      </text>
      <text x="500" y="132" className="dg-small dg-muted">
        owner deploy · group devs
      </text>
      <text x="402" y="196" className="dg-code dg-left dg-muted">
        -
      </text>
      {["rwx", "r-x", "---"].map((c, i) => (
        <text key={c} x={chunkX[i]} y="196" className="dg-code">
          {c}
        </text>
      ))}
      {["owner", "group", "others"].map((c, i) => (
        <text key={c} x={chunkX[i]} y="222" className="dg-small dg-muted">
          {c}
        </text>
      ))}
    </Frame>
  );
}

function SystemdRestart({ caption }: { caption?: string }) {
  const journal = [
    { y: 196, text: "shop.service: Main process exited, status=9/KILL", cls: "dg-sd-j1 dg-warn-text" },
    { y: 214, text: "shop.service: Scheduled restart job, restart counter is at 1", cls: "dg-sd-j2 dg-muted" },
    { y: 232, text: "Started shop.service - Shop web app", cls: "dg-sd-j3 dg-res-text" },
  ];
  return (
    <Frame caption={caption} viewBox="0 0 640 250">
      <g className="dg-ink" strokeWidth={2.5} fill="none">
        <rect x="24" y="40" width="170" height="70" rx="12" />
      </g>
      <text x="109" y="70" className="dg-label">
        systemd
      </text>
      <text x="109" y="88" className="dg-small dg-muted">
        PID 1 · Restart=on-failure
      </text>

      <path d="M196 75 H400" className="dg-lane" />
      <g className="dg-sd-restart">
        <path d="M196 75 H396" className="dg-arrow dg-arrow-res" />
        <path d="M388 69 L397 75 L388 81" className="dg-arrow dg-arrow-res" />
        <text x="298" y="64" className="dg-small dg-res-text">
          restart after 5s
        </text>
      </g>

      {/* The app box cycles: running → killed → waiting → running again (new PID). */}
      <g className="dg-sd-run1">
        <rect x="404" y="40" width="212" height="70" rx="12" className="dg-res-box" />
        <text x="510" y="70" className="dg-label">
          shop.service
        </text>
        <text x="510" y="88" className="dg-small dg-res-text">
          running · PID 1342
        </text>
      </g>
      <g className="dg-sd-dead">
        <rect x="404" y="40" width="212" height="70" rx="12" className="dg-bad-pill" />
        <text x="510" y="70" className="dg-label">
          shop.service
        </text>
        <text x="510" y="88" className="dg-small dg-warn-text">
          killed · signal 9
        </text>
      </g>
      <g className="dg-sd-wait">
        <rect x="404" y="40" width="212" height="70" rx="12" className="dg-paper" />
        <text x="510" y="70" className="dg-label">
          shop.service
        </text>
        <text x="510" y="88" className="dg-small dg-muted">
          activating…
        </text>
      </g>
      <g className="dg-sd-run2">
        <rect x="404" y="40" width="212" height="70" rx="12" className="dg-res-box" />
        <text x="510" y="70" className="dg-label">
          shop.service
        </text>
        <text x="510" y="88" className="dg-small dg-res-text">
          running · PID 1388
        </text>
      </g>

      <text x="24" y="170" className="dg-label dg-left">
        journalctl -u shop
      </text>
      <rect x="20" y="180" width="600" height="62" rx="8" className="dg-paper" />
      {journal.map((j) => (
        <text key={j.y} x="32" y={j.y + 2} className={`dg-code dg-left ${j.cls}`}>
          {j.text}
        </text>
      ))}
    </Frame>
  );
}

function StrictMode({ caption }: { caption?: string }) {
  const lines = ['cd "$DEPLOY_DIR"', "rm -rf ./*", 'echo "done"'];
  const col = (x: number, title: string, strict: boolean) => (
    <g>
      <text x={x + 140} y="28" className={`dg-label ${strict ? "dg-res-text" : "dg-warn-text"}`}>
        {title}
      </text>
      <rect x={x} y="40" width="280" height="110" rx="10" className="dg-paper" />
      {lines.map((l, i) => (
        <text key={l} x={x + 40} y={70 + i * 30} className={`dg-code dg-left ${strict && i > 0 ? "dg-muted" : ""}`}>
          {l}
        </text>
      ))}
      <g transform={`translate(${x + 20} 66)`}>
        <path d="M0 -6 L8 0 L0 6 Z" className={strict ? "dg-cursor-strict" : "dg-cursor-loose"} />
      </g>
    </g>
  );
  return (
    <Frame caption={caption} viewBox="0 0 640 250">
      {col(20, "no safety net", false)}
      {col(340, "set -euo pipefail", true)}
      <g className="dg-step dg-step-1">
        <text x="160" y="176" className="dg-small dg-warn-text">
          cd fails (no such dir) → keeps going
        </text>
        <text x="480" y="176" className="dg-small dg-res-text">
          cd fails → script stops here
        </text>
      </g>
      <g className="dg-step dg-step-2">
        <rect x="40" y="186" width="240" height="26" rx="8" className="dg-bad-pill" />
        <text x="160" y="203" className="dg-small dg-warn-text">
          rm -rf ran in the wrong folder
        </text>
        <rect x="360" y="186" width="240" height="26" rx="8" className="dg-res-box" />
        <text x="480" y="203" className="dg-small dg-res-text">
          nothing deleted · exit 1
        </text>
      </g>
      <g className="dg-step dg-step-3">
        <text x="160" y="236" className="dg-small dg-warn-text">
          …and it still exits 0, so nobody knows
        </text>
        <text x="480" y="236" className="dg-small dg-muted">
          cron / CI sees the failure
        </text>
      </g>
    </Frame>
  );
}


// ── Programming ──

/** Three ways code reaches the CPU: compiled, interpreted, and bytecode on a VM. */
function CodeJourney({ caption }: { caption?: string }) {
  const W = 110;
  const xs = [126, 258, 390, 522];
  const lanes = [
    {
      y: 62,
      name: "C++ · Go · Rust",
      boxes: [
        { t: "hello.cpp", s: "your text", k: "dg-paper" },
        { t: "compiler", s: "g++ · go · rustc", k: "dg-req-box" },
        { t: "hello", s: "01001101 1110…", k: "dg-paper" },
        { t: "CPU", s: "Hello, World!", k: "dg-res-box" },
      ],
    },
    {
      y: 152,
      name: "Python · JavaScript",
      boxes: [
        { t: "hello.py", s: "your text", k: "dg-paper" },
        { t: "interpreter", s: "line by line", k: "dg-req-box", wide: true },
        null,
        { t: "CPU", s: "Hello, World!", k: "dg-res-box" },
      ],
    },
    {
      y: 242,
      name: "Java",
      boxes: [
        { t: "Hello.java", s: "your text", k: "dg-paper" },
        { t: "javac", s: "compiler", k: "dg-req-box" },
        { t: "Hello.class", s: "bytecode", k: "dg-paper" },
        { t: "JVM → CPU", s: "Hello, World!", k: "dg-res-box" },
      ],
    },
  ];
  return (
    <Frame caption={caption} viewBox="0 0 640 290">
      {lanes.map((lane) => (
        <g key={lane.name}>
          <text x="8" y={lane.y - 32} className="dg-label dg-left">
            {lane.name}
          </text>
          {lane.boxes.map((b, i) => {
            if (!b) return null;
            const w = "wide" in b && b.wide ? W * 2 + 22 : W;
            const x = xs[i]!;
            const box = (
              <>
                {i > 0 && <path d={`M${xs[i - 1]! + W + 2} ${lane.y} H${x - 4}`} className="dg-arrow dg-arrow-req" />}
                <rect x={x} y={lane.y - 20} width={w} height="40" rx="8" className={b.k} />
                <text x={x + (w === W ? w / 2 : 62)} y={b.s ? lane.y - 3 : lane.y + 4} className="dg-label">
                  {b.t}
                </text>
                {b.s && (
                  <text x={x + (w === W ? w / 2 : 62)} y={lane.y + 12} className={`dg-small ${b.t.includes("CPU") ? "dg-res-text" : "dg-muted"}`}>
                    {b.s}
                  </text>
                )}
              </>
            );
            // the source is always there; every later stage appears in turn
            return i === 0 ? (
              <g key={i}>{box}</g>
            ) : (
              <g key={i} className={`dg-step dg-step-${i + 1}`}>
                {box}
              </g>
            );
          })}
          {/* the interpreter reads one line, runs it, then the next */}
          {!lane.boxes[2] && (
            <g>
              {[0, 1, 2].map((r) => (
                <rect key={r} x={xs[1]! + 140} y={lane.y - 10 + r * 8} width={84 - r * 14} height="4" rx="2" className="dg-dot" />
              ))}
              <rect x={xs[1]! + 134} y={lane.y - 13} width="96" height="10" rx="3" className="dg-scan" transform="translate(0 16)" />
            </g>
          )}
          {lane.boxes[3] && (
            <circle cx={xs[3]! + W - 10} cy={lane.y - 10} r="4" className="dg-led" />
          )}
        </g>
      ))}
    </Frame>
  );
}

/** The CPU's loop: fetch the instruction the pointer is on, do it, move to the next. */
function FetchExecute({ caption }: { caption?: string }) {
  const rows = ["LOAD A, 2", "ADD A, 3", "PRINT A", "HALT"];
  const rowY = (i: number) => 58 + i * 36;
  return (
    <Frame caption={caption} viewBox="0 0 640 230">
      <text x="150" y="28" className="dg-label">
        memory (your program)
      </text>
      {rows.map((r, i) => (
        <g key={r}>
          <rect x="60" y={rowY(i) - 14} width="180" height="28" rx="6" className="dg-paper" />
          <text x="78" y={rowY(i) + 4} className="dg-small dg-muted dg-left">
            {i + 1}
          </text>
          <text x="156" y={rowY(i) + 4}>
            {r}
          </text>
        </g>
      ))}
      {/* the instruction pointer; resting on HALT, the end state */}
      <g transform={`translate(0 ${rowY(3) - rowY(0)})`}>
        <g className="dg-pc">
          <path d={`M22 ${rowY(0) - 8} L44 ${rowY(0)} L22 ${rowY(0) + 8} Z`} className="dg-accent" />
        </g>
      </g>
      <path d="M246 112 H306" className="dg-arrow dg-arrow-req" />
      <text x="276" y="104" className="dg-small dg-muted">
        fetch
      </text>

      <rect x="312" y="40" width="170" height="150" rx="12" className="dg-req-box" />
      <text x="397" y="64" className="dg-label">
        CPU
      </text>
      <text x="397" y="82" className="dg-small dg-muted">
        fetch → decode → execute
      </text>
      <rect x="352" y="100" width="90" height="44" rx="8" className="dg-paper" />
      <text x="372" y="126" className="dg-small dg-muted">
        A =
      </text>
      <text x="412" y="128" className="dg-label dg-reg dg-reg-0">
        0
      </text>
      <text x="412" y="128" className="dg-label dg-reg dg-reg-2">
        2
      </text>
      <text x="412" y="128" className="dg-label dg-res-text dg-reg-5">
        5
      </text>
      <text x="397" y="172" className="dg-small dg-res-text dg-halt">
        HALT: done ✓
      </text>

      <path d="M488 112 H520" className="dg-arrow dg-arrow-res" />
      <rect x="526" y="82" width="100" height="60" rx="8" className="dg-paper" />
      <text x="576" y="76" className="dg-small dg-muted">
        screen
      </text>
      <text x="576" y="120" className="dg-label dg-res-text dg-out">
        5
      </text>
    </Frame>
  );
}

// ── DSA ──

/**
 * The same sum() on three machines: the time bars race at different speeds and stop at
 * different seconds, while the step count beside each one is identical.
 */
function StopwatchVsSteps({ caption }: { caption?: string }) {
  const rows = [
    { name: "new laptop", time: "0.6 s", speed: "fast", y: 78 },
    { name: "phone", time: "1.9 s", speed: "mid", y: 132 },
    { name: "2015 laptop", time: "4.2 s", speed: "slow", y: 186 },
  ];
  return (
    <Frame caption={caption} viewBox="0 0 640 250">
      <text x="320" y="30" className="dg-label dg-accent">
        same sum() · same 1,000,000 numbers
      </text>
      <text x="300" y="54" className="dg-small dg-muted">
        stopwatch
      </text>
      <text x="560" y="54" className="dg-small dg-muted">
        steps counted
      </text>
      {rows.map((r) => (
        <g key={r.name}>
          <text x="24" y={r.y + 5} className="dg-label dg-left">
            {r.name}
          </text>
          <rect x="140" y={r.y - 11} width="300" height="22" rx="6" className="dg-paper" />
          <rect
            x="140"
            y={r.y - 11}
            width="300"
            height="22"
            rx="6"
            className={`dg-req-box dg-race dg-race-${r.speed}`}
          />
          <text x="452" y={r.y + 5} className={`dg-label dg-left dg-warn-text dg-done dg-done-${r.speed}`}>
            {r.time}
          </text>
          <rect x="500" y={r.y - 13} width="120" height="26" rx="8" className="dg-res-box" />
          <text x="560" y={r.y + 5} className="dg-code dg-res-text">
            2,000,002
          </text>
        </g>
      ))}
      <g className="dg-step dg-step-4">
        <text x="290" y="232" className="dg-small dg-warn-text">
          seconds depend on the machine
        </text>
        <text x="560" y="232" className="dg-small dg-res-text">
          steps don&apos;t
        </text>
      </g>
    </Frame>
  );
}

/**
 * Double the input, twice. One loop's steps double (a bar twice as long); a loop inside a
 * loop quadruples (a square whose side doubles, so its area grows four times).
 */
function StepsGrow({ caption }: { caption?: string }) {
  const cols = [
    { n: 10, x: 230, one: "10", pairs: "100", k: 1 },
    { n: 20, x: 370, one: "20", pairs: "400", k: 2 },
    { n: 40, x: 520, one: "40", pairs: "1,600", k: 3 },
  ];
  return (
    <Frame caption={caption} viewBox="0 0 640 304">
      <text x="24" y="104" className="dg-label dg-left">
        one loop
      </text>
      <text x="24" y="120" className="dg-small dg-left dg-muted">
        sum(list)
      </text>
      <text x="24" y="224" className="dg-label dg-left">
        loop in a loop
      </text>
      <text x="24" y="240" className="dg-small dg-left dg-muted">
        check every pair
      </text>
      <path d="M150 140h470M150 270h470" className="dg-lane" />
      {cols.map((c) => {
        const bar = c.n * 2;
        const side = c.n * 1.6;
        return (
          <g key={c.n} className={`dg-step dg-step-${c.k}`}>
            <text x={c.x} y="40" className="dg-label">
              n = {c.n}
            </text>
            <rect x={c.x - bar / 2} y="96" width={bar} height="20" rx="4" className="dg-req-box" />
            <text x={c.x} y="80" className="dg-code dg-accent">
              {c.one} steps
            </text>
            <rect x={c.x - side / 2} y={268 - side} width={side} height={side} rx="3" className="dg-bad-pill" />
            <text x={c.x} y={258 - side} className="dg-code dg-warn-text">
              {c.pairs} steps
            </text>
          </g>
        );
      })}
      <g className="dg-step dg-step-4">
        <text x="300" y="164" className="dg-small dg-accent">
          input ×2 → one loop ×2
        </text>
        <text x="370" y="294" className="dg-small dg-warn-text">
          input ×2 → loop in a loop ×4
        </text>
      </g>
    </Frame>
  );
}

/** marks[3]: the address is computed (start + 3 × 4), so the jump is one step, not a walk. */
function ArrayAddress({ caption }: { caption?: string }) {
  const vals = [72, 65, 90, 81, 55, 77];
  return (
    <Frame caption={caption} viewBox="0 0 640 230">
      <text x="320" y="30" className="dg-label dg-accent">
        int marks[6] · each box is 4 bytes
      </text>
      {vals.map((v, i) => {
        const x = 50 + i * 92;
        return (
          <g key={i}>
            <text x={x + 41} y="74" className="dg-small dg-muted">
              {1000 + i * 4}
            </text>
            <rect x={x} y="84" width="82" height="46" rx="6" className="dg-paper" />
            {i === 3 && (
              <rect x={x} y="84" width="82" height="46" rx="6" className="dg-res-box dg-step dg-step-2" />
            )}
            <text x={x + 41} y="113" className="dg-label">
              {v}
            </text>
            <text x={x + 41} y="150" className="dg-small dg-muted">
              [{i}]
            </text>
          </g>
        );
      })}
      <g className="dg-step dg-step-1">
        <path d="M91 166 C 140 206, 290 206, 367 166" className="dg-lane" />
        <text x="230" y="214" className="dg-code dg-accent">
          1000 + 3 × 4 = 1012
        </text>
      </g>
      <g className="dg-step dg-step-3">
        <text x="520" y="200" className="dg-small dg-res-text">
          one sum, no walking → O(1)
        </text>
      </g>
    </Frame>
  );
}

/** Reading one box pulls its whole 64-byte neighbourhood into the cache; the next reads are free. */
function CacheLine({ caption }: { caption?: string }) {
  const ram = Array.from({ length: 16 }, (_, i) => i);
  return (
    <Frame caption={caption} viewBox="0 0 640 250">
      <rect x="20" y="40" width="80" height="60" rx="10" className="dg-req-box" />
      <text x="60" y="76" className="dg-label">
        CPU
      </text>
      <text x="240" y="30" className="dg-small dg-muted">
        cache (tiny, ~1 ns)
      </text>
      <rect x="130" y="44" width="220" height="52" rx="8" className="dg-paper" />
      <text x="400" y="150" className="dg-small dg-muted">
        RAM (huge, ~100 ns) · long a[] · 8 bytes each
      </text>
      {ram.map((i) => (
        <g key={i}>
          <rect x={40 + i * 36} y="164" width="32" height="32" rx="4" className="dg-paper" />
          {i < 8 && (
            <rect x={40 + i * 36} y="164" width="32" height="32" rx="4" className="dg-res-box dg-step dg-step-2" />
          )}
          <text x={56 + i * 36} y="185" className="dg-small">
            a[{i}]
          </text>
        </g>
      ))}
      <g className="dg-step dg-step-1">
        <path d="M60 104 L 60 158" className="dg-lane" />
        <text x="66" y="134" className="dg-small dg-left dg-warn-text">
          read a[0]: miss
        </text>
      </g>
      <g className="dg-step dg-step-2">
        <path d="M184 160 L 240 100" className="dg-lane" />
        <text x="250" y="76" className="dg-code dg-res-text">
          a[0] … a[7]
        </text>
        <text x="330" y="214" className="dg-small dg-res-text">
          one trip brings 64 bytes = 8 neighbours
        </text>
      </g>
      <g className="dg-step dg-step-3">
        <text x="520" y="70" className="dg-small dg-res-text">
          a[1] … a[7]: hits, almost free
        </text>
      </g>
      <g className="dg-step dg-step-4">
        <text x="320" y="238" className="dg-small dg-accent">
          arrays read in order make the cache happy
        </text>
      </g>
    </Frame>
  );
}

/** The common growth rates drawn one after another, from flat O(1) to explosive O(2ⁿ). */
function GrowthCurves({ caption }: { caption?: string }) {
  const curves = [
    { d: "M60 222 L 540 222", k: "O(1)", y: 226, c: "dg-res-text", s: "dg-curve-good" },
    { d: "M60 236 C 120 200, 300 196, 540 190", k: "O(log n)", y: 194, c: "dg-res-text", s: "dg-curve-good" },
    { d: "M60 236 L 540 140", k: "O(n)", y: 144, c: "dg-accent", s: "dg-curve-mid" },
    { d: "M60 236 C 300 190, 440 120, 540 84", k: "O(n log n)", y: 88, c: "dg-accent", s: "dg-curve-mid" },
    { d: "M60 236 C 300 230, 420 150, 470 30", k: "O(n²)", y: 40, c: "dg-warn-text", s: "dg-curve-bad" },
    { d: "M60 236 C 220 236, 300 200, 330 30", k: "O(2ⁿ)", y: 40, c: "dg-warn-text", s: "dg-curve-bad" },
  ];
  return (
    <Frame caption={caption} viewBox="0 0 640 270">
      <path d="M60 20 L 60 236 L 600 236" className="dg-ink" strokeWidth={2} fill="none" />
      <text x="330" y="258" className="dg-small dg-muted">
        input size n →
      </text>
      <text x="40" y="130" className="dg-small dg-muted" transform="rotate(-90 40 130)">
        steps →
      </text>
      {curves.map((c, i) => (
        <g key={c.k}>
          <path
            d={c.d}
            fill="none"
            strokeWidth={3}
            strokeLinecap="round"
            className={`dg-draw ${c.s}`}
            style={{ animationDelay: `${i * 0.9}s` }}
          />
          <text
            x={i === 4 ? 486 : i === 5 ? 346 : 550}
            y={c.y}
            className={`dg-code dg-left ${c.c}`}
          >
            {c.k}
          </text>
        </g>
      ))}
    </Frame>
  );
}

/** Reading cost off the loops: one loop → n, a loop in a loop → n², a halving loop → log n. */
function LoopCost({ caption }: { caption?: string }) {
  const cols = [
    { x: 20, lines: ["for i in 0..n:", "  total += a[i]"], cost: "O(n)", k: 1 },
    { x: 230, lines: ["for i in 0..n:", "  for j in 0..n:", "    check(i, j)"], cost: "O(n²)", k: 2 },
    { x: 440, lines: ["while n > 1:", "  n = n / 2"], cost: "O(log n)", k: 3 },
  ];
  return (
    <Frame caption={caption} viewBox="0 0 640 230">
      {cols.map((c) => (
        <g key={c.cost}>
          <rect x={c.x} y="30" width="180" height="104" rx="10" className="dg-paper" />
          <rect x={c.x} y="30" width="180" height="104" rx="10" className={`dg-req-box dg-step dg-step-${c.k}`} />
          {c.lines.map((l, i) => (
            <text
              key={l}
              x={c.x + 14 + (l.length - l.trimStart().length) * 6.6}
              y={58 + i * 22}
              className="dg-code dg-left"
            >
              {l.trim()}
            </text>
          ))}
          <g className={`dg-step dg-step-${c.k}`}>
            <rect x={c.x + 50} y="146" width="80" height="28" rx="14" className="dg-res-box" />
            <text x={c.x + 90} y="165" className="dg-code dg-res-text">
              {c.cost}
            </text>
          </g>
        </g>
      ))}
      <g className="dg-step dg-step-4">
        <text x="320" y="208" className="dg-small dg-accent">
          drop the constants: 3n + 5 → O(n) · keep the biggest term: n² + n → O(n²)
        </text>
      </g>
    </Frame>
  );
}

/** fact(4): frames pile up until the base case, then the answers flow back down the stack. */
function CallStack({ caption }: { caption?: string }) {
  const frames = ["fact(4)", "fact(3)", "fact(2)", "fact(1)"];
  const back = ["= 4 × 6 = 24", "= 3 × 2 = 6", "= 2 × 1 = 2", "= 1  (base case)"];
  return (
    <Frame caption={caption} viewBox="0 0 640 260">
      <text x="160" y="28" className="dg-label dg-accent">
        calls go up ↑
      </text>
      <text x="470" y="28" className="dg-label dg-res-text">
        answers come back ↓
      </text>
      <path d="M60 236 h 220" className="dg-ink" strokeWidth={2} />
      {frames.map((f, i) => {
        const y = 190 - i * 46;
        return (
          <g key={f}>
            {/* frames stay up until the answers have come back down */}
            <g className="dg-seq dg-seq-hold" style={{ "--d": i } as CSSProperties}>
              <rect x="70" y={y} width="200" height="40" rx="8" className={i === 3 ? "dg-res-box" : "dg-req-box"} />
              <text x="170" y={y + 25} className="dg-code">
                {f}
              </text>
            </g>
            <g className="dg-seq" style={{ "--d": 7 - i } as CSSProperties}>
              <text x="300" y={y + 25} className="dg-code dg-left dg-res-text">
                {back[i]}
              </text>
            </g>
          </g>
        );
      })}
    </Frame>
  );
}

/** fib(5) as a tree: the same calls appear again and again (the waste memoization removes). */
function RecursionTree({ caption }: { caption?: string }) {
  const n = (x: number, y: number, t: string, dup = false, k = 1) => (
    <g key={`${x}-${y}`} className={`dg-step dg-step-${k}`}>
      <rect x={x - 34} y={y - 14} width="68" height="26" rx="13" className={dup ? "dg-bad-pill" : "dg-paper"} />
      <text x={x} y={y + 4} className={`dg-code ${dup ? "dg-warn-text" : ""}`}>
        {t}
      </text>
    </g>
  );
  const e = (x1: number, y1: number, x2: number, y2: number, k: number) => (
    <path key={`${x1}${y1}${x2}${y2}`} d={`M${x1} ${y1 + 12} L ${x2} ${y2 - 14}`} className={`dg-lane dg-step dg-step-${k}`} />
  );
  return (
    <Frame caption={caption} viewBox="0 0 640 250">
      {e(320, 30, 180, 90, 1)}
      {e(320, 30, 470, 90, 1)}
      {e(180, 90, 100, 150, 2)}
      {e(180, 90, 260, 150, 2)}
      {e(470, 90, 420, 150, 2)}
      {e(470, 90, 540, 150, 2)}
      {e(100, 150, 60, 210, 3)}
      {e(100, 150, 140, 210, 3)}
      {e(260, 150, 230, 210, 3)}
      {e(260, 150, 300, 210, 3)}
      {e(420, 150, 390, 210, 3)}
      {e(420, 150, 450, 210, 3)}
      {n(320, 30, "fib(5)", false, 1)}
      {n(180, 90, "fib(4)", false, 1)}
      {n(470, 90, "fib(3)", true, 1)}
      {n(100, 150, "fib(3)", true, 2)}
      {n(260, 150, "fib(2)", true, 2)}
      {n(420, 150, "fib(2)", true, 2)}
      {n(540, 150, "fib(1)", false, 2)}
      {n(60, 210, "fib(2)", true, 3)}
      {n(140, 210, "fib(1)", false, 3)}
      {n(230, 210, "fib(1)", false, 3)}
      {n(300, 210, "fib(0)", false, 3)}
      {n(390, 210, "fib(1)", false, 3)}
      {n(450, 210, "fib(0)", false, 3)}
      <g className="dg-step dg-step-4">
        <text x="560" y="214" className="dg-small dg-warn-text">
          fib(3) ×2, fib(2) ×3
        </text>
        <text x="560" y="232" className="dg-small dg-warn-text">
          same work, again
        </text>
      </g>
    </Frame>
  );
}

/** 16 appends to a doubling array: most cost 1, a few spike (the copies), the average stays flat. */
function AmortizedDoubling({ caption }: { caption?: string }) {
  // cost of the i-th append (1-based), starting at capacity 1: a copy happens when size hits a power of two
  const costs = Array.from({ length: 16 }, (_, k) => {
    const i = k + 1;
    return i > 1 && ((i - 1) & (i - 2)) === 0 ? i : 1;
  });
  const unit = 9;
  return (
    <Frame caption={caption} viewBox="0 0 640 250">
      <path d="M50 210 h 560" className="dg-ink" strokeWidth={2} />
      <text x="330" y="236" className="dg-small dg-muted">
        append #1 … #16
      </text>
      {costs.map((c, k) => {
        const x = 62 + k * 34;
        const spike = c > 1;
        return (
          <g key={k} className="dg-seq" style={{ "--d": k * 0.6 } as CSSProperties}>
            <rect x={x} y={210 - c * unit} width="24" height={c * unit} rx="3" className={spike ? "dg-bad-pill" : "dg-req-box"} />
            {spike && (
              <text x={x + 12} y={202 - c * unit} className="dg-small dg-warn-text">
                copy {c - 1}
              </text>
            )}
          </g>
        );
      })}
      <g className="dg-step dg-step-4">
        <path d="M50 183 h 560" className="dg-lane" />
        <text x="560" y="176" className="dg-small dg-res-text">
          average ≈ 3 per append
        </text>
      </g>
    </Frame>
  );
}

/** Merge sort's recursion tree: each level does n work in total, and there are log₂ n levels. */
function RecurrenceLevels({ caption }: { caption?: string }) {
  const levels = [1, 2, 4, 8];
  return (
    <Frame caption={caption} viewBox="0 0 640 250">
      {levels.map((parts, l) => {
        const w = 400 / parts;
        return (
          <g key={parts} className={`dg-step dg-step-${Math.min(l + 1, 4)}`}>
            {Array.from({ length: parts }, (_, i) => (
              <g key={i}>
                <rect x={30 + i * w + 3} y={24 + l * 50} width={w - 6} height="32" rx="6" className="dg-req-box" />
                <text x={30 + i * w + w / 2} y={45 + l * 50} className="dg-code">
                  {8 / parts}
                </text>
              </g>
            ))}
            <text x="450" y={45 + l * 50} className="dg-code dg-left dg-res-text">
              {parts} × {8 / parts} = 8 work
            </text>
          </g>
        );
      })}
      <g className="dg-step dg-step-4">
        <text x="320" y="236" className="dg-small dg-accent">
          log₂ 8 = 3 splits · each level costs n · total ≈ n log n
        </text>
      </g>
    </Frame>
  );
}

// ── Build to Hire: scaling Postgres ──

/** The scaling ladder: each rung lights in order, cheapest first, sharding last. */
function ScaleLadder({ caption }: { caption?: string }) {
  const rungs = [
    { t: "measure", s: "baseline p95", k: "dg-paper" },
    { t: "indexes", s: "hours of work", k: "dg-res-box" },
    { t: "PgBouncer", s: "an afternoon", k: "dg-res-box" },
    { t: "replicas", s: "days", k: "dg-req-box" },
    { t: "partitions", s: "days", k: "dg-req-box" },
    { t: "shards", s: "weeks, forever", k: "dg-bad-pill" },
  ];
  return (
    <Frame caption={caption} viewBox="0 0 640 260">
      <path d="M40 230 L 610 230" className="dg-ink" strokeWidth={2} />
      {rungs.map((r, i) => {
        const x = 50 + i * 94;
        const y = 180 - i * 27;
        return (
          <g key={r.t} className="dg-seq dg-seq-hold" style={{ "--d": i * 0.8 } as CSSProperties}>
            <rect x={x} y={y} width="84" height={230 - y} rx="6" className={r.k} />
            <text x={x + 42} y={y + 20} className="dg-label">
              {r.t}
            </text>
            <text x={x + 42} y={y + 36} className={`dg-small ${i === 5 ? "dg-warn-text" : "dg-muted"}`}>
              {r.s}
            </text>
          </g>
        );
      })}
      <text x="40" y="34" className="dg-small dg-left dg-res-text">
        climb only when the step below is used up
      </text>
      <text x="600" y="34" className="dg-small dg-warn-text" style={{ textAnchor: "end" }}>
        cost and complexity grow →
      </text>
    </Frame>
  );
}

/**
 * Read-your-writes: the write returns its WAL position (LSN). A replica that hasn't
 * replayed that far yet is skipped and the read goes to the primary; once it catches up,
 * reads go back to the replica.
 */
function ReadYourWrites({ caption }: { caption?: string }) {
  return (
    <Frame caption={caption} viewBox="0 0 640 260">
      <rect x="24" y="100" width="100" height="56" rx="10" className="dg-paper" />
      <text x="74" y="133" className="dg-label">
        app
      </text>
      <rect x="270" y="30" width="130" height="56" rx="10" className="dg-req-box" />
      <text x="335" y="56" className="dg-label">
        primary
      </text>
      <text x="335" y="74" className="dg-small dg-muted">
        LSN 0/5A00
      </text>
      <rect x="270" y="172" width="130" height="56" rx="10" className="dg-paper" />
      <text x="335" y="198" className="dg-label">
        replica
      </text>
      <text x="335" y="216" className="dg-small dg-warn-text dg-step dg-step-1">
        replayed 0/59F0
      </text>
      <g className="dg-step dg-step-1">
        <path d="M124 116 L 266 64" className="dg-lane" />
        <text x="170" y="52" className="dg-small dg-accent">
          INSERT post → LSN 0/5A00
        </text>
      </g>
      <g className="dg-step dg-step-2">
        <path d="M124 128 L 266 76" className="dg-lane" />
        <text x="214" y="136" className="dg-small dg-warn-text">
          replica behind → read primary
        </text>
      </g>
      <g className="dg-step dg-step-3">
        <path d="M335 90 L 335 168" className="dg-lane" />
        <text x="430" y="132" className="dg-small dg-left dg-muted">
          WAL streams down
        </text>
        <rect x="270" y="172" width="130" height="56" rx="10" className="dg-res-box" />
        <text x="335" y="198" className="dg-label">
          replica
        </text>
        <text x="335" y="216" className="dg-small dg-res-text">
          replayed 0/5A00 ✓
        </text>
      </g>
      <g className="dg-step dg-step-4">
        <path d="M124 142 L 266 196" className="dg-lane" />
        <text x="150" y="200" className="dg-small dg-res-text">
          caught up → read replica
        </text>
      </g>
    </Frame>
  );
}

/** Moving bucket 16 between shards online: copy, catch up, brief freeze, flip, unfreeze. */
function ShardMove({ caption }: { caption?: string }) {
  const steps = [
    "1 · copy bucket 16 (logical replication)",
    "2 · stream new writes until lag ≈ 0",
    "3 · freeze writes to bucket 16 (~1 s)",
    "4 · flip map: 16 → shard B · unfreeze",
  ];
  return (
    <Frame caption={caption} viewBox="0 0 640 290">
      <rect x="30" y="40" width="160" height="110" rx="10" className="dg-paper" />
      <text x="110" y="62" className="dg-label">
        shard A
      </text>
      <rect x="450" y="40" width="160" height="110" rx="10" className="dg-paper" />
      <text x="530" y="62" className="dg-label">
        shard B
      </text>
      <rect x="240" y="40" width="160" height="60" rx="10" className="dg-req-box" />
      <text x="320" y="64" className="dg-label">
        router
      </text>
      <text x="320" y="84" className="dg-code dg-step dg-step-1">
        16 → A
      </text>
      <g className="dg-step dg-step-4">
        <rect x="240" y="40" width="160" height="60" rx="10" className="dg-res-box" />
        <text x="320" y="64" className="dg-label">
          router
        </text>
        <text x="320" y="84" className="dg-code dg-res-text">
          16 → B
        </text>
      </g>
      <rect x="62" y="86" width="96" height="40" rx="6" className="dg-bad-pill" />
      <text x="110" y="111" className="dg-code dg-warn-text">
        bucket 16
      </text>
      <g className="dg-step dg-step-1">
        <path d="M160 106 C 260 150, 380 150, 480 106" className="dg-lane" />
        <rect x="482" y="86" width="96" height="40" rx="6" className="dg-bad-pill" />
        <text x="530" y="111" className="dg-code dg-warn-text">
          bucket 16
        </text>
      </g>
      <g className="dg-step dg-step-3">
        <text x="320" y="176" className="dg-small dg-warn-text">
          writes for 16 wait ~1 s · reads keep working
        </text>
      </g>
      {steps.map((t, i) => (
        <g key={t} className={`dg-step dg-step-${i + 1}`}>
          <text x="40" y={204 + i * 21} className="dg-small dg-left">
            {t}
          </text>
        </g>
      ))}
    </Frame>
  );
}

const DIAGRAMS: Record<string, (p: { caption?: string }) => ReactNode> = {
  "code-journey": CodeJourney,
  "fetch-execute": FetchExecute,
  "http-restaurant": HttpRestaurant,
  "request-response": RequestResponse,
  "http-anatomy": HttpAnatomy,
  "cors-preflight": CorsPreflight,
  "network-layers": NetworkLayers,
  "http1-vs-http2": Http1VsHttp2,
  "os-sandwich": OsSandwich,
  "user-kernel": UserKernel,
  "kernel-types": KernelTypes,
  "syscall-journey": SyscallJourney,
  "traps-interrupts": TrapsInterrupts,
  "vdso-fast-path": VdsoFastPath,
  "llm-tokens": LlmTokens,
  "context-window": ContextWindow,
  "lossy-zip": LossyZip,
  "model-council": ModelCouncil,
  "tool-loop": ToolLoop,
  "library-vs-service": LibraryVsService,
  "tail-latency": TailLatency,
  "query-guardrail": QueryGuardrail,
  "rust-rewrite": RustRewrite,
  "pipe-flow": PipeFlow,
  "permission-bits": PermissionBits,
  "systemd-restart": SystemdRestart,
  "strict-mode": StrictMode,
  "stopwatch-vs-steps": StopwatchVsSteps,
  "steps-grow": StepsGrow,
  "array-address": ArrayAddress,
  "cache-line": CacheLine,
  "growth-curves": GrowthCurves,
  "loop-cost": LoopCost,
  "call-stack": CallStack,
  "recursion-tree": RecursionTree,
  "amortized-doubling": AmortizedDoubling,
  "recurrence-levels": RecurrenceLevels,
  "scale-ladder": ScaleLadder,
  "read-your-writes": ReadYourWrites,
  "shard-move": ShardMove,
  ...BFP_DIAGRAMS,
};

export const DIAGRAM_NAMES = Object.keys(DIAGRAMS);

export function Diagram({
  name,
  caption,
}: {
  name?: string;
  caption?: string;
}) {
  const D = name ? DIAGRAMS[name] : undefined;
  if (!D) return null;
  return <D caption={caption || undefined} />;
}
