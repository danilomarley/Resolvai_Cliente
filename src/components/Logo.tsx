/** Símbolo da ResolvAI: um "R" simples em um quadrado arredondado, com a perna terminando como um visto de "resolvido". */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect width="48" height="48" rx="13" fill="var(--color-secondary)" />
      <path d="M17 35V13.5h8.5a7.25 7.25 0 0 1 0 14.5H17" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26 28.5 31.5 35" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  )
}

/** Logo completo (símbolo + nome). A cor do "Resolv" segue a cor do texto onde o logo é usado. */
export function Logo({ markOnly = false, size = 36 }: { markOnly?: boolean; size?: number }) {
  if (markOnly) return <LogoMark size={size} />
  return (
    <span className="logo" role="img" aria-label="ResolvAI">
      <LogoMark size={size} />
      <span className="logo-name" aria-hidden="true">Resolv<span className="logo-ai">AI</span></span>
    </span>
  )
}
