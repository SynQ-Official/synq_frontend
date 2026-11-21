import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex min-h-10 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-full border border-transparent px-4 text-sm  leading-none transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:pointer-events-none aria-disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-white shadow-brand hover:bg-primary-hover hover:shadow-[0_14px_28px_-12px_rgb(17_76_97/0.6)]",
        secondary: "btn-glass border-line bg-surface-muted text-ink hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700",
        outline: "btn-glass border-line-strong bg-white text-ink hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700",
        ghost: "text-teal-700 hover:bg-teal-50 hover:text-teal-800",
        link: "min-h-0 rounded-none p-0 text-teal-700 underline-offset-4 hover:underline",
        destructive: "bg-destructive text-white shadow-xs hover:bg-rose-700/90",
        nav: "bg-primary text-white shadow-brand hover:bg-primary-hover",
        hero: "bg-primary text-base text-white shadow-brand hover:bg-primary-hover hover:shadow-[0_18px_36px_-14px_rgb(17_76_97/0.65)]",
        auth: "w-full bg-primary text-[0.9375rem] text-white shadow-brand hover:bg-primary-hover",
      },
      size: {
        default: "min-h-11 px-5 py-2.5",
        sm: "min-h-9 px-3.5 py-2 text-[0.8125rem]",
        lg: "min-h-12 px-6 py-3 text-[0.9375rem]",
        icon: "h-10 w-10 min-h-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        type={asChild ? undefined : type}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
