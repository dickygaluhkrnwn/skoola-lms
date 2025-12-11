"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";

const sizes = {
  default: "h-11 px-6 py-2 text-sm md:text-base font-bold", // Sedikit lebih lebar untuk touch target
  sm: "h-9 rounded-lg px-3 text-xs",
  lg: "h-14 rounded-2xl px-8 text-lg",
  icon: "h-11 w-11 p-2 flex items-center justify-center",
};

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

    // Helper: Tentukan styles berdasarkan Tema
    const getVariantClasses = () => {
      // 1. KIDS THEME (SD) - Playful, Big Shadow, Bouncy
      if (theme === "sd") {
        return {
          primary: "bg-primary text-white border-b-4 border-red-700 active:border-b-0 active:translate-y-1 active:shadow-none shadow-lg shadow-red-200 hover:brightness-110",
          default: "bg-primary text-white border-b-4 border-red-700 active:border-b-0 active:translate-y-1 active:shadow-none shadow-lg shadow-red-200 hover:brightness-110",
          secondary: "bg-white text-orange-700 border-2 border-orange-200 border-b-4 active:border-b-2 active:translate-y-[2px] hover:bg-orange-50",
          outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary/10 border-dashed",
          ghost: "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-800 hover:scale-105",
          danger: "bg-red-500 text-white border-b-4 border-red-800 active:border-b-0 active:translate-y-1 hover:bg-red-400",
          success: "bg-green-500 text-white border-b-4 border-green-800 active:border-b-0 active:translate-y-1 hover:bg-green-400",
        }[variant || "primary"];
      }

      // 2. SMP THEME - Gradient, Glow, Modern
      if (theme === "smp") {
        return {
          primary: "bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 border-none",
          default: "bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 border-none",
          secondary: "bg-white text-primary border border-primary/20 hover:bg-primary/5 hover:border-primary/50 shadow-sm",
          outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary/10",
          ghost: "text-slate-600 hover:bg-slate-100 hover:text-primary",
          danger: "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-red-500/30 hover:shadow-red-500/50",
          success: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50",
        }[variant || "primary"];
      }

      // 3. SMA & UNI - Futuristic, Tech, Sleek
      if (theme === "sma" || theme === "uni") {
        return {
          primary: "bg-primary text-primary-foreground shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-[1px] transition-all border border-white/10 font-medium tracking-wide",
          default: "bg-primary text-primary-foreground shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-[1px] transition-all border border-white/10 font-medium tracking-wide",
          secondary: "bg-secondary/50 backdrop-blur-sm border border-slate-200/50 text-secondary-foreground hover:bg-secondary hover:border-slate-300 transition-all shadow-sm",
          outline: "bg-transparent border border-slate-300 text-slate-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all tracking-wider uppercase text-xs font-bold",
          ghost: "hover:bg-slate-100/50 hover:text-primary transition-all",
          danger: "bg-red-600 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/30 border border-red-500",
          success: "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 border border-emerald-500",
        }[variant || "primary"];
      }

      // 4. DEFAULT FALLBACK
      return {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-[0.98]",
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-[0.98]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm border border-slate-200/50",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
      }[variant || "primary"];
    };

    // Helper: Tentukan Animation Props
    const getAnimationProps = () => {
        if (theme === "sd") {
            return {
                whileHover: { 
                    scale: 1.05, 
                    rotate: disabled ? 0 : [-1, 1, -1, 0], // Wiggle effect
                },
                whileTap: { 
                    scale: 0.9, 
                    rotate: 0,
                },
                transition: { 
                    type: "spring" as const, 
                    stiffness: 400, 
                    damping: 10,
                    // FIX: Override animasi rotate agar menggunakan 'tween' (keyframes friendly)
                    // karena spring tidak support array keyframes > 2 nilai
                    rotate: { type: "tween", duration: 0.3 } 
                }
            };
        }
        return {
            whileTap: { scale: 0.98 }
        };
    };

    return (
      <motion.button
        ref={ref}
        {...(!disabled ? getAnimationProps() : {})}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:grayscale",
          // Radius dinamis dari globals.css (--radius) akan otomatis terapply via Tailwind theme config atau class utility
          theme === "sd" ? "rounded-3xl tracking-wide" : "rounded-xl", 
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