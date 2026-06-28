import { useSim } from "@/lib/sim/store";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function EntityDetail() {
  const selected = useSim((s) => s.selected);
  const select = useSim((s) => s.select);
  // Currently entities are not clickable in canvas (next iteration). Placeholder API for future.
  return (
    <Sheet open={!!selected} onOpenChange={(o) => !o && select(null)}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Entity details</SheetTitle>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
