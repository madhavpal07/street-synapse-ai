# Machine-learning module

## Initial objective

Train and evaluate a compact road-hazard model with these classes:

- `pothole`
- `waterlogging`
- `damaged_road`

Do not add garbage overflow or streetlights until the first three classes work on an unseen route.

## Required handoff to Android

The ML owners must provide:

1. Exported ONNX or LiteRT/TFLite model
2. Class names in exact output order
3. Input image width, height, normalization, and color format
4. Confidence and non-maximum-suppression settings
5. Model version string
6. Validation report and unseen-route test results

Large datasets and weights must stay outside normal Git history. Store download instructions and a checksum here; use approved shared storage or Git LFS later.

