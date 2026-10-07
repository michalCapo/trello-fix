.DEFAULT_GOAL := help
.PHONY: help build release

help:
	@printf 'Available actions:\n  make help     Show this list\n  make build    Create the extension ZIP only\n  make release  Build, push, and publish a GitHub release\n'

build:
	@python3 scripts/build.py

release:
	@./release
