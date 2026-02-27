import { cn, getInitials } from "../../lib/utils";

type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps {
  src?: string;
  name: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const initials = getInitials(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          "rounded-full object-cover ring-2 ring-white/[0.08]",
          sizeClasses[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-primary-500/20 text-primary-400 font-medium ring-2 ring-primary-500/20",
        sizeClasses[size],
        className,
      )}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
