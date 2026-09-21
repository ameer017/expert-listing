import { cn } from "@/lib/cn";
import { highlightMatch } from "@/lib/places";

export function HighlightedText({
  text,
  query,
  id,
}: {
  text: string;
  query: string;
  id: string;
}) {
  return (
    <>
      {highlightMatch(text, query).map((part, index) => (
        <span key={`${id}-${index}`} className={cn(part.match && "text-leaf")}>
          {part.value}
        </span>
      ))}
    </>
  );
}
