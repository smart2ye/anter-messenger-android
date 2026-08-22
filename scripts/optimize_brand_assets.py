from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path("/home/ubuntu/webdev-static-assets/anter-messenger-icon-v2.png")
TARGETS = (
    PROJECT_ROOT / "assets/images/icon.png",
    PROJECT_ROOT / "assets/images/splash-icon.png",
    PROJECT_ROOT / "assets/images/favicon.png",
    PROJECT_ROOT / "assets/images/android-icon-foreground.png",
)


def main() -> None:
    image = Image.open(SOURCE).convert("RGBA")
    image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
    optimized = image.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
    for target in TARGETS:
        optimized.save(target, format="PNG", optimize=True, compress_level=9)
        print(f"{target.name}: {target.stat().st_size} bytes")


if __name__ == "__main__":
    main()
