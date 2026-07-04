const STORAGE_KEY = "countdown.objects.v1";
const SELECTED_KEY = "countdown.selectedId.v1";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const elements = {
  selectedTitle: document.querySelector("#selectedTitle"),
  countdownValue: document.querySelector("#countdownValue"),
  countdownLabel: document.querySelector("#countdownLabel"),
  countdownDate: document.querySelector("#countdownDate"),
  progressRing: document.querySelector("#progressRing"),
  progressValue: document.querySelector("#progressValue"),
  progressLabel: document.querySelector("#progressLabel"),
  optionsList: document.querySelector("#optionsList"),
  deleteButton: document.querySelector("#deleteButton"),
  editButton: document.querySelector("#editButton"),
  createButton: document.querySelector("#createButton"),
  objectDialog: document.querySelector("#objectDialog"),
  objectDialogTitle: document.querySelector("#objectDialogTitle"),
  objectForm: document.querySelector("#objectForm"),
  closeObjectButton: document.querySelector("#closeObjectButton"),
  cancelObjectButton: document.querySelector("#cancelObjectButton"),
  titleInput: document.querySelector("#titleInput"),
  dateInput: document.querySelector("#dateInput"),
  timeInput: document.querySelector("#timeInput"),
  repeatInput: document.querySelector("#repeatInput"),
  formError: document.querySelector("#formError"),
  saveObjectButton: document.querySelector("#saveObjectButton"),
  deleteDialog: document.querySelector("#deleteDialog"),
  deleteMessage: document.querySelector("#deleteMessage"),
  cancelDeleteButton: document.querySelector("#cancelDeleteButton"),
  confirmDeleteButton: document.querySelector("#confirmDeleteButton")
};

const hasSavedCountdowns = localStorage.getItem(STORAGE_KEY) !== null;

let countdowns = loadCountdowns();
let selectedId = loadSelectedId();
let objectDialogMode = "create";
let editingId = null;

if (!hasSavedCountdowns && countdowns.length === 0) {
  countdowns = createSeedCountdowns();
  selectedId = countdowns[0].id;
  persist();
}

if (!countdowns.some((item) => item.id === selectedId)) {
  selectedId = countdowns[0]?.id ?? null;
  saveSelectedId();
}

render();
setInterval(renderSelectedCountdown, 60 * 1000);

elements.createButton.addEventListener("click", openCreateDialog);
elements.editButton.addEventListener("click", openEditDialog);
elements.closeObjectButton.addEventListener("click", closeObjectDialog);
elements.cancelObjectButton.addEventListener("click", closeObjectDialog);
elements.objectForm.addEventListener("submit", handleObjectSave);
elements.deleteButton.addEventListener("click", openDeleteDialog);
elements.cancelDeleteButton.addEventListener("click", () => elements.deleteDialog.close());
elements.confirmDeleteButton.addEventListener("click", handleDelete);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeOpenDialogs();
  }
});

function loadCountdowns() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(saved)) {
      return [];
    }

    return saved.filter(isCountdownLike);
  } catch {
    return [];
  }
}

function loadSelectedId() {
  return localStorage.getItem(SELECTED_KEY);
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(countdowns));
  saveSelectedId();
}

function saveSelectedId() {
  if (selectedId) {
    localStorage.setItem(SELECTED_KEY, selectedId);
  } else {
    localStorage.removeItem(SELECTED_KEY);
  }
}

function isCountdownLike(item) {
  return Boolean(
    item &&
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.targetDate === "string"
  );
}

function createSeedCountdowns() {
  const now = new Date().toISOString();
  const today = getLocalDateStart(new Date());
  const birthday = addDays(today, 42);
  const trip = addDays(today, 87);
  const holiday = new Date(today.getFullYear(), 11, 25);

  return [
    {
      id: createId(),
      title: "Birthday",
      targetDate: formatDateInput(birthday),
      targetTime: "",
      repeatsYearly: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: createId(),
      title: "Vacation",
      targetDate: formatDateInput(trip),
      targetTime: "",
      repeatsYearly: false,
      createdAt: now,
      updatedAt: now
    },
    {
      id: createId(),
      title: "Holiday",
      targetDate: formatDateInput(holiday),
      targetTime: "",
      repeatsYearly: true,
      createdAt: now,
      updatedAt: now
    }
  ];
}

function render() {
  renderOptions();
  renderSelectedCountdown();
}

function renderOptions() {
  elements.optionsList.replaceChildren();

  if (countdowns.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-options";
    empty.textContent = "No objects yet";
    elements.optionsList.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  getSortedCountdowns(countdowns).forEach((countdown) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    button.classList.toggle("is-selected", countdown.id === selectedId);
    button.setAttribute("aria-pressed", String(countdown.id === selectedId));

    const title = document.createElement("span");
    title.className = "option-title";
    title.textContent = countdown.title;

    const meta = document.createElement("span");
    meta.className = "option-meta";
    meta.textContent = formatDisplayTarget(countdown, getEffectiveTargetDate(countdown));

    button.append(title, meta);
    button.addEventListener("click", () => {
      selectedId = countdown.id;
      saveSelectedId();
      render();
    });
    fragment.append(button);
  });

  elements.optionsList.append(fragment);
}

function renderSelectedCountdown() {
  const selected = getSelectedCountdown();
  elements.deleteButton.disabled = !selected;
  elements.editButton.disabled = !selected;

  if (!selected) {
    elements.selectedTitle.textContent = "";
    elements.countdownValue.textContent = "No objects";
    elements.countdownValue.classList.add("is-word");
    elements.countdownLabel.textContent = "Create one whenever you are ready";
    elements.countdownDate.textContent = "";
    updateProgressRing(0, "0", "days left");
    return;
  }

  const result = calculateCountdown(selected);
  elements.selectedTitle.textContent = selected.title;
  elements.countdownValue.textContent = result.value;
  elements.countdownValue.classList.toggle("is-word", result.isWord);
  elements.countdownLabel.textContent = result.label;
  elements.countdownDate.textContent = formatDisplayTarget(selected, result.effectiveDate);
  updateProgressRing(result.progressPercent, result.ringValue, result.ringLabel);
}

function getSelectedCountdown() {
  return countdowns.find((item) => item.id === selectedId) ?? null;
}

function getSortedCountdowns(items, now = new Date()) {
  return [...items].sort((first, second) => compareCountdowns(first, second, now));
}

function compareCountdowns(first, second, now) {
  const firstTarget = getCountdownTargetDateTime(first, now);
  const secondTarget = getCountdownTargetDateTime(second, now);
  const firstPast = isPastOneTime(first, firstTarget, now);
  const secondPast = isPastOneTime(second, secondTarget, now);

  if (firstPast !== secondPast) {
    return firstPast ? 1 : -1;
  }

  const timeDifference = firstTarget.getTime() - secondTarget.getTime();
  if (timeDifference !== 0) {
    return timeDifference;
  }

  return first.title.localeCompare(second.title);
}

function getCountdownTargetDateTime(countdown, now = new Date()) {
  const today = getLocalDateStart(now);
  const effectiveDate = getEffectiveTargetDate(countdown, today);
  const time = parseStoredTime(countdown.targetTime);
  const target = new Date(
    effectiveDate.getFullYear(),
    effectiveDate.getMonth(),
    effectiveDate.getDate(),
    time?.hours ?? 23,
    time?.minutes ?? 59
  );

  if (countdown.repeatsYearly && target < now) {
    return new Date(
      target.getFullYear() + 1,
      target.getMonth(),
      target.getDate(),
      time?.hours ?? 23,
      time?.minutes ?? 59
    );
  }

  return target;
}

function isPastOneTime(countdown, target, now) {
  return !countdown.repeatsYearly && target < now;
}

function calculateCountdown(countdown, now = new Date()) {
  const today = getLocalDateStart(now);
  if (countdown.targetTime) {
    return calculateTimedCountdown(countdown, now, today);
  }

  const effectiveDate = getEffectiveTargetDate(countdown, today);
  const daysLeft = Math.ceil((effectiveDate.getTime() - today.getTime()) / MS_PER_DAY);

  if (daysLeft < 0) {
    return {
      value: "Past",
      label: "has passed",
      isWord: true,
      effectiveDate,
      daysLeft,
      progressPercent: 0,
      ringValue: "Past",
      ringLabel: "has passed"
    };
  }

  if (daysLeft === 0) {
    return {
      value: "Today",
      label: "is the day",
      isWord: true,
      effectiveDate,
      daysLeft,
      progressPercent: getDayProgress(now),
      ringValue: "0",
      ringLabel: "days left"
    };
  }

  if (daysLeft === 1) {
    return {
      value: "Tomorrow",
      label: "is the day",
      isWord: true,
      effectiveDate,
      daysLeft,
      progressPercent: 100,
      ringValue: "1",
      ringLabel: "day left"
    };
  }

  return {
    value: String(daysLeft),
    label: "days left",
    isWord: false,
    effectiveDate,
    daysLeft,
    progressPercent: getLongRangeProgress(daysLeft),
    ringValue: String(daysLeft),
    ringLabel: "days left"
  };
}

function calculateTimedCountdown(countdown, now, today) {
  const time = parseStoredTime(countdown.targetTime);
  if (!time) {
    return calculateCountdown(
      {
        ...countdown,
        targetTime: ""
      },
      now
    );
  }

  const effectiveDate = getEffectiveTargetDate(countdown, today);
  let effectiveDateTime = new Date(
    effectiveDate.getFullYear(),
    effectiveDate.getMonth(),
    effectiveDate.getDate(),
    time.hours,
    time.minutes
  );

  if (countdown.repeatsYearly && effectiveDateTime < now) {
    effectiveDateTime = new Date(
      effectiveDateTime.getFullYear() + 1,
      effectiveDateTime.getMonth(),
      effectiveDateTime.getDate(),
      time.hours,
      time.minutes
    );
  }

  const diffMs = effectiveDateTime.getTime() - now.getTime();

  if (diffMs < 0) {
    return {
      value: "Past",
      label: "has passed",
      isWord: true,
      effectiveDate: effectiveDateTime,
      daysLeft: Math.ceil(diffMs / MS_PER_DAY),
      progressPercent: 0,
      ringValue: "Past",
      ringLabel: "has passed"
    };
  }

  if (diffMs < 60 * 1000) {
    return {
      value: "Now",
      label: "is the time",
      isWord: true,
      effectiveDate: effectiveDateTime,
      daysLeft: 0,
      progressPercent: 0,
      ringValue: "Now",
      ringLabel: "is the time"
    };
  }

  if (diffMs < 60 * 60 * 1000) {
    const minutesLeft = Math.ceil(diffMs / (60 * 1000));
    return {
      value: String(minutesLeft),
      label: `${pluralize(minutesLeft, "minute")} left`,
      isWord: false,
      effectiveDate: effectiveDateTime,
      daysLeft: 0,
      progressPercent: getUnitProgress(minutesLeft, 60),
      ringValue: String(minutesLeft),
      ringLabel: `${pluralize(minutesLeft, "minute")} left`
    };
  }

  if (diffMs < MS_PER_DAY) {
    const hoursLeft = Math.ceil(diffMs / (60 * 60 * 1000));
    return {
      value: String(hoursLeft),
      label: `${pluralize(hoursLeft, "hour")} left`,
      isWord: false,
      effectiveDate: effectiveDateTime,
      daysLeft: 0,
      progressPercent: getUnitProgress(hoursLeft, 24),
      ringValue: String(hoursLeft),
      ringLabel: `${pluralize(hoursLeft, "hour")} left`
    };
  }

  const daysLeft = Math.ceil(diffMs / MS_PER_DAY);
  return {
    value: String(daysLeft),
    label: `${pluralize(daysLeft, "day")} left`,
    isWord: false,
    effectiveDate: effectiveDateTime,
    daysLeft,
    progressPercent: getLongRangeProgress(daysLeft),
    ringValue: String(daysLeft),
    ringLabel: `${pluralize(daysLeft, "day")} left`
  };
}

function getEffectiveTargetDate(countdown, today = getLocalDateStart(new Date())) {
  const baseDate = parseDateInput(countdown.targetDate);
  if (!countdown.repeatsYearly) {
    return baseDate;
  }

  let effectiveDate = new Date(today.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  if (effectiveDate < today) {
    effectiveDate = new Date(today.getFullYear() + 1, baseDate.getMonth(), baseDate.getDate());
  }

  return effectiveDate;
}

function openCreateDialog() {
  objectDialogMode = "create";
  editingId = null;
  elements.objectDialogTitle.textContent = "Create new object";
  elements.saveObjectButton.textContent = "Save object";
  elements.objectForm.reset();
  elements.formError.textContent = "";
  elements.dateInput.value = formatFormDate(new Date());
  showDialog(elements.objectDialog);
  requestAnimationFrame(() => elements.titleInput.focus());
}

function openEditDialog() {
  const selected = getSelectedCountdown();
  if (!selected) {
    return;
  }

  objectDialogMode = "edit";
  editingId = selected.id;
  elements.objectDialogTitle.textContent = "Edit object";
  elements.saveObjectButton.textContent = "Save changes";
  elements.formError.textContent = "";
  elements.titleInput.value = selected.title;
  elements.dateInput.value = formatFormDate(parseDateInput(selected.targetDate));
  elements.timeInput.value = formatFormTime(selected.targetTime);
  elements.repeatInput.checked = selected.repeatsYearly;
  showDialog(elements.objectDialog);
  requestAnimationFrame(() => elements.titleInput.focus());
}

function closeObjectDialog() {
  elements.objectDialog.close();
}

function handleObjectSave(event) {
  event.preventDefault();
  const title = elements.titleInput.value.trim();
  const dateResult = parseFormDate(elements.dateInput.value);
  const timeResult = parseFormTime(elements.timeInput.value);

  if (!title || !elements.dateInput.value.trim()) {
    elements.formError.textContent = "Title and date are required.";
    return;
  }

  if (!dateResult.ok) {
    elements.formError.textContent = dateResult.message;
    elements.dateInput.focus();
    return;
  }

  if (!timeResult.ok) {
    elements.formError.textContent = timeResult.message;
    elements.timeInput.focus();
    return;
  }

  const now = new Date().toISOString();
  const values = {
    title,
    targetDate: dateResult.value,
    targetTime: timeResult.value,
    repeatsYearly: elements.repeatInput.checked,
    updatedAt: now
  };

  if (objectDialogMode === "edit" && editingId) {
    countdowns = countdowns.map((item) =>
      item.id === editingId
        ? {
            ...item,
            ...values
          }
        : item
    );
    selectedId = editingId;
  } else {
    const countdown = {
      id: createId(),
      ...values,
      createdAt: now
    };
    countdowns = [countdown, ...countdowns];
    selectedId = countdown.id;
  }

  persist();
  closeObjectDialog();
  render();
}

function openDeleteDialog() {
  const selected = getSelectedCountdown();
  if (!selected) {
    return;
  }

  elements.deleteMessage.textContent = `Delete "${selected.title}"? This removes the object from this browser.`;
  showDialog(elements.deleteDialog);
  requestAnimationFrame(() => elements.cancelDeleteButton.focus());
}

function handleDelete() {
  const selected = getSelectedCountdown();
  if (!selected) {
    elements.deleteDialog.close();
    return;
  }

  countdowns = countdowns.filter((item) => item.id !== selected.id);
  selectedId = getSortedCountdowns(countdowns)[0]?.id ?? null;
  persist();
  elements.deleteDialog.close();
  render();
}

function showDialog(dialog) {
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function closeOpenDialogs() {
  [elements.objectDialog, elements.deleteDialog].forEach((dialog) => {
    if (dialog.open) {
      dialog.close();
    }
  });
}

function parseDateInput(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getLocalDateStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatFormDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function parseFormDate(value) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) {
    return {
      ok: false,
      message: "Use MM/DD/YYYY, like 06/30/2026."
    };
  }

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);

  if (month < 1 || month > 12) {
    return {
      ok: false,
      message: "Use a month from 01 to 12."
    };
  }

  const date = new Date(year, month - 1, day);
  const isRealDate =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  if (!isRealDate) {
    const monthName = new Intl.DateTimeFormat(undefined, { month: "long" }).format(
      new Date(year, month - 1, 1)
    );
    const maxDay = new Date(year, month, 0).getDate();
    return {
      ok: false,
      message: `That date does not exist. ${monthName} ${year} has ${maxDay} days.`
    };
  }

  return {
    ok: true,
    value: formatDateInput(date)
  };
}

function formatFormTime(value) {
  const parsed = parseStoredTime(value);
  if (!parsed) {
    return "";
  }

  return formatTimeParts(parsed.hours, parsed.minutes);
}

function parseFormTime(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      ok: true,
      value: ""
    };
  }

  const match = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp][Mm])?$/);
  if (!match) {
    return {
      ok: false,
      message: "Use a time like 10:06 PM, or leave it blank."
    };
  }

  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const period = match[3]?.toUpperCase();

  if (minutes > 59 || hours > 23 || (hours === 0 && period)) {
    return {
      ok: false,
      message: "Use a real time, like 10:06 PM."
    };
  }

  if (period) {
    if (hours > 12) {
      return {
        ok: false,
        message: "Use a real time, like 10:06 PM."
      };
    }

    if (period === "PM" && hours < 12) {
      hours += 12;
    }

    if (period === "AM" && hours === 12) {
      hours = 0;
    }
  }

  return {
    ok: true,
    value: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
  };
}

function parseStoredTime(value) {
  if (!value) {
    return null;
  }

  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  return {
    hours: Number(match[1]),
    minutes: Number(match[2])
  };
}

function formatTimeParts(hours, minutes) {
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

function formatDisplayDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function formatDisplayTarget(countdown, date) {
  if (!countdown.targetTime) {
    return formatDisplayDate(date);
  }

  return `${formatDisplayDate(date)} at ${formatFormTime(countdown.targetTime)}`;
}

function updateProgressRing(percent, value, label) {
  const safePercent = clamp(Math.round(percent), 0, 100);
  elements.progressRing.style.setProperty("--progress", `${safePercent * 3.6}deg`);
  elements.progressValue.textContent = value;
  elements.progressLabel.textContent = label;
}

function getDayProgress(now) {
  const dayStart = getLocalDateStart(now);
  const elapsedMs = now.getTime() - dayStart.getTime();
  const remainingPercent = 100 - (elapsedMs / MS_PER_DAY) * 100;
  return remainingPercent;
}

function getUnitProgress(valueLeft, total) {
  return (valueLeft / total) * 100;
}

function getLongRangeProgress(daysLeft) {
  return (Math.min(daysLeft, 365) / 365) * 100;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function pluralize(count, word) {
  return count === 1 ? word : `${word}s`;
}

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
