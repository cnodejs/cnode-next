import type { PublicIdentity } from "@cnode/shared";
import { Badge } from "~/components/ui/badge";

const identityLabels: Record<PublicIdentity, string> = {
  admin: "管理员",
  moderator: "版主",
  recruiter: "猎头",
};

const identityVariants: Record<PublicIdentity, "default" | "secondary" | "outline"> = {
  admin: "default",
  moderator: "secondary",
  recruiter: "outline",
};

export function UserIdentityBadges({ identities = [] }: { identities?: readonly PublicIdentity[] }) {
  if (identities.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5" aria-label="用户身份">
      {identities.map((identity) => (
        <Badge key={identity} variant={identityVariants[identity]}>
          {identityLabels[identity]}
        </Badge>
      ))}
    </div>
  );
}
