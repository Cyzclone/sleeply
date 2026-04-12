import { useState } from "react";
import { STAGE_DESCRIPTION_PROFILES } from "../../features/pulse-engine/constants/stageDescriptionProfiles";

const DOT_CLASS_NAMES = {
  alpha: "sl-suggestion-bubble__dot--alpha",
  beta: "sl-suggestion-bubble__dot--beta",
  delta: "sl-suggestion-bubble__dot--delta",
  neutral: "sl-suggestion-bubble__dot--neutral",
  theta: "sl-suggestion-bubble__dot--theta",
};

function SuggestionBubble({ children, collapsed, onDismiss, side, title }) {
  return (
    <aside
      className={`sl-suggestion-bubble sl-suggestion-bubble--${side} ${
        collapsed ? "is-collapsed" : ""
      }`.trim()}
      onClick={collapsed ? undefined : onDismiss}
      role={collapsed ? undefined : "button"}
      tabIndex={collapsed ? -1 : 0}
      onKeyDown={
        collapsed
          ? undefined
          : (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onDismiss();
              }
            }
      }
    >
      {!collapsed && (
        <>
          <button
            aria-label={`Close ${title}`}
            className="sl-suggestion-bubble__close"
            onClick={(event) => {
              event.stopPropagation();
              onDismiss();
            }}
            type="button"
          >
            x
          </button>
          <div className="sl-suggestion-bubble__eyebrow">{title}</div>
          {children}
        </>
      )}
    </aside>
  );
}

export default function BrainStageDescription({
  children,
  currentStage,
  resetKey,
  showPopups = true,
}) {
  const activeResetKey = resetKey ?? currentStage;
  const [leftDismissedKey, setLeftDismissedKey] = useState("");
  const [rightDismissedKey, setRightDismissedKey] = useState("");
  const profile =
    STAGE_DESCRIPTION_PROFILES[currentStage] ?? STAGE_DESCRIPTION_PROFILES.awake;
  const leftCollapsed = leftDismissedKey === activeResetKey;
  const rightCollapsed = rightDismissedKey === activeResetKey;

  return (
    <div className="sl-brain-suggestions">
      <div className="sl-brain-suggestions__center">{children}</div>

      {showPopups ? (
        <>
          <SuggestionBubble
            collapsed={leftCollapsed}
            onDismiss={() => setLeftDismissedKey(activeResetKey)}
            side="left"
            title="What You Are Seeing"
          >
            <h3 className="sl-suggestion-bubble__title">{profile.title}</h3>
            <p className="sl-suggestion-bubble__summary">{profile.summary}</p>
          </SuggestionBubble>

          <SuggestionBubble
            collapsed={rightCollapsed}
            onDismiss={() => setRightDismissedKey(activeResetKey)}
            side="right"
            title="Look For"
          >
            <ul className="sl-suggestion-bubble__list">
              {profile.items.map((item) => (
                <li className="sl-suggestion-bubble__item" key={`${profile.title}-${item.label}`}>
                  <span
                    className={`sl-suggestion-bubble__dot ${
                      DOT_CLASS_NAMES[item.tone] ?? DOT_CLASS_NAMES.neutral
                    }`.trim()}
                  />
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </SuggestionBubble>
        </>
      ) : null}
    </div>
  );
}
