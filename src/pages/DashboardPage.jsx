import { Download, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import ProfileQuestionList from "../components/forms/ProfileQuestionList";
import { createDefaultAnswers } from "../features/sleep-inputs/constants/profileQuestions";

function cloneAnswers(answers) {
  return JSON.parse(JSON.stringify(answers));
}

function mergeImportedAnswers(answers) {
  return Object.fromEntries(
    Object.entries(createDefaultAnswers()).map(([questionId, defaultAnswer]) => [
      questionId,
      {
        ...defaultAnswer,
        ...(answers?.[questionId] ?? {}),
      },
    ]),
  );
}

function downloadProfile(profile) {
  const exportedProfile = {
    answers: profile.answers,
    createdAt: profile.createdAt,
    name: profile.name,
    updatedAt: profile.updatedAt,
  };
  const fileContents = JSON.stringify(exportedProfile, null, 2);
  const blob = new Blob([fileContents], { type: "application/json" });
  const objectUrl = window.URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  const safeFileName = profile.name.trim().replace(/[<>:"/\\|?*]/g, "_") || "sleeply-profile";

  downloadLink.href = objectUrl;
  downloadLink.download = `${safeFileName}.sleeply.json`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.URL.revokeObjectURL(objectUrl);
}

function DashboardMessagePanel({ actions, message, onClose, wide = false }) {
  return (
    <div className="sl-settings-overlay" onClick={onClose} role="presentation">
      <Card
        className={`sl-settings-panel sl-settings-panel--compact sl-dashboard-message-panel ${
          wide ? "sl-dashboard-message-panel--wide" : ""
        }`.trim()}
      >
        <div
          className="sl-dashboard-message-panel__body"
          onClick={(event) => event.stopPropagation()}
          role="presentation"
        >
          <p className="sl-dashboard-message-panel__text">{message}</p>
          <div className="sl-dashboard-message-panel__actions">{actions}</div>
        </div>
      </Card>
    </div>
  );
}

function DashboardAwakePromptPanel({
  hoursDraft,
  onChange,
  onClose,
  onSubmit,
  profileName,
}) {
  return (
    <div className="sl-settings-overlay" onClick={onClose} role="presentation">
      <Card className="sl-settings-panel sl-settings-panel--compact sl-dashboard-message-panel sl-dashboard-message-panel--wide">
        <div
          className="sl-dashboard-message-panel__body sl-dashboard-message-panel__body--stacked"
          onClick={(event) => event.stopPropagation()}
          role="presentation"
        >
          <p className="sl-dashboard-message-panel__text sl-dashboard-message-panel__text--wrap">
            {`"${profileName}" has no sleep duration. How long do you want to stay awake?`}
          </p>
          <label className="sl-dashboard-message-panel__field">
            <span>Awake time (hours)</span>
            <input
              autoFocus
              className="sl-profile-name-input sl-dashboard-message-panel__input"
              inputMode="decimal"
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onSubmit();
                }
              }}
              type="text"
              value={hoursDraft}
            />
          </label>
          <div className="sl-dashboard-message-panel__actions">
            <button className="sl-inline-button sl-inline-button--ghost" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="sl-inline-button" onClick={onSubmit} type="button">
              Continue
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function DashboardPage({
  activeProfileId,
  appSettings,
  createProfile,
  deleteProfile,
  onLoadProfile,
  onSelectProfile,
  profiles,
  questions,
  replaceAnswers,
}) {
  const [profileNameDraft, setProfileNameDraft] = useState("");
  const [screen, setScreen] = useState("base");
  const [draft, setDraft] = useState(null);
  const [noticeMessage, setNoticeMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [awakePromptState, setAwakePromptState] = useState(null);
  const uploadInputRef = useRef(null);

  function continueProfileLoad(profileId) {
    const activeProfile = profiles.find((profile) => profile.id === profileId);
    const plannedSleepHours = activeProfile?.answers?.plannedSleepHours?.value ?? 0;

    if (plannedSleepHours <= 0) {
      setAwakePromptState({
        hoursDraft: "1",
        profileId,
        profileName: activeProfile?.name ?? "This profile",
      });
      return;
    }

    onLoadProfile(profileId);
  }

  function handleCreateProfile() {
    setProfileNameDraft("");
    setScreen("name");
    onSelectProfile("");
  }

  function handleDraftChange(questionId, patch) {
    setDraft((current) => ({
      ...current,
      answers: {
        ...current.answers,
        [questionId]: {
          ...current.answers[questionId],
          ...patch,
        },
      },
    }));
  }

  function handleStartQuestionnaire() {
    if (!profileNameDraft.trim()) {
      return;
    }

    setDraft({
      mode: "create",
      name: profileNameDraft.trim(),
      answers: cloneAnswers(createDefaultAnswers()),
    });
    setScreen("questionnaire");
  }

  function handleProfileToggle(profileId) {
    onSelectProfile(activeProfileId === profileId ? "" : profileId);
  }

  function handleEditFromList(profile) {
    onSelectProfile(profile.id);
    setDraft({
      mode: "edit",
      profileId: profile.id,
      name: profile.name,
      answers: cloneAnswers(profile.answers),
    });
    setScreen("questionnaire");
  }

  function handleDeleteProfile(profile) {
    setDeleteTarget(profile);
  }

  function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }

    deleteProfile(deleteTarget.id);
    if (activeProfileId === deleteTarget.id) {
      onSelectProfile("");
    }
    setDeleteTarget(null);
  }

  function handleLoadProfile() {
    if (!activeProfileId) {
      setNoticeMessage("Click on a profile to load it.");
      return;
    }

    continueProfileLoad(activeProfileId);
  }

  function handleConfirmAwakePrompt() {
    if (!awakePromptState?.profileId) {
      return;
    }

    const awakeHours = Number.parseFloat(awakePromptState.hoursDraft);
    const awakeOnlyMinutes = Number.isFinite(awakeHours)
      ? Math.max(0.25, awakeHours) * 60
      : 60;

    onLoadProfile(awakePromptState.profileId, awakeOnlyMinutes);
    setAwakePromptState(null);
  }

  async function handleUploadProfile(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const parsed = JSON.parse(await file.text());
      if (
        !parsed ||
        typeof parsed !== "object" ||
        typeof parsed.name !== "string" ||
        !parsed.answers ||
        typeof parsed.answers !== "object"
      ) {
        throw new Error("Invalid Sleeply profile file.");
      }

      const nextProfile = createProfile(parsed.name.trim() || "Imported Profile");
      replaceAnswers(nextProfile.id, cloneAnswers(mergeImportedAnswers(parsed.answers)));
      onSelectProfile("");
    } catch {
      setNoticeMessage("That file is not a valid Sleeply profile export.");
    } finally {
      event.target.value = "";
    }
  }

  function handleSubmitDraft() {
    if (!draft) {
      return;
    }

    if (draft.mode === "create") {
      const nextProfile = createProfile(draft.name);
      replaceAnswers(nextProfile.id, draft.answers);
      onSelectProfile("");
    } else {
      replaceAnswers(draft.profileId, draft.answers);
      onSelectProfile("");
    }

    setDraft(null);
    setProfileNameDraft("");
    setScreen("base");
  }

  return (
    <div className="sl-dashboard">
      <section className="sl-hero">
        <img
          alt="Sleeply"
          className="sl-hero__logo"
          src="/icons/Sleeply_logo.png"
        />
      </section>

      {screen === "base" && (
        <>
          <Card className="sl-profiles-card" title="Profiles">
            {profiles.length > 0 ? (
              <div className="sl-profiles-list">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={`sl-profile-tile ${
                      profile.id === activeProfileId ? "is-active" : ""
                    }`.trim()}
                    onClick={() => handleProfileToggle(profile.id)}
                  >
                    <button
                      className="sl-profile-tile__main"
                      type="button"
                    >
                      <strong>{profile.name}</strong>
                      {appSettings.showProfileDates && (
                        <span>{new Date(profile.updatedAt).toLocaleDateString()}</span>
                      )}
                    </button>

                    <div className="sl-profile-tile__actions">
                      <button
                        aria-label={`Edit ${profile.name}`}
                        className="sl-icon-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleEditFromList(profile);
                        }}
                        type="button"
                      >
                        <Pencil aria-hidden="true" size={18} strokeWidth={2.1} />
                      </button>
                      <button
                        aria-label={`Download ${profile.name}`}
                        className="sl-icon-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          downloadProfile(profile);
                        }}
                        type="button"
                      >
                        <Download aria-hidden="true" size={18} strokeWidth={2.1} />
                      </button>
                      <button
                        aria-label={`Delete ${profile.name}`}
                        className="sl-icon-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteProfile(profile);
                        }}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" size={18} strokeWidth={2.1} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="sl-empty-state">
                <span>No profiles created yet.</span>
                <span>Click the plus icon to get started.</span>
              </p>
            )}
          </Card>

          <section className="sl-action-row">
            <button
              aria-label="Create profile"
              className="sl-action-icon-button"
              onClick={handleCreateProfile}
              type="button"
            >
              <Plus aria-hidden="true" size={28} strokeWidth={2.2} />
            </button>
            <Button
              className={`sl-stack-button sl-row-button ${
                !activeProfileId ? "is-inactive" : ""
              }`.trim()}
              onClick={handleLoadProfile}
              variant="secondary"
            >
              Load Profile
            </Button>
            <button
              aria-label="Upload profile"
              className="sl-action-icon-button"
              onClick={() => uploadInputRef.current?.click()}
              type="button"
            >
              <Upload aria-hidden="true" size={26} strokeWidth={2.2} />
            </button>
            <input
              accept=".json,application/json"
              className="sl-upload-input"
              onChange={handleUploadProfile}
              ref={uploadInputRef}
              type="file"
            />
          </section>
        </>
      )}

      {screen === "name" && (
        <Card className="sl-profile-card" title="Create Profile">
          <label className="sl-profile-name-field">
            <span>Profile name</span>
            <input
              autoFocus
              className="sl-profile-name-input"
              onChange={(event) => setProfileNameDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleStartQuestionnaire();
                }
              }}
              placeholder="Type profile name"
              type="text"
              value={profileNameDraft}
            />
          </label>
          <div className="sl-profile-card__footer">
            <Button onClick={() => setScreen("base")} variant="secondary">
              Cancel
            </Button>
            <Button onClick={handleStartQuestionnaire}>Continue</Button>
          </div>
        </Card>
      )}

      {screen === "questionnaire" && draft && (
        <Card
          className="sl-profile-card"
          title={draft.mode === "create" ? draft.name : `Edit ${draft.name}`}
        >
          <p className="sl-profile-card__note">
            {draft.mode === "create"
              ? "Answer the questionnaire to save this profile."
              : "Update this profile and submit to save your changes."}
          </p>
          <ProfileQuestionList
            answers={draft.answers}
            mode="draft"
            onSkipChange={(questionId, checked) =>
              handleDraftChange(questionId, { skipped: checked })
            }
            onValueChange={(questionId, value) =>
              handleDraftChange(questionId, { value })
            }
            questions={questions}
          />
          <div className="sl-profile-card__footer">
            <Button
              onClick={() => {
                setDraft(null);
                setScreen("base");
              }}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitDraft}>Submit</Button>
          </div>
        </Card>
      )}
      {noticeMessage ? (
        <DashboardMessagePanel
          actions={
            <button className="sl-inline-button" onClick={() => setNoticeMessage("")} type="button">
              Close
            </button>
          }
          message={noticeMessage}
          onClose={() => setNoticeMessage("")}
        />
      ) : null}
      {deleteTarget ? (
        <DashboardMessagePanel
          actions={
            <>
              <button
                className="sl-inline-button sl-inline-button--ghost"
                onClick={() => setDeleteTarget(null)}
                type="button"
              >
                Cancel
              </button>
              <button className="sl-inline-button" onClick={handleConfirmDelete} type="button">
                Delete
              </button>
            </>
          }
          message={`Are you sure?`}
          onClose={() => setDeleteTarget(null)}
          wide
        />
      ) : null}
      {awakePromptState ? (
        <DashboardAwakePromptPanel
          hoursDraft={awakePromptState.hoursDraft}
          onChange={(value) =>
            setAwakePromptState((current) =>
              current
                ? {
                    ...current,
                    hoursDraft: value,
                  }
                : current,
            )
          }
          onClose={() => setAwakePromptState(null)}
          onSubmit={handleConfirmAwakePrompt}
          profileName={awakePromptState.profileName}
        />
      ) : null}
    </div>
  );
}
