import random
import shutil
import xml.etree.ElementTree as ET
from pathlib import Path


SOURCE_IMAGES = Path(r"C:\SIH_DATA\archive (1)\train\images")
SOURCE_XMLS = Path(r"C:\SIH_DATA\archive (1)\train\annotations\xmls")
OUTPUT = Path(r"C:\SIH_DATA\pothole_yolo")

RANDOM_SEED = 42


def convert_xml(xml_path):
    root = ET.parse(xml_path).getroot()

    width = int(root.findtext("size/width"))
    height = int(root.findtext("size/height"))

    labels = []

    for obj in root.findall("object"):
        class_name = obj.findtext("name", "").strip()

        # Only D40 means pothole.
        if class_name != "D40":
            continue

        box = obj.find("bndbox")

        xmin = float(box.findtext("xmin"))
        ymin = float(box.findtext("ymin"))
        xmax = float(box.findtext("xmax"))
        ymax = float(box.findtext("ymax"))

        x_center = ((xmin + xmax) / 2) / width
        y_center = ((ymin + ymax) / 2) / height
        box_width = (xmax - xmin) / width
        box_height = (ymax - ymin) / height

        labels.append(
            f"0 {x_center:.6f} {y_center:.6f} "
            f"{box_width:.6f} {box_height:.6f}"
        )

    return labels


def main():
    images = [
        path for path in SOURCE_IMAGES.iterdir()
        if path.suffix.lower() in {".jpg", ".jpeg", ".png"}
    ]

    random.seed(RANDOM_SEED)
    random.shuffle(images)

    train_end = int(len(images) * 0.8)
    val_end = int(len(images) * 0.9)

    splits = {
        "train": images[:train_end],
        "val": images[train_end:val_end],
        "test": images[val_end:],
    }

    total_potholes = 0

    for split_name, split_images in splits.items():
        image_output = OUTPUT / "images" / split_name
        label_output = OUTPUT / "labels" / split_name

        image_output.mkdir(parents=True, exist_ok=True)
        label_output.mkdir(parents=True, exist_ok=True)

        for image_path in split_images:
            xml_path = SOURCE_XMLS / f"{image_path.stem}.xml"

            if not xml_path.exists():
                print(f"Missing XML: {xml_path.name}")
                continue

            labels = convert_xml(xml_path)
            total_potholes += len(labels)

            shutil.copy2(image_path, image_output / image_path.name)

            label_path = label_output / f"{image_path.stem}.txt"
            label_path.write_text("\n".join(labels), encoding="utf-8")

    yaml_content = f"""path: {OUTPUT.as_posix()}
train: images/train
val: images/val
test: images/test

names:
  0: pothole
"""

    (OUTPUT / "data.yaml").write_text(yaml_content, encoding="utf-8")

    print("Dataset preparation completed.")
    print(f"Training images: {len(splits['train'])}")
    print(f"Validation images: {len(splits['val'])}")
    print(f"Testing images: {len(splits['test'])}")
    print(f"Total potholes: {total_potholes}")
    print(f"Output: {OUTPUT}")


if __name__ == "__main__":
    main()