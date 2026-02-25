import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, InfoIcon, AlertTriangleIcon, Trash2Icon, LoaderIcon } from "lucide-react";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ConfirmOptions = {
  title?: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "info" | "warning";
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
};

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => void;
};

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    onConfirm: () => {},
  });
  const [isLoading, setIsLoading] = useState(false);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setOpen(true);
  }, []);

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await options.onConfirm();
      setOpen(false);
    } catch (error) {
      console.error("Confirmation action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (options.onCancel) {
      options.onCancel();
    }
    setOpen(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {options.variant === "destructive" && (
                <Trash2Icon className="h-5 w-5 text-destructive" />
              )}
              {options.variant === "warning" && (
                <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />
              )}
              {options.variant === "info" && <InfoIcon className="h-5 w-5 text-blue-500" />}
              {!options.variant || options.variant === "default" ? (
                <CheckCircleIcon className="h-5 w-5 text-primary" />
              ) : null}
              {options.title || "Are you sure?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {options.description || "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {/* We manually control close to handle async, so we use Buttons instead of AlertDialogAction/Cancel directly if needed, but for simplicity of styling we can abuse asChild or just use Buttons with onClick.
                 Standard AlertDialogCancel closes automatically. For async confirm, we need to block close until done.
                 So we won't use AlertDialogAction which closes automatically.
             */}
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              {options.cancelText || "Cancel"}
            </Button>
            <Button
              variant={options.variant === "destructive" ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading && <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />}
              {options.confirmText || "Continue"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}
