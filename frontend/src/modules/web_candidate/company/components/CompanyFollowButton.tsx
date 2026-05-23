import { useMemo } from "react";
import { Button, useDisclosure, type ButtonProps } from "@chakra-ui/react";
import { FiBookmark } from "react-icons/fi";
import { useAuthStore } from "../../../auth/store/auth.store";
import { RECRUIT_BASE_ROLE } from "../../../../constant/roles";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import {
  useCompanyFollowSummary,
  useFollowCompanyMutation,
  useUnfollowCompanyMutation,
} from "../api/companyFollow";
import CandidateLoginModal from "../../auth/components/CandidateLoginModal";

type CompanyFollowButtonProps = {
  companyId?: string;
  followLabel?: string;
  followingLabel?: string;
  variant?: "hero" | "card";
  buttonProps?: ButtonProps;
};

export default function CompanyFollowButton({
  companyId,
  followLabel,
  followingLabel,
  variant = "hero",
  buttonProps,
}: CompanyFollowButtonProps) {
  const notify = useNotify();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authUser = useAuthStore((state) => state.user);
  const {
    isOpen: isLoginOpen,
    onOpen: onLoginOpen,
    onClose: onLoginClose,
  } = useDisclosure();

  const roleNames = useMemo(
    () =>
      (authUser?.roles ?? [])
        .map((role: any) => role?.role?.name_role || role?.name_role || role?.name || "")
        .filter(Boolean),
    [authUser?.roles],
  );

  const candidateId = authUser?.id || "";
  const isCandidateLoggedIn = Boolean(
    isAuthenticated && roleNames.includes(RECRUIT_BASE_ROLE.Candidate) && candidateId,
  );

  const { data: followSummary } = useCompanyFollowSummary(companyId || "", {
    enabled: Boolean(companyId && isCandidateLoggedIn),
  });

  const followMutation = useFollowCompanyMutation();
  const unfollowMutation = useUnfollowCompanyMutation();

  const isFollowing = Boolean(followSummary?.is_following);
  const isBusy = followMutation.isPending || unfollowMutation.isPending;

  const toggleFollow = async () => {
    if (!companyId) return;

    try {
      const result = isFollowing
        ? await unfollowMutation.mutateAsync(companyId)
        : await followMutation.mutateAsync(companyId);

      notify({
        message: result.message,
        type: "success",
      });
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "The company cannot be tracked at this time";
      notify({
        message: "An error occurred",
        description: Array.isArray(msg) ? msg.join(", ") : msg,
        type: "error",
      });
    }
  };

  const handleFollowClick = async () => {
    if (!companyId) return;

    if (!isCandidateLoggedIn) {
      notify({
        message: "Please log in",
        description: "You need to log in to your candidate account to follow the company.",
        type: "warning",
      });
      onLoginOpen();
      return;
    }

    await toggleFollow();
  };

  const baseProps: ButtonProps =
    variant === "card"
      ? {
          h: { base: "34px", md: "36px" },
          minW: { base: "92px", md: "108px" },
          borderRadius: "full",
          bg: "linear-gradient(135deg, #2E3D68 0%, #334371 100%)",
          color: "white",
          fontWeight: "700",
          fontSize: { base: "xs", md: "sm" },
          boxShadow: "0 8px 18px rgba(46, 61, 104, 0.22)",
          _hover: {
            bg: "linear-gradient(135deg, #2B3962 0%, #31406D 100%)",
          },
        }
      : {
          bg: "rgba(255,255,255,0.96)",
          color: "#334155",
          border: "1px solid",
          borderColor: "rgba(255,255,255,0.45)",
          borderRadius: "12px",
          px: { base: 4, md: 5 },
          h: { base: "42px", md: "44px" },
          minW: "unset",
          fontSize: { base: "sm", md: "md" },
          fontWeight: "700",
          boxShadow: "0 8px 22px rgba(15,23,42,0.10)",
          _hover: { bg: "#F8FAFC" },
          _active: { bg: "#F1F5F9" },
        };

  const followText = followLabel ?? (variant === "card" ? "Follow" : "Follow the company");
  const followingText = followingLabel ?? (variant === "card" ? "Following" : "Following");

  return (
    <>
      <Button
        leftIcon={<FiBookmark />}
        onClick={handleFollowClick}
        isLoading={isBusy}
        aria-label={isFollowing ? followingText : followText}
        {...baseProps}
        {...buttonProps}
      >
        {isFollowing ? followingText : followText}
      </Button>
      <CandidateLoginModal
        isOpen={isLoginOpen}
        onClose={onLoginClose}
        onSuccess={toggleFollow}
      />
    </>
  );
}
