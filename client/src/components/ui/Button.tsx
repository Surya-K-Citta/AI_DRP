// @ts-nocheck
import React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'brand'
  | 'cta'
  | 'brandOutline'
  | 'tonal'
  | 'inverse'
  | 'inverseOutline';

type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

const baseStyles =
  'inline-flex items-center justify-center rounded-[10px] font-medium transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-200 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

const portalBase =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-center transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60 select-none';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm',
  outline: 'border border-input bg-background hover:bg-muted hover:text-foreground',
  ghost: 'hover:bg-muted hover:text-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
  brand:
    'bg-[#366e6b] text-white border border-[#366e6b] hover:bg-[#2a5956] hover:border-[#2a5956] active:bg-[#1e4341]',
  cta: 'bg-[#c14e0b] text-white border border-[#c14e0b] hover:bg-[#a8440b] hover:border-[#a8440b] active:bg-[#a8440b]',
  brandOutline:
    'bg-white text-[#2a5956] border-2 border-[#366e6b] hover:bg-[#eef5f4] active:bg-[#d4e6e4]',
  tonal:
    'bg-[#eef5f4] text-[#2a5956] border border-[#d4e6e4] hover:bg-[#d4e6e4] hover:border-[#366e6b] active:bg-[#d4e6e4]',
  inverse: 'bg-white text-[#1e4341] border border-white hover:bg-[#eef5f4] active:bg-[#d4e6e4]',
  inverseOutline:
    'bg-transparent text-white border-2 border-white/80 hover:bg-white/10 hover:border-white active:bg-white/15',
};

const PORTAL_VARIANTS: ButtonVariant[] = ['brand', 'cta', 'brandOutline', 'tonal', 'inverse', 'inverseOutline'];

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 py-2',
  lg: 'h-11 px-8',
  xl: 'min-h-12 px-6 text-base',
};

/** Class list for links that should look like buttons. */
export const buttonVariants = ({
  variant = 'primary',
  size = 'md',
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) =>
  cn(PORTAL_VARIANTS.includes(variant) ? portalBase : baseStyles, variants[variant], sizes[size], className);

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  return (
    <button
      className={buttonVariants({ variant, size, className })}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
