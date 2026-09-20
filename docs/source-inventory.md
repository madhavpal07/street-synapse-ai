# SIH source inventory

Imported on 20 September 2026 for madhavpal07/street-synapse-ai.

| Source | Destination | Treatment |
| --- | --- | --- |
| Existing main commit 42f08b96d1d8d7039bd4bb258ea54ff37ac6bca0 | Original module paths | Preserved; docs/config updates recorded in the import commit |
| streetsynapse-bus-tracker.zip, saved version 2 | bus-tracker/ | Integrated app layout and lockfile retained |
| citytransit-live (1).zip | designs/citytransit-prototype/ | Later standalone design retained and labelled mock-data reference |
| citytransit-live.zip | Not duplicated | Seven files differ; older version remains in the original source archive |
| potholes(1).html | web-dashboard/authority/index.html | Latest saved map-reload version; adapted to the existing FastAPI list endpoint |
| potholes.html | Not duplicated | Superseded by the map-reload version |
| Pasted code(1).py | ml/live_phone_detection.py | Actual Python content imported despite original MIME label |
| SAWAARI_Tech_Flowchart.svg | docs/images/sawaari-tech-flowchart.svg | Preserved reference diagram |
| X Factor SIH PPT.pptx | Pending upload | Binary transfer did not finish; not included in this code import |
| feature/database commit 37feed06c776a4598d61d9c3a4160952d414fdb7 | backend/app/database.py | Source preserved; SQLite database binary omitted |

The feature/road-ai source tree contains no additional changed blobs relative
to inspected main. Other module branches pointed to the earlier starter commit.

## Added organization and compatibility

- Root project index, source/status/setup/security notes and Windows launchers.
- Expanded ignore rules for evidence, databases, outputs and generated files.
- Authority dashboard reads /api/v1/incidents with field normalization.
- Backend CORS allows the two documented local dashboard origins on port 5500.
- Database dependency file and bus-tracker test workflow.

## Explicitly excluded

Canopy Climb, NGG CRM, corn-leaf disease detection, unrelated coursework,
personal photographs, credentials, raw datasets/videos, generated evidence,
local databases and installed dependencies.

## Not available

The user's laptop is not accessible from this workspace. Trained best.pt,
the latest local offline/Streamlit application, any later ML/backend bridge,
and newer teammate source were not supplied. No replacement code is presented
as a recovered original. Original archives and other branches were not deleted.
