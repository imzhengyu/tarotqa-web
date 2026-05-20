# Regression Report

This file tracks regression test results over time.

## Report Format
Each regression run is appended with:
- Timestamp (ISO 8601)
- Git branch and commit SHA
- Test pass/fail status
- Coverage metrics

---

## Regression Test Report
**Timestamp**: 2026-05-20 22:00:00
**Branch**: master
**Status**: ✅ PASS

### Test Results
| Metric | Value |
|--------|-------|
| Passed | 220 |
| Failed | 0 |
| Total | 220 |
| Coverage | ~85% |

### Test Files
| File | Tests |
|------|-------|
| api.test.js | 91 |
| components.test.jsx | 47 |
| useVisitStats.test.js | 57 |
| calculations.test.js | 10 |
| BirthInfoForm.test.jsx | 8 |
| DisclaimerModal.test.jsx | 8 |
| useAIRequestCooldown.test.js | 10 |
| useIntersectionObserver.test.jsx | 3 |

### Changes Since Last Report
- Removed Horoscope (运势) page
- Added Tarot Disclaimer modal
- Added Ziwei/Astrology AI interpretation with iztro + astronomy-engine
- Updated CLAUDE.md with new feature documentation

