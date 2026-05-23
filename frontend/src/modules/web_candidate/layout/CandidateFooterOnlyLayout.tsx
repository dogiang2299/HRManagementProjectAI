import { Box, Flex } from "@chakra-ui/react";
import { useOutlet } from "react-router-dom";
import CandidateFooter from "./CandidateFooter";
import CandidateRouteMotion from "./CandidateRouteMotion";

const CandidateFooterOnlyLayout = () => {
  const outlet = useOutlet();

  return (
    <Flex direction="column" minH="100vh" bg="#ffffff">
      <Box as="main" flex="1">
        <CandidateRouteMotion>{outlet}</CandidateRouteMotion>
      </Box>
      <CandidateFooter />
    </Flex>
  );
};

export default CandidateFooterOnlyLayout;
