/**
 * Site logo. Inlined (instead of loading `public/Logo.svg` through <Image>) so its fills can follow the `.dark`
 * theme class. The monogram stays legible on the header background; the blue accent is the one brand color that
 * works on both.
 */
export const Logo = ({ className }: { className?: string }) => (
  <svg
    aria-label="Hendra Widjaja logo"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 240 240" width="240" height="240">
    <rect className="fill-slate-50 dark:fill-slate-950" width="240" height="240" />
    <path className="fill-slate-900 dark:fill-white" d="M44,82 Q44,72 54,72 Q62,72 62,80 L62,113 L90,113 L90,80 Q90,72 98,72 Q108,72 108,82 L108,158 Q108,168 98,168 Q90,168 90,160 L90,127 L62,127 L62,160 Q62,168 54,168 Q44,168 44,158 Z" />
    <path className="fill-slate-900 dark:fill-white" d="M118,82 Q118,72 127,72 Q134,72 136,80 L146,136 L154,108 Q156,102 160,102 Q164,102 166,108 L174,136 L184,80 Q186,72 193,72 Q202,72 202,82 L185,158 Q183,168 175,168 Q169,168 167,160 L160,136 L153,160 Q151,168 145,168 Q137,168 135,158 Z" />
  </svg>
);