import { useMemo, useState, type MouseEvent } from "react";
import {
	Badge,
	Box,
	Button,
	Divider,
	Flex,
	HStack,
	Icon,
	IconButton,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	Spinner,
	Text,
	Textarea,
	VStack,
} from "@chakra-ui/react";
import { FaRegStar, FaStar, FaStarHalfAlt } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import {
	useCandidateReviews,
	useCreateCandidateReview,
	useDeleteCandidateReview,
	useUpdateCandidateReview,
} from "../api/review";
import type { ICandidateReview } from "../types";
import theme from "../../../../theme";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import { ModalConfirm } from "../../../../components/common/ModalConfirm";

type ReviewCandidateProps = {
	candidateId: string;
	applicationId?: string;
	canCreateReview?: boolean;
	canEditReview?: boolean;
	canDeleteReview?: boolean;
};

const clampHalfStep = (value: number) => {
	if (!Number.isFinite(value)) return 0;
	return Math.max(0, Math.min(5, Math.round(value * 2) / 2));
};

const parseRating = (value: number | string | undefined | null) => {
	const numeric = Number(value ?? 0);
	return Number.isFinite(numeric) ? numeric : 0;
};

const toRatingText = (value: number) => {
	return Number.isInteger(value) ? `${value}.0` : `${value}`;
};

const getAvgLabel = (avg: number) => {
	if (avg < 2.5) return "Not Suitable";
	if (avg < 3.5) return "Average";
	return "Good";
};

const ratingBadgeColor = (avg: number) => {
	if (avg < 2.5) return "red";
	if (avg < 3.5) return "yellow";
	return "green";
};

const RatingStars = ({
	value,
	onChange,
	interactive,
	size = "18px",
}: {
	value: number;
	onChange?: (next: number) => void;
	interactive?: boolean;
	size?: string;
}) => {
	return (
		<HStack spacing={1}>
			{Array.from({ length: 5 }, (_, idx) => {
				const starIndex = idx + 1;
				const full = value >= starIndex;
				const half = value >= starIndex - 0.5 && value < starIndex;
				const icon = full ? FaStar : half ? FaStarHalfAlt : FaRegStar;

				const clickStar = (e: MouseEvent<HTMLButtonElement>) => {
					if (!interactive || !onChange) return;
					const rect = e.currentTarget.getBoundingClientRect();
					const clickX = e.clientX - rect.left;
					const next = clickX <= rect.width / 2 ? starIndex - 0.5 : starIndex;
					onChange(clampHalfStep(next));
				};

				return (
					<Button
						key={starIndex}
						minW="unset"
						h="28px"
						px={0}
						variant="ghost"
						onClick={clickStar}
						cursor={interactive ? "pointer" : "default"}
						_hover={interactive ? { bg: "transparent" } : {}}
						_active={interactive ? { bg: "transparent" } : {}}
					>
						<Icon as={icon} boxSize={size} color="yellow.400" />
					</Button>
				);
			})}
		</HStack>
	);
};

export default function ReviewCandidate({
	candidateId,
	applicationId,
	canCreateReview = true,
	canEditReview = true,
	canDeleteReview = true,
}: ReviewCandidateProps) {
	const notify = useNotify();
	const [rating, setRating] = useState<number>(0);
	const [comment, setComment] = useState<string>("");
	const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [reviewToDelete, setReviewToDelete] = useState<ICandidateReview | null>(null);

	const {
		data: reviewData,
		isLoading,
		isError,
		refetch,
	} = useCandidateReviews(candidateId, { applicationId }, {
		enabled: !!candidateId,
	});

	const createReviewMutation = useCreateCandidateReview({
		candidateId,
		config: {
			onSuccess: () => {
				setEditingReviewId(null);
				setRating(0);
				setComment("");
				notify({
					type: "success",
					message: "Review submitted",
					description: "Candidate review has been added successfully.",
				});
			},
			onError: () => {
				notify({
					type: "error",
					message: "Submit failed",
					description: "Could not submit candidate review.",
				});
			},
		},
	});

	const updateReviewMutation = useUpdateCandidateReview({
		candidateId,
		config: {
			onSuccess: () => {
				refetch();
				setEditingReviewId(null);
				setRating(0);
				setComment("");
				notify({
					type: "success",
					message: "Review updated",
					description: "Candidate review has been updated successfully.",
				});
			},
			onError: () => {
				notify({
					type: "error",
					message: "Update failed",
					description: "Could not update this review.",
				});
			},
		},
	});

	const deleteReviewMutation = useDeleteCandidateReview({
		candidateId,
		config: {
			onSuccess: () => {
				notify({
					type: "success",
					message: "Review deleted",
					description: "Candidate review has been deleted successfully.",
				});

				if (editingReviewId) {
					setEditingReviewId(null);
					setRating(0);
					setComment("");
				}
			},
			onError: () => {
				notify({
					type: "error",
					message: "Delete failed",
					description: "Could not delete this review.",
				});
			},
		},
	});

	const reviews = useMemo(() => reviewData?.items ?? [], [reviewData]);

	// Calculate average from DB ratings for immediate suitability evaluation on UI.
	const averageScore = useMemo(() => {
		if (!reviews.length) return 0;
		const total = reviews.reduce((acc, item) => acc + parseRating(item.rating), 0);
		return Math.round((total / reviews.length) * 10) / 10;
	}, [reviews]);

	const avgLabel = getAvgLabel(averageScore);

	const submitReview = () => {
		if (!canCreateReview && !editingReviewId) {
			notify({
				type: "warning",
				message: "No permission",
				description: "You do not have permission to add candidate reviews.",
			});
			return;
		}

		if (!canEditReview && editingReviewId) {
			notify({
				type: "warning",
				message: "No permission",
				description: "You do not have permission to update candidate reviews.",
			});
			return;
		}

		const normalizedRating = clampHalfStep(rating);
		if (normalizedRating <= 0) {
			notify({
				type: "warning",
				message: "Rating is required",
				description: "Please select a star rating before sending.",
			});
			return;
		}

		const payload = {
			rating: normalizedRating,
			comment: comment.trim() || undefined,
		};

		if (editingReviewId) {
			updateReviewMutation.mutate({ reviewId: editingReviewId, data: payload });
			return;
		}

		createReviewMutation.mutate(payload);
	};

	const startEditReview = (item: ICandidateReview) => {
		if (!canEditReview) return;
		setEditingReviewId(item.id);
		setRating(clampHalfStep(parseRating(item.rating)));
		setComment(item.comment || "");
	};

	const openDeleteModal = (item: ICandidateReview) => {
		if (!canDeleteReview) return;
		if (!item.id || deleteReviewMutation.isPending) return;
		setReviewToDelete(item);
		setIsDeleteModalOpen(true);
	};

	const handleDeleteModalOpen = (open: boolean) => {
		setIsDeleteModalOpen(open);
		if (!open) {
			setReviewToDelete(null);
		}
	};

	const confirmDeleteReview = () => {
		if (!reviewToDelete?.id || deleteReviewMutation.isPending) return;

		deleteReviewMutation.mutate(reviewToDelete.id, {
			onSettled: () => {
				handleDeleteModalOpen(false);
			},
		});
	};

	if (isLoading) {
		return (
			<Flex align="center" justify="center" minH="220px">
				<Spinner />
			</Flex>
		);
	}

	if (isError) {
		return (
			<VStack align="stretch" spacing={3}>
				<Text color="red.500" fontWeight="600">
					Failed to load reviews.
				</Text>
				<Button onClick={() => refetch()} w="fit-content" size="sm" variant="outline">
					Retry
				</Button>
			</VStack>
		);
	}

	return (
		<VStack align="stretch" spacing={4}>
			<Flex justify="space-between" align="center" p={3} borderRadius="md" bg="gray.50">
				<VStack align="flex-start" spacing={1}>
					<Text fontWeight="700" fontSize={'sm'}>Overall Review</Text>
					<HStack>
						<RatingStars value={averageScore} size="16px" />
						<Text fontWeight="700" fontSize={'sm'}>
							{toRatingText(averageScore)}/5
						</Text>
						<Text color="gray.500" fontSize={'sm'}>
							({reviews.length} reviews)
						</Text>
					</HStack>
				</VStack>

				<Badge fontSize={'sm'} colorScheme={ratingBadgeColor(averageScore)} px={3} py={1} borderRadius="full">
					{avgLabel}
				</Badge>
			</Flex>

			<Box border="1px solid" borderColor="gray.200" borderRadius="md" p={4}>
				<Text fontWeight="600" mb={2} fontSize={'sm'}>
					{editingReviewId ? "Update Review" : "Quick Review"}
				</Text>
				<HStack spacing={2} mb={3}>
					<RatingStars  value={rating} onChange={setRating} interactive />
					<Text color={theme.colors.primary} fontSize={'sm'} fontWeight="700" minW="40px">
						{toRatingText(rating)}
					</Text>
				</HStack>

				<Textarea
                    fontSize={'sm'}
					value={comment}
					onChange={(e) => setComment(e.target.value)}
					placeholder="Write your review for this candidate..."
					mb={3}
					resize="vertical"
				/>

				<Flex justify="flex-end" gap={2}>
					<Button
						variant="ghost"
						onClick={() => {
							setEditingReviewId(null);
							setRating(0);
							setComment("");
						}}
                        fontSize={'sm'}
						isDisabled={!canCreateReview && !editingReviewId}
					>
						CANCEL
					</Button>
					<Button
						background={theme.colors.primary}
						color="white"
						_hover={{ bg: theme.colors.primary }}
						onClick={submitReview}
                        p={3}
						isLoading={createReviewMutation.isPending || updateReviewMutation.isPending}
                        fontSize={'sm'}
						isDisabled={!canCreateReview && !editingReviewId}
					>
						{editingReviewId ? "UPDATE" : "ADD"}
					</Button>
				</Flex>
			</Box>

			<Box border="1px solid" borderColor="gray.200" borderRadius="md" p={4}>
				<Text fontWeight="600" mb={3} fontSize={'sm'}>
					Review History
				</Text>

				{reviews.length === 0 ? (
					<Text  color="gray.500" fontSize="sm">
						No reviews yet.
					</Text>
				) : (
					<VStack align="stretch" spacing={3}>
						{reviews.map((item: ICandidateReview, idx) => {
							const rowRating = clampHalfStep(parseRating(item.rating));
							const reviewerName = item.Reviewer?.employee_name || "Unknown reviewer";

							return (
								<Box key={item.id}>
									<Flex justify="space-between" align="center" mb={1}>
										<Text fontWeight="600" noOfLines={1} fontSize={'sm'} >
											{reviewerName}
										</Text>
										<HStack spacing={2}>
											<RatingStars value={rowRating} size="14px" />
											<Text color="gray.600" minW="36px" fontSize={'sm'}>
												{toRatingText(rowRating)}
											</Text>
											{(canEditReview || canDeleteReview) && (
												<Menu placement="bottom-end">
													<MenuButton
														as={IconButton}
														icon={<BsThreeDotsVertical />}
														variant="ghost"
														size="sm"
														aria-label="Review actions"
													/>
													<MenuList minW="120px">
														{canEditReview && (
															<MenuItem fontSize="sm" onClick={() => startEditReview(item)}>
																Update
															</MenuItem>
														)}
														{canDeleteReview && (
															<MenuItem
																fontSize="sm"
																color="red.500"
																onClick={() => openDeleteModal(item)}
															>
																Delete
															</MenuItem>
														)}
													</MenuList>
												</Menu>
											)}
										</HStack>
									</Flex>

									<Text fontSize="sm" color="gray.700">
										{item.comment || "(No comment)"}
									</Text>

									{idx < reviews.length - 1 && <Divider mt={3} />}
								</Box>
							);
						})}
					</VStack>
				)}
			</Box>

			<ModalConfirm
				open={isDeleteModalOpen}
				setOpen={handleDeleteModalOpen}
				title="Delete review"
				message="This review will be removed from candidate history."
				titleButton="DELETE"
				cancelButtonText="CANCEL"
				onClick={confirmDeleteReview}
				confirmButtonProps={{ isLoading: deleteReviewMutation.isPending }}
			/>
		</VStack>
	);
}

