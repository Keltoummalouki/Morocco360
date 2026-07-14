/**
 * Morocco360 pictorial mark — hand-authored SVG recreation of the brand logo:
 * twin Moroccan ogee arches forming an "M", a pointed-arch doorway framing the
 * Koutoubia minaret with a palm and Atlas foothills, crowned by the 8-point
 * khatim star, with the green→gold→terracotta "360" arc sweeping over the top.
 *
 * Fixed brand colours (this is a brand mark, not a themed UI element), but the
 * doorway carries its own cream ground so it reads correctly on any background —
 * light, dark, or a photo.
 */
const GREEN = '#124E44';
const GREEN_SOFT = '#1C6B54';
const GOLD = '#E7A43A';
const GOLD_DEEP = '#C9871F';
const TERRA = '#C25A32';
const TERRA_DEEP = '#9E3E19';
const CREAM = '#FBF7EF';
const HILL = '#E2A16E';
const HILL_BACK = '#CE7C48';

const LEFT_PANEL =
  'M40 172C39 130 41 96 46 72C50 42 58 34 70 40C86 47 97 64 104 82C108 90 111 93 110 96C103 110 93 130 89 148C87 157 86 163 88 168Z';
const DOORWAY =
  'M88 168C86 163 87 157 89 148C93 130 103 110 110 96C117 110 127 130 131 148C133 157 134 163 132 168Z';

export default function LogoMark({
  size = 34,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="28 8 168 168"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="m360-tower" x1="110" y1="100" x2="110" y2="168" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={TERRA} />
          <stop offset="1" stopColor={TERRA_DEEP} />
        </linearGradient>
        <linearGradient id="m360-arc" x1="86" y1="16" x2="184" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={GREEN} />
          <stop offset="0.5" stopColor={GOLD} />
          <stop offset="1" stopColor={TERRA} />
        </linearGradient>
        <clipPath id="m360-door">
          <path d={DOORWAY} />
        </clipPath>
      </defs>

      {/* 360 arc — behind the panels */}
      <path
        d="M86.6 16.8A80 80 0 0 1 184.6 129.5"
        stroke="url(#m360-arc)"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Doorway ground */}
      <path d={DOORWAY} fill={CREAM} />

      {/* Scenery inside the doorway */}
      <g clipPath="url(#m360-door)">
        <path d="M84 168C90 158 98 157 104 163C110 156 118 156 124 162C129 158 133 160 135 168Z" fill={HILL_BACK} />
        <path d="M86 168C92 156 100 155 106 161C112 152 120 153 126 160C130 156 134 158 136 168Z" fill={HILL} />
        {/* palm */}
        <path d="M99 168C97 156 96 148 98 140" stroke={TERRA_DEEP} strokeWidth="2.4" strokeLinecap="round" />
        <g stroke={GREEN_SOFT} strokeWidth="2" strokeLinecap="round" fill="none">
          <path d="M98 140C93 135 88 135 84 138" />
          <path d="M98 140C94 133 90 131 86 130" />
          <path d="M98 140C97 133 97 129 98 126" />
          <path d="M98 140C101 133 105 131 109 131" />
          <path d="M98 140C100 135 104 135 108 138" />
        </g>
        {/* Koutoubia minaret */}
        <rect x="101" y="160" width="18" height="8" fill={TERRA_DEEP} />
        <rect x="103" y="120" width="14" height="42" fill="url(#m360-tower)" />
        <rect x="106" y="110" width="8" height="11" fill="url(#m360-tower)" />
        <path d="M110 100L114.5 110H105.5Z" fill={TERRA_DEEP} />
        <circle cx="110" cy="99" r="1.9" fill={GOLD_DEEP} />
        <rect x="103" y="144.5" width="14" height="2.4" fill={TERRA_DEEP} />
        <rect x="106.4" y="129" width="2.3" height="9" fill={TERRA_DEEP} />
        <rect x="111.3" y="129" width="2.3" height="9" fill={TERRA_DEEP} />
      </g>

      {/* Green arch panels forming the M */}
      <path d={LEFT_PANEL} fill={GREEN} />
      <path d={LEFT_PANEL} fill={GREEN} transform="matrix(-1 0 0 1 220 0)" />

      {/* 8-point khatim star */}
      <g>
        <rect x="94.5" y="39.5" width="31" height="31" rx="3" fill={GOLD} />
        <rect x="94.5" y="39.5" width="31" height="31" rx="3" fill={GOLD} transform="rotate(45 110 55)" />
        <rect x="100.6" y="45.6" width="18.8" height="18.8" rx="2" fill="none" stroke={CREAM} strokeWidth="1.3" />
        <rect x="100.6" y="45.6" width="18.8" height="18.8" rx="2" fill="none" stroke={CREAM} strokeWidth="1.3" transform="rotate(45 110 55)" />
        <circle cx="110" cy="55" r="1.8" fill={CREAM} />
      </g>
    </svg>
  );
}
