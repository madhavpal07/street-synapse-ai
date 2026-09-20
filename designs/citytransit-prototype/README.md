# CityTransit passenger design reference

Preserved from citytransit-live (1).zip. This is the original standalone
Next.js design prototype with mock transit data, not the integrated live app.
Use ../../bus-tracker/ for the working passenger/driver/fleet demo.

Both original ZIPs were compared. The later source was selected; it differs
in seven source files. The older ZIP was not uploaded as a second application.
No original archive was deleted.

The original dependency manifests, components and lockfiles are preserved.
The source uses Next.js 15, whereas the integrated tracker has its own pinned stack.
Mock ETAs, fares and locations in this folder must not be presented as real data.
The inherited .env.example contains placeholders only. No active Gemini request
was found in the application source, so no real API key is needed for this UI.

If investigating this prototype independently, install its dependencies inside
this folder and run npm run dev -- --port 3001. Its independent build has not
been certified by the integrated bus-tracker checks. Do not mix node_modules
or lockfiles between these two apps.
