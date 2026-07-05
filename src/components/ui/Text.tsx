import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

export type TextVariant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'body-sm' | 'label' | 'caption';

export type TextColor =
  'default' | 'muted' | 'primary' | 'on-primary' | 'on-image' | 'destructive' | 'success';

const variantClasses: Record<TextVariant, string> = {
  display: 'font-heading text-4xl leading-tight',
  h1: 'font-heading text-3xl leading-tight',
  h2: 'font-heading text-2xl leading-tight',
  h3: 'font-heading-medium text-xl leading-snug',
  body: 'font-body text-base leading-relaxed',
  'body-sm': 'font-body text-sm leading-relaxed',
  label: 'font-body-medium text-sm leading-snug',
  caption: 'font-body text-xs leading-snug',
};

const colorClasses: Record<TextColor, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  'on-primary': 'text-on-primary',
  'on-image': 'text-on-image',
  destructive: 'text-destructive',
  success: 'text-success',
};

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  className?: string;
}

export function Text({ variant = 'body', color = 'default', className = '', ...props }: TextProps) {
  return (
    <RNText
      className={`${variantClasses[variant]} ${colorClasses[color]} ${className}`}
      {...props}
    />
  );
}
