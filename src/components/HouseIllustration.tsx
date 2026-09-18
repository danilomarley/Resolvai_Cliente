import { Icon } from './Icon'

export function HouseIllustration() {
  return (
    <div className="hero-art" aria-hidden="true">
      <svg viewBox="0 0 350 220" fill="none">
        <ellipse cx="177" cy="195" rx="126" ry="15" fill="#102754" />
        <g stroke="#9bbde9" strokeWidth="1.5" strokeLinejoin="round">
          <path d="M221 105 267 83V170L221 192Z" fill="#254678" />
          <path d="M91 105 156 49 221 105V192H91Z" fill="#426ead" />
          <path d="M156 40 202 18 279 86 235 108Z" fill="#5a88c8" />
          <path
            d="M79 108 156 40 235 108 224 115 156 57 90 115Z"
            fill="#254678"
          />
          <path d="M169 132H203V192H169Z" fill="#19365f" />
          <path d="M109 132H145V166H109Z" fill="#b4dffc" />
          <path d="M127 132V166M109 149H145" stroke="#426ead" strokeWidth="3" />
          <path d="M237 121 253 113V143L237 151Z" fill="#b4dffc" />
          <path d="M237 136 253 128" stroke="#426ead" strokeWidth="3" />
          <path d="M164 192H208L200 201H156Z" fill="#628dc4" />
        </g>
        <circle cx="195" cy="164" r="2.5" fill="var(--color-secondary)" />
        <path
          d="M64 167V190M290 153V177"
          stroke="#6ab7b5"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M50 160C50 143 64 131 64 131S78 143 78 160A14 14 0 0 1 50 160Z"
          fill="#397d85"
          stroke="#6ab7b5"
        />
        <path
          d="M279 149C279 134 290 124 290 124S301 134 301 149A11 11 0 0 1 279 149Z"
          fill="#397d85"
          stroke="#6ab7b5"
        />
        <path d="M37 85 42 76 47 85 42 94Z" fill="var(--color-secondary)" />
        <path d="M298 59 302 52 306 59 302 66Z" fill="#88b6fa" />
        <circle cx="306" cy="103" r="3" fill="#5588d3" />
      </svg>
      <span className="art-badge">
        <Icon name="shield" size={17} /> Sua casa em boas mãos
      </span>
    </div>
  )
}
