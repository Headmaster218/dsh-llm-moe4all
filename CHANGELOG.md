# Changelog

## 0.1.0-alpha.1

- Add the installable DSH bundle and default local MoE4All model route.
- Add connect, automatic, and managed engine lifecycle modes.
- Add loopback protection, health checks, process cleanup, and compatibility tests.
- Default to connection-only mode and the MoE4All `8080` port.
- Discover chat models from `/v1/models` and inject them into DSH's existing pi-ai adapter.
- Prevent duplicate engines by process identity, independent of listening IP or port.
- Gate automatic launch on more than 50% free RAM and live VRAM, with an explicit busy-machine prompt.
