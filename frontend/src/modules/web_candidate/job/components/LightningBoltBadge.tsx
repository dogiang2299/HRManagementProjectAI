import { Box, Icon, type BoxProps } from "@chakra-ui/react";
import { FiZap } from "react-icons/fi";

type LightningBoltBadgeProps = BoxProps & {
	iconSize?: number;
};

const LightningBoltBadge = ({ iconSize = 5, ...props }: LightningBoltBadgeProps) => {
	return (
		<Box
			w="28px"
			h="28px"
			minW="28px"
			borderRadius="10px"
			display="flex"
			alignItems="center"
			justifyContent="center"
			bg="linear-gradient(180deg, #6C9CF6 0%, #334371 100%)"
			color="white"
			boxShadow="0 10px 20px rgba(51, 67, 113, 0.24)"
			{...props}
		>
			<Icon as={FiZap} boxSize={iconSize} />
		</Box>
	);
};

export default LightningBoltBadge;
