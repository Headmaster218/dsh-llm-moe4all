# Changelog

## 0.2.0-alpha.18

- Make the Windows installer use its bundled prebuilt plugin package instead of a floating GitHub source.
- Keep the bundled package in the target DSH home so deleting the extracted installer does not break the profile dependency.
- Replace prerelease-incompatible `releases/latest/download` README links with the Releases page.

## 0.2.0-alpha.15

- Add automatic plugin update discovery, progress, retry, and restart/refresh prompts through the public DSH Market API.
- Add a Release workflow that publishes a prebuilt package, SHA-256 hashes, and a one-click Windows installer ZIP.
- Expand the English and Chinese READMEs with catalog-ready installation, upgrade, uninstall, permissions, troubleshooting, and security guidance.

## 0.1.0-alpha.1

- Add the installable DSH bundle and default local MoE4All model route.
- Add connect, automatic, and managed engine lifecycle modes.
- Add loopback protection, health checks, process cleanup, and compatibility tests.
- Default to connection-only mode and the MoE4All `8080` port.
- Discover chat models from `/v1/models` and inject them into DSH's existing pi-ai adapter.
- Prevent duplicate engines by process identity, independent of listening IP or port.
- Gate automatic launch on more than 50% free RAM and live VRAM, with an explicit busy-machine prompt.
