import { Button, Container, Icon, Text } from '@chakra-ui/react';
import { IoIosArrowRoundBack } from 'react-icons/io';
import { Link } from 'react-router-dom';
import theme from '../../theme';

const NotFound = () => (
    <>
        <Container
            h="100vh"
            alignItems="stretch"
            justifyContent="center"
            textAlign="center"
            maxW="sm"
            centerContent
        >
            <Text fontSize="8xl" color="ui.main" fontWeight="bold" lineHeight="1" mb={4}>
                404
            </Text>
            <Text fontSize="md">Oops!</Text>
            <Text fontSize="md">Page not found.</Text>
            <Link to="/">
                <Button bg={theme.colors.primary} color={theme.colors.white} variant="subtle" mt={4}>
                    <Icon as={IoIosArrowRoundBack} mr={1} />
                    Go back
                </Button>
            </Link>
        </Container>
    </>
);

export default NotFound;
