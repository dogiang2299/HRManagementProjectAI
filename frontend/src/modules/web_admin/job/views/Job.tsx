import { Box, Spinner, Text, VStack } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import JobCandidate, {
    getJobCompanyName,
} from "../../candidate/components/JobCandidate";
import { useGetJob } from "../api/get";
import { useDeleteJob } from "../api/delete";
import type { IJob } from "../types";
import JobModal from "../components/JobModal";
import { ModalConfirm } from "../../../../components/common/ModalConfirm";
import { PaginationBar } from "../../../../components/common/PaginationBar";
import SearchCombobox from "../../../../components/common/SearchCombobox";
import { useNotify } from "../../../../components/notification/NotifyProvider";
import { RECRUIT_BASE_ROLE } from "../../../../constant/roles";
import { useAuthStore } from "../../../auth/store/auth.store";

export function Job() {
    const notify = useNotify();
    const navigate = useNavigate();
    const hasRole = useAuthStore((s) => s.hasRole);
    const isAdmin = hasRole(RECRUIT_BASE_ROLE.Admin);
    const isEmployer = useAuthStore((s) => s.hasAnyRole(["Employer"]));
    const companyId = useAuthStore((s) => (s.user as any)?.company_id as string | undefined);
    
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [selectedCompany, setSelectedCompany] = useState("all");
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [jobModalMode, setJobModalMode] = useState<"add" | "edit">("add");
    const [selectedJob, setSelectedJob] = useState<IJob | undefined>(undefined);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<IJob | undefined>(undefined);

    const { mutateAsync: deleteJob, isPending: isDeleting } = useDeleteJob();

    const { data, isLoading, isError } = useGetJob({
        pages: page,
        limit,
        sortBy: "deadline",
        sortOrder: "asc",
    });

    const jobs = data?.data ?? [];
    const pagination = data?.pagination ?? {
        totalItems: 0,
        totalPages: 1,
        currentPage: page,
        limit,
    };

    const companyOptions = useMemo(() => {
        if (!isAdmin) {
            return [];
        }

        return Array.from(
            new Set(
                jobs
                    .map(getJobCompanyName)
                    .filter((name) => !!name && name !== "Unknown company"),
            ),
        ).sort((a, b) => a.localeCompare(b));
    }, [isAdmin, jobs]);

    useEffect(() => {
        if (!isAdmin) return;
        if (selectedCompany === "all") return;
        if (companyOptions.includes(selectedCompany)) return;

        setSelectedCompany("all");
    }, [isAdmin, selectedCompany, companyOptions]);

    const filteredJobs = useMemo(() => {
        let filtered = jobs;

        // For employers, filter by their company_id
        if (isEmployer && companyId) {
            filtered = jobs.filter((job) => String(job.company_id) === String(companyId));
        }

        // For admins, apply the selected company filter
        if (isAdmin && selectedCompany !== "all") {
            filtered = filtered.filter((job) => getJobCompanyName(job) === selectedCompany);
        }

        return filtered;
    }, [isAdmin, isEmployer, companyId, jobs, selectedCompany]);

    const openAddModal = () => {
        setSelectedJob(undefined);
        setJobModalMode("add");
        setIsJobModalOpen(true);
    };

    const openEditModal = (job: IJob) => {
        setSelectedJob(job);
        setJobModalMode("edit");
        setIsJobModalOpen(true);
    };

    const openDeleteModal = (job: IJob) => {
        setDeleteTarget(job);
        setIsDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteTarget?.id) return;

        try {
            await deleteJob(deleteTarget.id);
            notify({
                type: "success",
                message: "Deleted successfully",
                description: `Job "${deleteTarget.name_job || "Untitled job"}" has been removed.`,
            });
            setIsDeleteOpen(false);
            setDeleteTarget(undefined);
        } catch (error: any) {
            const rawMessage = error?.response?.data?.message;
            const message = Array.isArray(rawMessage)
                ? rawMessage.join(", ")
                : typeof rawMessage === "string"
                    ? rawMessage
                    : "Could not delete this job.";

            notify({
                type: "error",
                message: "Delete failed",
                description: message,
            });
        }
    };

    const goToDetail = (job: IJob) => {
        if (!job.id) return;
        navigate(`/jobs/${job.id}`);
    };

    if (isLoading) {
        return (
            <VStack py={10} spacing={3}>
                <Spinner size="lg" color="#334371" />
                <Text color="gray.600">Loading jobs...</Text>
            </VStack>
        );
    }

    if (isError) {
        return (
            <VStack py={10} spacing={3}>
                <Text color="red.500" fontWeight="600">
                    Failed to load jobs
                </Text>
                <Text color="gray.600">Please try again.</Text>
            </VStack>
        );
    }

    return (
        <Box>
            <JobCandidate
                jobs={filteredJobs}
                showCandidates
                onAddClick={openAddModal}
                onViewClick={goToDetail}
                onEditClick={openEditModal}
                onDeleteClick={openDeleteModal}
                toolbarRight={
                    isAdmin ? (
                        <Box w={{ base: "220px", md: "230px" }}>
                            <SearchCombobox
                                value={selectedCompany}
                                onChange={(value) => {
                                    setSelectedCompany(value || "all");
                                    setPage(1);
                                }}
                                options={[
                                    { id: "all", name: "All companies" },
                                    ...companyOptions.map((company) => ({
                                        id: company,
                                        name: company,
                                    })),
                                ]}
                                placeholder="Filter by company"
                                isClearable={false}
                                size="md"
                            />
                        </Box>
                    ) : null
                }
            />

            <PaginationBar
                total={selectedCompany === "all" ? pagination.totalItems : filteredJobs.length}
                page={page}
                perPage={limit}
                onPageChange={(p) => setPage(p)}
                onPerPageChange={(n) => {
                    setLimit(n);
                    setPage(1);
                }}
            />

            <JobModal
                isOpen={isJobModalOpen}
                onClose={() => setIsJobModalOpen(false)}
                mode={jobModalMode}
                data={selectedJob}
                onSuccess={() => {
                    setIsJobModalOpen(false);
                    setSelectedJob(undefined);
                }}
            />

            <ModalConfirm
                open={isDeleteOpen}
                setOpen={setIsDeleteOpen}
                title="Delete job"
                message={`Are you sure you want to delete \"${deleteTarget?.name_job || "this job"}\"?`}
                titleButton="Delete"
                onClick={handleDelete}
                confirmButtonProps={{ isLoading: isDeleting }}
            />
        </Box>
    );
}