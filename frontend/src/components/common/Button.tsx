import { Button as CButton } from '@chakra-ui/react';
import type { ButtonProps as ChakraButtonProps } from '@chakra-ui/react';
import React from 'react';
import { theme } from '../../theme';
interface ButtonProps extends Omit<ChakraButtonProps, 'type'> {
  type?: ChakraButtonProps['variant'];
  props?: any;
  label?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
  htmlType?: any;
  children?: React.ReactNode;
  disabled?: boolean;
  styles?: React.CSSProperties;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  danger?: boolean;
}

export const ButtonConfig: React.FC<ButtonProps> = ({
  props,
  type = 'solid',
  label,
  loading,
  styles,
  size = 'md',
  className,
  onClick,
  htmlType = 'button',
  danger,
  children,
  icon,
  iconPosition = 'start',
  disabled,
}) => {
  const backgroundColor = danger ? theme.colors.error : theme.colors.primary;

  const hoverColor = danger ? theme.colors.error + 'cc' : theme.colors.primary + 'cc';

  const baseStyle: React.CSSProperties = {
    backgroundColor,
    color: 'white',
    borderRadius: '7px',
    padding: '8px 16px',
    ...styles,
  };

  return (
    <CButton
      isDisabled={disabled}
      isLoading={loading}
      onClick={onClick}
      type={htmlType}
      className={className}
      size={size}
      variant={type}
      leftIcon={iconPosition === 'start' ? icon : undefined}
      rightIcon={iconPosition === 'end' ? icon : undefined}
      style={baseStyle}
      _hover={{ backgroundColor: hoverColor }}
      {...props}
    >
      {label}
      {children}
    </CButton>
  );
};
