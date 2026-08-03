import { Link } from "react-router";
import { Shield } from "lucide-react";
import { CNODE_LOGO_DARK, CNODE_LOGO_LIGHT } from "~/lib/brand";
import { cn } from "~/lib/utils";

interface CNodeLogoProps {
  to?: string;
  admin?: boolean;
  compact?: boolean;
  className?: string;
}

export function CNodeLogo({ to = "/", admin = false, compact = false, className }: CNodeLogoProps) {
  return (
    <Link
      to={to}
      className={cn("group inline-flex items-center gap-2", className)}
      aria-label={admin ? "CNode Admin" : "CNode"}
    >
      <span className="inline-flex h-10 items-start pt-[3px]">
        {compact ? (
          <>
            <img src={CNODE_LOGO_DARK} alt="CNode" className="block h-7 w-auto max-w-[88px] dark:hidden" />
            <img src={CNODE_LOGO_LIGHT} alt="CNode" className="hidden h-7 w-auto max-w-[88px] dark:block" />
          </>
        ) : (
          <>
            <img src={CNODE_LOGO_DARK} alt="CNode" className="block h-7 w-auto min-w-[118px] dark:hidden" />
            <img src={CNODE_LOGO_LIGHT} alt="CNode" className="hidden h-7 w-auto min-w-[118px] dark:block" />
          </>
        )}
      </span>
      {admin && (
        <span className="hidden items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground sm:inline-flex">
          <Shield className="h-3 w-3" /> Admin
        </span>
      )}
    </Link>
  );
}
