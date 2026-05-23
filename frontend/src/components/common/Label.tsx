import { Text } from '@chakra-ui/react';
import React from 'react';
import theme from '../../theme';
interface LabelItemProps {
  label: string;
  required?: boolean;
  fontSize?: number | string;
  fontWeight?: number | string;
  color?: string;
  mb?: number;
  mt?: number;
}
const LabelItem = React.memo(({ label, required = false, fontSize = 14.5, fontWeight = 500, color = theme.colors.primaryText, mb = 1, mt }: LabelItemProps) => {
  return (
    <Text fontWeight={fontWeight} color={color} fontSize={fontSize} mb={mb} mt={mt}>
      {label}{' '}
      {required && (
        <Text as="span" color="red.500">
          *
        </Text>
      )}
    </Text>
  );
});
export default LabelItem;
