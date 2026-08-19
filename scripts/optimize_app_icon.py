from pathlib import Path

from PIL import Image


PROJECT = Path("/home/ubuntu/anter-messenger-android")
SOURCE = Path("/home/ubuntu/webdev-static-assets/anter-messenger-icon.png")
TARGETS = [
    PROJECT / "assets/images/icon.png",
    PROJECT / "assets/images/splash-icon.png",
    PROJECT / "assets/images/favicon.png",
    PROJECT / "assets/images/android-icon-foreground.png",
]


def main() -> None:
    with Image.open(SOURCE) as original:
        image = original.convert("RGBA")
        image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        for target in TARGETS:
            image.save(target, format="PNG", optimize=True, compress_level=9)
            print(f"{target.name}: {target.stat().st_size} bytes")


if __name__ == "__main__":
    main()
