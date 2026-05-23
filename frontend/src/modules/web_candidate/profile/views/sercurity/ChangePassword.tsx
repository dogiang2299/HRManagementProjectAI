import { useState } from "react";
import {
	Badge,
	Box,
	Button,
	Container,
	FormControl,
	FormLabel,
	Heading,
	HStack,
	Icon,
	Image,
	Input,
	SimpleGrid,
	Switch,
	Text,
	VStack,
} from "@chakra-ui/react";
import { FiCheck } from "react-icons/fi";
import { authApi } from "../../../../auth/api/auth.api";
import { useAuthStore } from "../../../../auth/store/auth.store";
import { useNotify } from "../../../../../components/notification/NotifyProvider";
import { useGetMyCandidateProfile } from "../../api/myCv";

export default function ChangePassword() {
	const notify = useNotify();
	const authUser = useAuthStore((state) => state.user);
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { data } = useGetMyCandidateProfile();

	const fullName = data?.candidate_name || authUser?.employee_name || "Not updated yet";
	const email = data?.email || authUser?.email_account || "";

	const handleSubmit = async () => {
		if (!email || !authUser?.id) {
			notify({
				message: "Missing account information",
				description: "Please log in again to change your password",
				type: "warning",
			});
			return;
		}

		if (!currentPassword || !newPassword || !confirmPassword) {
			notify({
				message: "Please enter complete information",
				type: "warning",
			});
			return;
		}

		if (newPassword.length < 6) {
			notify({
				message: "New password must be at least 6 characters long",
				type: "warning",
			});
			return;
		}

		if (newPassword !== confirmPassword) {
			notify({
				message: "Re-entered password does not match",
				type: "error",
			});
			return;
		}

		try {
			setIsSubmitting(true);
			await authApi.changePassword(String(authUser.id), newPassword);

			notify({
				message: "Password changed successfully",
				description: "You can use the new password the next time you log in",
				type: "success",
			});

			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} catch (error: any) {
			const msg = error?.response?.data?.message || error?.message || "Cannot change password";
			notify({
				message: "An error occurred",
				description: Array.isArray(msg) ? msg.join(", ") : msg,
				type: "error",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Box bg="#F6F8FB" minH="100vh" py={{ base: 5, md: 7 }}>
			<Container maxW="1200px" px={{ base: 4, md: 6, xl: 8 }}>
				<SimpleGrid columns={{ base: 1, xl: 12 }} spacing={{ base: 5, xl: 8 }}>
					<Box gridColumn={{ base: "span 1", xl: "span 8" }}>
						<VStack align="start" spacing={1} mb={5}>
							<Heading fontSize={{ base: "md", md: "lg" }} color="#1F2937" lineHeight="1.15" fontWeight="700">
								Change login password
							</Heading>
							<Text color="#6B7280" fontSize="sm">
								Update your password to increase your account security.
							</Text>
						</VStack>

						<Box bg="white" borderRadius="18px" border="1px solid" borderColor="#E5E7EB" p={{ base: 4, md: 6 }}>
							<VStack spacing={4} align="stretch">
								<FormControl>
									<FormLabel fontSize="sm" color="#4B5563" fontWeight="600">
										Login email
									</FormLabel>
									<Input value={email} isReadOnly bg="#F3F4F6" borderColor="#E5E7EB" />
								</FormControl>

								<FormControl>
									<FormLabel fontSize="sm" color="#4B5563" fontWeight="600">
										Current password
									</FormLabel>
									<Input
										type="password"
										value={currentPassword}
										onChange={(e) => setCurrentPassword(e.target.value)}
										borderColor="#E5E7EB"
									/>
								</FormControl>

								<FormControl>
									<FormLabel fontSize="sm" color="#4B5563" fontWeight="600">
										New password
									</FormLabel>
									<Input
										type="password"
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										borderColor="#E5E7EB"
									/>
								</FormControl>

								<FormControl>
									<FormLabel fontSize="sm" color="#4B5563" fontWeight="600">
										Re-enter the new password
									</FormLabel>
									<Input
										type="password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										borderColor="#E5E7EB"
									/>
								</FormControl>

								<Button
									alignSelf="start"
									bg="#334371"
									color="white"
									_hover={{ bg: "#334371" }}
									onClick={handleSubmit}
									isLoading={isSubmitting}
								>
									Save
								</Button>
							</VStack>
						</Box>
					</Box>

					<Box gridColumn={{ base: "span 1", xl: "span 4" }}>
						<VStack spacing={4} align="stretch" position={{ base: "static", xl: "sticky" }} top="88px">
							<Box bg="#F3F4F6" borderRadius="20px" border="1px solid" borderColor="#E5E7EB" p={5}>
								<HStack align="start" spacing={3}>
									<Image src={authUser?.avatar || ""} alt="Avatar" w="56px" h="56px" borderRadius="full" bg="#D1D5DB" />
									<VStack align="start" spacing={1} flex={1}>
										<Text fontSize="sm" color="#4B5563">Hello again,</Text>
										<Text fontSize="2xl" lineHeight="1.1" color="#1F2937" fontWeight="800">
											{fullName}
										</Text>
										<Badge bg="#E5E7EB" color="#4B5563" borderRadius="6px" px={2} py={0.5}>
											Verified account
										</Badge>
									</VStack>
								</HStack>

								<Box h="1px" bg="#E5E7EB" my={4} />

								<HStack justify="space-between">
									<Text fontSize="sm" fontWeight="700" color="#4B5563">Looking for a job</Text>
									<Switch isChecked colorScheme="green" size="md" />
								</HStack>

								<Text mt={3} fontSize="sm" color="#6B7280" lineHeight="1.6">
									Allowing recruiters to search your resume increases your chances of being contacted as a better match.
								</Text>

								<HStack mt={4} align="start" spacing={2.5}>
									<Box mt={0.5} w="20px" h="20px" borderRadius="full" bg="#334371" display="flex" alignItems="center" justifyContent="center">
										<Icon as={FiCheck} color="#334371" boxSize={3.2} />
									</Box>
									<Text fontSize="sm" color="#374151" lineHeight="1.6">
										NTD only views your profile when you agree to connect.
									</Text>
								</HStack>
							</Box>

							<Box bg="#F3F4F6" borderRadius="20px" border="1px solid" borderColor="#E5E7EB" p={5}>
								<Text fontSize="3xl" fontWeight="800" color="#334371" lineHeight="1">2</Text>
								<Text fontSize="sm" color="#6B7280" mt={1}>CV views during the week</Text>
								<Text fontSize="sm" color="#6B7280" mt={3} lineHeight="1.6">
									Each profile view gets you closer to the right job.
								</Text>
								<Button
									mt={4}
									w="100%"
									borderColor="#334371"
									color="#334371"
									variant="outline"
									_hover={{ bg: "#334371" }}
								>
									Explore now
								</Button>
							</Box>
						</VStack>
					</Box>
				</SimpleGrid>
			</Container>
		</Box>
	);
}
