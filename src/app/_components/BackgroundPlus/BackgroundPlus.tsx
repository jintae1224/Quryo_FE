import classNames from 'classnames/bind';
import React from 'react';

import styles from './BackgroundPlus.module.css';

const cx = classNames.bind(styles);

interface BackgroundGradientProps {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  className?: string;
  style?: React.CSSProperties;
  direction?: 'to-br' | 'to-tr' | 'to-bl' | 'to-tl' | 'to-b' | 'to-t';
  opacity?: number;
  [key: string]: unknown;
}

export default function BackgroundPlus({
  primaryColor: _primaryColor = '#10b981',
  secondaryColor: _secondaryColor = '#059669',
  backgroundColor = 'hsl(var(--background))',
  className,
  direction = 'to-br',
  opacity = 0.05,
  style,
  ...props
}: BackgroundGradientProps) {
  const gradientDirectionMap = {
    'to-br': 'to bottom right',
    'to-tr': 'to top right',
    'to-bl': 'to bottom left',
    'to-tl': 'to top left',
    'to-b': 'to bottom',
    'to-t': 'to top',
  };

  const backgroundStyle: React.CSSProperties = {
    backgroundColor,
    backgroundImage: `
      radial-gradient(circle at 20% 30%, rgba(16, 185, 129, ${opacity * 0.6}) 0%, transparent 50%), 
      radial-gradient(circle at 80% 70%, rgba(5, 150, 105, ${opacity * 0.8}) 0%, transparent 50%),
      linear-gradient(${gradientDirectionMap[direction]}, 
        rgba(16, 185, 129, ${opacity * 0.3}), 
        transparent 40%, 
        transparent 60%,
        rgba(5, 150, 105, ${opacity * 0.3}))`,
    ...style,
  };

  return (
    <div
      className={cx('backgroundPlus', className)}
      style={backgroundStyle}
      {...props}
    />
  );
}