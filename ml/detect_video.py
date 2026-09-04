from pathlib import Path

import cv2
from ultralytics import YOLO


BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "models" / "best.pt"
VIDEO_PATH = BASE_DIR / "input_videos" / "road.mp4"
OUTPUT_FOLDER = BASE_DIR / "detected_frames"
OUTPUT_VIDEO = BASE_DIR / "pothole_result.mp4"

CONFIDENCE = 0.25
CAPTURE_GAP_SECONDS = 2


def main():
    OUTPUT_FOLDER.mkdir(exist_ok=True)

    model = YOLO(str(MODEL_PATH))
    video = cv2.VideoCapture(str(VIDEO_PATH))

    if not video.isOpened():
        print("Error: road.mp4 could not be opened.")
        return

    fps = video.get(cv2.CAP_PROP_FPS)

    if fps <= 0:
        fps = 30

    width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))

    writer = cv2.VideoWriter(
        str(OUTPUT_VIDEO),
        cv2.VideoWriter_fourcc(*"mp4v"),
        fps,
        (width, height),
    )

    frame_number = 0
    last_capture_time = -CAPTURE_GAP_SECONDS
    captured_images = 0

    while True:
        success, frame = video.read()

        if not success:
            break

        frame_number += 1
        video_time = frame_number / fps

        results = model.predict(
            frame,
            conf=CONFIDENCE,
            device=0,
            verbose=False,
        )

        result = results[0]
        annotated_frame = result.plot()

        if result.boxes is not None and len(result.boxes) > 0:
            highest_confidence = float(
                result.boxes.conf.max().item()
            )

            enough_time_passed = (
                video_time - last_capture_time
                >= CAPTURE_GAP_SECONDS
            )

            if enough_time_passed:
                image_name = (
                    f"pothole_{frame_number}_"
                    f"{highest_confidence:.2f}.jpg"
                )

                image_path = OUTPUT_FOLDER / image_name

                cv2.imwrite(
                    str(image_path),
                    annotated_frame,
                )

                captured_images += 1
                last_capture_time = video_time

                print(f"Captured: {image_name}")

        writer.write(annotated_frame)

        cv2.imshow(
            "StreetSynapse Pothole Detection",
            annotated_frame,
        )

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    video.release()
    writer.release()
    cv2.destroyAllWindows()

    print("\nProcessing completed.")
    print(f"Images captured: {captured_images}")
    print(f"Images folder: {OUTPUT_FOLDER}")
    print(f"Result video: {OUTPUT_VIDEO}")


if __name__ == "__main__":
    main()