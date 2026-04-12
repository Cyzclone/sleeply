import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export default function CustomSelect({
  ariaLabel,
  className = "",
  menuClassName = "",
  onChange,
  options,
  value,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listboxId = useId();
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className={`sl-custom-select ${className}`.trim()} ref={rootRef}>
      <button
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={`sl-custom-select__trigger ${open ? "is-open" : ""}`.trim()}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown aria-hidden="true" className="sl-custom-select__icon" size={16} strokeWidth={2.2} />
      </button>
      {open ? (
        <div className={`sl-custom-select__menu ${menuClassName}`.trim()} id={listboxId} role="listbox">
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                aria-selected={selected}
                className={`sl-custom-select__option ${selected ? "is-selected" : ""}`.trim()}
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                role="option"
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
