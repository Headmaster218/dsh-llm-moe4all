window.__ModuleLoader__.load({
	id: "dsh-llm-moe4all",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperties(exports, {
			__esModule: { value: true },
			[Symbol.toStringTag]: { value: "Module" }
		});
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/engine-api.ts
		async function json(path, init) {
			const response = await fetch(path, {
				cache: "no-store",
				...init,
				headers: {
					accept: "application/json",
					...init?.body === void 0 ? {} : { "content-type": "application/json" },
					...init?.headers
				}
			});
			const value = await response.json();
			if (!response.ok) throw new Error(value.message ?? `MoE4All control request returned HTTP ${response.status}`);
			return value;
		}
		function fetchEngineStatus() {
			return json("/api/moe4all/status");
		}
		function startEngine(force = false) {
			return json("/api/moe4all/start", {
				method: "POST",
				body: JSON.stringify({ force })
			});
		}
		function fetchReleaseStatus(force = false) {
			return json(`/api/moe4all/release${force ? "?force=1" : ""}`);
		}
		async function installLatestEngine() {
			await json("/api/moe4all/install", {
				method: "POST",
				body: "{}"
			});
		}
		async function cancelEngineInstall() {
			return (await json("/api/moe4all/install-cancel", {
				method: "POST",
				body: "{}"
			})).install;
		}
		async function deleteEngineVersion(tag) {
			await json("/api/moe4all/engine-delete", {
				method: "POST",
				body: JSON.stringify({ tag })
			});
		}
		async function scanModelLibrary(directory, selectedPaths) {
			return (await json("/api/moe4all/model-library", {
				method: "POST",
				body: JSON.stringify({
					directory,
					selectedPaths
				})
			})).library;
		}
		async function validateModelPaths(paths) {
			return (await json("/api/moe4all/validate-models", {
				method: "POST",
				body: JSON.stringify({ paths })
			})).paths;
		}
		async function pickModelFile() {
			return (await json("/api/moe4all/pick-model-file", {
				method: "POST",
				body: "{}"
			})).path;
		}
		function fetchModelCatalog() {
			return json("/api/moe4all/model-catalog");
		}
		async function fetchModelDownload() {
			return (await json("/api/moe4all/model-download")).download;
		}
		async function startModelDownload(modelId, directory) {
			return (await json("/api/moe4all/model-download", {
				method: "POST",
				body: JSON.stringify({
					modelId,
					directory
				})
			})).download;
		}
		async function cancelModelDownload() {
			return (await json("/api/moe4all/model-download-cancel", {
				method: "POST",
				body: "{}"
			})).download;
		}
		//#endregion
		//#region src/client/EngineStartupOverlay.tsx
		function ModalFrame({ title, children }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "m4a-overlay",
				role: "presentation",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
					className: "m4a-overlay__dialog",
					role: "dialog",
					"aria-modal": "true",
					"aria-labelledby": "m4a-overlay-title",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						id: "m4a-overlay-title",
						className: "m4a-overlay__title",
						children: title
					}), children]
				})
			});
		}
		function formatBytes$1(bytes) {
			if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`;
			if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MiB`;
			return `${(bytes / 1024 ** 3).toFixed(2)} GiB`;
		}
		function EngineStartupOverlay({ scope, t }) {
			const snapshot = (0, react.useSyncExternalStore)((listener) => scope.subscribe(listener), () => scope.getSnapshot(), () => scope.getSnapshot());
			const [status, setStatus] = (0, react.useState)(null);
			const [busy, setBusy] = (0, react.useState)(false);
			const [dismissed, setDismissed] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)("");
			(0, react.useEffect)(() => {
				let disposed = false;
				const poll = async () => {
					try {
						const next = await fetchEngineStatus();
						if (!disposed) setStatus(next);
					} catch (cause) {
						if (!disposed) setError(cause instanceof Error ? cause.message : String(cause));
					}
				};
				poll();
				const timer = window.setInterval(() => {
					poll();
				}, 1500);
				return () => {
					disposed = true;
					window.clearInterval(timer);
				};
			}, []);
			const launch = async (force, remember = false) => {
				setBusy(true);
				setError("");
				try {
					const result = await startEngine(force);
					setStatus(result.status);
					if (result.ok && remember) await scope.set("mode", "auto");
					if (result.ok) setDismissed(true);
				} catch (cause) {
					setError(cause instanceof Error ? cause.message : String(cause));
				} finally {
					setBusy(false);
				}
			};
			const config = snapshot.value;
			if (config === void 0 || status === null || config.mode === "connect") return null;
			if (status.phase === "missing-executable" || status.phase === "missing-arguments") return null;
			if (status.phase === "starting" && !dismissed) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(ModalFrame, {
				title: t("startupProgressTitle"),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "m4a-overlay__body",
						children: t("startupProgressBody")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-overlay__progress",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("progress", {}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: status.message ?? t("startingNow") })]
					}),
					status.adjustedRamBudgetBytes === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						className: "m4a-overlay__notice",
						children: [
							t("ramBudgetAdjusted"),
							" ",
							formatBytes$1(status.adjustedRamBudgetBytes)
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-overlay__startup-output",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "m4a-settings__label",
							children: t("startupOutput")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", { children: (status.startupLines ?? []).join("\n") || t("checkingEngine") })]
					})
				]
			});
			if ((status.phase === "error" || status.phase === "duplicate-process") && !dismissed) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(ModalFrame, {
				title: t("startupFailedTitle"),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "m4a-overlay__error",
						children: status.message ?? error
					}),
					(status.startupLines?.length ?? 0) === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-overlay__startup-output",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "m4a-settings__label",
							children: t("startupOutput")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", { children: status.startupLines.join("\n") })]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-overlay__actions",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "m4a-settings__button",
							disabled: busy,
							onClick: () => {
								setDismissed(true);
							},
							children: t("notNow")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "m4a-settings__button m4a-settings__button--primary",
							disabled: busy,
							onClick: () => {
								launch(false);
							},
							children: busy ? t("startingNow") : t("retryStart")
						})]
					})
				]
			});
			if (status.phase === "resource-warning" && !dismissed) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(ModalFrame, {
				title: t("resourceWarningTitle"),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "m4a-overlay__body",
						children: t("resourceWarningBody")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: "m4a-overlay__reasons",
						children: (status.reasons ?? []).map((reason) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: reason }, reason))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-overlay__actions",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "m4a-settings__button",
							disabled: busy,
							onClick: () => {
								setDismissed(true);
							},
							children: t("notNow")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "m4a-settings__button m4a-settings__button--danger",
							disabled: busy,
							onClick: () => {
								launch(true);
							},
							children: busy ? t("startingNow") : t("startAnyway")
						})]
					})
				]
			});
			if (!dismissed && !status.ready && status.phase === "offline" && config.mode !== "auto") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(ModalFrame, {
				title: t("startupPromptTitle"),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "m4a-overlay__body",
						children: t("startupPromptBody")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
						className: "m4a-overlay__endpoint",
						children: status.endpoint
					}),
					error === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "m4a-overlay__error",
						children: error
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-overlay__actions m4a-overlay__actions--three",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "m4a-settings__button",
								disabled: busy,
								onClick: () => {
									setDismissed(true);
								},
								children: t("notNow")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "m4a-settings__button",
								disabled: busy,
								onClick: () => {
									launch(false);
								},
								children: t("startThisTime")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "m4a-settings__button m4a-settings__button--primary",
								disabled: busy,
								onClick: () => {
									launch(false, true);
								},
								children: busy ? t("startingNow") : t("startAndRemember")
							})
						]
					})
				]
			});
			return null;
		}
		//#endregion
		//#region src/client/Moe4AllOnboarding.tsx
		function Moe4AllOnboarding({ scope, complete, openSection }) {
			const config = (0, react.useSyncExternalStore)((listener) => scope.subscribe(listener), () => scope.getSnapshot(), () => scope.getSnapshot()).value;
			const needsSetup = config !== void 0 && config.mode !== "connect" && (config.executable?.trim() === "" || (config.arguments?.length ?? 0) === 0);
			(0, react.useEffect)(() => {
				if (config === void 0) return;
				if (needsSetup) openSection("moe4all");
				complete();
			}, [
				complete,
				config,
				needsSetup,
				openSection
			]);
			return null;
		}
		//#endregion
		//#region src/client/engine-setup.ts
		function normalizeSetupPath(value) {
			const trimmed = value.trim();
			if (trimmed.length >= 2) {
				const first = trimmed[0];
				const last = trimmed.at(-1);
				if (first === "\"" && last === "\"" || first === "'" && last === "'") return trimmed.slice(1, -1).trim();
			}
			return trimmed;
		}
		function positiveInteger(value, message) {
			if (!Number.isSafeInteger(value) || value < 1) throw new Error(message);
		}
		function nonNegativeInteger(value, message) {
			if (!Number.isSafeInteger(value) || value < 0) throw new Error(message);
		}
		function optionValue(arguments_, option) {
			const index = arguments_.lastIndexOf(option);
			return index < 0 ? void 0 : arguments_[index + 1];
		}
		function setValue(arguments_, path) {
			for (let index = 0; index < arguments_.length; index += 1) {
				const argument = arguments_[index];
				if (argument === "--set") {
					const value = arguments_[index + 1];
					if (value?.startsWith(`${path}=`)) return value.slice(path.length + 1);
					index += 1;
					continue;
				}
				const inline = /^--set=(.+)$/u.exec(argument)?.[1];
				if (inline?.startsWith(`${path}=`)) return inline.slice(path.length + 1);
			}
		}
		function integer(value, fallback) {
			const parsed = Number(value);
			return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : fallback;
		}
		function parseEngineArguments(arguments_) {
			const sessionDirectory = setValue(arguments_, "kv.session_cache_dir") ?? "kv-sessions";
			const model = [...arguments_].reverse().find((value) => /\.gguf$/iu.test(value)) ?? "";
			const mtpModel = setValue(arguments_, "spec.draft") ?? "";
			return {
				model: model === mtpModel ? "" : model,
				visionModel: optionValue(arguments_, "--mmproj") ?? "",
				embeddingModel: optionValue(arguments_, "--embedding-model") ?? "",
				mtpModel,
				embeddingIdleTimeout: integer(optionValue(arguments_, "--embedding-idle-timeout"), 60),
				parallel: Math.max(1, integer(optionValue(arguments_, "--parallel"), 1)),
				profile: setValue(arguments_, "device.auto_profile") === "aggressive" ? "aggressive" : "conservative",
				mtp: setValue(arguments_, "spec.mtp") === "true",
				sessionCacheEnabled: sessionDirectory !== "",
				sessionCache: {
					directory: sessionDirectory || "kv-sessions",
					maxSize: setValue(arguments_, "kv.session_cache_max") ?? "10g",
					idleSeconds: integer(setValue(arguments_, "kv.session_idle_secs"), 90),
					ttlHours: integer(setValue(arguments_, "kv.session_cache_ttl_hours"), 24)
				}
			};
		}
		function buildEngineArguments(values) {
			const model = normalizeSetupPath(values.model);
			const visionModel = normalizeSetupPath(values.visionModel ?? "");
			const embeddingModel = normalizeSetupPath(values.embeddingModel ?? "");
			const mtpModel = normalizeSetupPath(values.mtpModel ?? "");
			const host = values.host.trim();
			if (model === "") throw new Error("A model GGUF path is required.");
			if (host === "" || /\s/u.test(host)) throw new Error("A valid listen host is required.");
			if (!Number.isSafeInteger(values.port) || values.port < 1 || values.port > 65535) throw new Error("The listen port must be between 1 and 65535.");
			positiveInteger(values.contextWindow, "The context window must be a positive token count.");
			positiveInteger(values.maxTokens, "The maximum output must be a positive token count.");
			positiveInteger(values.parallel, "Concurrent slots must be a positive integer.");
			const arguments_ = [
				"serve",
				"--addr",
				`${host}:${values.port}`,
				"--parallel",
				String(values.parallel),
				"--ctx",
				String(values.contextWindow),
				"--max-new",
				String(values.maxTokens)
			];
			if (values.profile === "aggressive") arguments_.push("--set", "device.auto_profile=aggressive");
			if (values.mtp) {
				if (mtpModel === "") throw new Error("An MTP head GGUF path is required when MTP is enabled.");
				arguments_.push("--set", "spec.mtp=true", "--set", `spec.draft=${mtpModel}`);
			}
			if (visionModel !== "") arguments_.push("--mmproj", visionModel);
			if (embeddingModel !== "") {
				const idleTimeout = values.embeddingIdleTimeout ?? 60;
				nonNegativeInteger(idleTimeout, "The embedding idle timeout must be zero or a positive integer.");
				arguments_.push("--embedding-model", embeddingModel, "--embedding-idle-timeout", String(idleTimeout));
			}
			if (values.sessionCache !== void 0) {
				const directory = normalizeSetupPath(values.sessionCache.directory);
				const maxSize = values.sessionCache.maxSize.trim();
				if (directory === "") throw new Error("A KV cache directory is required when session caching is enabled.");
				if (!/^\d+(?:\.\d+)?\s*(?:[kmgt]i?b?)?$/iu.test(maxSize)) throw new Error("The KV cache size must be an absolute size such as 10g or 512MiB.");
				nonNegativeInteger(values.sessionCache.idleSeconds, "The KV cache idle timeout must be zero or a positive integer.");
				nonNegativeInteger(values.sessionCache.ttlHours, "The KV cache cleanup age must be zero or a positive integer.");
				arguments_.push("--set", "kv.type_k=q8_0", "--set", "kv.type_v=q8_0", "--set", `kv.session_cache_dir=${directory}`, "--set", `kv.session_idle_secs=${values.sessionCache.idleSeconds}`, "--set", `kv.session_cache_max=${maxSize}`, "--set", `kv.session_cache_ttl_hours=${values.sessionCache.ttlHours}`);
			} else arguments_.push("--set", "kv.session_cache_dir=");
			arguments_.push(model);
			return arguments_;
		}
		//#endregion
		//#region src/client/token-value.ts
		function parseTokenValue(input) {
			const value = input.trim().replaceAll("_", "");
			const match = /^(\d+(?:\.\d+)?)\s*([km]?)$/iu.exec(value);
			if (match === null) return void 0;
			const scalar = Number(match[1]);
			const suffix = match[2].toLowerCase();
			const tokens = scalar * (suffix === "k" ? 1024 : suffix === "m" ? 1024 ** 2 : 1);
			if (!Number.isSafeInteger(tokens) || tokens < 1) return void 0;
			return tokens;
		}
		function formatTokenValue(tokens) {
			if (tokens >= 1024 && tokens % 1024 === 0) return `${tokens / 1024}k`;
			return String(tokens);
		}
		//#endregion
		//#region src/client/Moe4AllSettings.tsx
		function same(left, right) {
			return JSON.stringify(left) === JSON.stringify(right);
		}
		function resolved(value) {
			const mode = value.mode === "managed" ? "prompt" : value.mode;
			return {
				...value,
				mode
			};
		}
		function Field({ label, wide = false, hint, children }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				className: `m4a-settings__field${wide ? " m4a-settings__field--wide" : ""}`,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "m4a-settings__label",
						children: label
					}),
					children,
					hint === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "m4a-settings__hint",
						children: hint
					})
				]
			});
		}
		function Check({ checked, disabled, label, onChange }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				className: "m4a-settings__check",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					type: "checkbox",
					checked,
					disabled,
					onChange: (event) => {
						onChange(event.target.checked);
					}
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label })]
			});
		}
		function TokenInput({ value, disabled, onChange }) {
			const [text, setText] = (0, react.useState)(formatTokenValue(value));
			const valid = parseTokenValue(text) !== void 0;
			(0, react.useEffect)(() => {
				setText(formatTokenValue(value));
			}, [value]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
				className: `m4a-settings__input${valid || text === "" ? "" : " m4a-settings__input--invalid"}`,
				type: "text",
				inputMode: "decimal",
				value: text,
				disabled,
				placeholder: "160k",
				onChange: (event) => {
					const next = event.target.value;
					setText(next);
					const parsed = parseTokenValue(next);
					if (parsed !== void 0) onChange(parsed);
				},
				onBlur: () => {
					const parsed = parseTokenValue(text);
					setText(parsed === void 0 ? formatTokenValue(value) : text.trim().toLowerCase());
				}
			});
		}
		function statusClass(status) {
			if (status?.ready === true) return "ready";
			if (status?.phase === "starting" || status?.phase === "checking") return "busy";
			if (status?.phase === "resource-warning") return "warning";
			if (status?.phase === "error" || status?.phase === "duplicate-process") return "error";
			return "offline";
		}
		function formatBytes(bytes) {
			if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`;
			if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MiB`;
			return `${(bytes / 1024 ** 3).toFixed(2)} GiB`;
		}
		function fileName(path) {
			return path.split(/[\\/]/u).at(-1) ?? path;
		}
		function samePath(left, right) {
			return left.replaceAll("/", "\\").toLowerCase() === right.replaceAll("/", "\\").toLowerCase();
		}
		function activeEngineInstall(release) {
			return release !== null && [
				"checking",
				"downloading",
				"verifying",
				"extracting",
				"finalizing"
			].includes(release.install.stage);
		}
		function activeModelDownload(download) {
			return download.stage === "downloading";
		}
		function recommendationFor(model, recommendations) {
			return recommendations.find((item) => item.kind === model.kind && item.family === model.family && (item.files.some((file) => file.name.toLowerCase() === fileName(model.path).toLowerCase()) || item.totalBytes === model.sizeBytes));
		}
		function libraryRows(models, recommendations) {
			const installedRecommendations = /* @__PURE__ */ new Set();
			const rows = models.map((model) => {
				const recommendation = recommendationFor(model, recommendations);
				if (recommendation !== void 0) installedRecommendations.add(recommendation.id);
				return {
					key: `local:${model.id}`,
					family: model.family,
					kind: model.kind,
					name: recommendation?.name ?? model.name,
					quantization: model.quantization,
					sizeBytes: model.sizeBytes,
					fileCount: model.fileCount,
					path: model.path,
					...recommendation === void 0 ? {} : { recommendation }
				};
			});
			for (const recommendation of recommendations) {
				if (installedRecommendations.has(recommendation.id)) continue;
				rows.push({
					key: `recommended:${recommendation.id}`,
					family: recommendation.family,
					kind: recommendation.kind,
					name: recommendation.name,
					quantization: recommendation.quantization,
					sizeBytes: recommendation.totalBytes,
					fileCount: recommendation.files.length,
					recommendation
				});
			}
			const rank = {
				main: 0,
				vision: 1,
				mtp: 2,
				embedding: 3
			};
			const familyRank = /* @__PURE__ */ new Map();
			for (const recommendation of recommendations) if (!familyRank.has(recommendation.family)) familyRank.set(recommendation.family, familyRank.size);
			return rows.sort((left, right) => (familyRank.get(left.family) ?? Number.MAX_SAFE_INTEGER) - (familyRank.get(right.family) ?? Number.MAX_SAFE_INTEGER) || left.family.localeCompare(right.family, void 0, {
				numeric: true,
				sensitivity: "base"
			}) || rank[left.kind] - rank[right.kind] || left.name.localeCompare(right.name, void 0, {
				numeric: true,
				sensitivity: "base"
			}));
		}
		function pathForKind(setup, kind) {
			if (kind === "main") return setup.model;
			if (kind === "vision") return setup.visionModel;
			if (kind === "embedding") return setup.embeddingModel;
			return setup.mtpModel;
		}
		function ModelSelection({ kind, path, disabled, t, onChoose, onClear }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "m4a-current-model",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "m4a-current-model__body",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "m4a-settings__label",
							children: kind === "main" ? t("mainModel") : kind === "vision" ? t("visionModel") : kind === "embedding" ? t("embeddingModel") : t("mtpModel")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: path === "" ? t("notSelected") : fileName(path) }),
						path === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
							title: path,
							children: path
						})
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "m4a-current-model__actions",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "m4a-settings__button",
						disabled,
						onClick: onChoose,
						children: t("chooseFile")
					}), kind === "main" || path === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "m4a-settings__button",
						disabled,
						onClick: onClear,
						children: t("removeSelection")
					})]
				})]
			});
		}
		function Moe4AllSettings(props) {
			const { t, useMoe4AllSettings, save, pickDirectory } = props;
			const snapshot = useMoe4AllSettings((value) => value);
			const initial = snapshot.value === void 0 ? null : resolved(snapshot.value);
			const [draft, setDraft] = (0, react.useState)(initial);
			const [setup, setSetup] = (0, react.useState)(() => parseEngineArguments(initial?.arguments ?? []));
			const [saving, setSaving] = (0, react.useState)(false);
			const [acting, setActing] = (0, react.useState)(false);
			const [status, setStatus] = (0, react.useState)(null);
			const [release, setRelease] = (0, react.useState)(null);
			const [recommendations, setRecommendations] = (0, react.useState)([]);
			const [library, setLibrary] = (0, react.useState)({
				directory: "",
				models: []
			});
			const [libraryLoading, setLibraryLoading] = (0, react.useState)(false);
			const [modelDownload, setModelDownload] = (0, react.useState)({
				stage: "idle",
				downloadedBytes: 0
			});
			const [nativeFilePicker, setNativeFilePicker] = (0, react.useState)(false);
			const [engineInstalling, setEngineInstalling] = (0, react.useState)(false);
			const [modelDownloading, setModelDownloading] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)("");
			const [confirmBusy, setConfirmBusy] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				if (!saving && snapshot.value !== void 0) {
					const next = resolved(snapshot.value);
					setDraft(next);
					setSetup(parseEngineArguments(next.arguments));
				}
			}, [
				saving,
				snapshot.revision,
				snapshot.value
			]);
			(0, react.useEffect)(() => {
				let disposed = false;
				const poll = async () => {
					try {
						const next = await fetchEngineStatus();
						if (!disposed) setStatus(next);
					} catch (cause) {
						if (!disposed) setError(cause instanceof Error ? cause.message : String(cause));
					}
				};
				poll();
				const timer = window.setInterval(() => {
					poll();
				}, 2e3);
				return () => {
					disposed = true;
					window.clearInterval(timer);
				};
			}, []);
			(0, react.useEffect)(() => {
				let disposed = false;
				fetchReleaseStatus().then((next) => {
					if (!disposed) setRelease(next);
				}).catch((cause) => {
					if (!disposed) setError(cause instanceof Error ? cause.message : String(cause));
				});
				fetchModelCatalog().then((next) => {
					if (disposed) return;
					setRecommendations(next.models);
					setModelDownload(next.download);
					setNativeFilePicker(next.capabilities.nativeFilePicker);
				}).catch((cause) => {
					if (!disposed) setError(cause instanceof Error ? cause.message : String(cause));
				});
				return () => {
					disposed = true;
				};
			}, []);
			const selectedPaths = (0, react.useMemo)(() => [
				setup.model,
				setup.visionModel,
				setup.embeddingModel,
				setup.mtpModel
			].filter(Boolean), [setup]);
			const refreshLibrary = (0, react.useCallback)(async (directory = draft?.modelDirectory ?? "", paths = selectedPaths) => {
				setLibraryLoading(true);
				try {
					setLibrary(await scanModelLibrary(directory, paths));
				} catch (cause) {
					setError(cause instanceof Error ? cause.message : String(cause));
				} finally {
					setLibraryLoading(false);
				}
			}, [draft?.modelDirectory, selectedPaths]);
			(0, react.useEffect)(() => {
				refreshLibrary();
			}, [snapshot.revision]);
			const current = snapshot.value === void 0 ? null : resolved(snapshot.value);
			const currentSetup = current === null ? null : parseEngineArguments(current.arguments);
			const dirty = draft !== null && current !== null && (!same(draft, current) || !same(setup, currentSetup));
			const rows = (0, react.useMemo)(() => libraryRows(library.models, recommendations), [library.models, recommendations]);
			const groupedRows = (0, react.useMemo)(() => {
				const result = /* @__PURE__ */ new Map();
				for (const row of rows) result.set(row.family, [...result.get(row.family) ?? [], row]);
				return [...result.entries()];
			}, [rows]);
			if (snapshot.status === "loading" || draft === null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: "m4a-settings__message",
				children: t("loading")
			});
			if (snapshot.status === "unavailable") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: "m4a-settings__message",
				children: t("unavailable")
			});
			const disabled = saving || acting || !snapshot.writable;
			const setField = (field, value) => {
				setDraft((previous) => previous === null ? previous : {
					...previous,
					[field]: value
				});
			};
			const numberField = (field, value) => {
				const parsed = Number(value);
				if (Number.isFinite(parsed)) setField(field, parsed);
			};
			const setSetupField = (field, value) => {
				setSetup((previous) => ({
					...previous,
					[field]: value
				}));
			};
			const persist = async (next) => {
				setSaving(true);
				setError("");
				try {
					await save(next);
				} finally {
					setSaving(false);
				}
			};
			const composed = async () => {
				if (draft.mode === "connect") return draft;
				const paths = await validateModelPaths({
					main: setup.model,
					...setup.visionModel === "" ? {} : { vision: setup.visionModel },
					...setup.embeddingModel === "" ? {} : { embedding: setup.embeddingModel },
					...setup.mtp && setup.mtpModel !== "" ? { mtp: setup.mtpModel } : {}
				});
				const arguments_ = buildEngineArguments({
					model: paths.main,
					...paths.vision === void 0 ? {} : { visionModel: paths.vision },
					...paths.embedding === void 0 ? {} : {
						embeddingModel: paths.embedding,
						embeddingIdleTimeout: setup.embeddingIdleTimeout
					},
					...paths.mtp === void 0 ? {} : { mtpModel: paths.mtp },
					host: draft.host,
					port: draft.port,
					contextWindow: draft.contextWindow,
					maxTokens: draft.maxTokens,
					parallel: setup.parallel,
					profile: setup.profile,
					mtp: setup.mtp,
					...setup.sessionCacheEnabled ? { sessionCache: setup.sessionCache } : {}
				});
				return {
					...draft,
					arguments: arguments_,
					vision: paths.vision !== void 0
				};
			};
			const submit = async () => {
				setError("");
				try {
					const next = await composed();
					setDraft(next);
					await persist(next);
				} catch (cause) {
					setError(cause instanceof Error ? cause.message : String(cause));
				}
			};
			const launch = async (force = false) => {
				setActing(true);
				setError("");
				try {
					if (dirty) {
						const next = await composed();
						setDraft(next);
						await persist(next);
						await new Promise((resolve) => window.setTimeout(resolve, 700));
					}
					const result = await startEngine(force);
					setStatus(result.status);
					setConfirmBusy(result.status.phase === "resource-warning");
				} catch (cause) {
					setError(cause instanceof Error ? cause.message : String(cause));
				} finally {
					setActing(false);
				}
			};
			const monitorEngineInstall = async () => {
				while (true) {
					await new Promise((resolve) => window.setTimeout(resolve, 500));
					const next = await fetchReleaseStatus();
					setRelease(next);
					if (activeEngineInstall(next)) continue;
					if (next.install.stage === "error") throw new Error(next.install.error ?? t("downloadFailed"));
					if (next.install.stage === "cancelled") return;
					if (next.install.stage === "complete" && next.installed !== void 0) {
						const updated = {
							...draft,
							executable: next.installed.executable,
							workingDirectory: next.installed.workingDirectory
						};
						setDraft(updated);
						await persist(updated);
					}
					return;
				}
			};
			const installEngine = async () => {
				setEngineInstalling(true);
				setError("");
				try {
					await installLatestEngine();
					await monitorEngineInstall();
					setRelease(await fetchReleaseStatus(true));
					setStatus(await fetchEngineStatus());
				} catch (cause) {
					setError(cause instanceof Error ? cause.message : String(cause));
					try {
						setRelease(await fetchReleaseStatus());
					} catch {}
				} finally {
					setEngineInstalling(false);
				}
			};
			const stopEngineInstall = async () => {
				try {
					const install = await cancelEngineInstall();
					setRelease((previous) => previous === null ? previous : {
						...previous,
						install
					});
				} catch (cause) {
					setError(cause instanceof Error ? cause.message : String(cause));
				}
			};
			const removeEngine = async () => {
				const selected = release?.versions.find((item) => samePath(item.executable, draft.executable));
				if (selected === void 0) return;
				if (!window.confirm(t("confirmDeleteEngine"))) return;
				setActing(true);
				setError("");
				try {
					await deleteEngineVersion(selected.tag);
					const nextRelease = await fetchReleaseStatus(true);
					setRelease(nextRelease);
					const persistedExecutable = current?.executable ?? "";
					const fallback = nextRelease.versions.find((item) => samePath(item.executable, persistedExecutable)) ?? nextRelease.versions[0];
					setDraft((previous) => previous === null ? previous : {
						...previous,
						executable: fallback?.executable ?? "",
						workingDirectory: fallback?.workingDirectory ?? ""
					});
				} catch (cause) {
					setError(cause instanceof Error ? cause.message : String(cause));
				} finally {
					setActing(false);
				}
			};
			const selectEngine = (executable) => {
				const version = release?.versions.find((item) => samePath(item.executable, executable));
				setDraft((previous) => previous === null ? previous : {
					...previous,
					executable,
					workingDirectory: version?.workingDirectory ?? previous.workingDirectory
				});
			};
			const chooseLibraryDirectory = async () => {
				const directory = await pickDirectory();
				if (directory === null) return;
				setField("modelDirectory", directory);
				await refreshLibrary(directory);
			};
			const chooseModelFile = async (kind) => {
				try {
					const path = await pickModelFile();
					if (path === void 0) return;
					if (kind === "main") setSetupField("model", path);
					else if (kind === "vision") setSetupField("visionModel", path);
					else if (kind === "embedding") setSetupField("embeddingModel", path);
					else setSetup((previous) => ({
						...previous,
						mtpModel: path,
						mtp: true
					}));
					await refreshLibrary(draft.modelDirectory, [...selectedPaths, path]);
				} catch (cause) {
					setError(cause instanceof Error ? cause.message : String(cause));
				}
			};
			const useModel = (row) => {
				if (row.path === void 0) return;
				if (row.kind === "main") {
					const related = rows.filter((item) => item.path !== void 0 && item.family === row.family);
					setSetup((previous) => ({
						...previous,
						model: row.path,
						visionModel: previous.visionModel || related.find((item) => item.kind === "vision")?.path || "",
						mtpModel: previous.mtpModel || related.find((item) => item.kind === "mtp")?.path || ""
					}));
				} else if (row.kind === "vision") setSetupField("visionModel", row.path);
				else if (row.kind === "embedding") setSetupField("embeddingModel", row.path);
				else setSetup((previous) => ({
					...previous,
					mtpModel: row.path,
					mtp: true
				}));
			};
			const monitorModelDownload = async () => {
				while (true) {
					await new Promise((resolve) => window.setTimeout(resolve, 500));
					const next = await fetchModelDownload();
					setModelDownload(next);
					if (activeModelDownload(next)) continue;
					if (next.stage === "error") throw new Error(next.error ?? t("downloadFailed"));
					if (next.stage === "complete") await refreshLibrary();
					return;
				}
			};
			const downloadModel = async (model) => {
				if (draft.modelDirectory.trim() === "") {
					setError(t("modelDirectoryRequired"));
					return;
				}
				setModelDownloading(true);
				setError("");
				try {
					setModelDownload(await startModelDownload(model.id, draft.modelDirectory));
					await monitorModelDownload();
				} catch (cause) {
					setError(cause instanceof Error ? cause.message : String(cause));
				} finally {
					setModelDownloading(false);
				}
			};
			const stopModelDownload = async () => {
				try {
					setModelDownload(await cancelModelDownload());
				} catch (cause) {
					setError(cause instanceof Error ? cause.message : String(cause));
				}
			};
			const endpoint = draft.endpoint.trim() !== "" ? draft.endpoint.trim() : `${draft.protocol}://${draft.host}:${draft.port}${draft.apiBasePath.startsWith("/") ? draft.apiBasePath : `/${draft.apiBasePath}`}`;
			const selectedVersion = release?.versions.find((item) => samePath(item.executable, draft.executable));
			const releaseAction = release?.install.stage === "error" || release?.install.stage === "cancelled" ? t("retryDownload") : release?.updateAvailable === true ? t("updateNow") : t("installLatest");
			const downloadRecommendation = recommendations.find((item) => item.id === modelDownload.modelId);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "m4a-settings",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: "m4a-settings__header",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
								className: "m4a-settings__title",
								children: t("title")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "m4a-settings__status",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: `m4a-settings__dot m4a-settings__dot--${statusClass(status)}` }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: status?.message ?? t("checkingEngine") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
										className: "m4a-settings__endpoint",
										title: endpoint,
										children: endpoint
									})
								]
							}),
							error === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "m4a-settings__error",
								children: error
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "m4a-settings__engine-bar",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "m4a-settings__engine-version",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "m4a-settings__label",
									children: t("engineVersion")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
									className: "m4a-settings__select",
									value: draft.executable,
									disabled: disabled || engineInstalling,
									onChange: (event) => {
										selectEngine(event.target.value);
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "",
										children: t("engineNotInstalled")
									}), (release?.versions ?? []).map((version) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: version.executable,
										children: version.name
									}, `${version.tag}:${version.executable}`))]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "m4a-settings__runtime-actions",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "m4a-settings__button m4a-settings__button--primary",
										disabled: disabled || status?.ready === true || status?.phase === "starting",
										onClick: () => {
											launch(false);
										},
										children: acting ? t("working") : dirty ? t("saveAndStart") : t("startNow")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "m4a-settings__button",
										disabled: disabled || engineInstalling,
										onClick: () => {
											installEngine();
										},
										children: releaseAction
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "m4a-settings__button",
										disabled: disabled || engineInstalling,
										onClick: () => {
											setActing(true);
											fetchReleaseStatus(true).then(setRelease).catch((cause) => {
												setError(cause instanceof Error ? cause.message : String(cause));
											}).finally(() => {
												setActing(false);
											});
										},
										children: t("checkUpdates")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "m4a-settings__button m4a-settings__button--danger",
										disabled: disabled || selectedVersion === void 0 || status?.ready === true || engineInstalling,
										onClick: () => {
											removeEngine();
										},
										children: t("deleteEngine")
									})
								]
							}),
							release === null || !activeEngineInstall(release) && release.install.stage === "idle" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "m4a-download-status",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("progress", {
										max: 100,
										value: release.install.percent
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: release.install.message ?? release.install.error ?? release.install.stage }),
									release.install.totalBytes === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
										formatBytes(release.install.downloadedBytes),
										" / ",
										formatBytes(release.install.totalBytes)
									] }),
									activeEngineInstall(release) ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "m4a-settings__button",
										onClick: () => {
											stopEngineInstall();
										},
										children: t("stopDownload")
									}) : null
								]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-model-workbench",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: "m4a-model-config",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "m4a-pane-heading",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("currentConfiguration") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("currentConfigurationHint") })] })
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "m4a-settings__segmented",
									role: "group",
									"aria-label": t("mode"),
									children: [
										"connect",
										"prompt",
										"auto"
									].map((mode) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "m4a-settings__segment",
										"aria-pressed": draft.mode === mode,
										disabled,
										onClick: () => {
											setField("mode", mode);
										},
										children: t(mode)
									}, mode))
								}),
								draft.mode === "connect" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: "m4a-settings__hint",
									children: t("connectHint")
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ModelSelection, {
										kind: "main",
										path: setup.model,
										disabled,
										t,
										onChoose: () => {
											chooseModelFile("main");
										},
										onClear: () => {}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ModelSelection, {
										kind: "vision",
										path: setup.visionModel,
										disabled,
										t,
										onChoose: () => {
											chooseModelFile("vision");
										},
										onClear: () => {
											setSetupField("visionModel", "");
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ModelSelection, {
										kind: "mtp",
										path: setup.mtpModel,
										disabled,
										t,
										onChoose: () => {
											chooseModelFile("mtp");
										},
										onClear: () => {
											setSetup((previous) => ({
												...previous,
												mtpModel: "",
												mtp: false
											}));
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ModelSelection, {
										kind: "embedding",
										path: setup.embeddingModel,
										disabled,
										t,
										onChoose: () => {
											chooseModelFile("embedding");
										},
										onClear: () => {
											setSetupField("embeddingModel", "");
										}
									}),
									setup.embeddingModel === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
										label: t("embeddingIdleTimeout"),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											className: "m4a-settings__input",
											type: "number",
											min: 0,
											value: setup.embeddingIdleTimeout,
											disabled,
											onChange: (event) => {
												setSetupField("embeddingIdleTimeout", Number(event.target.value) || 0);
											}
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "m4a-settings__grid m4a-settings__grid--compact",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
												label: t("contextWindow"),
												hint: t("tokenUnitHint"),
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TokenInput, {
													value: draft.contextWindow,
													disabled,
													onChange: (value) => {
														setField("contextWindow", value);
													}
												})
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
												label: t("maxTokens"),
												hint: t("tokenUnitHint"),
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TokenInput, {
													value: draft.maxTokens,
													disabled,
													onChange: (value) => {
														setField("maxTokens", value);
													}
												})
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
												label: t("parallelSlots"),
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													className: "m4a-settings__input",
													type: "number",
													min: 1,
													value: setup.parallel,
													disabled,
													onChange: (event) => {
														setSetupField("parallel", Math.max(1, Number(event.target.value) || 1));
													}
												})
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
												label: t("automaticProfile"),
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
													className: "m4a-settings__select",
													value: setup.profile,
													disabled,
													onChange: (event) => {
														setSetupField("profile", event.target.value);
													},
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "conservative",
														children: t("conservativeProfile")
													}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "aggressive",
														children: t("aggressiveProfile")
													})]
												})
											})
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Check, {
										checked: setup.mtp,
										disabled: disabled || setup.mtpModel === "",
										label: t("enableMtp"),
										onChange: (value) => {
											setSetupField("mtp", value);
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Check, {
										checked: setup.sessionCacheEnabled,
										disabled,
										label: t("enableSessionCache"),
										onChange: (value) => {
											setSetupField("sessionCacheEnabled", value);
										}
									}),
									setup.sessionCacheEnabled ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "m4a-settings__grid m4a-settings__grid--compact",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
												label: t("sessionCachePath"),
												wide: true,
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													className: "m4a-settings__input",
													value: setup.sessionCache.directory,
													disabled,
													onChange: (event) => {
														setSetupField("sessionCache", {
															...setup.sessionCache,
															directory: event.target.value
														});
													}
												})
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
												label: t("sessionCacheMax"),
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													className: "m4a-settings__input",
													value: setup.sessionCache.maxSize,
													disabled,
													onChange: (event) => {
														setSetupField("sessionCache", {
															...setup.sessionCache,
															maxSize: event.target.value
														});
													}
												})
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
												label: t("sessionCacheIdle"),
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													className: "m4a-settings__input",
													type: "number",
													min: 0,
													value: setup.sessionCache.idleSeconds,
													disabled,
													onChange: (event) => {
														setSetupField("sessionCache", {
															...setup.sessionCache,
															idleSeconds: Number(event.target.value) || 0
														});
													}
												})
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
												label: t("sessionCacheTtl"),
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													className: "m4a-settings__input",
													type: "number",
													min: 0,
													value: setup.sessionCache.ttlHours,
													disabled,
													onChange: (event) => {
														setSetupField("sessionCache", {
															...setup.sessionCache,
															ttlHours: Number(event.target.value) || 0
														});
													}
												})
											})
										]
									}) : null
								] })
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("aside", {
							className: "m4a-model-library",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "m4a-pane-heading",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("modelLibrary") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("modelLibraryHint") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "m4a-settings__button",
										disabled: disabled || libraryLoading,
										onClick: () => {
											refreshLibrary();
										},
										children: libraryLoading ? t("scanning") : t("rescan")
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "m4a-library-directory",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: "m4a-settings__input",
										value: draft.modelDirectory,
										disabled: disabled || modelDownloading,
										placeholder: "D:\\\\Models",
										onChange: (event) => {
											setField("modelDirectory", event.target.value);
										}
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "m4a-settings__button",
										disabled: disabled || modelDownloading,
										onClick: () => {
											chooseLibraryDirectory();
										},
										children: t("chooseDirectory")
									})]
								}),
								groupedRows.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: "m4a-settings__message",
									children: t("noModelsInLibrary")
								}) : groupedRows.map(([family, familyRows]) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
									className: "m4a-model-family",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", { children: family }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "m4a-model-family__items",
										children: familyRows.map((row) => {
											const selected = row.path !== void 0 && samePath(pathForKind(setup, row.kind), row.path);
											const downloading = row.recommendation?.id === modelDownload.modelId && activeModelDownload(modelDownload);
											const retry = row.recommendation?.id === modelDownload.modelId && (modelDownload.stage === "error" || modelDownload.stage === "cancelled");
											return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
												className: `m4a-model-item${selected ? " m4a-model-item--selected" : ""}`,
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
														className: "m4a-model-item__topline",
														children: [
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: `m4a-model-item__kind m4a-model-item__kind--${row.kind}`,
																children: t(row.kind === "main" ? "mainModel" : row.kind === "vision" ? "visionModel" : row.kind === "mtp" ? "mtpModel" : "embeddingModel")
															}),
															row.recommendation === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: "m4a-model-item__recommended",
																children: t("recommended")
															}),
															row.path === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: "m4a-model-item__remote",
																children: t("notDownloaded")
															}) : null
														]
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: row.name }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
														className: "m4a-model-item__meta",
														children: [
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: row.quantization }),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: formatBytes(row.sizeBytes) }),
															row.fileCount <= 1 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
																row.fileCount,
																" ",
																t("files")
															] })
														]
													}),
													row.path === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
														title: row.path,
														children: row.path
													}),
													downloading ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
														className: "m4a-model-item__download",
														children: [
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("progress", {
																max: 100,
																value: modelDownload.percent
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
																formatBytes(modelDownload.downloadedBytes),
																" / ",
																formatBytes(modelDownload.totalBytes ?? row.sizeBytes)
															] }),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
																type: "button",
																className: "m4a-settings__button",
																onClick: () => {
																	stopModelDownload();
																},
																children: t("stopDownload")
															})
														]
													}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
														className: "m4a-model-item__actions",
														children: [row.path === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: "m4a-settings__button m4a-settings__button--primary",
															disabled: disabled || modelDownloading || draft.modelDirectory.trim() === "",
															onClick: () => {
																if (row.recommendation !== void 0) downloadModel(row.recommendation);
															},
															children: retry ? t("retryDownload") : t("downloadRecommended")
														}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: "m4a-settings__button",
															disabled: disabled || selected,
															onClick: () => {
																useModel(row);
															},
															children: selected ? t("selected") : t("useModel")
														}), row.recommendation === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
															href: row.recommendation.sourceUrl,
															target: "_blank",
															rel: "noreferrer",
															children: t("sourcePage")
														})]
													})
												]
											}, row.key);
										})
									})]
								}, family)),
								downloadRecommendation === void 0 || modelDownload.stage === "idle" || activeModelDownload(modelDownload) ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
									className: modelDownload.stage === "error" ? "m4a-settings__error" : "m4a-settings__hint",
									children: [
										downloadRecommendation.name,
										": ",
										modelDownload.error ?? modelDownload.stage
									]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
						className: "m4a-settings__details",
						open: draft.mode === "connect",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("connection") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "m4a-settings__grid",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
										label: t("protocol"),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
											className: "m4a-settings__select",
											value: draft.protocol,
											disabled,
											onChange: (event) => {
												setField("protocol", event.target.value);
											},
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: "http",
												children: "HTTP"
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: "https",
												children: "HTTPS"
											})]
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
										label: t("host"),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											className: "m4a-settings__input",
											value: draft.host,
											disabled,
											onChange: (event) => {
												setField("host", event.target.value);
											}
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
										label: t("port"),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											className: "m4a-settings__input",
											type: "number",
											min: 1,
											max: 65535,
											value: draft.port,
											disabled,
											onChange: (event) => {
												numberField("port", event.target.value);
											}
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
										label: t("apiBasePath"),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											className: "m4a-settings__input",
											value: draft.apiBasePath,
											disabled,
											onChange: (event) => {
												setField("apiBasePath", event.target.value);
											}
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
										label: t("endpoint"),
										hint: t("endpointHint"),
										wide: true,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											className: "m4a-settings__input",
											value: draft.endpoint,
											disabled,
											placeholder: "http://127.0.0.1:8080/v1",
											onChange: (event) => {
												setField("endpoint", event.target.value);
											}
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
										label: t("apiKeyEnv"),
										wide: true,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											className: "m4a-settings__input",
											value: draft.apiKeyEnv,
											disabled,
											placeholder: "MOE4ALL_API_KEY",
											onChange: (event) => {
												setField("apiKeyEnv", event.target.value);
											}
										})
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Check, {
								checked: draft.allowRemoteEndpoint,
								disabled,
								label: t("allowRemoteEndpoint"),
								onChange: (value) => {
									setField("allowRemoteEndpoint", value);
								}
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
						className: "m4a-settings__details",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("advanced") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "m4a-settings__grid",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
										label: t("executable"),
										wide: true,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											className: "m4a-settings__input",
											value: draft.executable,
											disabled,
											onChange: (event) => {
												setField("executable", event.target.value);
											}
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
										label: t("workingDirectory"),
										wide: true,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											className: "m4a-settings__input",
											value: draft.workingDirectory,
											disabled,
											onChange: (event) => {
												setField("workingDirectory", event.target.value);
											}
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
										label: t("minimumFreeRam"),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "m4a-settings__percentage",
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												type: "range",
												min: 0,
												max: 1,
												step: .05,
												value: draft.minimumFreeRamFraction,
												disabled,
												onChange: (event) => {
													numberField("minimumFreeRamFraction", event.target.value);
												}
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("output", { children: [Math.round(draft.minimumFreeRamFraction * 100), "%"] })]
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
										label: t("minimumFreeVram"),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "m4a-settings__percentage",
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												type: "range",
												min: 0,
												max: 1,
												step: .05,
												value: draft.minimumFreeVramFraction,
												disabled,
												onChange: (event) => {
													numberField("minimumFreeVramFraction", event.target.value);
												}
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("output", { children: [Math.round(draft.minimumFreeVramFraction * 100), "%"] })]
										})
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Check, {
								checked: draft.stopOnUnload,
								disabled,
								label: t("stopOnUnload"),
								onChange: (value) => {
									setField("stopOnUnload", value);
								}
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Check, {
								checked: draft.logOutput,
								disabled,
								label: t("logOutput"),
								onChange: (value) => {
									setField("logOutput", value);
								}
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-settings__actions",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "m4a-settings__save-state",
								children: !snapshot.writable ? t("readOnly") : dirty ? t("unsaved") : t("saved")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "m4a-settings__button",
								disabled: disabled || !dirty || current === null,
								onClick: () => {
									if (current !== null) {
										setDraft(current);
										setSetup(parseEngineArguments(current.arguments));
									}
								},
								children: t("revert")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "m4a-settings__button m4a-settings__button--primary",
								disabled: disabled || !dirty,
								onClick: () => {
									submit();
								},
								children: saving ? t("saving") : t("save")
							})
						]
					}),
					!confirmBusy ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "m4a-overlay",
						role: "presentation",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: "m4a-overlay__dialog",
							role: "alertdialog",
							"aria-modal": "true",
							"aria-labelledby": "m4a-busy-title",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
									id: "m4a-busy-title",
									className: "m4a-overlay__title",
									children: t("resourceWarningTitle")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: "m4a-overlay__body",
									children: t("resourceWarningBody")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
									className: "m4a-overlay__reasons",
									children: (status?.reasons ?? []).map((reason) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: reason }, reason))
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "m4a-overlay__actions",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "m4a-settings__button",
										disabled: acting,
										onClick: () => {
											setConfirmBusy(false);
										},
										children: t("cancel")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "m4a-settings__button m4a-settings__button--danger",
										disabled: acting,
										onClick: () => {
											launch(true);
										},
										children: acting ? t("startingNow") : t("startAnyway")
									})]
								})
							]
						})
					})
				]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		const en = {
			nav: "MoE4All",
			engineVersion: "Engine version",
			engineNotInstalled: "No managed engine selected",
			deleteEngine: "Delete version",
			confirmDeleteEngine: "Delete this managed engine version? Model files and settings will not be removed.",
			stopDownload: "Stop",
			downloadFailed: "Download failed.",
			currentConfiguration: "Current model and runtime",
			currentConfigurationHint: "This is the configuration MoE4All will use the next time it starts.",
			mainModel: "Main model",
			visionModel: "Vision",
			mtpModel: "MTP",
			embeddingModel: "Embedding",
			notSelected: "Not selected",
			removeSelection: "Remove",
			modelLibrary: "Model library",
			modelLibraryHint: "Local models and official recommendations are grouped by family.",
			scanning: "Scanning...",
			rescan: "Rescan",
			noModelsInLibrary: "No local or recommended models are available.",
			recommended: "Recommended",
			notDownloaded: "Not downloaded",
			files: "files",
			selected: "Selected",
			useModel: "Use",
			modelDirectoryRequired: "Choose a model directory before downloading.",
			modelDirectory: "Model download directory",
			chooseFile: "Choose file",
			recommendedModel: "Recommended model",
			downloadSize: "Download size",
			fileCount: "Files",
			supportsVision: "Vision",
			supportsMtp: "MTP",
			downloadToDirectory: "Downloads are stored in the selected model directory.",
			downloadRecommended: "Download selected model",
			modelDownloadProgress: "Downloading model",
			modelDownloadComplete: "Model download complete",
			modelDownloadRetry: "Resume download",
			sourcePage: "Open source page",
			startupProgressTitle: "Starting MoE4All",
			startupProgressBody: "Loading the model and allocating runtime resources. This can take several minutes.",
			startupOutput: "Engine output",
			startupFailedTitle: "MoE4All could not start",
			retryStart: "Retry start",
			ramBudgetAdjusted: "The RAM budget was reduced to fit the current Windows commit headroom.",
			title: "MoE4All engine",
			loading: "Loading configuration...",
			unavailable: "Engine settings are unavailable on this connection.",
			readOnly: "Read-only",
			saved: "Saved",
			unsaved: "Unsaved changes",
			saving: "Saving...",
			save: "Save changes",
			revert: "Revert",
			working: "Working...",
			mode: "Startup behavior",
			connect: "Connect only",
			prompt: "Ask on startup",
			auto: "Start automatically",
			connectHint: "Connect to the configured service. The plugin never starts a local process automatically.",
			promptHint: "When DSH starts and the service is offline, ask before starting the configured local engine.",
			autoHint: "Start the configured local engine when DSH starts. Low RAM or VRAM still requires confirmation.",
			connection: "Connection",
			protocol: "Protocol",
			host: "Host",
			port: "Port",
			apiBasePath: "API base path",
			endpoint: "Endpoint override",
			endpointHint: "Optional. Overrides protocol, host, port, and API base path.",
			apiKeyEnv: "API key environment variable",
			allowRemoteEndpoint: "Allow a non-loopback endpoint",
			startup: "Local engine",
			executable: "Engine executable",
			workingDirectory: "Working directory",
			arguments: "Arguments",
			argumentsHint: "One argument per line.",
			minimumFreeRam: "Free RAM warning threshold",
			minimumFreeVram: "Free VRAM warning threshold",
			stopOnUnload: "Stop an engine started by this plugin when DSH exits",
			logOutput: "Forward engine output to the DSH log",
			model: "Model defaults",
			contextWindow: "Context window",
			maxTokens: "Maximum output tokens",
			tokenUnitHint: "Plain tokens or k units; 1k = 1024 tokens.",
			vision: "Advertise image input support",
			advanced: "Advanced",
			processNames: "Engine process names",
			excludeModels: "Exclude model names containing",
			listHint: "One value per line.",
			resourceProbeTimeout: "Resource probe timeout (ms)",
			startupTimeout: "Startup timeout (ms)",
			healthTimeout: "Health timeout (ms)",
			pollInterval: "Startup poll interval (ms)",
			shutdownTimeout: "Shutdown timeout (ms)",
			modelRefreshInterval: "Model refresh interval (ms)",
			modelDiscoveryTimeout: "Model discovery timeout (ms)",
			checkingEngine: "Checking engine status...",
			syncedModels: "Available models",
			saveAndStart: "Save and start",
			startNow: "Start now",
			checkUpdates: "Check for updates",
			installLatest: "Install latest engine",
			installing: "Installing...",
			updateNow: "Update engine",
			latestVersion: "Latest",
			engineNotManaged: "External engine",
			startupPromptTitle: "Start MoE4All?",
			startupPromptBody: "The configured MoE4All service is offline. Start the local engine now?",
			notNow: "Not now",
			startThisTime: "Start this time",
			startAndRemember: "Start and remember",
			startingNow: "Starting...",
			resourceWarningTitle: "Resources are below the warning threshold",
			resourceWarningBody: "Starting may exhaust RAM or VRAM and can reset the GPU. Continue only if the current workload can be interrupted.",
			startAnyway: "Start anyway",
			cancel: "Cancel",
			installTitle: "Install MoE4All engine?",
			installBody: "No engine executable was found. Download the latest official Windows release and configure it automatically?",
			updateTitle: "MoE4All update available",
			updateBody: "Install the latest official release? Plugin settings and engine arguments are preserved.",
			checkingDownload: "Checking the official release...",
			downloadingEngine: "Downloading",
			verifyingDownload: "Verifying the download...",
			extractingDownload: "Extracting MoE4All...",
			finalizingDownload: "Finishing installation...",
			downloadComplete: "Download complete. MoE4All is ready to configure.",
			openReleasePage: "Open official release page",
			downloadInBrowser: "Download ZIP in browser",
			localDownloadPath: "Downloaded ZIP, extracted directory, or infr.exe",
			localDownloadHint: "Paste a local path. The plugin will verify and extract an official ZIP, or use an existing installation directly.",
			useLocalDownload: "Use local download",
			retryDownload: "Retry download",
			setupTitle: "Configure MoE4All",
			setupBody: "Choose the basic engine settings. They can be changed later in MoE4All settings.",
			modelPath: "Model GGUF path",
			parallelSlots: "Concurrent slots",
			automaticProfile: "Automatic resource profile",
			conservativeProfile: "Conservative",
			aggressiveProfile: "Aggressive performance",
			enableMtp: "Enable Qwen3.8 MTP acceleration",
			saveSetupAndStart: "Save and start",
			invalidContext: "Enter a valid context length, such as 160k. One k equals 1024 tokens.",
			invalidMaxTokens: "Enter a valid maximum output, such as 100k. One k equals 1024 tokens.",
			modelsAndFeatures: "Models and features",
			runtimeSettings: "Runtime settings",
			chooseDirectory: "Choose directory",
			scanDirectory: "Scan folder",
			selectDetectedModel: "Select a detected model",
			downloadFlash: "Download Qwen3.8 Flash",
			download35b: "Download Qwen3.6 35B",
			enableVision: "Enable image understanding",
			downloadVision: "Download recommended vision model",
			enableEmbedding: "Enable the Embedding API",
			downloadEmbedding: "Download recommended embedding model",
			embeddingIdleTimeout: "Embedding idle release (seconds)",
			enableAutoStart: "Start MoE4All automatically with DSH after this setup",
			enableSessionCache: "Cache idle session KV on SSD",
			sessionCacheHelp: "MoE4All can write an idle conversation KV cache to SSD and restore it later, avoiding a full prompt prefill. Most inference engines do not provide this feature.",
			sessionCachePath: "KV cache directory",
			sessionCachePathHint: "A relative path is created under the MoE4All engine directory.",
			sessionCacheMax: "Total cache limit",
			sessionCacheIdle: "Spill after idle seconds",
			sessionCacheTtl: "Delete entries older than (hours; 0 disables)",
			noVisionFound: "No vision GGUF was found in the selected directory.",
			noEmbeddingFound: "No embedding GGUF was found in the selected directory.",
			visionPathRequired: "Choose a vision GGUF or disable image understanding.",
			embeddingPathRequired: "Choose an embedding GGUF or disable the Embedding API.",
			downloadMtp: "Download recommended MTP head",
			noMtpFound: "No MTP head GGUF was found in the selected directory.",
			mtpPathRequired: "Choose an MTP head GGUF or disable MTP acceleration."
		};
		const zh = {
			nav: "MoE4All",
			engineVersion: "引擎版本",
			engineNotInstalled: "未选择托管引擎",
			deleteEngine: "删除版本",
			confirmDeleteEngine: "确定删除这个托管引擎版本吗？模型文件和设置不会被删除。",
			stopDownload: "停止",
			downloadFailed: "下载失败。",
			currentConfiguration: "当前模型与运行配置",
			currentConfigurationHint: "MoE4All 下次启动时将使用这里的配置。",
			mainModel: "主模型",
			visionModel: "视觉",
			mtpModel: "MTP",
			embeddingModel: "Embedding",
			notSelected: "未选择",
			removeSelection: "移除",
			modelLibrary: "模型库",
			modelLibraryHint: "本地模型与官方推荐模型按家族归类显示。",
			scanning: "扫描中...",
			rescan: "重新扫描",
			noModelsInLibrary: "暂无本地或推荐模型。",
			recommended: "推荐",
			notDownloaded: "未下载",
			files: "个文件",
			selected: "已选用",
			useModel: "选用",
			modelDirectoryRequired: "请先选择模型下载目录。",
			modelDirectory: "模型下载目录",
			chooseFile: "选择文件",
			recommendedModel: "推荐模型",
			downloadSize: "下载大小",
			fileCount: "文件数",
			supportsVision: "视觉",
			supportsMtp: "MTP",
			downloadToDirectory: "模型会下载到所选模型目录中。",
			downloadRecommended: "下载所选模型",
			modelDownloadProgress: "正在下载模型",
			modelDownloadComplete: "模型下载完成",
			modelDownloadRetry: "继续下载",
			sourcePage: "打开来源页面",
			startupProgressTitle: "正在启动 MoE4All",
			startupProgressBody: "正在加载模型并分配运行资源，可能需要几分钟。",
			startupOutput: "引擎输出",
			startupFailedTitle: "MoE4All 启动失败",
			retryStart: "重试启动",
			ramBudgetAdjusted: "已根据当前 Windows 提交余量下调 RAM 预算。",
			title: "MoE4All 引擎",
			loading: "正在加载配置...",
			unavailable: "当前连接无法访问引擎设置。",
			readOnly: "只读",
			saved: "已保存",
			unsaved: "有未保存的更改",
			saving: "正在保存...",
			save: "保存更改",
			revert: "撤销更改",
			working: "处理中...",
			mode: "启动方式",
			connect: "仅连接现有服务",
			prompt: "每次启动时询问",
			auto: "自动启动",
			connectHint: "只连接填写的服务地址，插件不会自动启动本机进程。",
			promptHint: "DSH 启动且服务未运行时，先询问是否按当前配置启动本机引擎。",
			autoHint: "DSH 启动时自动拉起本机引擎；RAM 或 VRAM 低于警戒线时仍会二次询问。",
			connection: "连接",
			protocol: "协议",
			host: "主机",
			port: "端口",
			apiBasePath: "API 基础路径",
			endpoint: "覆盖 Endpoint",
			endpointHint: "可选。填写后将覆盖协议、主机、端口和 API 基础路径。",
			apiKeyEnv: "API Key 环境变量",
			allowRemoteEndpoint: "允许连接非本机地址",
			startup: "本机引擎",
			executable: "引擎执行文件",
			workingDirectory: "工作目录",
			arguments: "启动参数",
			argumentsHint: "每行一个参数。",
			minimumFreeRam: "空闲 RAM 警戒线",
			minimumFreeVram: "空闲 VRAM 警戒线",
			stopOnUnload: "DSH 退出时停止由插件启动的引擎",
			logOutput: "将引擎输出写入 DSH 日志",
			model: "模型默认值",
			contextWindow: "上下文窗口",
			maxTokens: "最大输出 Token",
			tokenUnitHint: "可填写 Token 数或 k；1k = 1024 Token。",
			vision: "向 DSH 声明支持图片输入",
			advanced: "高级设置",
			processNames: "引擎进程名",
			excludeModels: "排除名称中包含以下文本的模型",
			listHint: "每行一个值。",
			resourceProbeTimeout: "资源探测超时（毫秒）",
			startupTimeout: "启动超时（毫秒）",
			healthTimeout: "健康检查超时（毫秒）",
			pollInterval: "启动轮询间隔（毫秒）",
			shutdownTimeout: "停止超时（毫秒）",
			modelRefreshInterval: "模型刷新间隔（毫秒）",
			modelDiscoveryTimeout: "模型探测超时（毫秒）",
			checkingEngine: "正在检查引擎状态...",
			syncedModels: "可用模型",
			saveAndStart: "保存并启动",
			startNow: "立即启动",
			checkUpdates: "检查更新",
			installLatest: "安装最新版引擎",
			installing: "正在安装...",
			updateNow: "更新引擎",
			latestVersion: "最新版本",
			engineNotManaged: "外部引擎",
			startupPromptTitle: "启动 MoE4All？",
			startupPromptBody: "当前配置的 MoE4All 服务未运行。是否按已保存的配置启动本机引擎？",
			notNow: "暂不启动",
			startThisTime: "仅本次启动",
			startAndRemember: "启动并记住",
			startingNow: "正在启动...",
			resourceWarningTitle: "可用资源低于警戒线",
			resourceWarningBody: "继续启动可能耗尽 RAM 或 VRAM，并可能导致显卡重置。请确认当前任务可以被中断。",
			startAnyway: "仍然启动",
			cancel: "取消",
			installTitle: "安装 MoE4All 引擎？",
			installBody: "没有找到引擎执行文件。是否下载最新的官方 Windows 发行版并自动填写路径？",
			updateTitle: "MoE4All 有新版本",
			updateBody: "是否安装最新官方发行版？插件设置和引擎启动参数会保留。",
			checkingDownload: "正在检查官方发行版...",
			downloadingEngine: "正在下载",
			verifyingDownload: "正在校验下载文件...",
			extractingDownload: "正在解压 MoE4All...",
			finalizingDownload: "正在完成安装...",
			downloadComplete: "下载完成，可以开始配置 MoE4All。",
			openReleasePage: "打开官方发行页",
			downloadInBrowser: "在浏览器中下载 ZIP",
			localDownloadPath: "已下载的 ZIP、解压目录或 infr.exe",
			localDownloadHint: "粘贴本地路径。插件会校验并解压官方 ZIP，也可以直接接管已有安装。",
			useLocalDownload: "使用本地文件",
			retryDownload: "重新下载",
			setupTitle: "配置 MoE4All",
			setupBody: "先完成基础引擎配置，之后仍可在 MoE4All 设置中修改。",
			modelPath: "模型 GGUF 路径",
			parallelSlots: "并发槽位数",
			automaticProfile: "自动资源策略",
			conservativeProfile: "保守",
			aggressiveProfile: "激进性能",
			enableMtp: "启用 Qwen3.8 MTP 加速",
			saveSetupAndStart: "保存并启动",
			invalidContext: "请输入有效的上下文长度，例如 160k；1k 等于 1024 token。",
			invalidMaxTokens: "请输入有效的最长输出，例如 100k；1k 等于 1024 token。",
			modelsAndFeatures: "模型与能力",
			runtimeSettings: "运行参数",
			chooseDirectory: "选择目录",
			scanDirectory: "扫描同目录",
			selectDetectedModel: "选择检测到的模型",
			downloadFlash: "下载 Qwen3.8 Flash",
			download35b: "下载 Qwen3.6 35B",
			enableVision: "启用图片理解",
			downloadVision: "下载推荐视觉模型",
			enableEmbedding: "启用 Embedding API",
			downloadEmbedding: "下载推荐 Embedding 模型",
			embeddingIdleTimeout: "Embedding 空闲释放（秒）",
			enableAutoStart: "本次设置后，随 DSH 自动启动 MoE4All",
			enableSessionCache: "将闲置会话 KV 缓存到 SSD",
			sessionCacheHelp: "MoE4All 可将闲置对话的 KV 缓存写入 SSD，并在再次使用时恢复，避免从头 Prefill。大多数推理引擎没有这项能力。",
			sessionCachePath: "KV 缓存目录",
			sessionCachePathHint: "相对路径会在 MoE4All 引擎目录下创建。",
			sessionCacheMax: "缓存总上限",
			sessionCacheIdle: "闲置多少秒后写入 SSD",
			sessionCacheTtl: "清理早于多少小时的缓存（0 为不按时间清理）",
			noVisionFound: "所选目录中没有找到视觉 GGUF。",
			noEmbeddingFound: "所选目录中没有找到 Embedding GGUF。",
			visionPathRequired: "请选择视觉 GGUF，或关闭图片理解。",
			embeddingPathRequired: "请选择 Embedding GGUF，或关闭 Embedding API。",
			downloadMtp: "下载推荐 MTP 头",
			noMtpFound: "所选目录中没有找到 MTP 头 GGUF。",
			mtpPathRequired: "请选择 MTP 头 GGUF，或关闭 MTP 加速。"
		};
		//#endregion
		//#region src/client/styles.ts
		const styles = `
.m4a-settings {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: min(100%, 980px);
  color: var(--dsw-alias-label-primary);
}
.m4a-settings * { box-sizing: border-box; }
.m4a-settings__header { display: flex; flex-direction: column; gap: 6px; }
.m4a-settings__title { margin: 0; font-size: 18px; line-height: 1.4; font-weight: 650; }
.m4a-settings__subtitle { margin: 0; max-width: 680px; color: var(--dsw-alias-label-tertiary); font-size: 13px; line-height: 1.55; }
.m4a-settings__status { display: flex; align-items: center; gap: 8px; min-height: 24px; font-size: 12px; color: var(--dsw-alias-label-tertiary); }
.m4a-settings__dot { width: 7px; height: 7px; flex: 0 0 7px; border-radius: 50%; background: #7a828c; }
.m4a-settings__dot--ready { background: var(--dsw-alias-state-success-primary, #2f9e63); }
.m4a-settings__dot--busy { background: var(--dsw-alias-brand-primary, #3478d4); }
.m4a-settings__dot--warning { background: var(--dsw-alias-state-warning-primary, #c47b18); }
.m4a-settings__dot--error { background: var(--dsw-alias-state-danger-primary, #d54b4b); }
.m4a-settings__models, .m4a-settings__release { margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 1.45; overflow-wrap: anywhere; }
.m4a-settings__error { margin: 2px 0 0; color: var(--dsw-alias-state-danger-primary, #d54b4b); font-size: 12px; line-height: 1.45; }
.m4a-settings__runtime-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
.m4a-settings__endpoint { margin-left: auto; max-width: 65%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
.m4a-settings__group { display: flex; flex-direction: column; gap: 14px; padding: 0 0 22px; border-bottom: 1px solid var(--dsw-alias-border-l2); }
.m4a-settings__group:last-of-type { border-bottom: 0; }
.m4a-settings__group-title { margin: 0; font-size: 13px; line-height: 1.4; font-weight: 650; }
.m4a-settings__engine-bar { display: grid; grid-template-columns: minmax(220px, 1fr) auto; align-items: end; gap: 10px 18px; padding: 14px 0 18px; border-bottom: 1px solid var(--dsw-alias-border-l2); }
.m4a-settings__engine-version { display: grid; gap: 6px; min-width: 0; }
.m4a-settings__engine-bar .m4a-settings__runtime-actions { justify-content: flex-end; margin: 0; }
.m4a-download-status { grid-column: 1 / -1; display: grid; grid-template-columns: minmax(120px, 1fr) minmax(160px, auto) auto auto; align-items: center; gap: 8px 12px; color: var(--dsw-alias-label-tertiary); font-size: 11px; font-variant-numeric: tabular-nums; }
.m4a-download-status progress { width: 100%; height: 8px; accent-color: var(--dsw-alias-brand-primary); }
.m4a-model-workbench { display: grid; grid-template-columns: minmax(0, .92fr) minmax(0, 1.08fr); gap: 0; min-height: 420px; border-bottom: 1px solid var(--dsw-alias-border-l2); }
.m4a-model-config, .m4a-model-library { display: flex; min-width: 0; flex-direction: column; gap: 14px; padding: 20px 0 22px; }
.m4a-model-config { padding-right: 20px; }
.m4a-model-library { padding-left: 20px; border-left: 1px solid var(--dsw-alias-border-l2); }
.m4a-pane-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.m4a-pane-heading h3 { margin: 0; font-size: 14px; line-height: 1.4; }
.m4a-pane-heading p { margin: 3px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 1.45; }
.m4a-current-model { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 10px; min-height: 60px; padding: 9px 0; border-bottom: 1px solid var(--dsw-alias-border-l2); }
.m4a-current-model__body { display: grid; min-width: 0; gap: 3px; }
.m4a-current-model__body strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; font-weight: 600; }
.m4a-current-model__body code { min-width: 0; overflow: hidden; color: var(--dsw-alias-label-tertiary); font: 10px/1.4 ui-monospace, SFMono-Regular, Consolas, monospace; text-overflow: ellipsis; white-space: nowrap; }
.m4a-current-model__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
.m4a-settings__grid--compact { gap: 10px; }
.m4a-library-directory { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
.m4a-model-family { display: grid; gap: 8px; }
.m4a-model-family h4 { margin: 2px 0 0; color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary)); font-size: 12px; line-height: 1.4; }
.m4a-model-family__items { display: grid; gap: 7px; }
.m4a-model-item { display: grid; min-width: 0; gap: 6px; padding: 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; background: var(--dsw-alias-bg-layer-2); }
.m4a-model-item--selected { border-color: var(--dsw-alias-brand-primary); box-shadow: inset 3px 0 0 var(--dsw-alias-brand-primary); }
.m4a-model-item__topline { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; }
.m4a-model-item__kind, .m4a-model-item__recommended, .m4a-model-item__remote { display: inline-flex; min-height: 20px; align-items: center; padding: 0 6px; border-radius: 4px; font-size: 10px; line-height: 1; }
.m4a-model-item__kind { background: #e8edf3; color: #17202a; }
.m4a-model-item__kind--vision { background: #dff3ea; color: #185b3c; }
.m4a-model-item__kind--mtp { background: #f1e7d5; color: #70490d; }
.m4a-model-item__kind--embedding { background: #e8e4f4; color: #4b3678; }
.m4a-model-item__recommended { background: #dce8ff; color: #1d4ed8; font-weight: 650; }
.m4a-model-item__remote { color: var(--dsw-alias-label-tertiary); border: 1px solid var(--dsw-alias-border-l2); }
.m4a-model-item > strong { min-width: 0; overflow-wrap: anywhere; font-size: 12px; line-height: 1.35; }
.m4a-model-item > code { min-width: 0; overflow: hidden; color: var(--dsw-alias-label-tertiary); font: 10px/1.4 ui-monospace, SFMono-Regular, Consolas, monospace; text-overflow: ellipsis; white-space: nowrap; }
.m4a-model-item__meta { display: flex; flex-wrap: wrap; gap: 5px 12px; color: var(--dsw-alias-label-tertiary); font-size: 10px; font-variant-numeric: tabular-nums; }
.m4a-model-item__actions { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.m4a-model-item__actions a { color: var(--dsw-alias-brand-primary); font-size: 11px; text-underline-offset: 2px; }
.m4a-model-item__download { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 8px; color: var(--dsw-alias-label-tertiary); font-size: 10px; font-variant-numeric: tabular-nums; }
.m4a-model-item__download progress { width: 100%; height: 7px; accent-color: var(--dsw-alias-brand-primary); }
.m4a-settings__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.m4a-settings__field { display: flex; min-width: 0; flex-direction: column; gap: 6px; }
.m4a-settings__field--wide { grid-column: 1 / -1; }
.m4a-settings__label { font-size: 12px; line-height: 1.35; color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary)); }
.m4a-settings__hint { margin: 0; font-size: 11px; line-height: 1.45; color: var(--dsw-alias-label-tertiary); }
.m4a-settings__input, .m4a-settings__select, .m4a-settings__textarea {
  width: 100%; min-width: 0; border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px;
  background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary);
  font: inherit; font-size: 13px; outline: none;
}
.m4a-settings__input, .m4a-settings__select { height: 36px; padding: 0 10px; }
.m4a-settings__textarea { min-height: 78px; resize: vertical; padding: 9px 10px; line-height: 1.45; }
.m4a-settings__input:focus, .m4a-settings__select:focus, .m4a-settings__textarea:focus { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 18%, transparent); }
.m4a-settings__input--invalid { border-color: var(--dsw-alias-state-danger-primary, #d54b4b); }
.m4a-settings__input:disabled, .m4a-settings__select:disabled, .m4a-settings__textarea:disabled { opacity: .55; cursor: not-allowed; }
.m4a-settings__segmented { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 3px; padding: 3px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: var(--dsw-alias-bg-layer-2); }
.m4a-settings__segment { min-height: 32px; border: 0; border-radius: 5px; background: transparent; color: var(--dsw-alias-label-tertiary); font: inherit; font-size: 12px; cursor: pointer; }
.m4a-settings__segment[aria-pressed='true'] { background: var(--dsw-alias-bg-layer-3); color: var(--dsw-alias-label-primary); box-shadow: 0 0 0 1px var(--dsw-alias-border-l2); font-weight: 600; }
.m4a-settings__segment:focus-visible, .m4a-settings__button:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.m4a-settings__check { display: flex; align-items: flex-start; gap: 9px; font-size: 12px; line-height: 1.45; color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary)); }
.m4a-settings__check input { width: 16px; height: 16px; margin: 1px 0 0; accent-color: var(--dsw-alias-brand-primary); }
.m4a-settings__percentage { display: grid; grid-template-columns: minmax(0, 1fr) 52px; align-items: center; gap: 10px; }
.m4a-settings__percentage input[type='range'] { width: 100%; accent-color: var(--dsw-alias-brand-primary); }
.m4a-settings__percentage output { text-align: right; font-size: 12px; font-variant-numeric: tabular-nums; }
.m4a-settings__details summary { cursor: pointer; font-size: 13px; font-weight: 650; list-style-position: outside; }
.m4a-settings__details { padding-bottom: 18px; border-bottom: 1px solid var(--dsw-alias-border-l2); }
.m4a-settings__details[open] summary { margin-bottom: 14px; }
.m4a-settings__actions { position: sticky; bottom: 0; display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 12px 0; background: var(--dsw-alias-bg-layer-1, transparent); }
.m4a-settings__save-state { margin-right: auto; color: var(--dsw-alias-label-tertiary); font-size: 11px; }
.m4a-settings__button { min-height: 34px; padding: 0 14px; border-radius: 6px; border: 1px solid #b9c2cc; background: #e8edf3; color: #17202a; font: inherit; font-size: 12px; font-weight: 550; cursor: pointer; }
.m4a-settings__button--primary { border-color: #1d4ed8; background: #2563eb; color: white; }
.m4a-settings__button--danger { border-color: #ad3039; background: #c83f49; color: white; }
.m4a-settings__button--link { display: inline-flex; align-items: center; justify-content: center; text-decoration: none; }
.m4a-settings__button:disabled { opacity: .5; cursor: default; }
.m4a-settings__message { margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 13px; }
.m4a-overlay { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 24px; pointer-events: auto; background: rgb(0 0 0 / .48); }
.m4a-overlay__dialog { width: min(100%, 760px); max-height: min(820px, calc(100vh - 48px)); overflow: auto; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; padding: 22px; background: var(--dsw-alias-bg-layer-1, #fff); color: var(--dsw-alias-label-primary); box-shadow: 0 18px 55px rgb(0 0 0 / .28); }
.m4a-overlay__title { margin: 0 0 10px; font-size: 18px; line-height: 1.4; }
.m4a-overlay__body, .m4a-overlay__version, .m4a-overlay__endpoint, .m4a-overlay__error, .m4a-overlay__notice { margin: 0 0 12px; font-size: 13px; line-height: 1.55; }
.m4a-overlay__version { color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary)); }
.m4a-overlay__endpoint { display: block; overflow-wrap: anywhere; color: var(--dsw-alias-label-tertiary); }
.m4a-overlay__error { color: var(--dsw-alias-state-danger-primary, #d54b4b); }
.m4a-overlay__notice { color: var(--dsw-alias-state-warning-primary, #a56512); }
.m4a-overlay__reasons { margin: 0 0 16px; padding-left: 20px; color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary)); font-size: 12px; line-height: 1.55; }
.m4a-overlay__progress { display: grid; gap: 7px; margin: 0 0 14px; color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary)); font-size: 12px; font-variant-numeric: tabular-nums; }
.m4a-overlay__progress progress { width: 100%; height: 8px; accent-color: var(--dsw-alias-brand-primary); }
.m4a-overlay__links { display: flex; flex-wrap: wrap; gap: 8px 16px; margin: 0 0 16px; font-size: 12px; }
.m4a-overlay__links a { color: var(--dsw-alias-brand-primary); text-underline-offset: 2px; }
.m4a-overlay__local-path { margin-top: 4px; }
.m4a-overlay__section { display: flex; flex-direction: column; gap: 12px; padding: 14px 0 18px; border-bottom: 1px solid var(--dsw-alias-border-l2); }
.m4a-overlay__section h3 { margin: 0; font-size: 13px; line-height: 1.4; }
.m4a-overlay__section-heading, .m4a-overlay__optional-model { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.m4a-overlay__download-links { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
.m4a-overlay__path-row { display: grid; grid-template-columns: minmax(0, 1fr) repeat(3, auto); gap: 8px; }
.m4a-overlay__optional-model { min-height: 34px; }
.m4a-overlay__recommendation { display: flex; flex-direction: column; gap: 12px; padding: 12px 0; border-top: 1px solid var(--dsw-alias-border-l2); border-bottom: 1px solid var(--dsw-alias-border-l2); }
.m4a-overlay__model-details { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px 14px; color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 1.45; }
.m4a-overlay__model-details span { min-width: 0; overflow-wrap: anywhere; }
.m4a-overlay__download-actions { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px 16px; font-size: 12px; }
.m4a-overlay__download-actions a { color: var(--dsw-alias-brand-primary); text-underline-offset: 2px; }
.m4a-overlay__startup-output { display: grid; gap: 7px; margin-top: 12px; }
.m4a-overlay__startup-output pre { min-height: 180px; max-height: 340px; margin: 0; overflow: auto; padding: 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; background: #111820; color: #e8edf3; font: 11px/1.5 ui-monospace, SFMono-Regular, Consolas, monospace; white-space: pre-wrap; overflow-wrap: anywhere; }
.m4a-overlay__help { width: 26px; height: 26px; flex: 0 0 26px; padding: 0; border: 1px solid #b9c2cc; border-radius: 50%; background: #e8edf3; color: #17202a; font: inherit; font-size: 12px; font-weight: 700; cursor: help; }
.m4a-overlay__setup-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.m4a-overlay__mtp { margin-top: 14px; }
.m4a-overlay__actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
.m4a-overlay__actions--three { justify-content: stretch; }
.m4a-overlay__actions--three .m4a-settings__button { flex: 1 1 130px; }
.m4a-overlay__actions--install .m4a-settings__button { flex: 1 1 125px; }
@media (max-width: 680px) {
  .m4a-settings__grid { grid-template-columns: minmax(0, 1fr); }
  .m4a-settings__field--wide { grid-column: auto; }
  .m4a-settings__endpoint { display: none; }
  .m4a-overlay { padding: 12px; }
  .m4a-overlay__dialog { padding: 18px; }
  .m4a-overlay__setup-grid { grid-template-columns: minmax(0, 1fr); }
  .m4a-overlay__section-heading, .m4a-overlay__optional-model { align-items: flex-start; flex-direction: column; }
  .m4a-overlay__download-links { justify-content: flex-start; }
  .m4a-overlay__path-row { grid-template-columns: minmax(0, 1fr); }
  .m4a-overlay__model-details { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 900px) {
  .m4a-settings__engine-bar { grid-template-columns: minmax(0, 1fr); align-items: stretch; }
  .m4a-settings__engine-bar .m4a-settings__runtime-actions { justify-content: flex-start; }
  .m4a-download-status { grid-template-columns: minmax(0, 1fr) auto; }
  .m4a-model-workbench { grid-template-columns: minmax(0, 1fr); }
  .m4a-model-config { padding-right: 0; }
  .m4a-model-library { padding-left: 0; border-left: 0; border-top: 1px solid var(--dsw-alias-border-l2); }
}
@media (max-width: 520px) {
  .m4a-current-model { grid-template-columns: minmax(0, 1fr); }
  .m4a-current-model__actions { justify-content: flex-start; }
  .m4a-library-directory, .m4a-model-item__download, .m4a-download-status { grid-template-columns: minmax(0, 1fr); }
}
`;
		//#endregion
		//#region src/client/index.ts
		const inject = [
			"slots",
			"locale",
			"settingsScope",
			"workspaces"
		];
		const SETTINGS_NAMESPACE = "moe4all-engine";
		function changedFields(current, next) {
			return Object.keys(next).filter((field) => JSON.stringify(current[field]) !== JSON.stringify(next[field]));
		}
		function apply(ctx) {
			const scope = ctx.settingsScope.bind({ namespace: SETTINGS_NAMESPACE });
			ctx.effect(() => ctx.locale.register("settings.moe4all", {
				zh,
				en
			}), "moe4all-engine: settings dictionaries");
			ctx.effect(() => {
				const tag = document.createElement("style");
				tag.dataset.plugin = "dsh-llm-moe4all";
				tag.textContent = styles;
				document.head.appendChild(tag);
				return () => {
					tag.remove();
				};
			}, "moe4all-engine: settings styles");
			const injected = () => ({
				hooks: { moe4AllSettings: scope },
				pickDirectory: () => ctx.workspaces.pickDirectory(),
				async save(next) {
					const current = scope.getSnapshot().value;
					if (current === void 0) return;
					await Promise.all(changedFields(current, next).map((field) => scope.set(field, next[field])));
				}
			});
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "moe4all",
				order: 15,
				label: () => ctx.locale.bind("settings.moe4all")("nav"),
				locale: "settings.moe4all",
				inject: injected
			}, Moe4AllSettings));
			ctx.slots.inject("settings.onboarding", () => ctx.slots.register({
				name: "settings.onboarding",
				id: "moe4all-setup",
				order: -50
			}, (owner) => (0, react.createElement)(Moe4AllOnboarding, {
				...owner,
				scope
			})));
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "moe4all-engine-startup",
				label: () => "MoE4All"
			}, () => (0, react.createElement)(EngineStartupOverlay, {
				scope,
				t: ctx.locale.bind("settings.moe4all")
			})));
		}
		const plugin = {
			inject,
			apply
		};
		//#endregion
		exports.apply = apply;
		exports.default = plugin;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map