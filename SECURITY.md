# Prototype security notes

Never commit real .env files, driver/dashboard keys, API credentials, private
database snapshots, location traces, raw videos or generated evidence.

bus-tracker/scripts/setup.mjs generates fresh local keys and does not overwrite
an existing .env. Passenger positions are intentionally public to people who
can reach the tracker service. Use test devices and consent for demonstrations.

The FastAPI incident service and Python camera server are development
prototypes without device/operator authentication. Keep them bound to loopback.
Before internet exposure add access control, request size/rate limits, safe
evidence storage, retention controls and TLS. A tunnel alone is not authentication.

Only load trusted model weights. Review local changes before committing.
A secret scan cannot prove that a repository is completely free of sensitive data.
If a credential is ever committed, revoke/rotate it; removing the visible file
does not remove it from Git history.

No new license was imposed on the team source. Check dataset, model and
third-party dependency licenses before redistribution.
