import { Box } from "@chakra-ui/react";
import Interview_Schedule from "../../interview_schedule/views/Interview_Schedule";

type InterviewScheduleTabContentProps = {
    recruitmentId: string;
};

export default function InterviewScheduleTabContent({ recruitmentId }: InterviewScheduleTabContentProps) {
    return (
        <Box px={{ base: 4, md: 6 }} py={5}>
            <Interview_Schedule recruitmentInforId={recruitmentId} />
        </Box>
    );
}
