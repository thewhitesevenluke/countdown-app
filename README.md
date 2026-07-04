# Countdown App

A small browser countdown app for tracking dates, times, and yearly events.

## Features

- Create, edit, delete, and select countdown objects
- Optional target time for hour/minute countdowns
- Repeat-yearly support for birthdays and holidays
- Circular time-left progress display
- Local browser storage, no account required

## Run Locally

```bash
python3 -m http.server 8001
```

Then open:

```text
http://127.0.0.1:8001/index.html
```

## Test

```bash
node --check app.js
node tests/countdown-calculation.test.js
```
