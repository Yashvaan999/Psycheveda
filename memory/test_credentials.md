# Psycheveda — Test Credentials

## Existing Test Account (created via curl during dev)
- Email: `seeker@psyche.app`
- Password: `Test1234`
- Note: This account already has 2 journal entries logged for today (will trigger daily quota UI).

## Recommended Fresh Account for Full E2E Testing
- Create a new account via the Register tab to exercise the full Onboarding → Goals → Dashboard flow.
- Suggested: `tester+<timestamp>@psyche.app` / `Test1234`

## API Base
- Backend URL is read from `frontend/.env` → `REACT_APP_BACKEND_URL`
- All API endpoints are prefixed with `/api`
