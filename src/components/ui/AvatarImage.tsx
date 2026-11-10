import { type SyntheticEvent, useState } from "react";

type Attempt = "picture" | "base" | "failed";
interface AvatarImageProps {
  alt?: string;
  className?: string;
  name: string;
  src: string;
}

interface AttemptState {
  attempt: Attempt;
  src: string;
}

/**
 * `/foo/bar.png` → `/foo/bar.jxl`. Returns `null` for paths where deriving a
 * sibling would be wrong (remote URLs, no image extension).
 */
function siblingSource(src: string, extension: "jxl" | "webp"): string | null {
  if (!src.startsWith("/")) return null;
  const match = /^(.*)\.(?:png|jpe?g|webp|jxl)$/i.exec(src);
  return match ? `${match[1]}.${extension}` : null;
}

/**
 * Avatar that prefers JXL, then WebP, then the original file, and finally
 * falls back to the profile initials when nothing decodes.
 */
export function AvatarImage({ src, name, alt, className }: AvatarImageProps) {
  const [state, setState] = useState<AttemptState>(() => ({
    src,
    attempt: src ? "picture" : "failed",
  }));

  // Reset when the parent supplies a different image.
  if (state.src !== src) {
    setState({ src, attempt: src ? "picture" : "failed" });
  }

  const imageClass = `h-full w-full object-cover object-center${className ? ` ${className}` : ""}`;

  const handleError = () => {
    setState((current) => ({
      ...current,
      attempt: current.attempt === "picture" ? "base" : "failed",
    }));
  };

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    // A "load" with no pixels means the format decoded to nothing.
    if (event.currentTarget.naturalWidth === 0) handleError();
  };

  if (state.attempt === "failed") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 p-6 text-center dark:from-slate-800 dark:to-slate-900">
        <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
          {name
            .split(" ")
            .map((part) => part[0])
            .join("")}
        </span>
        <span className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{name}</span>
      </div>
    );
  }

  if (state.attempt === "base") {
    return (
      // biome-ignore lint/performance/noImgElement: <picture> needs a plain <img> for format negotiation
      <img
        alt={alt ?? name}
        className={imageClass}
        loading="eager"
        onError={handleError}
        onLoad={handleLoad}
        referrerPolicy="no-referrer"
        src={src}
      />
    );
  }

  const jxl = siblingSource(src, "jxl");
  const webp = siblingSource(src, "webp");

  return (
    <picture className="contents">
      {jxl && <source srcSet={jxl} type="image/jxl" />}
      {webp && <source srcSet={webp} type="image/webp" />}
      <img
        alt={alt ?? name}
        className={imageClass}
        loading="eager"
        onError={handleError}
        onLoad={handleLoad}
        referrerPolicy="no-referrer"
        src={src}
      />
    </picture>
  );
}