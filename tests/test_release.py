import json
import os
from pathlib import Path
import shlex
import shutil
import subprocess
import tempfile
import unittest
import zipfile


class ReleaseTest(unittest.TestCase):
    def test_build_and_release_refresh_both_archives(self):
        source = Path(__file__).resolve().parent.parent
        with tempfile.TemporaryDirectory() as temporary:
            work = Path(temporary)
            project = work / "project"
            project.mkdir()
            for name in ("extension", "scripts"):
                shutil.copytree(source / name, project / name)
            for name in ("Makefile", "release", "README.md", ".gitignore"):
                shutil.copy2(source / name, project / name)

            def run(*command, env=None):
                return subprocess.check_output(
                    command, cwd=project, env=env, text=True, stderr=subprocess.STDOUT
                )

            run("git", "init", "-b", "main")
            run("git", "config", "user.name", "Release Test")
            run("git", "config", "user.email", "release-test@example.invalid")
            run("git", "add", ".")
            run("git", "commit", "-m", "Test fixture")
            run("git", "remote", "add", "origin", "https://github.com/example/test.git")

            commands = work / "bin"
            commands.mkdir()
            uploaded = work / "uploaded.zip"
            mocks = {
                "git": (
                    'if [ "$1" = push ]; then exit 0; fi\n'
                    f'exec {shlex.quote(shutil.which("git"))} "$@"\n'
                ),
                "gh": (
                    'case "$1 $2" in\n'
                    '  "auth status"|"release view"|"api --hostname") exit 0 ;;\n'
                    f'  "release upload") cp "$4" {shlex.quote(str(uploaded))} ;;\n'
                    '  *) exit 1 ;;\n'
                    'esac\n'
                ),
            }
            for name, body in mocks.items():
                command = commands / name
                command.write_text("#!/bin/sh\nset -eu\n" + body)
                command.chmod(0o755)
            environment = dict(os.environ, PATH=f"{commands}:{os.environ['PATH']}")

            root_zip = project / "trello-fix.zip"
            dist_zip = project / "dist" / "trello-fix.zip"
            dist_zip.parent.mkdir()
            for target in ("build", "release"):
                with self.subTest(target=target):
                    root_zip.write_bytes(b"stale root ZIP")
                    dist_zip.write_bytes(b"stale dist ZIP")
                    run("make", target, env=environment)
                    self.assertEqual(root_zip.read_bytes(), dist_zip.read_bytes())
                    with zipfile.ZipFile(root_zip) as archive:
                        self.assertIsNone(archive.testzip())
                        for path in (project / "extension").iterdir():
                            self.assertEqual(
                                archive.read(path.relative_to(project).as_posix()),
                                path.read_bytes(),
                            )
                    self.assertEqual(run("git", "status", "--porcelain"), "")
            self.assertEqual(uploaded.read_bytes(), dist_zip.read_bytes())
            version = json.loads((project / "extension/manifest.json").read_text())["version"]
            self.assertEqual(run("git", "rev-parse", f"v{version}"), run("git", "rev-parse", "HEAD"))


if __name__ == "__main__":
    unittest.main()
