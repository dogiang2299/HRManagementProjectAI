export const capitalizeFirst = (s?: string | null) => {
  if (!s) return "";
  const str = s.trim();
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const formatBadgeLabel = (value?: string | null) => {
  if (!value) return "";
  const v = value.trim();
  if (!v) return "";

  // For hyphenated values like "full-time" -> "Full-Time"
  if (v.includes("-")) {
    return v
      .split("-")
      .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part))
      .join("-");
  }

  // Capitalize first letter of each word (Title Case)
  // Example: "artificial neural networks" -> "Artificial Neural Networks"
  return v
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(" ");
};

export const formatWorkTypeLabel = (value?: string | null) => {
  if (!value) return "";
  const v = value.trim().replace(/\s+/g, " ");
  if (!v) return "";

  const normalized = v.toLowerCase();
  const mapped: Record<string, string> = {
    "toàn thời gian": "Full-time",
    "full time": "Full-time",
    "full-time": "Full-time",
    "bán thời gian": "Part-time",
    "part time": "Part-time",
    "part-time": "Part-time",
    "hợp đồng": "Contract",
    contract: "Contract",
    "thực tập": "Internship",
    internship: "Internship",
    hybrid: "Hybrid",
    remote: "Remote",
  };

  if (mapped[normalized]) return mapped[normalized];

  return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
};

export default formatBadgeLabel;
