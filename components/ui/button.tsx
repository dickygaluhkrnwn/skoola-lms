"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";

const sizes = {
  default: "h-11 px-5 py-2 text-sm",
  sm: "h-9 rounded-md px-3 text-xs",
  lg: "h-14 rounded-lg px-8 text-base",
  icon: "h-10 w-10 p-2",
};

// Tambahkan "default" ke sini
interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "default";
  size?: keyof typeof sizes;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", children, disabled, ...props }, ref) => {
    const { theme } = useTheme();

    const getVariantClasses = () => {
      // PRO THEME STYLES (Default & SMP/SMA/UNI)
      const proStyles = {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm border border-transparent",
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm border border-transparent", // Alias for primary
        secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm",
        outline: "bg-transparent border border-slate-300 text-slate-700 hover:bg-slate-50",
        ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
      };

      // KIDS (SD) THEME STYLES (Override)
      const kidsStyles = {
        primary: "bg-primary text-white hover:brightness-110 shadow-[0_4px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[4px] border-none",
        default: "bg-primary text-white hover:brightness-110 shadow-[0_4px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[4px] border-none", // Alias
        secondary: "bg-white text-orange-800 border-2 border-orange-200 hover:border-orange-300 hover:bg-yellow-50 shadow-[0_2px_0_rgba(0,0,0,0.1)] active:translate-y-[2px]",
        outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary/5",
        ghost: "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700",
        danger: "bg-red-500 text-white hover:bg-red-400 shadow-[0_4px_0_#991b1b] active:shadow-none active:translate-y-[4px]",
        success: "bg-green-500 text-white hover:bg-green-400 shadow-[0_4px_0_#166534] active:shadow-none active:translate-y-[4px]",
      };

      // FIX: Cek 'sd' karena 'kids' tidak ada di tipe Theme baru
      const styles = theme === "sd" ? kidsStyles : proStyles;
      return styles[variant || "primary"];
    };

    return (
      <motion.button
        ref={ref}
        whileTap={!disabled ? { scale: theme === "sd" ? 0.95 : 0.98 } : {}}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:grayscale",
          "rounded-xl", 
          sizes[size],
          getVariantClasses(),
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