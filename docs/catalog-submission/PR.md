# Add Headmaster218/dsh-llm-moe4all

## Summary

Adds one model-category plugin connecting DeepSeek Harness to MoE4All's OpenAI-compatible API. The plugin includes local Engine lifecycle management, bounded GGUF discovery, model and Engine downloads, guarded startup, and a shared settings surface. Chat and tool processing remain on DSH's original pi-ai provider.

- Repository: https://github.com/Headmaster218/dsh-llm-moe4all
- First stable release: https://github.com/Headmaster218/dsh-llm-moe4all/releases/tag/release-0.2.0
- License: Apache-2.0, including bundled icon notices.
- Packaging: root `dsh.bundle` and `cordis.patch.yml`; official DSH packages stay peer dependencies.
- Compatibility CI: DSH 0.1.1-rc.2, 0.1.5-rc.3, and 0.2.0-rc.2. The 0.2.0-rc.2 smoke installs the built tarball and verifies authenticated plugin routes and native-provider model synchronization with a mock endpoint.
- Screenshots: root `screenshots.json` points to two complete repository images.
- Downloads: version-free prebuilt GitHub Release tarball; no npm listing claimed.
- Platform limits: automatic Engine installation is Windows x86_64; other platforms can connect to an existing service.

## Submission Scope

Copy `data/plugins/Headmaster218__dsh-llm-moe4all.yml` from this directory into the same path in `awesome-dsh-plugin/awesome-dsh-plugin`. The PR should add only that entry, not modify generated READMEs or other plugins.

Before submitting, confirm the stable Release exists, the `latest` tarball downloads successfully, and the repository has the `dsh-plugin` topic. This document prepares a submission; it does not claim catalog acceptance.
