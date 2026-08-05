import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import type { RegistryManifest } from "~/lib/registry/types";
import { gravatarHash, gravatarUrl, initials } from "~/lib/registry/gravatar";

type Maintainer = NonNullable<RegistryManifest["maintainers"]>[number];

export function MaintainersCard({ maintainers }: { maintainers: Maintainer[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>维护者</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {maintainers.map((maintainer) => (
          <MaintainerRow key={maintainer.name} maintainer={maintainer} />
        ))}
      </CardContent>
    </Card>
  );
}

function MaintainerRow({ maintainer }: { maintainer: Maintainer }) {
  const hash = gravatarHash(maintainer.email);

  return (
    <div className="flex items-center gap-2.5">
      <Avatar className="size-8">
        <AvatarImage src={gravatarUrl(hash)} alt={maintainer.name} />
        <AvatarFallback>{initials(maintainer.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-foreground">{maintainer.name}</div>
        {maintainer.email && (
          <div className="truncate text-xs text-muted-foreground">{maintainer.email}</div>
        )}
      </div>
    </div>
  );
}
