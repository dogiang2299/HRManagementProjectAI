import { VStack, Flex, Text, Box, Grid, Badge, Image } from "@chakra-ui/react";
import React, { useState } from "react";
import { useParams } from "react-router-dom";

import { formatDate, INFOR_COMPANY_DETAIL_SECTIONS } from "../utils";
import { useGetCompanyByID } from "../api/get_company";
import InformModal from "../components/InformModal";
import  { ButtonConfig } from "../../../../components/common/Button";

export default function InformationCompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const [modalOpen, setModalOpen] = useState(false);

  const {
    data: company,
    isLoading,
    isError,
    refetch, // ✅ lấy refetch để cập nhật UI sau update
  } = useGetCompanyByID(id ?? "", {
    enabled: !!id,
  });

  if (!id) return <Text>Missing company id</Text>;
  if (isLoading) return <Text>Loading...</Text>;
  if (isError || !company) return <Text>Company not found.</Text>;

  return (
    <>
      <VStack align="stretch" spacing={6}>
        <Flex align="center" justify="space-between" w="full">
          <Text flex="1" textAlign="left" pr={6}>
            Configure and update company information so the system can automatically generate reports,
            documents, and related materials
          </Text>

          <ButtonConfig
            background="#334371"
            color="white"
            onClick={() => setModalOpen(true)}
          >
            UPDATE
          </ButtonConfig>
        </Flex>

        <VStack align="stretch" spacing={4}>
          {Object.values(INFOR_COMPANY_DETAIL_SECTIONS).map((section) => (
            <Box key={section.title} bg="white" p={{ base: 4, md: 4 }} rounded="xl">
              <Text fontSize="md" fontWeight="700" mb={4}>
                {section.title}
              </Text>

              <Grid
                templateColumns={{ base: "1fr", md: "220px 1fr" }}
                columnGap={{ base: 4, md: 8 }}
                rowGap={3}
              >
                {section.fields.map((field) => {
                  const value = (company as any)[field.key];
                  const empty = value === null || value === undefined || value === "";

                  const renderValue = () => {
                    if (field.key === "status") {
                      const rawStatus = String(value ?? "").trim();
                      const status = rawStatus || (company.is_active ? "Active" : "Inactive");
                      const isActive = status.toLowerCase() === "active";

                      return (
                        <Badge
                          w="fit-content"
                          px={3}
                          py={1}
                          fontSize="xs"
                          fontWeight="700"
                          textTransform="uppercase"
                          bg={isActive ? "green.50" : "gray.50"}
                          color={isActive ? "green.700" : "gray.600"}
                        >
                          {status}
                        </Badge>
                      );
                    }

                    if (empty) return <Text color="gray.400">--</Text>;

                    if (field.type === "image") {
                      return (
                        <Image
                          src={String(value)}
                          boxSize="72px"
                          objectFit="cover"
                          rounded="md"
                        />
                      );
                    }

                    if(field.key === 'date_of_issue'){
                        return formatDate(value);
                    }
                    if (field.type === "boolean") {
                      const active = Boolean(value);
                      return (
                        <Badge
                          w="fit-content"
                          px={3}
                          py={1}
                          fontSize="xs"
                          fontWeight="700"
                          textTransform="uppercase"
                          bg={active ? "green.50" : "gray.50"}
                          color={active ? "green.700" : "gray.600"}
                        >
                          {active ? "ACTIVE" : "INACTIVE"}
                        </Badge>
                      );
                    }

                    return <Text fontWeight="600">{String(value)}</Text>;
                  };

                  return (
                    <React.Fragment key={field.key}>
                      <Text fontSize="sm" color="gray.600">
                        {field.label}
                      </Text>
                      {renderValue()}
                    </React.Fragment>
                  );
                })}
              </Grid>
            </Box>
          ))}
        </VStack>

        {/* ✅ Modal update */}
        <InformModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          mode="edit"
          data={company} // ✅ quan trọng: truyền data vào để reset form
          onSuccess={() => {
            setModalOpen(false);
            refetch?.(); // ✅ cập nhật lại trang detail
          }}
        />
      </VStack>
    </>
  );
}