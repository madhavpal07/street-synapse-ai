# Checks

Run from the repository root:

```sh
cd backend
python -m pytest
cd ../bus-tracker
npm test
npm run build
npm run test:app
```

Backend test code lives in backend/tests/, and tracker tests in bus-tracker/tests/.
These checks use synthetic test inputs and do not validate real phone hardware,
trained model accuracy or production deployment. See docs/verification.md.

