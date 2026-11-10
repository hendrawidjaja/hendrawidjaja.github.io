/**
 * Site logo. Inlined (instead of loading `public/Logo.svg` through <Image>) so
 * its fills can follow the `.dark` theme class: the tile matches the header
 * background and the monogram flips to stay legible. The blue accent is the
 * one brand colour that works on both.
 */
export const Logo = ({ className }: { className?: string }) => (
  <svg
    aria-label="Hendra Widjaja logo"
    className={className}
    role="img"
    viewBox="0 0 500 500"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect className="fill-white dark:fill-slate-950" height="500" rx="20" width="500" />
    <polygon
      className="fill-slate-900 dark:fill-white"
      points="66,160 100,160 100,233 140,233 140,160 174,160 174,340 140,340 140,267 100,267 100,340 66,340"
    />
    <polygon fill="#0066ff" points="258,160 292,160 242,340 208,340" />
    <polygon
      className="fill-slate-900 dark:fill-white"
      points="300,160 334,160 354,274 380,220 406,274 426,160 460,160 418,340 400,340 380,274 360,340 342,340"
    />
  </svg>
);
