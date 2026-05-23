import { Box, Heading, Text } from "@chakra-ui/react";
import { useAuthStore } from "../../auth/store/auth.store";

export function Home(){
    const user = useAuthStore((state) => (state.user));
        return (
            <Box w={'100%'} display={'flex'} gap={2} flexDirection={'column'}>
                <Heading fontSize={'2xl'} fontWeight={'bold'} color={'ui.main'}>
                    Hi {user?.employee_name || 'Admin'}
                </Heading>
                <Text fontSize={'md'} color={'gray.600'}>
                    Welcome back, nice to see you again!
                </Text>
            </Box>
        
        )
    
}