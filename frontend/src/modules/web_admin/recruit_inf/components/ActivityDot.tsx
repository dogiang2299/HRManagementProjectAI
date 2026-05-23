import { useColorModeValue } from "@chakra-ui/react";
import { Box } from "@chakra-ui/react";

export function ActivityDot({muted}: {muted?: boolean}){
    const c = useColorModeValue(muted ? "gray.300": "gray.600", muted ? "gray.600" : "gray.300");
    return <Box w={'6px'} h={'6px'} borderRadius={'999px'} bg={c} mt={'6px'}></Box>
}