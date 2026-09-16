import { Icon } from './Icon'

export function HouseIllustration() {
  return (
    <div className="hero-art" aria-hidden="true">
      <svg viewBox="0 0 350 220" fill="none">
        <ellipse cx="188" cy="191" rx="122" ry="17" fill="#102754" />
        <path d="m72 98 99-59 105 59-101 60z" fill="#426ead" stroke="#86acdf" />
        <path d="m88 101 87 48v57l-87-49z" fill="#254678" stroke="#6c98d4" />
        <path d="m175 149 85-48v57l-85 48z" fill="#19365f" stroke="#6c98d4" />
        <path
          d="m64 103 100-85 119 80-26 15-91-61-77 65z"
          fill="#3969b0"
          stroke="#9bbde9"
          strokeWidth="1.5"
        />
        <path d="m164 18 4 34 89 61 26-15z" fill="#5a88c8" stroke="#9bbde9" />
        <path d="m191 35 16 9V17l-16-9z" fill="#84a5d3" />
        <path d="m207 44 13-8V10l-13 7z" fill="#426ba2" />
        <path d="m191 8 15-8 14 10-13 7z" fill="#aec8eb" />
        <path d="m110 124 24 14v28l-24-14z" fill="#a0d7fb" stroke="#bddfff" />
        <path
          d="m122 131 0 28 M110 138l24 14"
          stroke="#396297"
          strokeWidth="2"
        />
        <path d="m199 148 27-15v43l-27 15z" fill="#628dc4" stroke="#9bbde9" />
        <path d="m218 156 0 3" stroke="#d3e7ff" strokeWidth="3" />
        <path d="m240 125 13-8v23l-13 7z" fill="#a0d7fb" />
        <path
          d="M64 165v24 M50 161c0-19 14-29 14-29s15 10 15 29a15 15 0 0 1-29 0"
          fill="#397d85"
          stroke="#6ab7b5"
        />
        <path
          d="M286 148v32 M274 146c0-20 12-28 12-28s13 8 13 28a13 13 0 0 1-25 0"
          fill="#397d85"
          stroke="#6ab7b5"
        />
        <path d="m27 88 5-9 5 9-5 9z M298 62l4-7 4 7-4 7z" fill="#88b6fa" />
        <circle cx="306" cy="103" r="3" fill="#5588d3" />
        <circle cx="82" cy="37" r="3" fill="#5588d3" />
      </svg>
      <span className="art-badge">
        <Icon name="shield" size={17} /> Sua casa em boas mãos
      </span>
    </div>
  )
}
