import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// A drop-in replacement for <Input type="password" /> with a show/hide
// toggle — every password field in the app (Login, LoginModal,
// Register, ResetPassword, Account's change-password form) used a
// plain password input with no way to check what you typed. One
// shared component instead of wiring the same eye-icon toggle by hand
// in eight places.
const PasswordInput = React.forwardRef<HTMLInputElement, Omit<React.ComponentProps<"input">, "type">>(
  ({ className, disabled, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    // `className` lands on the WRAPPER, not the inner <input> — every
    // current caller only ever passes layout classes meant for the
    // wrapper's position in its own parent (e.g. LoginModal's grid
    // `col-span-3`), same as a plain <Input> would receive them as a
    // direct grid/flex child. The input itself always keeps its own
    // fixed pr-10 for icon clearance, not merged with caller classes.
    return (
      <div className={cn("relative", className)}>
        <Input
          type={visible ? "text" : "password"}
          className="pr-10"
          disabled={disabled}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          // Same left-3/pl-10 spacing convention the search-icon-in-
          // input pattern elsewhere in the app already uses (see
          // Properties.tsx), mirrored on the right side.
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
