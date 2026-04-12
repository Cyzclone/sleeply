import { useEffect, useState } from "react";
import {
  PROFILE_QUESTIONS,
  REQUIRED_QUESTION_IDS,
  createDefaultAnswers,
} from "../features/sleep-inputs/constants/profileQuestions";

const STORAGE_KEY = "sleeply-profiles-v1";

function safeParseProfiles() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function withDefaults(profile) {
  const mergedAnswers = {
    ...createDefaultAnswers(),
    ...profile.answers,
  };

  REQUIRED_QUESTION_IDS.forEach((questionId) => {
    if (mergedAnswers[questionId]) {
      mergedAnswers[questionId] = {
        ...mergedAnswers[questionId],
        skipped: false,
      };
    }
  });

  return {
    ...profile,
    answers: mergedAnswers,
  };
}

export function useProfiles() {
  const [profiles, setProfiles] = useState(() =>
    safeParseProfiles().map(withDefaults),
  );

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  }, [profiles]);

  function createProfile(name) {
    const nextProfile = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      answers: createDefaultAnswers(),
    };

    setProfiles((current) => [nextProfile, ...current]);
    return nextProfile;
  }

  function replaceAnswers(profileId, answers) {
    setProfiles((current) =>
      current.map((profile) =>
        profile.id === profileId
          ? { ...profile, answers, updatedAt: Date.now() }
          : profile,
      ),
    );
  }

  function updateAnswer(profileId, questionId, patch) {
    setProfiles((current) =>
      current.map((profile) => {
        if (profile.id !== profileId) {
          return profile;
        }

        return {
          ...profile,
          updatedAt: Date.now(),
          answers: {
            ...profile.answers,
            [questionId]: {
              ...profile.answers[questionId],
              ...patch,
              ...(REQUIRED_QUESTION_IDS.has(questionId) ? { skipped: false } : {}),
            },
          },
        };
      }),
    );
  }

  function deleteProfile(profileId) {
    setProfiles((current) =>
      current.filter((profile) => profile.id !== profileId),
    );
  }

  return {
    profiles,
    questions: PROFILE_QUESTIONS,
    createProfile,
    deleteProfile,
    replaceAnswers,
    updateAnswer,
  };
}
