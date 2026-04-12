import Card from "../common/Card";
import CustomSelect from "../common/CustomSelect";
import { COLOR_OPTIONS } from "../../features/settings/constants/colorPalettes";
import { cursors } from "../../config/cursors";

function ToggleRow({ checked, description, label, onChange }) {
  return (
    <label className="sl-settings-row">
      <div>
        <strong>{label}</strong>
        <p>{description}</p>
      </div>
      <input
        checked={checked}
        className="sl-settings-toggle"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}

function SelectRow({ description, label, onChange, options, value }) {
  return (
    <label className="sl-settings-row">
      <div>
        <strong>{label}</strong>
        <p>{description}</p>
      </div>
      <CustomSelect
        ariaLabel={label}
        className="sl-settings-select"
        value={value}
        options={options}
        onChange={onChange}
      />
    </label>
  );
}

export default function SettingsPanel({ onClose, settings, updateSetting }) {
  return (
    <div className="sl-settings-overlay" onClick={onClose} role="presentation">
      <Card
        className="sl-settings-panel"
        rightSlot={
          <button className="sl-inline-button" onClick={onClose} type="button">
            Close
          </button>
        }
        title="Settings"
      >
        <div
          className="sl-settings-panel__content"
          onClick={(event) => event.stopPropagation()}
          role="presentation"
        >
          <SelectRow
            description="Swap the main app palette across the whole interface."
            label="Color palette"
            onChange={(value) => updateSetting("colorPalette", value)}
            options={COLOR_OPTIONS}
            value={settings.colorPalette}
          />
          <SelectRow
            description="Choose the cursor style used across Sleeply."
            label="Cursor style"
            onChange={(value) => updateSetting("cursorStyle", value)}
            options={cursors.map((cursor) => ({ label: cursor.name, value: cursor.id }))}
            value={settings.cursorStyle}
          />
          <ToggleRow
            checked={settings.showProfileDates}
            description="Show or hide the saved date on profile rows."
            label="Show profile dates"
            onChange={(value) => updateSetting("showProfileDates", value)}
          />
          <ToggleRow
            checked={settings.show3DInfoPopups}
            description="Show or hide the stage explanation bubbles around the 3D visualization."
            label="3D info popups"
            onChange={(value) => updateSetting("show3DInfoPopups", value)}
          />
          <ToggleRow
            checked={settings.displayIndividualTimes}
            description="Show or hide the exact durations next to cycles and stages on the timeline."
            label="Display individual times"
            onChange={(value) => updateSetting("displayIndividualTimes", value)}
          />
          <ToggleRow
            checked={settings.enableTutorial}
            description="Show the guided 3D visualization walkthrough the next time you open a profile."
            label="Enable tutorial"
            onChange={(value) => updateSetting("enableTutorial", value)}
          />
        </div>
      </Card>
    </div>
  );
}
