import { useNavigate } from "react-router";
import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "~/components/ui/input-group";
import { cn } from "~/lib/utils";

export function NpmSearchForm({
  initialValue = "",
  autoFocus = false,
  size = "default",
  className,
}: {
  initialValue?: string;
  autoFocus?: boolean;
  size?: "default" | "lg";
  className?: string;
}) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initialValue);
  const large = size === "lg";

  return (
    <form
      role="search"
      className={cn("w-full", className)}
      onSubmit={(event) => {
        event.preventDefault();
        const keyword = value.trim();
        if (keyword) navigate(`/cnpm/search?q=${encodeURIComponent(keyword)}`);
      }}
    >
      <InputGroup className={cn("bg-transparent", large ? "h-12 rounded-xl" : "h-9 rounded-lg")}>
        <InputGroupAddon align="inline-start" className={cn(large ? "pl-3" : "pl-2.5")}>
          <SearchIcon className={large ? "size-5" : "size-4"} />
        </InputGroupAddon>
        <InputGroupInput
          type="text"
          value={value}
          autoFocus={autoFocus}
          onChange={(event) => setValue(event.target.value)}
          placeholder="搜索 npm 包，如 react、@babel/core..."
          aria-label="搜索 npm 包"
          className={cn("h-full", large && "text-base")}
        />
        <InputGroupAddon align="inline-end" className={cn(large ? "pr-2" : "pr-1.5")}>
          <InputGroupButton
            type="submit"
            variant="default"
            className={cn(
              "font-medium",
              large ? "h-9 gap-1.5 rounded-lg px-4" : "h-6",
            )}
          >
            {large && <SearchIcon />}
            搜索
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
