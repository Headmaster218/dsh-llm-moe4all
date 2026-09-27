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
		//#region src/client/Moe4AllSettings.tsx
		function same(left, right) {
			return JSON.stringify(left) === JSON.stringify(right);
		}
		function lines(value) {
			return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
		}
		function resolved(value) {
			return value;
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
		function Moe4AllSettings(props) {
			const { t, useMoe4AllSettings, save } = props;
			const snapshot = useMoe4AllSettings((value) => value);
			const [draft, setDraft] = (0, react.useState)(snapshot.value === void 0 ? null : resolved(snapshot.value));
			const [saving, setSaving] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				if (!saving && snapshot.value !== void 0) setDraft(resolved(snapshot.value));
			}, [
				saving,
				snapshot.revision,
				snapshot.value
			]);
			const current = snapshot.value === void 0 ? null : resolved(snapshot.value);
			const dirty = draft !== null && current !== null && !same(draft, current);
			const endpoint = (0, react.useMemo)(() => {
				if (draft === null) return "";
				if (draft.endpoint.trim() !== "") return draft.endpoint.trim();
				const path = draft.apiBasePath.startsWith("/") ? draft.apiBasePath : `/${draft.apiBasePath}`;
				return `${draft.protocol}://${draft.host}:${draft.port}${path}`;
			}, [draft]);
			if (snapshot.status === "loading" || draft === null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: "m4a-settings__message",
				children: t("loading")
			});
			if (snapshot.status === "unavailable") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: "m4a-settings__message",
				children: t("unavailable")
			});
			const disabled = saving || !snapshot.writable;
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
			const submit = async () => {
				setSaving(true);
				try {
					await save(draft);
				} finally {
					setSaving(false);
				}
			};
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
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "m4a-settings__subtitle",
								children: t("subtitle")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "m4a-settings__status",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: `m4a-settings__dot${dirty ? " m4a-settings__dot--dirty" : ""}` }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: !snapshot.writable ? t("readOnly") : dirty ? t("unsaved") : t("saved") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
										className: "m4a-settings__endpoint",
										title: endpoint,
										children: endpoint
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "m4a-settings__group",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
							className: "m4a-settings__group-title",
							children: t("mode")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "m4a-settings__segmented",
							role: "group",
							"aria-label": t("mode"),
							children: [
								"connect",
								"auto",
								"managed"
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
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "m4a-settings__group",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
								className: "m4a-settings__group-title",
								children: t("connection")
							}),
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
										label: t("host"),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											className: "m4a-settings__input",
											value: draft.host,
											disabled,
											spellCheck: false,
											onChange: (event) => {
												setField("host", event.target.value);
											}
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
										label: t("apiBasePath"),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											className: "m4a-settings__input",
											value: draft.apiBasePath,
											disabled,
											spellCheck: false,
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
											spellCheck: false,
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
											spellCheck: false,
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
					draft.mode === "connect" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "m4a-settings__group",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
								className: "m4a-settings__group-title",
								children: t("startup")
							}),
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
											spellCheck: false,
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
											spellCheck: false,
											onChange: (event) => {
												setField("workingDirectory", event.target.value);
											}
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
										label: t("arguments"),
										hint: t("argumentsHint"),
										wide: true,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
											className: "m4a-settings__textarea",
											value: draft.arguments.join("\n"),
											disabled,
											spellCheck: false,
											onChange: (event) => {
												setField("arguments", lines(event.target.value));
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
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("output", { children: `${Math.round(draft.minimumFreeRamFraction * 100)}%` })]
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
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("output", { children: `${Math.round(draft.minimumFreeVramFraction * 100)}%` })]
										})
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Check, {
								checked: draft.promptWhenBusy,
								disabled,
								label: t("promptWhenBusy"),
								onChange: (value) => {
									setField("promptWhenBusy", value);
								}
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
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "m4a-settings__group",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
								className: "m4a-settings__group-title",
								children: t("model")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "m4a-settings__grid",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
									label: t("contextWindow"),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: "m4a-settings__input",
										type: "number",
										min: 1,
										step: 1024,
										value: draft.contextWindow,
										disabled,
										onChange: (event) => {
											numberField("contextWindow", event.target.value);
										}
									})
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
									label: t("maxTokens"),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: "m4a-settings__input",
										type: "number",
										min: 1,
										step: 1024,
										value: draft.maxTokens,
										disabled,
										onChange: (event) => {
											numberField("maxTokens", event.target.value);
										}
									})
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Check, {
								checked: draft.vision,
								disabled,
								label: t("vision"),
								onChange: (value) => {
									setField("vision", value);
								}
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
						className: "m4a-settings__details",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("advanced") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "m4a-settings__grid",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
									label: t("processNames"),
									hint: t("listHint"),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
										className: "m4a-settings__textarea",
										value: draft.processNames.join("\n"),
										disabled,
										spellCheck: false,
										onChange: (event) => {
											setField("processNames", lines(event.target.value));
										}
									})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
									label: t("excludeModels"),
									hint: t("listHint"),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
										className: "m4a-settings__textarea",
										value: draft.excludeModelNameContains.join("\n"),
										disabled,
										spellCheck: false,
										onChange: (event) => {
											setField("excludeModelNameContains", lines(event.target.value));
										}
									})
								}),
								[
									["resourceProbeTimeoutMs", "resourceProbeTimeout"],
									["startupTimeoutMs", "startupTimeout"],
									["healthTimeoutMs", "healthTimeout"],
									["pollIntervalMs", "pollInterval"],
									["shutdownTimeoutMs", "shutdownTimeout"],
									["modelRefreshIntervalMs", "modelRefreshInterval"],
									["modelDiscoveryTimeoutMs", "modelDiscoveryTimeout"]
								].map(([field, label]) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
									label: t(label),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: "m4a-settings__input",
										type: "number",
										min: 1,
										step: 100,
										value: draft[field],
										disabled,
										onChange: (event) => {
											numberField(field, event.target.value);
										}
									})
								}, field))
							]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-settings__actions",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "m4a-settings__button",
							disabled: disabled || !dirty || current === null,
							onClick: () => {
								if (current !== null) setDraft(current);
							},
							children: t("revert")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "m4a-settings__button m4a-settings__button--primary",
							disabled: disabled || !dirty,
							onClick: () => {
								submit();
							},
							children: saving ? t("saving") : t("save")
						})]
					})
				]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		const en = {
			nav: "MoE4All",
			title: "MoE4All engine",
			subtitle: "Connect DSH to an existing engine, or let this plugin start and supervise a local engine.",
			loading: "Loading configuration...",
			unavailable: "Engine settings are unavailable on this connection.",
			readOnly: "This configuration is read-only.",
			saved: "Saved",
			unsaved: "Unsaved changes",
			saving: "Saving...",
			save: "Save changes",
			revert: "Revert",
			mode: "Engine mode",
			connect: "Connect only",
			auto: "Auto",
			managed: "Managed",
			connection: "Connection",
			protocol: "Protocol",
			host: "Host",
			port: "Port",
			apiBasePath: "API base path",
			endpoint: "Endpoint override",
			endpointHint: "Optional. Overrides protocol, host, port, and API base path.",
			apiKeyEnv: "API key environment variable",
			allowRemoteEndpoint: "Allow a non-loopback endpoint",
			startup: "Local engine startup",
			executable: "Engine executable",
			workingDirectory: "Working directory",
			arguments: "Arguments",
			argumentsHint: "One argument per line.",
			minimumFreeRam: "Minimum free RAM",
			minimumFreeVram: "Minimum free VRAM",
			promptWhenBusy: "Ask before starting when the machine is busy",
			stopOnUnload: "Stop an engine started by this plugin when DSH exits",
			logOutput: "Forward engine output to the DSH log",
			model: "Model defaults",
			contextWindow: "Context window",
			maxTokens: "Maximum output tokens",
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
			modelDiscoveryTimeout: "Model discovery timeout (ms)"
		};
		const zh = {
			nav: "MoE4All",
			title: "MoE4All 引擎",
			subtitle: "连接已有引擎，或由插件启动并管理本机 MoE4All 引擎。",
			loading: "正在加载配置...",
			unavailable: "当前连接无法访问引擎设置。",
			readOnly: "当前配置为只读。",
			saved: "已保存",
			unsaved: "有未保存的更改",
			saving: "正在保存...",
			save: "保存更改",
			revert: "撤销更改",
			mode: "引擎模式",
			connect: "仅连接",
			auto: "自动",
			managed: "托管",
			connection: "连接",
			protocol: "协议",
			host: "主机",
			port: "端口",
			apiBasePath: "API 基础路径",
			endpoint: "覆盖 Endpoint",
			endpointHint: "可选。填写后将覆盖协议、主机、端口和 API 基础路径。",
			apiKeyEnv: "API Key 环境变量",
			allowRemoteEndpoint: "允许连接非本机地址",
			startup: "本机引擎启动",
			executable: "引擎程序",
			workingDirectory: "工作目录",
			arguments: "启动参数",
			argumentsHint: "每行一个参数。",
			minimumFreeRam: "最低空闲 RAM",
			minimumFreeVram: "最低空闲 VRAM",
			promptWhenBusy: "机器繁忙时先询问再启动",
			stopOnUnload: "DSH 退出时停止由插件启动的引擎",
			logOutput: "将引擎输出写入 DSH 日志",
			model: "模型默认值",
			contextWindow: "上下文窗口",
			maxTokens: "最大输出 Token",
			vision: "声明支持图片输入",
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
			modelDiscoveryTimeout: "模型探测超时（毫秒）"
		};
		//#endregion
		//#region src/client/styles.ts
		const styles = `
.m4a-settings {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: min(100%, 760px);
  color: var(--dsw-alias-label-primary);
}
.m4a-settings * { box-sizing: border-box; }
.m4a-settings__header { display: flex; flex-direction: column; gap: 6px; }
.m4a-settings__title { margin: 0; font-size: 18px; line-height: 1.4; font-weight: 650; }
.m4a-settings__subtitle { margin: 0; max-width: 680px; color: var(--dsw-alias-label-tertiary); font-size: 13px; line-height: 1.55; }
.m4a-settings__status { display: flex; align-items: center; gap: 8px; min-height: 24px; font-size: 12px; color: var(--dsw-alias-label-tertiary); }
.m4a-settings__dot { width: 7px; height: 7px; border-radius: 50%; background: var(--dsw-alias-state-success-primary, #2f9e63); }
.m4a-settings__dot--dirty { background: var(--dsw-alias-state-warning-primary, #c47b18); }
.m4a-settings__endpoint { margin-left: auto; max-width: 65%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
.m4a-settings__group { display: flex; flex-direction: column; gap: 14px; padding: 0 0 22px; border-bottom: 1px solid var(--dsw-alias-border-l2); }
.m4a-settings__group:last-of-type { border-bottom: 0; }
.m4a-settings__group-title { margin: 0; font-size: 13px; line-height: 1.4; font-weight: 650; }
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
.m4a-settings__details[open] summary { margin-bottom: 14px; }
.m4a-settings__actions { position: sticky; bottom: 0; display: flex; justify-content: flex-end; gap: 8px; padding: 12px 0; background: var(--dsw-alias-bg-layer-1, transparent); }
.m4a-settings__button { min-height: 34px; padding: 0 14px; border-radius: 6px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; cursor: pointer; }
.m4a-settings__button--primary { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-brand-primary); color: white; }
.m4a-settings__button:disabled { opacity: .5; cursor: default; }
.m4a-settings__message { margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 13px; }
@media (max-width: 680px) {
  .m4a-settings__grid { grid-template-columns: minmax(0, 1fr); }
  .m4a-settings__field--wide { grid-column: auto; }
  .m4a-settings__endpoint { display: none; }
}
`;
		//#endregion
		//#region src/client/index.ts
		const inject = [
			"slots",
			"locale",
			"settingsScope"
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