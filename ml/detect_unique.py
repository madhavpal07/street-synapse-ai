from pathlib import Path

import cv2
from ultralytics import YOLO


BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "models" / "best.pt"
VIDEO_PATH = BASE_DIR / "input_videos" / "road.mp4"
OUTPUT_FOLDER = BASE_DIR / "unique_frames"
OUTPUT_VIDEO = BASE_DIR / "unique_result.mp4"


def main():
    OUTPUT_FOLDER.mkdir(exist_ok=True)

    model = YOLO(str(MODEL_PATH))
    video = cv2.VideoCapture(str(VIDEO_PATH))

    if not video.isOpened():
        print("Video could not be opened.")
        return

    fps = video.get(cv2.CAP_PROP_FPS) or 30
    width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))

    writer = cv2.VideoWriter(
        str(OUTPUT_VIDEO),
        cv2.VideoWriter_fourcc(*"mp4v"),
        fps,
        (width, height),
    )

    saved_track_ids = set()

    while True:
        success, frame = video.read()

        if not success:
            break

        results = model.track(
            frame,
            persist=True,
            tracker="bytetrack.yaml",
            conf=0.25,
            device=0,
            verbose=False,
        )

        result = results[0]
        annotated_frame = result.plot()
        boxes = result.boxes

        if boxes is not None and boxes.id is not None:
            track_ids = boxes.id.int().cpu().tolist()
            confidences = boxes.conf.cpu().tolist()

            for track_id, confidence in zip(
                track_ids,
                confidences,
            ):
                if track_id in saved_track_ids:
                    continue

                image_name = (
                    f"pothole_id_{track_id}_"
                    f"confidence_{confidence:.2f}.jpg"
                )

                cv2.imwrite(
                    str(OUTPUT_FOLDER / image_name),
                    annotated_frame,
                )

                saved_track_ids.add(track_id)
                print(f"Unique pothole captured: {image_name}")

        writer.write(annotated_frame)
        cv2.imshow("Unique Pothole Detection", annotated_frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    video.release()
    writer.release()
    cv2.destroyAllWindows()

    print("\nProcessing completed.")
    print(f"Unique potholes captured: {len(saved_track_ids)}")
    print(f"Images: {OUTPUT_FOLDER}")
    print(f"Video: {OUTPUT_VIDEO}")


if __name__ == "__main__":
    main()