export type RecommendationSkillNameMap = Map<string, string>;

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toPercent(score: unknown) {
  return Math.round(toNumber(score) * 100);
}

function getSkillNames(
  skillIds: string[],
  skillNameMap: RecommendationSkillNameMap,
) {
  return skillIds.map((id) => skillNameMap.get(String(id)) ?? String(id));
}

function buildOverallLabel(finalScore: number, skillOverlapScore: number) {
  if (skillOverlapScore === 0 && finalScore >= 0.4) {
    return 'Worth considering';
  }

  if (finalScore >= 0.75) {
    return 'Highly suitable';
  }

  if (finalScore >= 0.6) {
    return 'Good match';
  }

  if (finalScore >= 0.5) {
    return 'Worth considering';
  }

  return 'Not suitable yet';
}

export function buildRecommendationMatchDetail(
  row: any,
  skillNameMap: RecommendationSkillNameMap,
) {
  const finalScore = toNumber(row.final_score);
  const skillOverlapScore = toNumber(row.skill_overlap_score);
  const groupSimilarityScore = toNumber(row.group_similarity_score);
  const dominantGroupScore = toNumber(row.dominant_group_score);
  const semanticScore = toNumber(row.semantic_score);

  const matchedSkillIds = row.matched_skill_ids ?? [];
  const missingSkillIds = row.missing_skill_ids ?? [];

  const matchedSkills = getSkillNames(matchedSkillIds, skillNameMap);
  const missingSkills = getSkillNames(missingSkillIds, skillNameMap);

  const requiredSkillCount = matchedSkillIds.length + missingSkillIds.length;
  const matchedSkillCount = matchedSkillIds.length;

  const skillPercent =
    requiredSkillCount > 0
      ? Math.round((matchedSkillCount / requiredSkillCount) * 100)
      : 0;

  const positionPercent = Math.round(
    Math.max(groupSimilarityScore, dominantGroupScore) * 100,
  );

  const semanticPercent = toPercent(semanticScore);

  const label = buildOverallLabel(finalScore, skillOverlapScore);

  const description =
    row.reason_texts?.join(' ') ||
    'This job is recommended based on a hybrid recommendation model.';

  const suggestions: string[] = [];

  const hasExperienceScore =
    row.experience_score !== null && row.experience_score !== undefined;

  const experienceScore = hasExperienceScore
    ? toNumber(row.experience_score)
    : null;

  const experiencePercent = hasExperienceScore
    ? toPercent(row.experience_score)
    : null;

  if (missingSkills.length > 0) {
    suggestions.push(
      `Add the missing skills if you already have practical experience with them: ${missingSkills
        .slice(0, 5)
        .join(', ')}.`,
    );
  }

  if (semanticPercent < 70) {
    suggestions.push(
      'Update your CV to better highlight relevant job responsibilities, completed projects, and technologies used.',
    );
  }

  if (positionPercent < 70) {
    suggestions.push(
      'Update your desired position or career orientation more clearly in your profile.',
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      'Your profile currently has a good match level. You can add more project experience to make it more convincing.',
    );
  }

  return {
    overall: {
      score: toPercent(finalScore),
      label,
      description,
    },

    dimensions: {
      position: {
        score: positionPercent,
        label: 'Position / Career group',
        description:
          positionPercent >= 80
            ? "The position or career group matches the candidate's orientation."
            : "The position or career group does not strongly match the candidate's orientation yet.",
      },

      skills: {
        score: skillPercent,
        label: 'Skills',
        description:
          requiredSkillCount > 0
            ? `You match ${matchedSkillCount}/${requiredSkillCount} required skills.`
            : 'The job posting does not have a clear list of required skills.',
      },

      semantic: {
        score: semanticPercent,
        label: 'CV/JD semantic match',
        description:
          semanticPercent >= 70
            ? 'The CV content and job description have high semantic similarity.'
            : 'The CV content and job description do not have high semantic similarity yet.',
      },

      ...(hasExperienceScore
        ? {
            experience: {
              score: experiencePercent!,
              label: 'Experience',
              description:
                experiencePercent! >= 80
                  ? "The candidate's experience matches the job requirements."
                  : experiencePercent! >= 50
                    ? "The candidate's experience can be considered against the job requirements."
                    : "The candidate's experience does not strongly match the job requirements yet.",
            },
          }
        : {}),
    },

    skillAnalysis: {
      score: skillPercent,
      matchedCount: matchedSkillCount,
      requiredCount: requiredSkillCount,
      matchedSkills,
      missingSkills,
    },

    suggestions,
  };
}