import {
  Page,
  PageContent,
  PageDescription,
  PageHeader,
  PageTitle,
  PageTitleContainer,
} from "@/components/layout/page-old";
import { Command, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, Loader2Icon, SearchIcon, PlusIcon, XIcon } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

// --- Types ---
type Ingredient = {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
};

const CATEGORIES = ["Vegetables", "Fruits", "Spices", "Dairy", "Meat", "Grains"];

// --- Mock Data Generator ---
const generateMockData = (count: number): Ingredient[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `ing-${i + 1}`,
    name: `Ingredient ${i + 1}`,
    category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
    stock: Math.floor(Math.random() * 100),
    unit: ["kg", "g", "pcs", "L"][Math.floor(Math.random() * 4)],
  }));
};

const MOCK_DB = generateMockData(500); // Large dataset simulation

// --- Mock Server Action ---
const searchIngredients = async (query: string): Promise<Ingredient[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500)); // Network latency
  if (!query) return MOCK_DB.slice(0, 20);
  return MOCK_DB.filter(
    (item) =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase()),
  ).slice(0, 20); // Limit results
};

export const Route = createFileRoute("/_app/examples/search/")({
  component: SearchDialogPage,
});

function SearchDialogPage() {
  const [selectedSingle, setSelectedSingle] = useState<Ingredient | null>(null);
  const [selectedMultiple, setSelectedMultiple] = useState<Ingredient[]>([]);

  return (
    <Page>
      <PageHeader sticky>
        <PageTitleContainer>
          <PageTitle>Search & Select Dialog</PageTitle>
          <PageDescription>
            Optimized dialogs for searching and selecting from large server-side datasets.
          </PageDescription>
        </PageTitleContainer>
      </PageHeader>
      <PageContent>
        <div className="grid gap-8 md:grid-cols-2">
          {/* Example 1: Single Selection */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Single Selection</h3>
              <p className="text-muted-foreground text-sm">
                Pick a single ingredient to substitute.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Selected Ingredient</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={selectedSingle ? selectedSingle.name : ""}
                  placeholder="No ingredient selected"
                />
                <SingleSelectDialog selectedId={selectedSingle?.id} onSelect={setSelectedSingle} />
              </div>
            </div>
          </div>

          {/* Example 2: Multiple Selection */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Multiple Selection</h3>
              <p className="text-muted-foreground text-sm">
                Build a recipe by selecting multiple ingredients.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Recipe Ingredients</Label>
              <div className="border rounded-md p-4 min-h-[100px] space-y-2">
                {selectedMultiple.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No ingredients added yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedMultiple.map((item) => (
                      <Badge key={item.id} variant="secondary" className="pl-2 pr-1 py-1">
                        {item.name}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 hover:bg-transparent"
                          onClick={() =>
                            setSelectedMultiple((prev) => prev.filter((i) => i.id !== item.id))
                          }
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="pt-2">
                  <MultiSelectDialog
                    selectedIds={selectedMultiple.map((i) => i.id)}
                    onConfirm={(items) => {
                      // Merge to avoid duplicates if re-opening (though logic handles ID check)
                      const newIds = new Set(items.map((i) => i.id));
                      const unique = [
                        ...selectedMultiple.filter((i) => !newIds.has(i.id)),
                        ...items,
                      ];
                      setSelectedMultiple(unique);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContent>
    </Page>
  );
}

// --- Reusable Single Selection Dialog ---
function SingleSelectDialog({
  onSelect,
  selectedId,
}: {
  onSelect: (item: Ingredient) => void;
  selectedId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);

  // Simple debounce logic inside effect
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async (q: string) => {
    setLoading(true);
    try {
      const data = await searchIngredients(q);
      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: Ingredient) => {
    onSelect(item);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="icon">
            <SearchIcon className="h-4 w-4" />
          </Button>
        }
      />
      <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-[500px]">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0 px-0"
              placeholder="Search ingredients..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {loading && <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <CommandList className="max-h-[300px] overflow-y-auto p-1">
            {results.length === 0 && !loading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No ingredients found.
              </div>
            )}
            {results.map((item) => (
              <CommandItem
                key={item.id}
                value={item.id + item.name} // Hack for cmdk unique value requirement
                onSelect={() => handleSelect(item)}
                className="flex items-center justify-between cursor-pointer p-2"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.category} • {item.stock} {item.unit} in stock
                  </span>
                </div>
                {item.id === selectedId && <CheckIcon className="h-4 w-4 text-primary" />}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

// --- Reusable Multi Selection Dialog ---
function MultiSelectDialog({
  onConfirm,
  selectedIds = [],
}: {
  onConfirm: (items: Ingredient[]) => void;
  selectedIds?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [tempSelected, setTempSelected] = useState<Set<string>>(new Set(selectedIds));
  const [selectedItemsMap, setSelectedItemsMap] = useState<Map<string, Ingredient>>(new Map()); // Keep track of item objects

  useEffect(() => {
    setTempSelected(new Set(selectedIds));
  }, [selectedIds, open]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async (q: string) => {
    setLoading(true);
    try {
      const data = await searchIngredients(q);
      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (item: Ingredient) => {
    const newMaxData = new Map(selectedItemsMap);
    newMaxData.set(item.id, item);
    setSelectedItemsMap(newMaxData);

    const next = new Set(tempSelected);
    if (next.has(item.id)) {
      next.delete(item.id);
    } else {
      next.add(item.id);
    }
    setTempSelected(next);
  };

  const handleConfirm = () => {
    // Only return items that are currently selected AND present in our map (which they should be if selected via UI)
    // For proper multi-select where options might not be in current search results,
    // we need to rely on the parent or keep a full map.
    // Here we'll just return what we have knowledge of + trigger parent to handle.

    // In a real app, you might fetch selectedItems by ID if they aren't in the current view.
    // For this mock, assume we have the objects if they were clicked.
    // If initially passed IDs aren't in map, we can't return full objects unless fetched.
    // So for this demo, we'll just return the ones available in `results` + previously cached ones?
    // Let's simplify: return objects we know about.

    const items = Array.from(tempSelected)
      .map((id) => {
        return selectedItemsMap.get(id) || results.find((r) => r.id === id);
      })
      .filter(Boolean) as Ingredient[];

    onConfirm(items);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Ingredients
          </Button>
        }
      />
      <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-[600px] h-[500px] flex flex-col">
        <div className="p-4 border-b flex flex-col gap-1 bg-muted/10">
          <DialogTitle>Add Ingredients</DialogTitle>
          <DialogDescription>Search and select multiple items.</DialogDescription>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center border-b px-3 py-2">
            <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              className="flex h-10 w-full rounded-md bg-transparent text-sm outline-none border-0 focus-visible:ring-0 px-0"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto p-1 relative">
            {loading && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 text-muted-foreground text-sm">
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Loading...
              </div>
            )}
            {results.length === 0 && !loading && (
              <div className="py-10 text-center text-sm text-muted-foreground">No items found.</div>
            )}
            <div className="grid gap-1 p-1">
              {results.map((item) => {
                const isSelected = tempSelected.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item)}
                    className={`
                                    flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors border
                                    ${isSelected ? "bg-primary/5 border-primary/20" : "hover:bg-accent border-transparent"}
                                `}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">{item.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.category} •{" "}
                        <span className={item.stock < 10 ? "text-destructive" : ""}>
                          {item.stock} {item.unit}
                        </span>
                      </span>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full border flex items-center justify-center ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"}`}
                    >
                      {isSelected && <CheckIcon className="h-3 w-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/10">
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">{tempSelected.size} selected</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirm}>Confirm Selection</Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
