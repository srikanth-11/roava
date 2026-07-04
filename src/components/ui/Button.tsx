import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { hapticLight } from '@/lib/haptics';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

const containerClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  outline: 'bg-transparent border border-border',
  ghost: 'bg-transparent',
  destructive: 'bg-destructive',
};

const textColor: Record<ButtonVariant, 'on-primary' | 'default' | 'destructive'> = {
  primary: 'on-primary',
  secondary: 'on-primary',
  outline: 'default',
  ghost: 'default',
  destructive: 'on-primary',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-10 px-4',
  md: 'h-12 px-6',
  lg: 'h-14 px-8',
};

// sm buttons are 40dp tall — hitSlop extends the touch target to 48dp.
const sizeHitSlop: Record<ButtonSize, number> = { sm: 4, md: 0, lg: 0 };

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  haptic?: boolean;
  className?: string;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  haptic = true,
  disabled,
  onPress,
  className = '',
  ...props
}: ButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  const isDisabled = disabled || loading;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!isDisabled, busy: loading }}
        disabled={isDisabled}
        hitSlop={sizeHitSlop[size]}
        onPressIn={() => {
          scale.set(withSpring(0.97, { damping: 20, stiffness: 300 }));
        }}
        onPressOut={() => {
          scale.set(withSpring(1, { damping: 20, stiffness: 300 }));
        }}
        onPress={(e) => {
          if (haptic) hapticLight();
          onPress?.(e);
        }}
        className={`flex-row items-center justify-center gap-2 rounded-full ${containerClasses[variant]} ${sizeClasses[size]} ${isDisabled ? 'opacity-45' : ''} ${className}`}
        {...props}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'outline' || variant === 'ghost' ? undefined : 'white'}
          />
        ) : null}
        <Text variant="label" color={textColor[variant]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
