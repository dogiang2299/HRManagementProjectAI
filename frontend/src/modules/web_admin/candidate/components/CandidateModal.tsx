import React, { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  Avatar,
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  Text,
  Textarea,
  VStack,
  Divider,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon } from "@chakra-ui/icons";
import { useUploadCandidateAvatar } from "../api/upload_avatar";
import type {
  CandidateCreateForm,
  CandidateCreateModalProps,
  CandidateCreatePayload,
  CandidateExperienceForm,
} from "../types";
import SearchCombobox from "../../../../components/common/SearchCombobox";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import { CandidateStatus, type CandidateStatusType } from "../../../../constant";
import { BASE_URL } from "../../../../constant/config";
import theme from "../../../../theme";

const defaultExperience = (): CandidateExperienceForm => ({
  company_name: "",
  position: "",
  from_month: "",
  to_month: "",
  job_description: "",
  is_active: true,
});

const initialForm: CandidateCreateForm = {
  candidate_name: "",
  date_of_birth: "",
  gender: "",
  phone_number: "",
  email: "",
  address: "",
  country: "",
  provice: "",
  district: "",
  date_applied: "",
  referrer_id: "",
  is_active: true,
  is_potential: false,
  potential_type_id: "",
  status: CandidateStatus.Active,
  cv_file: null,
  avatar_file: null,
  avatar_preview: "",
  current_avatar_file: "",
  current_cv_file: "",
  experiences: [],
};

const inputSx = {
  h: "46px",
  borderRadius: "10px",
  fontSize: "md",
  bg: "white",
};

const getCurrentMonthValue = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
};

const CandidateCreateModal: React.FC<CandidateCreateModalProps> = ({
  isOpen,
  onClose,
  mode = "add",
  data,
  onSubmit,
  referrerOptions = [],
  potentialTypeOptions = [],
  forcePotential = false,
  isSubmitting = false,
}) => {
  const notify = useNotify();
  const [form, setForm] = useState<CandidateCreateForm>(initialForm);
  const uploadAvatarMutation = useUploadCandidateAvatar();
  const maxMonthValue = useMemo(() => getCurrentMonthValue(), []);

  const cvFileName = useMemo(() => form.cv_file?.name || "", [form.cv_file]);
  const avatarFileName = useMemo(() => form.avatar_file?.name || form.current_avatar_file || "", [form.avatar_file, form.current_avatar_file]);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && data) {
      setForm({
        candidate_name: data.candidate_name || "",
        date_of_birth: data.date_of_birth ? new Date(data.date_of_birth).toISOString().slice(0, 10) : "",
        gender: data.gender || "",
        phone_number: data.phone_number || "",
        email: data.email || "",
        address: data.address || "",
        country: data.country || "",
        provice: data.provice || "",
        district: data.district || "",
        date_applied: data.date_applied ? new Date(data.date_applied).toISOString().slice(0, 10) : "",
        referrer_id: data.referrer_id || "",
        is_active: data.is_active,
        is_potential: forcePotential ? true : data.is_potential,
        potential_type_id: data.potential_type_id || "",
        status: (data.status as CandidateStatusType) || CandidateStatus.Active,
        cv_file: null,
        avatar_file: null,
        avatar_preview: data.avatar_file ? `${BASE_URL}/uploads/avatar/${data.avatar_file}` : "",
        current_avatar_file: data.avatar_file || "",
        current_cv_file: data.cv_file || "",
        experiences: (data.candidateExperiences || []).map((exp) => ({
          id: exp.id,
          company_name: exp.company_name || "",
          position: exp.position || "",
          from_month: exp.from_month ? new Date(exp.from_month).toISOString().slice(0, 7) : "",
          to_month: exp.to_month ? new Date(exp.to_month).toISOString().slice(0, 7) : "",
          job_description: exp.job_description || "",
          is_active: exp.is_active !== false,
        })),
      });
      return;
    }

    setForm({
      ...initialForm,
      is_potential: forcePotential,
    });
  }, [isOpen, mode, data, forcePotential]);

  const handleChange = (
    field: keyof Omit<CandidateCreateForm, "experiences" | "cv_file" | "avatar_file" | "avatar_preview" | "current_avatar_file">,
    value: string | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCVChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const maxSize = 15 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      notify({
        type: "warning",
        message: "Invalid file",
        description: "Only .doc, .docx, .pdf files are allowed.",
      });
      return;
    }

    if (file.size > maxSize) {
      notify({
        type: "warning",
        message: "File is too large",
        description: "File size must be smaller than 15MB.",
      });
      return;
    }

    setForm((prev) => ({
      ...prev,
      cv_file: file,
    }));
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      notify({
        type: "warning",
        message: "Invalid file",
        description: "Only .jpg, .jpeg, .png, .webp files are allowed.",
      });
      return;
    }

    if (file.size > maxSize) {
      notify({
        type: "warning",
        message: "File is too large",
        description: "Image size must be smaller than 5MB.",
      });
      return;
    }

    const preview = URL.createObjectURL(file);

    setForm((prev) => ({
      ...prev,
      avatar_file: file,
      avatar_preview: preview,
    }));

    if (mode === "edit" && data?.id) {
      uploadAvatarMutation.mutate(
        {
          candidateId: data.id,
          file,
          currentAvatarFile: form.current_avatar_file || null,
        },
        {
          onSuccess: (result) => {
            setForm((prev) => ({
              ...prev,
              avatar_file: null,
              avatar_preview: result.avatar_file ? `${BASE_URL}/uploads/avatar/${result.avatar_file}` : prev.avatar_preview,
              current_avatar_file: result.avatar_file || "",
            }));
            notify({
              type: "success",
              message: "Avatar updated",
              description: "Candidate avatar has been updated successfully.",
            });
          },
          onError: (error) => {
            notify({
              type: "error",
              message: "Unable to update avatar",
              description: error.message || "An unexpected error occurred while updating avatar.",
            });
          },
        },
      );
    }
  };

  const handleExperienceChange = (
    index: number,
    field: keyof CandidateExperienceForm,
    value: string
  ) => {
    if ((field === "from_month" || field === "to_month") && value && value > maxMonthValue) {
      notify({
        type: "warning",
        message: "Invalid month",
        description: `Month cannot be later than ${maxMonthValue}.`,
      });
      return;
    }

    setForm((prev) => {
      const next = [...prev.experiences];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return {
        ...prev,
        experiences: next,
      };
    });
  };

  const addExperience = () => {
    setForm((prev) => ({
      ...prev,
      experiences: [...prev.experiences, defaultExperience()],
    }));
  };

  const removeExperience = (index: number) => {
    setForm((prev) => {
      const next = [...prev.experiences];
      const item = next[index];
      if (!item) return prev;

      if (item.id) {
        next[index] = { ...item, is_active: false };
      } else {
        next.splice(index, 1);
      }

      return {
        ...prev,
        experiences: next,
      };
    });
  };

  const resetForm = () => {
    setForm({
      ...initialForm,
      is_potential: forcePotential,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!form.candidate_name.trim()) {
      notify({
        type: "warning",
        message: "Missing required information",
        description: "Full name is required.",
      });
      return;
    }

    const hasFutureMonth = form.experiences.some(
      (item) =>
        item.is_active !== false &&
        ((item.from_month && item.from_month > maxMonthValue) ||
          (item.to_month && item.to_month > maxMonthValue))
    );

    if (hasFutureMonth) {
      notify({
        type: "warning",
        message: "Invalid month",
        description: `From Month and To Month cannot be later than ${maxMonthValue}.`,
      });
      return;
    }

    if ((forcePotential || form.is_potential) && !form.potential_type_id) {
      notify({
        type: "warning",
        message: "Missing potential type",
        description: "Please select a potential type.",
      });
      return;
    }

    const payload: CandidateCreatePayload = {
      candidate_name: form.candidate_name.trim(),
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || undefined,
      phone_number: form.phone_number.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      country: form.country.trim() || undefined,
      provice: form.provice.trim() || undefined,
      district: form.district.trim() || undefined,
      date_applied: form.date_applied || null,
      referrer_id: form.referrer_id || null,
      is_active: form.is_active,
      is_potential: forcePotential ? true : form.is_potential,
      potential_type_id: (forcePotential || form.is_potential) ? form.potential_type_id || null : null,
      status: form.status || CandidateStatus.Active,
      cv_file: form.cv_file,
      avatar_file: form.avatar_file,
      candidateExperiences: form.experiences
        .filter(
          (item) =>
            item.is_active === false ||
            item.company_name.trim() ||
            item.position.trim() ||
            item.from_month ||
            item.to_month ||
            item.job_description.trim()
        )
        .map((item) => ({
          id: item.id,
          company_name: item.company_name.trim() || undefined,
          position: item.position.trim() || undefined,
          from_month: item.from_month || null,
          to_month: item.to_month || null,
          job_description: item.job_description.trim() || undefined,
          is_active: item.is_active,
        })),
    };

    await onSubmit(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl" scrollBehavior="inside" isCentered>
      <ModalOverlay/>
      <ModalContent
        maxW="800px"
        borderRadius="18px"
        overflow="hidden"
        boxShadow="0 20px 60px rgba(0,0,0,0.18)"
      >
        <ModalHeader textAlign={'center'} pt={6} px={6} fontSize="23px" fontWeight="800">
          {mode === "edit" ? "UPDATE CANDIDATE" : "ADD CANDIDATE"}
        </ModalHeader>
        <ModalCloseButton top={5} right={5} fontSize="16px" />

        <ModalBody px={6} pb={5}>
          <Stack spacing={6}>
            <Box
              border="1px dashed"
              borderColor="gray.250"
              borderRadius="14px"
              px={6}
              py={8}
              textAlign="center"
              bg="gray.50"
            >
              <Input
                id="candidate-cv-upload"
                type="file"
                accept=".doc,.docx,.pdf"
                display="none"
                onChange={handleCVChange}
              />
              <Text
                as="label"
                htmlFor="candidate-cv-upload"
                cursor="pointer"
                color={theme.colors.primary}
                fontWeight="600"
                fontSize="17px"
              >
                Drag and drop or click here to upload CV
              </Text>

              <Text mt={2} color="gray.500" fontSize="md">
                Accepts .doc, .docx, .pdf files (Max size &lt; 15MB)
              </Text>

              {cvFileName && (
                <Text mt={3} fontSize="13px" color="green.600" fontWeight="600">
                  Selected: {cvFileName}
                </Text>
              )}
            </Box>

            <HStack align="start" spacing={6}>
              <Box w="92px" pt={2}>
                <Input
                  id="candidate-avatar-upload"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  display="none"
                  onChange={handleAvatarChange}
                />
                <Box as="label" htmlFor="candidate-avatar-upload" cursor="pointer" display="block" title="Click to upload/update avatar">
                  <Avatar
                    boxSize="90px"
                    name={form.candidate_name || "Avatar"}
                    src={form.avatar_preview || undefined}
                    bg="gray.100"
                    color="gray.400"
                  />
                </Box>
                <Text mt={2} fontSize="sm" color="gray.500" textAlign="center">
                  {avatarFileName ? "Avatar selected" : "Click avatar to upload"}
                </Text>
              </Box>

              <Box flex="1">
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem colSpan={2}>
                    <FormControl isRequired>
                      <FormLabel mb={2} fontWeight="700" fontSize="md">
                        Full Name
                      </FormLabel>
                      <Input
                        {...inputSx}
                        placeholder="Enter full name"
                        value={form.candidate_name}
                        onChange={(e) => handleChange("candidate_name", e.target.value)}
                      />
                    </FormControl>
                  </GridItem>

                  <FormControl>
                    <FormLabel mb={2} fontWeight="700" fontSize="md">
                      Date of Birth
                    </FormLabel>
                    <Input
                      {...inputSx}
                      type="date"
                      value={form.date_of_birth}
                      onChange={(e) => handleChange("date_of_birth", e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel mb={2} fontWeight="700" fontSize="md">
                      Gender
                    </FormLabel>
                    <Select
                      {...inputSx}
                      placeholder="Select gender"
                      value={form.gender}
                      onChange={(e) => handleChange("gender", e.target.value)}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </Select>
                  </FormControl>

                  <GridItem colSpan={2}>
                    <FormControl>
                      <FormLabel mb={2} fontWeight="700" fontSize="md">
                        Country
                      </FormLabel>
                      <Input
                        {...inputSx}
                        placeholder="Enter country"
                        value={form.country}
                        onChange={(e) => handleChange("country", e.target.value)}
                      />
                    </FormControl>
                  </GridItem>

                  <FormControl>
                    <FormLabel mb={2} fontWeight="700" fontSize="md">
                      Province/City
                    </FormLabel>
                    <Input
                      {...inputSx}
                      placeholder="Enter province/city"
                      value={form.provice}
                      onChange={(e) => handleChange("provice", e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel mb={2} fontWeight="700" fontSize="md">
                      District
                    </FormLabel>
                    <Input
                      {...inputSx}
                      placeholder="Enter district"
                      value={form.district}
                      onChange={(e) => handleChange("district", e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel mb={2} fontWeight="700" fontSize="md">
                      Phone Number
                    </FormLabel>
                    <Input
                      {...inputSx}
                      placeholder="Enter phone number"
                      value={form.phone_number}
                      onChange={(e) => handleChange("phone_number", e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel mb={2} fontWeight="700" fontSize="md">
                      Email
                    </FormLabel>
                    <Input
                      {...inputSx}
                      placeholder="Enter email"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                    />
                  </FormControl>

                  <GridItem colSpan={2}>
                    <FormControl>
                      <FormLabel mb={2} fontWeight="700" fontSize="md">
                        Address
                      </FormLabel>
                      <Input
                        {...inputSx}
                        placeholder="Enter address"
                        value={form.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                      />
                    </FormControl>
                  </GridItem>
                <FormControl>
                  <FormLabel mb={2} fontWeight="700" fontSize="md">
                    Applied Date
                  </FormLabel>
                  <Input
                    {...inputSx}
                    type="date"
                    value={form.date_applied}
                    onChange={(e) => handleChange("date_applied", e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel mb={2} fontWeight="700" fontSize="md">
                    Referrer
                  </FormLabel>
                  <Select
                    {...inputSx}
                    placeholder="Select referrer"
                    value={form.referrer_id}
                    onChange={(e) => handleChange("referrer_id", e.target.value)}
                  >
                    {referrerOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                {(forcePotential || form.is_potential) && (
                  <GridItem colSpan={2}>
                    <FormControl isRequired>
                      <FormLabel mb={2} fontWeight="700" fontSize="md">
                        Potential Type
                      </FormLabel>
                      <SearchCombobox
                        value={form.potential_type_id}
                        onChange={(v) => handleChange("potential_type_id", v)}
                        options={potentialTypeOptions.map((item) => ({
                          id: item.value,
                          name: item.label,
                        }))}
                        placeholder="Search and select potential type"
                        isClearable
                        size="md"
                        zIndex={4000}
                      />
                    </FormControl>
                  </GridItem>
                )}

                </Grid>
                <Divider mt={7}/>
              <HStack justify="space-between" mt={5} mb={3}>
                <Text fontWeight="800" fontSize="18px">
                  Work Experience
                </Text>

                <Button
                  size="sm"
                  leftIcon={<AddIcon />}
                  variant="ghost"
                  color={theme.colors.primary}
                  onClick={addExperience}
                >
                  Add Experience
                </Button>
              </HStack>

              <VStack spacing={4} align="stretch">
                {form.experiences.length === 0 ? (
                  <Text fontSize="md" color="gray.500" mt={3}>
                    No experience added yet.
                  </Text>
                ) : (
                  form.experiences.filter((exp) => exp.is_active !== false).map((exp, index) => (
                    <Box
                      key={index}
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="14px"
                      p={4}
                      bg="gray.50"
                    >
                      <HStack justify="space-between" mb={3}>
                        <Text fontWeight="700">Experience #{index + 1}</Text>
                        <IconButton
                          aria-label="Delete experience"
                          icon={<DeleteIcon />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => removeExperience(index)}
                        />
                      </HStack>

                      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                        <FormControl>
                          <FormLabel fontSize="14px" fontWeight="600">
                            Company
                          </FormLabel>
                          <Input
                         
                            {...inputSx}
                            placeholder="Enter company name"
                            value={exp.company_name}
                            onChange={(e) =>
                              handleExperienceChange(index, "company_name", e.target.value)
                            }
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="14px" fontWeight="600">
                            Position
                          </FormLabel>
                          <Input
                            {...inputSx}
                            placeholder="Enter position"
                            value={exp.position}
                            onChange={(e) =>
                              handleExperienceChange(index, "position", e.target.value)
                            }
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="14px" fontWeight="600">
                            From Month
                          </FormLabel>
                          <Input
                            {...inputSx}
                            type="month"
                            max={maxMonthValue}
                            value={exp.from_month}
                            onChange={(e) =>
                              handleExperienceChange(index, "from_month", e.target.value)
                            }
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="14px" fontWeight="600">
                            To Month
                          </FormLabel>
                          <Input
                            {...inputSx}
                            type="month"
                            max={maxMonthValue}
                            value={exp.to_month}
                            onChange={(e) =>
                              handleExperienceChange(index, "to_month", e.target.value)
                            }
                          />
                        </FormControl>

                        <GridItem colSpan={2}>
                          <FormControl>
                            <FormLabel fontSize="14px" fontWeight="600">
                              Job Description
                            </FormLabel>
                            <Textarea
                              borderRadius="10px"
                              placeholder="Enter job description"
                              value={exp.job_description}
                              onChange={(e) =>
                                handleExperienceChange(
                                  index,
                                  "job_description",
                                  e.target.value
                                )
                              }
                              resize="vertical"
                            />
                          </FormControl>
                        </GridItem>
                      </Grid>
                    </Box>
                  ))
                )}
              </VStack>

              </Box>
            </HStack>

            


            <Box>
            </Box>
          </Stack>
        </ModalBody>

        <ModalFooter bg="gray.50" borderTop="1px solid" borderColor="gray.200">
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleClose}>
              CANCEL
            </Button>
            <Button
              bg={theme.colors.primary}
              color={"white"}
              _hover={{ opacity: 0.9 }}
              borderRadius="10px"
              px={7}
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              {mode === "edit" ? "UPDATE" : "ADD"}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CandidateCreateModal;