import React from "react";
import { Flex, Spinner, Text } from '@chakra-ui/react';

type LoadingPageProps = {
    loadChildren?: boolean;
}

const LoadingPage: React.FC<LoadingPageProps> = ({loadChildren}) => {
    return (
        <Flex align={'center'} justifyContent={'center'} direction={'column'} w={'100vw'} h={'100vh'} bg={loadChildren ? 'gray.50' : 'white'} position={'fixed'} top={0} left={0} zIndex={9999}>
            <Spinner size={'xl'} textDecorationThickness={'4px'} speed="0.65s" color="blue.500">
                <Text mt={4} fontSize={'lg'} fontWeight={'semibold'}>Loading ...</Text>
            </Spinner>
        </Flex>
    )
}
export default LoadingPage;