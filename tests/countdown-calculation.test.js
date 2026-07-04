const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

function createElement() {
  return {
    textContent: "",
    value: "",
    checked: false,
    disabled: false,
    open: false,
    className: "",
    style: {
      setProperty() {}
    },
    classList: {
      add() {},
      remove() {},
      toggle() {}
    },
    addEventListener() {},
    append() {},
    close() {
      this.open = false;
    },
    focus() {},
    replaceChildren() {},
    reset() {},
    setAttribute() {},
    showModal() {
      this.open = true;
    }
  };
}

function loadAppContext() {
  const elements = new Map();
  const storage = new Map();
  const context = {
    console,
    crypto: {
      randomUUID: () => "test-id"
    },
    document: {
      addEventListener() {},
      createDocumentFragment: createElement,
      createElement,
      querySelector(selector) {
        if (!elements.has(selector)) {
          elements.set(selector, createElement());
        }
        return elements.get(selector);
      }
    },
    Intl,
    localStorage: {
      getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
      },
      removeItem(key) {
        storage.delete(key);
      },
      setItem(key, value) {
        storage.set(key, String(value));
      }
    },
    requestAnimationFrame(callback) {
      callback();
    },
    setInterval() {}
  };

  vm.createContext(context);
  vm.runInContext(fs.readFileSync("app.js", "utf8"), context);
  return context;
}

const context = loadAppContext();

const timedResult = context.calculateCountdown(
  {
    id: "timed",
    title: "Timed Object",
    targetDate: "2026-06-30",
    targetTime: "20:30",
    repeatsYearly: false
  },
  new Date(2026, 5, 30, 18, 30)
);

assert.strictEqual(timedResult.value, "2");
assert.strictEqual(timedResult.label, "hours left");
assert.strictEqual(timedResult.ringValue, "2");
assert.strictEqual(timedResult.ringLabel, "hours left");

const dateOnlyResult = context.calculateCountdown(
  {
    id: "date-only",
    title: "Date Only",
    targetDate: "2026-06-30",
    targetTime: "",
    repeatsYearly: false
  },
  new Date(2026, 5, 30, 18, 30)
);

assert.strictEqual(dateOnlyResult.value, "Today");
assert.strictEqual(dateOnlyResult.label, "is the day");

const tomorrowResult = context.calculateCountdown(
  {
    id: "tomorrow",
    title: "Tomorrow",
    targetDate: "2026-07-01",
    targetTime: "",
    repeatsYearly: false
  },
  new Date(2026, 5, 30, 18, 30)
);

assert.strictEqual(tomorrowResult.value, "Tomorrow");
assert.strictEqual(tomorrowResult.label, "is the day");
assert.strictEqual(tomorrowResult.ringValue, "1");
assert.strictEqual(tomorrowResult.ringLabel, "day left");

const sortedIds = Array.from(
  context.getSortedCountdowns(
    [
      {
        id: "future",
        title: "Future",
        targetDate: "2026-07-05",
        targetTime: "",
        repeatsYearly: false
      },
      {
        id: "past",
        title: "Past",
        targetDate: "2026-06-01",
        targetTime: "",
        repeatsYearly: false
      },
      {
        id: "soon",
        title: "Soon",
        targetDate: "2026-06-30",
        targetTime: "20:00",
        repeatsYearly: false
      },
      {
        id: "tomorrow",
        title: "Tomorrow",
        targetDate: "2026-07-01",
        targetTime: "",
        repeatsYearly: false
      }
    ],
    new Date(2026, 5, 30, 18, 30)
  )
).map((countdown) => countdown.id);

assert.deepStrictEqual(sortedIds, ["soon", "tomorrow", "future", "past"]);
