const paths = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  plus: 'M12 5v14 M5 12h14',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  chevron: 'M9 5l7 7-7 7',
  down: 'm6 9 6 6 6-6',
  search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  bag: 'M4 7h16v14H4z M8 7V5a4 4 0 0 1 8 0v2 M8 11h0 M16 11h0',
  file: 'M6 3h9l4 4v14H6z M14 3v5h5 M9 12h7 M9 16h5',
  chat: 'M21 11a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4 M8 10h8 M8 14h5',
  wallet: 'M20 8V5H5a3 3 0 0 0 0 6h16v9H5a3 3 0 0 1-3-3V8 M21 12h-5v5h5',
  check: 'm5 12 4 4L19 6',
  circleCheck: 'M21 11v1a9 9 0 1 1-5-8 M8 11l4 4 9-10',
  star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2',
  help: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5 M12 17h.01',
  sparkles:
    'm14 2 2.5 6.5L23 11l-6.5 2.5L14 20l-2.5-6.5L5 11l6.5-2.5z M4 2v5 M1.5 4.5h5 M4 17v5 M1.5 19.5h5',
  pin: 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0 M14 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 7v5l3 2',
  trend: 'm3 17 6-6 4 4 8-10 M15 5h6v6',
  drop: 'M12 2S4 11 4 15a8 8 0 0 0 16 0c0-4-8-13-8-13 M8 15a4 4 0 0 0 4 4',
  tool: 'M14 6a5 5 0 0 0-6 6l-5 5a3 3 0 0 0 4 4l5-5a5 5 0 0 0 6-6l-3 3-4-4z',
  paint: 'M4 3h13v6H4z M17 5h3v8h-9v3 M9 16h4v6H9z',
  shield: 'm12 2 8 3v6c0 6-8 11-8 11S4 17 4 11V5z M8 11l3 3 5-5',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  close: 'm6 6 12 12 M6 18 18 6',
  calendar: 'M4 5h16v16H4z M8 2v6 M16 2v6 M4 11h16',
  home: 'm3 10 9-8 9 8 M5 9v12h14V9 M9 21v-8h6v8',
} as const

export type IconName = keyof typeof paths

export function Icon({
  name,
  size = 20,
  className,
}: {
  name: IconName
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={paths[name]} />
    </svg>
  )
}
