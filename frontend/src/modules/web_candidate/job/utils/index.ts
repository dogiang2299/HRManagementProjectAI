export const SPECIAL_WORDS: Record<string, string> = {
  ict: "ICT",
  sql: "SQL",
  api: "API",
  ai: "AI",
  ml: "ML",
  ui: "UI",
  ux: "UX",
  cv: "CV",
  jd: "JD",
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  react: "React",
  nodejs: "Node.js",
  "node.js": "Node.js",
  postgresql: "PostgreSQL",
  mysql: "MySQL",
};

export const formatSkillName = (value?: string | null) => {
  if (!value) return "";

  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => {
      const lower = word.toLowerCase();

      if (SPECIAL_WORDS[lower]) return SPECIAL_WORDS[lower];

      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
};

export const translateRecommendationText = (value?: string | null) => {
  if (!value) return "";

  let result = String(value);

  const sentenceRules: Array<[RegExp, string]> = [
    [/Ứng viên có\s*(\d+)\s*Skills?\s*phù hợp với yêu cầu công việc\.\s*Ứng viên còn thiếu\s*(\d+)\s*Skills?\s*so với yêu cầu\./gi, "You match $1 required skills and are missing $2 skills."],
    [/Ứng viên có\s*(\d+)\s*kỹ năng\s*phù hợp với yêu cầu công việc\.\s*Ứng viên còn thiếu\s*(\d+)\s*kỹ năng\s*so với yêu cầu\./gi, "You match $1 required skills and are missing $2 skills."],
    [/Position mong muốn hoặc Position phát hiện từ CV phù hợp với tin tuyển dụng\./gi, "Your desired position or the position detected from your CV matches this job posting."],
    [/Position hoặc nhóm nghề phù hợp với định hướng của ứng viên\./gi, "The position or job group matches your career direction."],
    [/Experience của ứng viên phù hợp với yêu cầu công việc\./gi, "Your experience matches the job requirements."],
    [/Tin tuyển dụng trùng vị trí mong muốn, hình thức làm việc phù hợp, CV\/JD có độ tương đồng cao, nhưng kỹ năng còn thiếu, địa điểm chưa khớp tốt, kinh nghiệm chưa thật sự phù hợp\./gi, "This job aligns with your desired position and preferred job type, and has strong CV/JD semantic similarity, but skills are still missing, location fit is not strong yet, and experience is not fully aligned."],
    [/Trùng với vị trí mong muốn:/gi, "Matches your desired position:"],
    [/(?:Location|Địa điểm)\s+chưa thực sự khớp với khu vực mong muốn của ứng viên\./gi, "Location is not fully aligned with your preferred area."],
    [/(?:Job type|Hình thức làm việc)\s+phù hợp:\s*/gi, "Job type fits: "],
    [/(?:Experience|Kinh nghiệm)\s+có thể cân nhắc, nhưng chưa thật sự khớp cao\./gi, "Experience is potentially relevant, but not strongly matched yet."],
    [/(?:Experience|Kinh nghiệm)\s+có thể cân nhắc so với yêu cầu\s*/gi, "Experience can be considered against the requirement of "],
    [/(?:Seniority|Cấp bậc)\s+của tin tuyển dụng chưa khớp hoàn toàn với hồ sơ ứng viên\./gi, "The job seniority does not fully align with your profile."],
    [/You match\s*(\d+\s*\/\s*\d+)\s*(?:Skills)\s*yêu cầu\./gi, "You match $1 required skills."],
    [/Chưa tìm thấy nhiều\s*(?:kỹ năng|Skills)\s*bắt buộc khớp với hồ sơ ứng viên\./gi, "The system could not find enough required skills matching your profile."],
    [/Nội dung CV và JD có độ tương đồng cao\./gi, "Your CV and the job description have high semantic similarity."],
    [/Cập nhật\s*(?:địa điểm|Location)\s*mong muốn để hệ thống lọc công việc chính xác hơn\./gi, "Update your preferred location so the system can filter jobs more accurately."],
    [/Cập nhật rõ số năm\s*(?:kinh nghiệm|Experience), dự án đã làm và vai trò trong từng dự án\./gi, "Add clearer years of experience, projects, and your role in each project."],
    [/Bổ sung các\s*(?:kỹ năng|Skills)\s*còn thiếu nếu đã có\s*(?:kinh nghiệm|Experience)\s*thực tế:\s*/gi, "Add missing skills if you have practical experience: "],
  ];

  const tokenRules: Array<[RegExp, string]> = [
    [/Rất phù hợp/gi, "Excellent fit"],
    [/Khá phù hợp/gi, "Good fit"],
    [/Chưa phù hợp/gi, "Not a fit"],
    [/Phù hợp rất tốt/gi, "Excellent fit"],
    [/Phù hợp rất cao/gi, "Excellent match"],
    [/Phù hợp tốt/gi, "Good fit"],
    [/Phù hợp cao/gi, "Strong match"],
    [/Phù hợp khá/gi, "Fair match"],
    [/Phù hợp thấp/gi, "Low match"],
    [/Có thể cân nhắc/gi, "Worth considering"],
    [/Cân nhắc/gi, "Consider"],
    [/Mức độ phù hợp/gi, "Match level"],
    [/Vị trí/gi, "Position"],
    [/Kỹ năng/gi, "Skills"],
    [/Địa điểm/gi, "Location"],
    [/Hình thức làm việc/gi, "Job type"],
    [/Kinh nghiệm/gi, "Experience"],
    [/Cấp bậc/gi, "Seniority"],
    [/Ngữ nghĩa CV\/JD/gi, "CV/JD semantics"],
    [/Bạn đang khớp/gi, "You match"],
    [/kỹ năng yêu cầu/gi, "required skills"],
  ];

  for (const [pattern, replacement] of sentenceRules) {
    result = result.replace(pattern, replacement);
  }

  for (const [pattern, replacement] of tokenRules) {
    result = result.replace(pattern, replacement);
  }

  return result;
};
