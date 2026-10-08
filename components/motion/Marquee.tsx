import { cn } from "@/lib/format";

type Props = {
  items: string[];
  className?: string;
  speed?: number; // segundos por vuelta
  reverse?: boolean;
  separator?: React.ReactNode;
};

export function Marquee({ items, className, speed = 28, reverse, separator }: Props) {
  const row = [...items, ...items];
  return (
    <div
      className={cn("relative flex overflow-hidden whitespace-nowrap select-none", className)}
      aria-hidden
    >
      <div
        className="flex min-w-full shrink-0 items-center gap-8 pr-8 animate-[marquee_var(--speed)_linear_infinite] motion-reduce:animate-none"
        style={
          {
            "--speed": `${speed}s`,
            animationDirection: reverse ? "reverse" : "normal",
          } as React.CSSProperties
        }
      >
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-8">
            <span>{item}</span>
            <span className="text-yellow">{separator ?? <Star size={18} />}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Star({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="currentColor"
    >
      <path d="M12 1.5l2.9 7.1 7.6.5-5.9 4.9 1.9 7.4L12 17.3 5.5 21.4l1.9-7.4L1.5 9.1l7.6-.5z" />
    </svg>
  );
}
