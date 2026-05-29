import { getInitials, type HouseholdMember } from "@/lib/store";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

const sizeCls: Record<Size, string> = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
  xl: "size-24 text-2xl",
};

export function MemberAvatar({
  member,
  size = "md",
  className,
  ring,
}: {
  member: Pick<HouseholdMember, "name" | "avatarType" | "avatarColor" | "avatarEmoji" | "avatarImage" | "initials">;
  size?: Size;
  className?: string;
  ring?: boolean;
}) {
  const base = cn(
    "rounded-full grid place-items-center overflow-hidden font-bold shrink-0",
    sizeCls[size],
    ring && "ring-2 ring-card",
    className,
  );

  if (member.avatarType === "photo" && member.avatarImage) {
    return (
      <img
        src={member.avatarImage}
        alt={member.name}
        className={cn(base, "object-cover")}
      />
    );
  }

  if (member.avatarType === "emoji" && member.avatarEmoji) {
    return (
      <div className={base} style={{ backgroundColor: member.avatarColor }}>
        <span className={size === "xl" ? "text-4xl" : size === "lg" ? "text-2xl" : "text-lg"}>
          {member.avatarEmoji}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(base, "text-white")}
      style={{ backgroundColor: member.avatarColor }}
    >
      {member.initials || getInitials(member.name)}
    </div>
  );
}
