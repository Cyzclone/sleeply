export default function ProfileQuestionRow({
  question,
  answer,
  mode,
  onValueChange,
  onSkipChange,
  onEdit,
}) {
  const displayedValue = answer.value;
  const isDecimalQuestion = question.step === 0.5;
  const allowSkip = !question.required;
  const valueLabel =
    question.id === "naturalSleepHours" || question.id === "plannedSleepHours"
      ? `${displayedValue} hrs`
      : question.id === "roomWakeCount"
        ? `${displayedValue} times`
        : `${displayedValue} / 10`;

  function handleInputChange(event) {
    const nextValue = event.target.value;

    if (!/^\d*\.?\d*$/.test(nextValue)) {
      return;
    }

    if (nextValue === "") {
      return;
    }

    const parsedValue = Number(nextValue);
    if (Number.isNaN(parsedValue)) {
      return;
    }

    const roundedValue = isDecimalQuestion
      ? Math.round(parsedValue * 2) / 2
      : Math.round(parsedValue);
    const clampedValue = Math.min(question.max, Math.max(question.min, roundedValue));

    onValueChange(question.id, clampedValue);
  }

  function handleInputBlur(event) {
    if (event.target.value === "") {
      event.target.value = String(answer.value);
      return;
    }

    const parsedValue = Number(event.target.value);
    if (Number.isNaN(parsedValue)) {
      event.target.value = String(answer.value);
      return;
    }

    const roundedValue = isDecimalQuestion
      ? Math.round(parsedValue * 2) / 2
      : Math.round(parsedValue);
    const clampedValue = Math.min(question.max, Math.max(question.min, roundedValue));

    onValueChange(question.id, clampedValue);
    event.target.value = String(clampedValue);
  }

  function handleInputKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.currentTarget.value = String(answer.value);
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Backspace") {
      const { selectionEnd, selectionStart, value } = event.currentTarget;
      const selectedLength = Math.max(0, (selectionEnd ?? 0) - (selectionStart ?? 0));
      const willBeEmpty =
        value.length === 1 ||
        (selectedLength > 0 && selectedLength === value.length);

      if (willBeEmpty) {
        queueMicrotask(() => {
          if (document.activeElement === event.currentTarget) {
            event.currentTarget.blur();
          }
        });
      }
    }
  }

  return (
    <article className="sl-question-row">
      <div className="sl-question-row__top">
        <div>
          <h3>{question.label}</h3>
          <p>{answer.skipped && allowSkip ? "Skipped" : valueLabel}</p>
        </div>

        <div className="sl-question-row__controls">
          {allowSkip ? (
            <label className="sl-check">
              <input
                checked={answer.skipped}
                onChange={(event) => onSkipChange(question.id, event.target.checked)}
                type="checkbox"
              />
              <span>Skip</span>
            </label>
          ) : null}

          {mode === "saved" && (
            <button className="sl-inline-button" onClick={() => onEdit(question)} type="button">
              Edit
            </button>
          )}
        </div>
      </div>

      {mode === "draft" && (
        <div className="sl-slider-wrap">
          <input
            className="sl-slider"
            disabled={answer.skipped && allowSkip}
            max={question.max}
            min={question.min}
            onChange={(event) =>
              onValueChange(question.id, Number(event.target.value))
            }
            step={question.step}
            type="range"
            value={answer.value}
          />
          <input
            className="sl-slider-value sl-slider-input"
            defaultValue={displayedValue}
            disabled={answer.skipped && allowSkip}
            inputMode="decimal"
            key={`${question.id}-${displayedValue}`}
            onBlur={handleInputBlur}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            step={question.step}
            type="text"
          />
        </div>
      )}
    </article>
  );
}
