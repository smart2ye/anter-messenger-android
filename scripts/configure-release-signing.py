#!/usr/bin/env python3
"""Inject stable release signing into the Expo-generated Android Gradle file."""

from pathlib import Path
import sys


def main() -> int:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: configure-release-signing.py <android/app/build.gradle>")

    path = Path(sys.argv[1])
    source = path.read_text(encoding="utf-8")
    if "ANTER_UPLOAD_STORE_FILE" in source:
        return 0

    marker = "    signingConfigs {\n"
    release_config = """        release {
            storeFile file(ANTER_UPLOAD_STORE_FILE)
            storePassword ANTER_UPLOAD_STORE_PASSWORD
            keyAlias ANTER_UPLOAD_KEY_ALIAS
            keyPassword ANTER_UPLOAD_KEY_PASSWORD
        }
"""
    if marker not in source:
        raise SystemExit("Could not find Android signingConfigs block")
    source = source.replace(marker, marker + release_config, 1)

    debug_release = "            signingConfig signingConfigs.debug"
    if debug_release not in source:
        raise SystemExit("Could not find Android release signing configuration")
    source = source.replace(debug_release, "            signingConfig signingConfigs.release", 1)
    path.write_text(source, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
