"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

// Definisi varian style tombol
// Kita buat varian agar bisa ganti warna dengan mudah (primary, outline, ghost, danger)
const variants = {
  primary: "bg-sky-500 text-white hover:bg-sky-600 shadow-[0_4px_0_rgb(14,165,233)] active:shadow-none active:translate-y-[4px]",
  secondary: "bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm active:translate-y-[2px]",
  outline: "bg-transparent border-2 border-sky-500 text-sky-500 hover:bg-sky-50",
  ghost: "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700",
  danger: "bg-red-500 text-white hover:bg-red-600 shadow-[0_4px_0_rgb(220,38,38)] active:shadow-none active:translate-y-[4px]",
  success: "bg-green-500 text-white hover:bg-green-600 shadow-[0_4px_0_rgb(22,163,74)] active:shadow-none active:translate-y-[4px]",
};

const sizes = {
  default: "h-12 px-6 py-2 text-base",
  sm: "h-9 rounded-lg px-3 text-sm",
  lg: "h-14 rounded-xl px-8 text-lg",
  icon: "h-10 w-10 p-2",
};

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:grayscale",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export { Button };