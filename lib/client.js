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
		//#region node_modules/lucide-react/dist/esm/shared/src/utils.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
		const mergeClasses = (...classes) => classes.filter((className, index, array) => {
			return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
		}).join(" ").trim();
		//#endregion
		//#region node_modules/lucide-react/dist/esm/defaultAttributes.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		var defaultAttributes = {
			xmlns: "http://www.w3.org/2000/svg",
			width: 24,
			height: 24,
			viewBox: "0 0 24 24",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: 2,
			strokeLinecap: "round",
			strokeLinejoin: "round"
		};
		//#endregion
		//#region node_modules/lucide-react/dist/esm/Icon.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Icon = (0, react.forwardRef)(({ color = "currentColor", size = 24, strokeWidth = 2, absoluteStrokeWidth, className = "", children, iconNode, ...rest }, ref) => {
			return (0, react.createElement)("svg", {
				ref,
				...defaultAttributes,
				width: size,
				height: size,
				stroke: color,
				strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
				className: mergeClasses("lucide", className),
				...rest
			}, [...iconNode.map(([tag, attrs]) => (0, react.createElement)(tag, attrs)), ...Array.isArray(children) ? children : [children]]);
		});
		//#endregion
		//#region node_modules/lucide-react/dist/esm/createLucideIcon.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const createLucideIcon = (iconName, iconNode) => {
			const Component = (0, react.forwardRef)(({ className, ...props }, ref) => (0, react.createElement)(Icon, {
				ref,
				iconNode,
				className: mergeClasses(`lucide-${toKebabCase(iconName)}`, className),
				...props
			}));
			Component.displayName = `${iconName}`;
			return Component;
		};
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/activity.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Activity = createLucideIcon("Activity", [["path", {
			d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",
			key: "169zse"
		}]]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/arrow-down-to-line.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const ArrowDownToLine = createLucideIcon("ArrowDownToLine", [
			["path", {
				d: "M12 17V3",
				key: "1cwfxf"
			}],
			["path", {
				d: "m6 11 6 6 6-6",
				key: "12ii2o"
			}],
			["path", {
				d: "M19 21H5",
				key: "150jfl"
			}]
		]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/arrow-right.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const ArrowRight = createLucideIcon("ArrowRight", [["path", {
			d: "M5 12h14",
			key: "1ays0h"
		}], ["path", {
			d: "m12 5 7 7-7 7",
			key: "xquz4c"
		}]]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/arrow-up-right.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const ArrowUpRight = createLucideIcon("ArrowUpRight", [["path", {
			d: "M7 7h10v10",
			key: "1tivn9"
		}], ["path", {
			d: "M7 17 17 7",
			key: "1vkiza"
		}]]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/check.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Check = createLucideIcon("Check", [["path", {
			d: "M20 6 9 17l-5-5",
			key: "1gmf2c"
		}]]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/chevron-down.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const ChevronDown = createLucideIcon("ChevronDown", [["path", {
			d: "m6 9 6 6 6-6",
			key: "qrunsl"
		}]]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/chevron-right.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const ChevronRight = createLucideIcon("ChevronRight", [["path", {
			d: "m9 18 6-6-6-6",
			key: "mthhwq"
		}]]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/circle-alert.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const CircleAlert = createLucideIcon("CircleAlert", [
			["circle", {
				cx: "12",
				cy: "12",
				r: "10",
				key: "1mglay"
			}],
			["line", {
				x1: "12",
				x2: "12",
				y1: "8",
				y2: "12",
				key: "1pkeuh"
			}],
			["line", {
				x1: "12",
				x2: "12.01",
				y1: "16",
				y2: "16",
				key: "4dfq90"
			}]
		]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/circle-help.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const CircleHelp = createLucideIcon("CircleHelp", [
			["circle", {
				cx: "12",
				cy: "12",
				r: "10",
				key: "1mglay"
			}],
			["path", {
				d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",
				key: "1u773s"
			}],
			["path", {
				d: "M12 17h.01",
				key: "p32p05"
			}]
		]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/code-xml.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const CodeXml = createLucideIcon("CodeXml", [
			["path", {
				d: "m18 16 4-4-4-4",
				key: "1inbqp"
			}],
			["path", {
				d: "m6 8-4 4 4 4",
				key: "15zrgr"
			}],
			["path", {
				d: "m14.5 4-5 16",
				key: "e7oirm"
			}]
		]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/copy.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Copy = createLucideIcon("Copy", [["rect", {
			width: "14",
			height: "14",
			x: "8",
			y: "8",
			rx: "2",
			ry: "2",
			key: "17jyea"
		}], ["path", {
			d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",
			key: "zix9uf"
		}]]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/cpu.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Cpu = createLucideIcon("Cpu", [
			["rect", {
				width: "16",
				height: "16",
				x: "4",
				y: "4",
				rx: "2",
				key: "14l7u7"
			}],
			["rect", {
				width: "6",
				height: "6",
				x: "9",
				y: "9",
				rx: "1",
				key: "5aljv4"
			}],
			["path", {
				d: "M15 2v2",
				key: "13l42r"
			}],
			["path", {
				d: "M15 20v2",
				key: "15mkzm"
			}],
			["path", {
				d: "M2 15h2",
				key: "1gxd5l"
			}],
			["path", {
				d: "M2 9h2",
				key: "1bbxkp"
			}],
			["path", {
				d: "M20 15h2",
				key: "19e6y8"
			}],
			["path", {
				d: "M20 9h2",
				key: "19tzq7"
			}],
			["path", {
				d: "M9 2v2",
				key: "165o2o"
			}],
			["path", {
				d: "M9 20v2",
				key: "i2bqo8"
			}]
		]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/database.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Database = createLucideIcon("Database", [
			["ellipse", {
				cx: "12",
				cy: "5",
				rx: "9",
				ry: "3",
				key: "msslwz"
			}],
			["path", {
				d: "M3 5V19A9 3 0 0 0 21 19V5",
				key: "1wlel7"
			}],
			["path", {
				d: "M3 12A9 3 0 0 0 21 12",
				key: "mv7ke4"
			}]
		]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/file-plus-2.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const FilePlus2 = createLucideIcon("FilePlus2", [
			["path", {
				d: "M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4",
				key: "1pf5j1"
			}],
			["path", {
				d: "M14 2v4a2 2 0 0 0 2 2h4",
				key: "tnqrlb"
			}],
			["path", {
				d: "M3 15h6",
				key: "4e2qda"
			}],
			["path", {
				d: "M6 12v6",
				key: "1u72j0"
			}]
		]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/folder-open.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const FolderOpen = createLucideIcon("FolderOpen", [["path", {
			d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",
			key: "usdka0"
		}]]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/image.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Image = createLucideIcon("Image", [
			["rect", {
				width: "18",
				height: "18",
				x: "3",
				y: "3",
				rx: "2",
				ry: "2",
				key: "1m3agn"
			}],
			["circle", {
				cx: "9",
				cy: "9",
				r: "2",
				key: "af1f0g"
			}],
			["path", {
				d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",
				key: "1xmnt7"
			}]
		]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/layers.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Layers = createLucideIcon("Layers", [
			["path", {
				d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",
				key: "zw3jo"
			}],
			["path", {
				d: "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",
				key: "1wduqc"
			}],
			["path", {
				d: "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",
				key: "kqbvx6"
			}]
		]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/link.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Link = createLucideIcon("Link", [["path", {
			d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
			key: "1cjeqo"
		}], ["path", {
			d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
			key: "19qd67"
		}]]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/loader-circle.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const LoaderCircle = createLucideIcon("LoaderCircle", [["path", {
			d: "M21 12a9 9 0 1 1-6.219-8.56",
			key: "13zald"
		}]]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/monitor.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Monitor = createLucideIcon("Monitor", [
			["rect", {
				width: "20",
				height: "14",
				x: "2",
				y: "3",
				rx: "2",
				key: "48i651"
			}],
			["line", {
				x1: "8",
				x2: "16",
				y1: "21",
				y2: "21",
				key: "1svkeh"
			}],
			["line", {
				x1: "12",
				x2: "12",
				y1: "17",
				y2: "21",
				key: "vw1qmm"
			}]
		]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/network.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Network = createLucideIcon("Network", [
			["rect", {
				x: "16",
				y: "16",
				width: "6",
				height: "6",
				rx: "1",
				key: "4q2zg0"
			}],
			["rect", {
				x: "2",
				y: "16",
				width: "6",
				height: "6",
				rx: "1",
				key: "8cvhb9"
			}],
			["rect", {
				x: "9",
				y: "2",
				width: "6",
				height: "6",
				rx: "1",
				key: "1egb70"
			}],
			["path", {
				d: "M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3",
				key: "1jsf9p"
			}],
			["path", {
				d: "M12 12V8",
				key: "2874zd"
			}]
		]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/package.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Package = createLucideIcon("Package", [
			["path", {
				d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",
				key: "1a0edw"
			}],
			["path", {
				d: "M12 22V12",
				key: "d0xqtd"
			}],
			["path", {
				d: "m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7",
				key: "yx3hmr"
			}],
			["path", {
				d: "m7.5 4.27 9 5.15",
				key: "1c824w"
			}]
		]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/play.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Play = createLucideIcon("Play", [["polygon", {
			points: "6 3 20 12 6 21 6 3",
			key: "1oa8hb"
		}]]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/plus.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Plus = createLucideIcon("Plus", [["path", {
			d: "M5 12h14",
			key: "1ays0h"
		}], ["path", {
			d: "M12 5v14",
			key: "s699le"
		}]]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/refresh-cw.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const RefreshCw = createLucideIcon("RefreshCw", [
			["path", {
				d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",
				key: "v9h5vc"
			}],
			["path", {
				d: "M21 3v5h-5",
				key: "1q7to0"
			}],
			["path", {
				d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",
				key: "3uifl3"
			}],
			["path", {
				d: "M8 16H3v5",
				key: "1cv678"
			}]
		]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/rotate-ccw.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const RotateCcw = createLucideIcon("RotateCcw", [["path", {
			d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
			key: "1357e3"
		}], ["path", {
			d: "M3 3v5h5",
			key: "1xhq8a"
		}]]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/save.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Save = createLucideIcon("Save", [
			["path", {
				d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
				key: "1c8476"
			}],
			["path", {
				d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",
				key: "1ydtos"
			}],
			["path", {
				d: "M7 3v4a1 1 0 0 0 1 1h7",
				key: "t51u73"
			}]
		]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/search.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Search = createLucideIcon("Search", [["circle", {
			cx: "11",
			cy: "11",
			r: "8",
			key: "4ej97u"
		}], ["path", {
			d: "m21 21-4.3-4.3",
			key: "1qie3q"
		}]]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/settings-2.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Settings2 = createLucideIcon("Settings2", [
			["path", {
				d: "M20 7h-9",
				key: "3s1dr2"
			}],
			["path", {
				d: "M14 17H5",
				key: "gfn3mx"
			}],
			["circle", {
				cx: "17",
				cy: "17",
				r: "3",
				key: "18b49y"
			}],
			["circle", {
				cx: "7",
				cy: "7",
				r: "3",
				key: "dfmy0x"
			}]
		]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/sliders-horizontal.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const SlidersHorizontal = createLucideIcon("SlidersHorizontal", [
			["line", {
				x1: "21",
				x2: "14",
				y1: "4",
				y2: "4",
				key: "obuewd"
			}],
			["line", {
				x1: "10",
				x2: "3",
				y1: "4",
				y2: "4",
				key: "1q6298"
			}],
			["line", {
				x1: "21",
				x2: "12",
				y1: "12",
				y2: "12",
				key: "1iu8h1"
			}],
			["line", {
				x1: "8",
				x2: "3",
				y1: "12",
				y2: "12",
				key: "ntss68"
			}],
			["line", {
				x1: "21",
				x2: "16",
				y1: "20",
				y2: "20",
				key: "14d8ph"
			}],
			["line", {
				x1: "12",
				x2: "3",
				y1: "20",
				y2: "20",
				key: "m0wm8r"
			}],
			["line", {
				x1: "14",
				x2: "14",
				y1: "2",
				y2: "6",
				key: "14e1ph"
			}],
			["line", {
				x1: "8",
				x2: "8",
				y1: "10",
				y2: "14",
				key: "1i6ji0"
			}],
			["line", {
				x1: "16",
				x2: "16",
				y1: "18",
				y2: "22",
				key: "1lctlv"
			}]
		]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/sparkles.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Sparkles = createLucideIcon("Sparkles", [
			["path", {
				d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",
				key: "4pj2yx"
			}],
			["path", {
				d: "M20 3v4",
				key: "1olli1"
			}],
			["path", {
				d: "M22 5h-4",
				key: "1gvqau"
			}],
			["path", {
				d: "M4 17v2",
				key: "vumght"
			}],
			["path", {
				d: "M5 18H3",
				key: "zchphs"
			}]
		]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/square.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Square = createLucideIcon("Square", [["rect", {
			width: "18",
			height: "18",
			x: "3",
			y: "3",
			rx: "2",
			key: "afitv7"
		}]]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/terminal.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Terminal = createLucideIcon("Terminal", [["polyline", {
			points: "4 17 10 11 4 5",
			key: "akl6gq"
		}], ["line", {
			x1: "12",
			x2: "20",
			y1: "19",
			y2: "19",
			key: "q2wloq"
		}]]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/trash-2.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Trash2 = createLucideIcon("Trash2", [
			["path", {
				d: "M3 6h18",
				key: "d0wm0j"
			}],
			["path", {
				d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",
				key: "4alrt4"
			}],
			["path", {
				d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",
				key: "v07s0e"
			}],
			["line", {
				x1: "10",
				x2: "10",
				y1: "11",
				y2: "17",
				key: "1uufr5"
			}],
			["line", {
				x1: "14",
				x2: "14",
				y1: "11",
				y2: "17",
				key: "xtxkd"
			}]
		]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/wrench.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Wrench = createLucideIcon("Wrench", [["path", {
			d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
			key: "cbrjhi"
		}]]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/x.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const X = createLucideIcon("X", [["path", {
			d: "M18 6 6 18",
			key: "1bl5f8"
		}], ["path", {
			d: "m6 6 12 12",
			key: "d8bk6v"
		}]]);
		//#endregion
		//#region node_modules/lucide-react/dist/esm/icons/zap.js
		/**
		* @license lucide-react v0.468.0 - ISC
		*
		* This source code is licensed under the ISC license.
		* See the LICENSE file in the root directory of this source tree.
		*/
		const Zap = createLucideIcon("Zap", [["path", {
			d: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",
			key: "1xq2db"
		}]]);
		//#endregion
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
		function stopEngine() {
			return json("/api/moe4all/stop", {
				method: "POST",
				body: "{}"
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
		async function installLocalEngine(path) {
			await json("/api/moe4all/install-local", {
				method: "POST",
				body: JSON.stringify({ path })
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
		async function scanModelPath(path) {
			return (await json("/api/moe4all/model-files", {
				method: "POST",
				body: JSON.stringify({ path })
			})).files;
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
		//#region src/client/workspace-ui.tsx
		function Button({ icon: Icon, children, kind = "default", busy, ...props }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				...props,
				className: `m4a-btn m4a-btn--${kind} ${props.className ?? ""}`,
				disabled: props.disabled || busy,
				children: [busy ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LoaderCircle, {
					size: 16,
					className: "m4a-spin"
				}) : Icon ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Icon, {
					size: 16,
					"aria-hidden": "true"
				}) : null, children]
			});
		}
		function IconButton({ icon: Icon, label, ...props }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				...props,
				className: `m4a-icon-btn ${props.className ?? ""}`,
				"aria-label": label,
				title: label,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Icon, {
					size: 16,
					"aria-hidden": "true"
				})
			});
		}
		function Field({ label, help, children, className = "" }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				className: `m4a-field ${className}`,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: "m4a-field-label",
					children: [label, help && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						tabIndex: 0,
						className: "m4a-help",
						"aria-label": help,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(CircleHelp, { size: 13 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							role: "tooltip",
							children: help
						})]
					})]
				}), children]
			});
		}
		function Toggle({ label, checked, onChange, disabled, detail }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				className: "m4a-toggle-row",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "m4a-toggle-label",
						children: label
					}), detail && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: detail })] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						type: "checkbox",
						role: "switch",
						checked,
						disabled,
						onChange: (event) => onChange(event.target.checked)
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "m4a-switch",
						"aria-hidden": "true"
					})
				]
			});
		}
		function Disclosure({ title, children, icon: Icon, open = false }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
				className: "m4a-disclosure",
				open: open || void 0,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("summary", { children: [
					Icon && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Icon, { size: 16 }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: title }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChevronDown, { size: 15 })
				] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "m4a-disclosure-body",
					children
				})]
			});
		}
		function Dialog({ title, children, onClose, actions, closeLabel }) {
			const ref = (0, react.useRef)(null);
			const close = (0, react.useRef)(onClose);
			close.current = onClose;
			(0, react.useEffect)(() => {
				const element = ref.current;
				element?.showModal();
				const escape = (event) => {
					if (event.key !== "Escape" || !element?.open) return;
					event.preventDefault();
					event.stopImmediatePropagation();
					close.current();
				};
				window.addEventListener("keydown", escape, true);
				return () => {
					window.removeEventListener("keydown", escape, true);
					element?.close();
				};
			}, []);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dialog", {
				ref,
				className: "m4a-dialog",
				"aria-label": title,
				onKeyDown: (event) => {
					if (event.key === "Escape") event.stopPropagation();
				},
				onCancel: (event) => {
					event.preventDefault();
					onClose();
				},
				onClick: (event) => {
					if (event.target === event.currentTarget) onClose();
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "m4a-dialog-inner",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: title }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
							icon: X,
							label: closeLabel,
							onClick: onClose
						})] }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "m4a-dialog-body",
							children
						}),
						actions && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("footer", { children: actions })
					]
				})
			});
		}
		function Transfer({ label, detail, percent, error, actions }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: `m4a-transfer${error ? " m4a-transfer--error" : ""}`,
				role: "status",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-transfer-heading",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: label }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: percent === void 0 ? "" : `${Math.min(100, Math.max(0, percent)).toFixed(1)}%` }),
							actions
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("progress", {
						"aria-label": label,
						max: 100,
						value: percent
					}),
					detail && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: detail }),
					error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: error })
				]
			});
		}
		//#endregion
		//#region src/client/EngineStartupOverlay.tsx
		function EngineStartupOverlay({ scope, t }) {
			const snapshot = (0, react.useSyncExternalStore)((listener) => scope.subscribe(listener), () => scope.getSnapshot(), () => scope.getSnapshot());
			const [status, setStatus] = (0, react.useState)(null);
			const [busy, setBusy] = (0, react.useState)(false);
			const [remember, setRemember] = (0, react.useState)(false);
			const [dismissed, setDismissed] = (0, react.useState)(false);
			const [settingsOpen, setSettingsOpen] = (0, react.useState)(document.documentElement.dataset.moe4allSettings === "open");
			const [error, setError] = (0, react.useState)("");
			(0, react.useEffect)(() => {
				let disposed = false;
				let timer;
				const poll = async () => {
					try {
						const next = await fetchEngineStatus();
						if (!disposed) setStatus(next);
					} catch {}
					if (!disposed) timer = setTimeout(() => {
						poll();
					}, 1500);
				};
				const visibility = () => {
					const open = document.documentElement.dataset.moe4allSettings === "open";
					setSettingsOpen(open);
					if (open) setDismissed(true);
				};
				window.addEventListener("moe4all-settings-visibility", visibility);
				poll();
				return () => {
					disposed = true;
					clearTimeout(timer);
					window.removeEventListener("moe4all-settings-visibility", visibility);
				};
			}, []);
			async function launch(force) {
				setBusy(true);
				setError("");
				try {
					const result = await startEngine(force);
					setStatus(result.status);
					if (result.ok) {
						if (remember) await scope.set("mode", "auto");
						setDismissed(true);
					}
				} catch (cause) {
					setError(cause instanceof Error ? cause.message : String(cause));
				} finally {
					setBusy(false);
				}
			}
			const config = snapshot.value;
			if (!config || !status || settingsOpen || dismissed || status.ready || config.mode === "connect") return null;
			const phase = status.phase;
			if (![
				"offline",
				"starting",
				"error",
				"duplicate-process",
				"resource-warning"
			].includes(phase)) return null;
			if (phase === "offline" && config.mode === "auto") return null;
			const starting = phase === "starting" || busy;
			const warning = phase === "resource-warning";
			const failed = phase === "error" || phase === "duplicate-process";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Dialog, {
				title: t(starting ? "startupProgressTitle" : warning ? "resourceWarningTitle" : failed ? "startupFailedTitle" : "startupPromptTitle"),
				closeLabel: t("notNow"),
				onClose: () => setDismissed(true),
				actions: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
					onClick: () => setDismissed(true),
					children: t("notNow")
				}), !starting && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
					kind: warning ? "danger" : "primary",
					icon: failed ? RefreshCw : Play,
					onClick: () => void launch(warning),
					children: t(warning ? "startAnyway" : failed ? "retryStart" : "startNow")
				})] }),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t(warning ? "resourceWarningBody" : starting ? "startupProgressBody" : "startupPromptBody") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: status.endpoint }),
					warning && status.reasons?.map((reason) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: reason }, reason)),
					failed && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						role: "alert",
						children: status.message
					}),
					starting && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("progress", { "aria-label": t("startingStatus") }),
					(starting || failed) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
						className: "m4a-log m4a-log--preview",
						children: status.startupLines?.join("\n") || status.message || t("noOutput")
					}),
					!starting && !failed && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Toggle, {
						checked: remember,
						onChange: setRemember,
						label: t("autoStart"),
						detail: t("resourcesHelp")
					}),
					error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						role: "alert",
						children: error
					})
				]
			});
		}
		//#endregion
		//#region src/client/Moe4AllOnboarding.tsx
		function Moe4AllOnboarding({ scope, complete, openSection }) {
			const config = (0, react.useSyncExternalStore)((listener) => scope.subscribe(listener), () => scope.getSnapshot(), () => scope.getSnapshot()).value;
			const needsSetup = config !== void 0 && config.mode !== "connect" && ((config.executable ?? "").trim() === "" || (config.arguments?.length ?? 0) === 0);
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
		//#region src/connection.ts
		function isLoopback(hostname) {
			const host = hostname.toLowerCase();
			return host === "localhost" || host === "::1" || host === "[::1]" || /^127(?:\.|$)/.test(host);
		}
		function endpointFromConfig(config) {
			const explicit = config.endpoint?.trim();
			if (explicit) return explicit;
			let host = (config.host ?? "127.0.0.1").trim();
			if (config.mode !== "connect" && [
				"0.0.0.0",
				"::",
				"[::]"
			].includes(host)) host = host === "0.0.0.0" ? "127.0.0.1" : "::1";
			if (host.includes(":") && !host.startsWith("[")) host = `[${host}]`;
			const rawPath = config.apiBasePath ?? "/v1";
			const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
			return `${config.protocol ?? "http"}://${host}:${config.port ?? 8080}${path}`;
		}
		function validateEndpoint(endpoint, allowRemoteEndpoint = false) {
			const parsed = new URL(endpoint);
			if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error(`MoE4All endpoint must use http or https: ${endpoint}`);
			if (parsed.username || parsed.password) throw new Error("MoE4All endpoint must not contain credentials");
			if (!allowRemoteEndpoint && !isLoopback(parsed.hostname)) throw new Error(`MoE4All endpoint is not loopback: ${parsed.hostname}`);
			return parsed;
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
			let result;
			for (let index = 0; index < arguments_.length; index++) if (arguments_[index] === option) result = arguments_[++index];
			else if (arguments_[index].startsWith(`${option}=`)) result = arguments_[index].slice(option.length + 1);
			return result;
		}
		function setValue(arguments_, path) {
			let result;
			for (let index = 0; index < arguments_.length; index += 1) {
				const argument = arguments_[index];
				if (argument === "--set") {
					const value = arguments_[index + 1];
					if (value?.startsWith(`${path}=`)) result = value.slice(path.length + 1);
					index += 1;
					continue;
				}
				const inline = /^--set=(.+)$/u.exec(argument)?.[1];
				if (inline?.startsWith(`${path}=`)) result = inline.slice(path.length + 1);
			}
			return result;
		}
		const managedOptions = /* @__PURE__ */ new Set([
			"--addr",
			"--parallel",
			"--ctx",
			"--max-new",
			"--mmproj",
			"--embedding-model",
			"--embedding-idle-timeout"
		]);
		const managedSettings = /* @__PURE__ */ new Set([
			"device.auto_profile",
			"spec.mtp",
			"spec.draft",
			"kv.type_k",
			"kv.type_v",
			"kv.session_cache_dir",
			"kv.session_idle_secs",
			"kv.session_cache_max",
			"kv.session_cache_ttl_hours"
		]);
		function modelArgument(arguments_) {
			for (let index = 0; index < arguments_.length; index += 1) {
				const argument = arguments_[index];
				if (argument.startsWith("-")) {
					if (!argument.includes("=") && ![
						"--think",
						"--no-think",
						"--help",
						"--version"
					].includes(argument)) index += 1;
				} else if (/\.gguf$/iu.test(normalizeSetupPath(argument))) return normalizeSetupPath(argument);
			}
			return "";
		}
		function unmanagedArguments(arguments_) {
			const model = modelArgument(arguments_);
			const result = [];
			for (let index = 0; index < arguments_.length; index += 1) {
				const argument = arguments_[index];
				if (argument === "serve" || normalizeSetupPath(argument) === model) continue;
				const [option] = argument.split("=", 1);
				if (managedOptions.has(option)) {
					if (!argument.includes("=")) index += 1;
					continue;
				}
				if (option === "--set") {
					const entry = argument.startsWith("--set=") ? argument.slice(6) : arguments_[++index] ?? "";
					if (!managedSettings.has(entry.split("=", 1)[0])) result.push("--set", entry);
				} else result.push(argument);
			}
			return result;
		}
		function integer(value, fallback) {
			const parsed = Number(value);
			return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : fallback;
		}
		function parseEngineArguments(arguments_) {
			const sessionDirectory = setValue(arguments_, "kv.session_cache_dir") ?? "kv-sessions";
			const model = modelArgument(arguments_);
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
				kvTypeK: setValue(arguments_, "kv.type_k") ?? "auto",
				kvTypeV: setValue(arguments_, "kv.type_v") ?? "auto",
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
				`${host.includes(":") && !host.startsWith("[") ? `[${host}]` : host}:${values.port}`,
				"--parallel",
				String(values.parallel),
				"--ctx",
				String(values.contextWindow),
				"--max-new",
				String(values.maxTokens)
			];
			arguments_.push("--set", `device.auto_profile=${values.profile}`, "--set", `spec.mtp=${values.mtp}`);
			if (values.mtp) {
				if (mtpModel === "") throw new Error("An MTP head GGUF path is required when MTP is enabled.");
				arguments_.push("--set", `spec.draft=${mtpModel}`);
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
			} else {
				const kvTypeK = values.kvTypeK?.trim() || "auto";
				const kvTypeV = values.kvTypeV?.trim() || "auto";
				if (kvTypeK !== "auto") arguments_.push("--set", `kv.type_k=${kvTypeK}`);
				if (kvTypeV !== "auto") arguments_.push("--set", `kv.type_v=${kvTypeV}`);
				arguments_.push("--set", "kv.session_cache_dir=");
			}
			arguments_.push(...values.extraArguments ?? []);
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
		//#region src/client/workspace-model.ts
		function editorFromConfig(config) {
			return {
				config: {
					...config,
					mode: config.mode === "managed" ? "prompt" : config.mode ?? "prompt"
				},
				setup: parseEngineArguments(config.arguments ?? []),
				context: formatTokenValue(config.contextWindow ?? 163840),
				maxTokens: formatTokenValue(config.maxTokens ?? 102400),
				extras: unmanagedArguments(config.arguments ?? []),
				extraText: void 0
			};
		}
		const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
		const fileName = (path) => path.split(/[\\/]/u).at(-1) ?? path;
		const samePath = (left, right) => left.replaceAll("\\", "/").toLowerCase() === right.replaceAll("\\", "/").toLowerCase();
		const formatBytes = (value) => value >= 1024 ** 3 ? `${(value / 1024 ** 3).toFixed(1)} GiB` : `${(value / 1024 ** 2).toFixed(0)} MiB`;
		function argumentValue(args, option) {
			let found = "";
			for (let i = 0; i < args.length; i++) {
				const arg = args[i];
				if (option.startsWith("--")) {
					if (arg === option) found = args[++i] ?? "";
					else if (arg.startsWith(`${option}=`)) found = arg.slice(option.length + 1);
				} else if (arg === "--set" || arg.startsWith("--set=")) {
					const entry = arg === "--set" ? args[++i] ?? "" : arg.slice(6);
					if (entry.startsWith(`${option}=`)) found = entry.slice(option.length + 1);
				}
			}
			return found;
		}
		function setArgument(args, option, value) {
			const next = [];
			for (let i = 0; i < args.length; i++) {
				const arg = args[i];
				if (option.startsWith("--") && (arg === option || arg.startsWith(`${option}=`))) {
					if (arg === option) i++;
				} else if (!option.startsWith("--") && (arg === "--set" || arg.startsWith("--set="))) {
					const entry = arg === "--set" ? args[++i] ?? "" : arg.slice(6);
					if (!entry.startsWith(`${option}=`)) next.push("--set", entry);
				} else next.push(arg);
			}
			if (value.trim() !== "") next.push(...option.startsWith("--") ? [option, value.trim()] : ["--set", `${option}=${value.trim()}`]);
			return next;
		}
		function composeEditor(editor) {
			const contextWindow = parseTokenValue(editor.context);
			const maxTokens = parseTokenValue(editor.maxTokens);
			if (!contextWindow || !maxTokens) throw new Error("invalidTokens");
			const config = {
				...editor.config,
				contextWindow,
				maxTokens
			};
			validateEndpoint(endpointFromConfig(config), config.allowRemoteEndpoint);
			if (config.mode === "connect") return config;
			const { sessionCache, ...setup } = editor.setup;
			if (!setup.model.trim()) throw new Error("missingModelError");
			const custom = parseExtraArguments(editor.extraText ?? JSON.stringify(editor.extras));
			config.arguments = buildEngineArguments({
				...setup,
				host: config.host ?? "127.0.0.1",
				port: config.port ?? 8080,
				contextWindow,
				maxTokens,
				...setup.sessionCacheEnabled ? { sessionCache } : {},
				extraArguments: custom
			});
			config.vision = setup.visionModel !== "";
			return config;
		}
		function parseExtraArguments(text) {
			try {
				const value = JSON.parse(text);
				if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) throw new Error();
				const canonical = value.flatMap((item) => item.startsWith("--set=") ? ["--set", item.slice(6)] : [item]);
				if (!equal(unmanagedArguments(["serve", ...canonical]), canonical)) throw new Error();
				return canonical;
			} catch {
				throw new Error("invalidExtra");
			}
		}
		function modelLibrary(locals, recommendations) {
			const seen = /* @__PURE__ */ new Set();
			const items = locals.map((local) => {
				const recommended = recommendations.find((item) => item.kind === local.kind && item.files.some((file) => file.name.toLowerCase() === fileName(local.path).toLowerCase()));
				if (recommended) seen.add(recommended.id);
				return {
					id: local.id,
					family: local.family,
					kind: local.kind,
					name: recommended?.name ?? local.name,
					quantization: local.quantization,
					size: local.sizeBytes,
					files: local.expectedFiles,
					local,
					...recommended ? { recommended } : {}
				};
			});
			for (const recommended of recommendations) if (!seen.has(recommended.id)) items.push({
				id: recommended.id,
				family: recommended.family,
				kind: recommended.kind,
				name: recommended.name,
				quantization: recommended.quantization,
				size: recommended.totalBytes,
				files: recommended.files.length,
				recommended
			});
			const families = [...new Set(recommendations.map((item) => item.family))];
			const roles = [
				"main",
				"vision",
				"mtp",
				"embedding"
			];
			return items.sort((a, b) => {
				const aRank = families.indexOf(a.family), bRank = families.indexOf(b.family);
				return (aRank < 0 ? 999 : aRank) - (bRank < 0 ? 999 : bRank) || a.family.localeCompare(b.family) || roles.indexOf(a.kind) - roles.indexOf(b.kind) || a.name.localeCompare(b.name);
			});
		}
		//#endregion
		//#region src/client/use-workspace.ts
		const isInstalling = (release) => !!release && [
			"checking",
			"downloading",
			"verifying",
			"extracting",
			"finalizing"
		].includes(release.install.stage);
		function useWorkspace(props) {
			const snapshot = props.useMoe4AllSettings((value) => value);
			const [editor, setEditor] = (0, react.useState)(null);
			const [baseline, setBaseline] = (0, react.useState)(null);
			const [status, setStatus] = (0, react.useState)(null);
			const [release, setRelease] = (0, react.useState)(null);
			const [catalog, setCatalog] = (0, react.useState)([]);
			const [library, setLibrary] = (0, react.useState)({
				directory: "",
				models: []
			});
			const [download, setDownload] = (0, react.useState)({
				stage: "idle",
				downloadedBytes: 0
			});
			const [defaultDirectory, setDefaultDirectory] = (0, react.useState)("");
			const [nativePicker, setNativePicker] = (0, react.useState)(false);
			const [working, setWorking] = (0, react.useState)("");
			const [scanning, setScanning] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)("");
			const [notice, setNotice] = (0, react.useState)("");
			const [resourcePrompt, setResourcePrompt] = (0, react.useState)(false);
			const saving = (0, react.useRef)(false);
			const mounted = (0, react.useRef)(true);
			const live = (0, react.useRef)(editor);
			live.current = editor;
			const dirty = editor !== null && baseline !== null && !equal(editor, baseline);
			const dirtyRef = (0, react.useRef)(dirty);
			dirtyRef.current = dirty;
			const directory = editor?.config.modelDirectory || defaultDirectory;
			const previousDownload = (0, react.useRef)("idle");
			const catalogRef = (0, react.useRef)([]);
			const scanGeneration = (0, react.useRef)(0);
			(0, react.useEffect)(() => {
				if (!snapshot.value || saving.current) return;
				const next = editorFromConfig(snapshot.value);
				setBaseline(next);
				if (!dirtyRef.current) setEditor(next);
			}, [snapshot.revision, snapshot.value]);
			function report(cause) {
				if (!mounted.current) return;
				const text = cause instanceof Error ? cause.message : String(cause);
				setError([
					"invalidTokens",
					"missingModelError",
					"missingEngineError",
					"importError",
					"selectDestination",
					"invalidExtra"
				].includes(text) ? props.t(text) : text);
			}
			async function run(label, task) {
				setWorking(label);
				setError("");
				setNotice("");
				try {
					await task();
					return true;
				} catch (cause) {
					report(cause);
					return false;
				} finally {
					if (mounted.current) setWorking("");
				}
			}
			async function scan(path = live.current?.config.modelDirectory || defaultDirectory, selected) {
				const generation = ++scanGeneration.current;
				setScanning(true);
				const setup = live.current?.setup;
				try {
					const result = await scanModelLibrary(path, selected ?? (setup ? [
						setup.model,
						setup.visionModel,
						setup.mtpModel,
						setup.embeddingModel
					].filter(Boolean) : []));
					if (mounted.current && generation === scanGeneration.current) setLibrary(result);
					return result;
				} finally {
					if (mounted.current && generation === scanGeneration.current) setScanning(false);
				}
			}
			(0, react.useEffect)(() => {
				mounted.current = true;
				let timer;
				let disposed = false;
				const poll = async () => {
					const results = await Promise.allSettled([
						fetchEngineStatus(),
						fetchReleaseStatus(),
						fetchModelDownload()
					]);
					if (disposed) return;
					const [runtime, engines, model] = results;
					if (runtime.status === "fulfilled") {
						setStatus(runtime.value);
						setError((previous) => previous === props.t("controlUnavailable") ? "" : previous);
					} else {
						setStatus(null);
						setError((previous) => previous || props.t("controlUnavailable"));
					}
					if (engines.status === "fulfilled") {
						setRelease(engines.value);
						const current = live.current;
						if (current?.config.mode !== "connect" && !current?.config.executable && engines.value.installed) selectEngine(engines.value.installed);
					}
					if (model.status === "fulfilled") {
						setDownload(model.value);
						if (model.value.stage === "complete" && previousDownload.current !== "complete") {
							const setup = live.current?.setup;
							scan(model.value.directory, [
								setup?.model ?? "",
								setup?.visionModel ?? "",
								setup?.mtpModel ?? "",
								setup?.embeddingModel ?? "",
								model.value.selectedFile ?? ""
							]).then(() => {
								if (catalogRef.current.find((item) => item.id === model.value.modelId)?.kind === "main" && !live.current?.setup.model && model.value.selectedFile) selectModel(model.value.selectedFile, "main");
							}).catch(report);
						}
						previousDownload.current = model.value.stage;
					}
					timer = setTimeout(() => {
						poll();
					}, 1200);
				};
				poll();
				fetchModelCatalog().then((result) => {
					if (disposed) return;
					setCatalog(result.models);
					catalogRef.current = result.models;
					setNativePicker(result.capabilities.nativeFilePicker);
					setDefaultDirectory(result.defaultDirectory);
				}).catch(report);
				return () => {
					mounted.current = false;
					disposed = true;
					clearTimeout(timer);
				};
			}, []);
			(0, react.useEffect)(() => {
				const timer = setTimeout(() => {
					if (editor !== null && directory) scan(directory).catch(report);
				}, 350);
				return () => clearTimeout(timer);
			}, [directory, editor === null]);
			const edit = (update) => setEditor((previous) => previous === null ? previous : update(previous));
			const config = (patch) => edit((previous) => ({
				...previous,
				config: {
					...previous.config,
					...patch
				}
			}));
			const setup = (patch) => edit((previous) => ({
				...previous,
				setup: {
					...previous.setup,
					...patch
				}
			}));
			async function persist(requireModel = false) {
				const value = live.current;
				if (requireModel && !value.config.executable) throw new Error("missingEngineError");
				const next = composeEditor(value);
				if (value.config.mode !== "connect") await validateModelPaths({
					main: value.setup.model,
					...value.setup.visionModel ? { vision: value.setup.visionModel } : {},
					...value.setup.embeddingModel ? { embedding: value.setup.embeddingModel } : {},
					...value.setup.mtp ? { mtp: value.setup.mtpModel } : {}
				});
				saving.current = true;
				try {
					await props.save(next);
					const saved = editorFromConfig(next);
					setBaseline(saved);
					setEditor(saved);
					live.current = saved;
					setNotice(status?.owned ? props.t("savedNextStart") : props.t("saved"));
				} finally {
					saving.current = false;
				}
				return next;
			}
			const save = () => run("save", async () => {
				await persist();
			});
			const launch = (force = false, restart = false) => run("start", async () => {
				await persist(live.current?.config.mode !== "connect");
				if (restart) await stopEngine();
				const result = await startEngine(force);
				setStatus(result.status);
				setResourcePrompt(result.status.phase === "resource-warning");
				if (result.ok) setNotice(props.t("connectionOk"));
			});
			const stop = () => run("stop", async () => {
				const result = await stopEngine();
				setStatus(result.status);
			});
			const refresh = () => run("refresh", async () => {
				const next = await fetchEngineStatus();
				setStatus(next);
				setNotice(props.t(next.ready ? "connectionOk" : "connectionFailed"));
			});
			function selectEngine(engine) {
				config({
					executable: engine.executable,
					workingDirectory: engine.workingDirectory
				});
				setNotice(props.t("engineSelectedNotice"));
			}
			async function install(localPath) {
				await run("install", async () => {
					if (localPath) await installLocalEngine(localPath);
					else await installLatestEngine();
					while (mounted.current) {
						const next = await fetchReleaseStatus();
						setRelease(next);
						if (!isInstalling(next)) {
							if (next.install.stage === "complete" && next.installed) selectEngine(next.installed);
							break;
						}
						await new Promise((resolve) => setTimeout(resolve, 600));
					}
				});
			}
			const checkUpdates = () => run("updates", async () => {
				const next = await fetchReleaseStatus(true);
				setRelease(next);
				if (next.message) throw new Error(next.message);
				setNotice(props.t(next.updateAvailable ? "newVersion" : "upToDate"));
			});
			const removeVersion = (engine) => run("delete", async () => {
				await deleteEngineVersion(engine.tag);
				setRelease(await fetchReleaseStatus());
			});
			const stopInstall = () => run("cancel-install", async () => {
				await cancelEngineInstall();
				setRelease(await fetchReleaseStatus());
			});
			function selectModel(path, kind) {
				edit((previous) => {
					const next = { ...previous.setup };
					if (kind === "main") {
						const model = library.models.find((item) => item.path === path);
						const previousModel = library.models.find((item) => item.path === next.model);
						if (path !== next.model && (!model || !previousModel || model.family !== previousModel.family)) {
							next.visionModel = "";
							next.mtpModel = "";
							next.mtp = false;
						}
						next.model = path;
						if (model) {
							const related = library.models.filter((item) => item.family === model.family && item.complete);
							if (!next.visionModel) next.visionModel = related.find((item) => item.kind === "vision")?.path ?? "";
							if (!next.mtpModel) next.mtpModel = related.find((item) => item.kind === "mtp")?.path ?? "";
						}
					} else if (kind === "vision") next.visionModel = path;
					else if (kind === "embedding") next.embeddingModel = path;
					else {
						next.mtpModel = path;
						next.mtp = !!path;
					}
					return {
						...previous,
						setup: next
					};
				});
				setNotice(props.t("modelSelectedNotice"));
			}
			const importPath = (path, kind = "main") => run("import", async () => {
				const files = await scanModelPath(normalizeSetupPath(path));
				const selected = files.selected && files[kind].includes(files.selected) ? files.selected : files[kind][0];
				if (!selected) throw new Error("importError");
				const model = (await scan(directory, [...live.current ? [
					live.current.setup.model,
					live.current.setup.visionModel,
					live.current.setup.mtpModel,
					live.current.setup.embeddingModel
				] : [], selected])).models.find((item) => item.path === selected);
				if (model && !model.complete) throw new Error(props.t("incompleteModel"));
				selectModel(selected, kind);
				if (kind === "main") setup({
					model: selected,
					visionModel: files.vision[0] ?? "",
					mtpModel: files.mtp[0] ?? "",
					mtp: false
				});
			});
			const pickFile = (kind = "main") => run("picker", async () => {
				const path = await pickModelFile();
				if (path) await importPath(path, kind);
			});
			const pickDirectory = () => run("directory", async () => {
				const path = await props.pickDirectory();
				if (path) {
					config({ modelDirectory: path });
					await scan(path);
				}
			});
			const downloadModel = (model) => run("download", async () => {
				if (!directory) throw new Error("selectDestination");
				config({ modelDirectory: directory });
				setDownload(await startModelDownload(model.id, download.modelId === model.id && download.directory ? download.directory : directory));
			});
			const stopDownload = () => run("cancel-download", async () => {
				setDownload(await cancelModelDownload());
			});
			return {
				editor,
				baseline,
				dirty,
				edit,
				config,
				setup,
				status,
				release,
				catalog,
				library,
				download,
				directory,
				nativePicker,
				working,
				scanning,
				error,
				notice,
				setError,
				setNotice,
				resourcePrompt,
				setResourcePrompt,
				disabled: !snapshot.writable || [
					"save",
					"start",
					"stop",
					"delete"
				].includes(working),
				snapshot,
				scan: () => run("scan", async () => {
					await scan();
				}),
				save,
				launch,
				stop,
				refresh,
				selectEngine,
				install,
				checkUpdates,
				removeVersion,
				stopInstall,
				selectModel,
				importPath,
				pickFile,
				pickDirectory,
				downloadModel,
				stopDownload,
				revert: () => {
					if (baseline) setEditor(baseline);
					setError("");
					setNotice("");
				}
			};
		}
		//#endregion
		//#region src/client/AdvancedOptions.tsx
		function ExtraArguments({ workspace: w, t }) {
			const text = w.editor.extraText ?? JSON.stringify(w.editor.extras, null, 2);
			let valid = true;
			try {
				parseExtraArguments(text);
			} catch {
				valid = false;
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Field, {
				label: t("customArguments"),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
					rows: 7,
					spellCheck: false,
					value: text,
					"aria-invalid": !valid,
					onChange: (event) => {
						const extraText = event.target.value;
						w.edit((previous) => {
							try {
								return {
									...previous,
									extras: parseExtraArguments(extraText),
									extraText
								};
							} catch {
								return {
									...previous,
									extraText
								};
							}
						});
					}
				}), !valid && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "m4a-field-error",
					children: t("invalidExtra")
				})]
			});
		}
		function AdvancedOptions({ workspace: w, t }) {
			const e = w.editor;
			const kvPreset = e.setup.sessionCacheEnabled ? "q8_0" : e.setup.kvTypeK === e.setup.kvTypeV && [
				"auto",
				"q8_0",
				"f16"
			].includes(e.setup.kvTypeK) ? e.setup.kvTypeK : "custom";
			const setKvPreset = (value) => {
				if (value === "custom") {
					w.setup({
						kvTypeK: e.setup.kvTypeK === "auto" ? "q8_0" : e.setup.kvTypeK,
						kvTypeV: e.setup.kvTypeV === "auto" ? "f16" : e.setup.kvTypeV
					});
					return;
				}
				w.setup({
					kvTypeK: value,
					kvTypeV: value
				});
			};
			const argument = (key, label, placeholder = t("automatic")) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
				label,
				help: t("advancedOverride"),
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					placeholder,
					value: argumentValue(e.extras, key),
					onChange: (event) => w.edit((previous) => ({
						...previous,
						extraText: void 0,
						extras: setArgument(previous.extras, key, event.target.value)
					}))
				})
			});
			let preview = "";
			try {
				preview = JSON.stringify(composeEditor(e).arguments ?? [], null, 2);
			} catch {}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "m4a-advanced",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Disclosure, {
						title: t("memoryCompute"),
						icon: Cpu,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "m4a-field-grid",
							children: [
								argument("--dev", t("deviceLabel"), "Vulkan0"),
								argument("--threads", t("threadsLabel")),
								argument("device.ram_budget", t("ramLabel"), "48g"),
								argument("device.vram_budget", t("vramLabel"), "22g"),
								argument("--ubatch", t("batchLabel")),
								argument("device.submit_dispatches", t("splitterLabel"))
							]
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Disclosure, {
						title: t("samplingSection"),
						icon: SlidersHorizontal,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "m4a-field-grid",
							children: [
								argument("--temp", t("temperatureLabel")),
								argument("--top-p", "Top P"),
								argument("--top-k", "Top K"),
								argument("--seed", "Seed")
							]
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Disclosure, {
						title: t("cacheSection"),
						icon: Database,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "m4a-field-grid",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
									label: t("kvQuantization"),
									help: t("kvQuantizationHelp"),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
										value: kvPreset,
										disabled: e.setup.sessionCacheEnabled,
										onChange: (event) => setKvPreset(event.target.value),
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: "auto",
												children: t("automatic")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: "q8_0",
												children: "Q8_0 K + Q8_0 V"
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: "f16",
												children: "F16 K + F16 V"
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: "custom",
												children: t("kvCustom")
											})
										]
									})
								}), kvPreset === "custom" && !e.setup.sessionCacheEnabled && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
									label: t("kvKeyType"),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
										value: e.setup.kvTypeK,
										onChange: (event) => w.setup({ kvTypeK: event.target.value }),
										children: [
											"q8_0",
											"q4_0",
											"q4_1",
											"q5_0",
											"q5_1",
											"iq4_nl",
											"f16",
											"bf16",
											"f32",
											"turbo2",
											"turbo3",
											"turbo4"
										].map((value) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value,
											children: value
										}, value))
									})
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
									label: t("kvValueType"),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
										value: e.setup.kvTypeV,
										onChange: (event) => w.setup({ kvTypeV: event.target.value }),
										children: [
											"q8_0",
											"q4_0",
											"q4_1",
											"q5_0",
											"q5_1",
											"iq4_nl",
											"f16",
											"bf16",
											"f32",
											"turbo2",
											"turbo3",
											"turbo4"
										].map((value) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value,
											children: value
										}, value))
									})
								})] })]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Toggle, {
								label: t("cacheEnabled"),
								checked: e.setup.sessionCacheEnabled,
								onChange: (value) => w.setup({ sessionCacheEnabled: value })
							}),
							e.setup.sessionCacheEnabled && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("sessionCacheKvHint") }),
							e.setup.sessionCacheEnabled && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "m4a-field-grid",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
										label: t("sessionCachePath"),
										help: t("sessionCachePathHint"),
										className: "m4a-span-2",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											value: e.setup.sessionCache.directory,
											onChange: (event) => w.setup({ sessionCache: {
												...e.setup.sessionCache,
												directory: event.target.value
											} })
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
										label: t("sessionCacheMax"),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											value: e.setup.sessionCache.maxSize,
											onChange: (event) => w.setup({ sessionCache: {
												...e.setup.sessionCache,
												maxSize: event.target.value
											} })
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
										label: t("sessionCacheIdle"),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "number",
											min: 0,
											value: e.setup.sessionCache.idleSeconds,
											onChange: (event) => w.setup({ sessionCache: {
												...e.setup.sessionCache,
												idleSeconds: Number(event.target.value)
											} })
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
										label: t("sessionCacheTtl"),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "number",
											min: 0,
											value: e.setup.sessionCache.ttlHours,
											onChange: (event) => w.setup({ sessionCache: {
												...e.setup.sessionCache,
												ttlHours: Number(event.target.value)
											} })
										})
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Disclosure, {
						title: t("networkSection"),
						icon: Network,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "m4a-field-grid",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
									label: t("host"),
									help: t("networkHelp"),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										value: e.config.host ?? "127.0.0.1",
										onChange: (event) => w.config({ host: event.target.value })
									})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
									label: t("port"),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "number",
										min: 1,
										max: 65535,
										value: e.config.port ?? 8080,
										onChange: (event) => w.config({ port: Number(event.target.value) })
									})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
									label: t("apiKeyEnv"),
									help: t("apiKeyHelp"),
									className: "m4a-span-2",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										value: e.config.apiKeyEnv ?? "",
										placeholder: "INFR_API_KEY",
										onChange: (event) => w.config({ apiKeyEnv: event.target.value })
									})
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Toggle, {
							label: t("allowRemoteEndpoint"),
							checked: e.config.allowRemoteEndpoint ?? false,
							onChange: (allowRemoteEndpoint) => w.config({ allowRemoteEndpoint })
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Disclosure, {
						title: t("diagnosticSettings"),
						icon: Wrench,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "m4a-field-grid",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
										label: t("startupTimeout"),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "number",
											min: 1e3,
											step: 1e3,
											value: e.config.startupTimeoutMs ?? 12e4,
											onChange: (event) => w.config({ startupTimeoutMs: Number(event.target.value) })
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
										label: t("healthTimeout"),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "number",
											min: 100,
											step: 100,
											value: e.config.healthTimeoutMs ?? 2e3,
											onChange: (event) => w.config({ healthTimeoutMs: Number(event.target.value) })
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
										label: t("minimumFreeRam"),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "m4a-range",
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												type: "range",
												min: 0,
												max: 90,
												step: 5,
												value: (e.config.minimumFreeRamFraction ?? .5) * 100,
												onChange: (event) => w.config({ minimumFreeRamFraction: Number(event.target.value) / 100 })
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("output", { children: [Math.round((e.config.minimumFreeRamFraction ?? .5) * 100), "%"] })]
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
										label: t("minimumFreeVram"),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "m4a-range",
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												type: "range",
												min: 0,
												max: 90,
												step: 5,
												value: (e.config.minimumFreeVramFraction ?? .5) * 100,
												onChange: (event) => w.config({ minimumFreeVramFraction: Number(event.target.value) / 100 })
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("output", { children: [Math.round((e.config.minimumFreeVramFraction ?? .5) * 100), "%"] })]
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
										label: t("embeddingIdleTimeout"),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "number",
											min: 0,
											value: e.setup.embeddingIdleTimeout,
											onChange: (event) => w.setup({ embeddingIdleTimeout: Number(event.target.value) })
										})
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Toggle, {
								label: t("stopOnUnload"),
								checked: e.config.stopOnUnload ?? true,
								onChange: (stopOnUnload) => w.config({ stopOnUnload })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Toggle, {
								label: t("logOutput"),
								checked: e.config.logOutput ?? true,
								onChange: (logOutput) => w.config({ logOutput })
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Disclosure, {
						title: t("customArguments"),
						icon: CodeXml,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ExtraArguments, {
							workspace: w,
							t
						}), preview && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Disclosure, {
							title: t("launchPreview"),
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
								className: "m4a-code",
								children: preview
							})
						})]
					})
				]
			});
		}
		//#endregion
		//#region src/client/EngineVersionsView.tsx
		function EngineVersionsView({ workspace: w, t, onDelete }) {
			const [path, setPath] = (0, react.useState)("");
			const e = w.editor;
			const installing = isInstalling(w.release) || w.working === "install";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "m4a-engine-view",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-section-heading",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("enginesTab") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
							icon: RefreshCw,
							busy: w.working === "updates",
							disabled: installing,
							onClick: () => void w.checkUpdates(),
							children: t("checkUpdates")
						})]
					}),
					(w.release?.versions.length ?? 0) > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
						label: t("selectedEngine"),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
							value: e.config.executable ?? "",
							onChange: (event) => {
								const version = w.release?.versions.find((item) => item.executable === event.target.value);
								if (version) w.selectEngine(version);
							},
							children: [!w.release?.versions.some((item) => item.executable === e.config.executable) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: e.config.executable ?? "",
								children: e.config.executable || t("noEngine")
							}), w.release?.versions.map((version) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: version.executable,
								children: version.name
							}, version.executable))]
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "m4a-engine-install",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "m4a-engine-symbol",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Package, { size: 26 })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", { children: w.release?.latest?.name ?? "MoE4All Engine" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: w.release?.updateAvailable ? t("newVersion") : t("installEngineTitle") })] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
								icon: ArrowDownToLine,
								kind: "primary",
								busy: installing,
								disabled: w.release?.supported === false,
								onClick: () => void w.install(),
								children: t(w.release?.install.stage === "error" || w.release?.install.stage === "cancelled" ? "retryDownload" : w.release?.updateAvailable ? "updateNow" : "installLatest")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-section-heading",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", { children: t("installedVersions") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "m4a-count",
							children: w.release?.versions.length ?? 0
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "m4a-version-list",
						children: (w.release?.versions ?? []).map((version) => {
							const selected = samePath(version.executable, e.config.executable ?? "");
							const configured = samePath(version.executable, w.baseline?.config.executable ?? "");
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: `m4a-version-row ${selected ? "is-selected" : ""}`,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Package, { size: 20 }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: version.name }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
										title: version.executable,
										children: version.executable
									})] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
										icon: selected ? Check : void 0,
										kind: "ghost",
										disabled: selected || w.disabled,
										onClick: () => w.selectEngine(version),
										children: t(selected ? "usingModel" : "useEngine")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
										icon: Trash2,
										label: t(configured ? "selectedVersionHint" : "deleteEngine"),
										disabled: configured || selected || w.status?.owned || w.status?.ready || installing,
										onClick: () => onDelete(version)
									})
								]
							}, version.executable);
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "m4a-section",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", { children: t("localEngineTitle") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "m4a-import-engine",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
									label: t("localEnginePath"),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										value: path,
										onChange: (event) => setPath(event.target.value),
										placeholder: "D:\\MoE4All\\infr.exe"
									})
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
									icon: FolderOpen,
									busy: w.working === "install",
									disabled: !path.trim() || installing,
									onClick: () => void w.install(path),
									children: t("adoptEngine")
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("a", {
								className: "m4a-source-link",
								href: "https://github.com/Headmaster218/MoE4All/releases",
								target: "_blank",
								rel: "noreferrer",
								children: ["GitHub Releases ", /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ArrowUpRight, { size: 14 })]
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region src/client/ModelLibraryView.tsx
		const roleIcon = {
			main: Layers,
			vision: Image,
			mtp: Zap,
			embedding: Database
		};
		const roleLabel = {
			main: "modelRoleMain",
			vision: "modelRoleVision",
			mtp: "modelRoleMtp",
			embedding: "modelRoleEmbedding"
		};
		function ModelLibraryView({ workspace: w, t, compact = false, onImport, onSelected }) {
			const [query, setQuery] = (0, react.useState)("");
			const [filter, setFilter] = (0, react.useState)("all");
			const visible = (0, react.useMemo)(() => modelLibrary(w.library.models, w.catalog), [w.library.models, w.catalog]).filter((item) => (filter !== "local" || item.local) && (filter !== "recommended" || item.recommended) && `${item.name} ${item.family} ${item.quantization}`.toLowerCase().includes(query.toLowerCase()));
			const families = [...new Set(visible.map((item) => item.family))];
			function isSelected(item) {
				const setup = w.editor?.setup;
				if (!setup || !item.local) return false;
				return samePath(item.kind === "main" ? setup.model : item.kind === "vision" ? setup.visionModel : item.kind === "mtp" ? setup.mtpModel : setup.embeddingModel, item.local.path);
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: `m4a-library ${compact ? "m4a-library--compact" : ""}`,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-section-heading",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("h3", { children: [
							t("modelsTab"),
							" ",
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "m4a-count",
								children: w.library.models.filter((item) => item.complete).length
							})
						] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "m4a-inline",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								icon: RefreshCw,
								label: t("rescanModels"),
								disabled: w.scanning,
								onClick: () => void w.scan()
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
								icon: Plus,
								onClick: onImport,
								children: t("importModel")
							})]
						})]
					}),
					!compact && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-library-storage",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
							label: t("modelDirectoryLabel"),
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								value: w.directory,
								onChange: (event) => w.config({ modelDirectory: event.target.value }),
								onBlur: () => void w.scan()
							})
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
							icon: FolderOpen,
							label: t("chooseDirectory"),
							onClick: () => void w.pickDirectory()
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-search",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Search, { size: 16 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							"aria-label": t("searchModels"),
							placeholder: t("searchModels"),
							value: query,
							onChange: (event) => setQuery(event.target.value)
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "m4a-filters",
						role: "group",
						"aria-label": t("modelsTab"),
						children: [
							"all",
							"local",
							"recommended"
						].map((value) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": filter === value,
							onClick: () => setFilter(value),
							children: t(value === "all" ? "filterAll" : value === "local" ? "filterLocal" : "filterRecommended")
						}, value))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-library-results",
						"aria-busy": w.scanning,
						children: [families.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "m4a-empty",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Layers, { size: 30 }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t(query ? "noMatches" : "noLocalModels") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
									icon: Plus,
									onClick: onImport,
									children: t("importModel")
								})
							]
						}), families.map((family) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: "m4a-family",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", { children: family }), visible.filter((item) => item.family === family).map((item) => {
								const Icon = roleIcon[item.kind];
								const selected = isSelected(item);
								const active = w.download.modelId === item.recommended?.id && w.download.stage === "downloading";
								const retry = w.download.modelId === item.recommended?.id && ["cancelled", "error"].includes(w.download.stage);
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
									className: `m4a-model-row ${selected ? "is-selected" : ""}`,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: `m4a-model-symbol m4a-model-symbol--${item.kind}`,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Icon, { size: 19 })
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "m4a-model-info",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: "m4a-model-badges",
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t(roleLabel[item.kind]) }),
													item.recommended && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
														className: "m4a-badge m4a-badge--recommend",
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Sparkles, { size: 10 }), t("filterRecommended")]
													}),
													item.local && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: `m4a-badge ${item.local.complete ? "m4a-badge--local" : "m4a-badge--warning"}`,
														children: t(item.local.complete ? "availableLocal" : "incompleteModel")
													})
												]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
												title: item.local?.path,
												children: item.name
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: "m4a-model-meta",
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: item.quantization }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: formatBytes(item.size) }),
													item.files > 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
														item.local ? `${item.local.fileCount}/` : "",
														item.files,
														" GGUF"
													] })
												]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: "m4a-model-actions",
												children: [item.local?.complete ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
													icon: selected ? Check : void 0,
													kind: selected ? "ghost" : "default",
													disabled: selected || w.disabled,
													onClick: () => {
														w.selectModel(item.local.path, item.kind);
														onSelected?.();
													},
													children: t(selected ? "usingModel" : "useSelected")
												}) : item.recommended && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
													icon: ArrowDownToLine,
													busy: active,
													disabled: w.download.stage === "downloading" || w.disabled,
													onClick: () => void w.downloadModel(item.recommended),
													children: t(retry ? "continueDownload" : "downloadAction")
												}), item.recommended && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
													className: "m4a-icon-btn",
													href: item.recommended.sourceUrl,
													target: "_blank",
													rel: "noreferrer",
													title: t("openModelSource"),
													"aria-label": t("openModelSource"),
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ArrowUpRight, { size: 15 })
												})]
											}),
											active && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: "m4a-model-download",
												role: "status",
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("progress", {
													value: w.download.percent ?? 0,
													max: 100
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
													w.download.fileIndex && w.download.fileCount ? `${w.download.fileIndex}/${w.download.fileCount} · ` : "",
													formatBytes(w.download.downloadedBytes),
													" / ",
													formatBytes(w.download.totalBytes ?? item.size)
												] })]
											})
										]
									})]
								}, item.id);
							})]
						}, family))]
					})
				]
			});
		}
		//#endregion
		//#region src/client/Moe4AllSettings.tsx
		const phases = {
			ready: "readyStatus",
			checking: "checkingStatus",
			starting: "startingStatus",
			offline: "stoppedStatus",
			error: "failedStatus",
			"missing-executable": "notConfigured",
			"missing-arguments": "notConfigured",
			"resource-warning": "busyStatus",
			"duplicate-process": "duplicateStatus"
		};
		function Moe4AllSettings(props) {
			const w = useWorkspace(props);
			const { t } = props;
			const root = (0, react.useRef)(null);
			const [tab, setTab] = (0, react.useState)("run");
			const [confirmation, setConfirmation] = (0, react.useState)(null);
			const [importKind, setImportKind] = (0, react.useState)(null);
			const [importText, setImportText] = (0, react.useState)("");
			const [advanced, setAdvanced] = (0, react.useState)(false);
			const [copied, setCopied] = (0, react.useState)(false);
			const [clock, setClock] = (0, react.useState)(Date.now());
			const hadModel = (0, react.useRef)(false);
			(0, react.useEffect)(() => {
				const dialog = root.current?.closest("[role=\"dialog\"]");
				let options = root.current?.parentElement;
				while (options && options !== dialog && getComputedStyle(options).overflowY !== "auto") options = options.parentElement;
				const overlay = dialog?.parentElement;
				dialog?.classList.add("m4a-host-dialog");
				options?.classList.add("m4a-host-options");
				if (overlay && "showPopover" in overlay) {
					overlay.classList.add("m4a-host-overlay");
					overlay.setAttribute("popover", "manual");
					overlay.showPopover();
				}
				document.documentElement.dataset.moe4allSettings = "open";
				window.dispatchEvent(new Event("moe4all-settings-visibility"));
				return () => {
					dialog?.classList.remove("m4a-host-dialog");
					options?.classList.remove("m4a-host-options");
					if (overlay?.hasAttribute("popover")) {
						overlay.hidePopover();
						overlay.removeAttribute("popover");
						overlay.classList.remove("m4a-host-overlay");
					}
					delete document.documentElement.dataset.moe4allSettings;
					window.dispatchEvent(new Event("moe4all-settings-visibility"));
				};
			}, [w.editor === null]);
			(0, react.useEffect)(() => {
				const timer = setInterval(() => setClock(Date.now()), 1e3);
				return () => clearInterval(timer);
			}, []);
			(0, react.useEffect)(() => {
				const editor = w.editor;
				if (!editor || editor.config.mode === "connect") return;
				const modelSelected = !!editor.setup.model;
				if (modelSelected && !hadModel.current && w.download.stage === "complete") setTab("run");
				hadModel.current = modelSelected;
			}, [
				w.editor?.config.executable,
				w.editor?.config.mode,
				w.editor?.setup.model,
				w.download.stage
			]);
			if (!w.editor) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "m4a-workspace",
				ref: root,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "m4a-loading",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RefreshCw, {
						size: 20,
						className: "m4a-spin"
					}), t(w.snapshot.status === "unavailable" ? "unavailable" : "loading")]
				})
			});
			const e = w.editor;
			const local = e.config.mode !== "connect";
			const owned = w.status?.owned === true;
			const ready = w.status?.ready === true;
			const starting = w.status?.phase === "starting" || w.working === "start";
			const engineSelected = !!e.config.executable;
			const modelSelected = !!e.setup.model;
			const selectedVersion = w.release?.versions.find((item) => samePath(item.executable, e.config.executable ?? ""));
			const currentModel = w.library.models.find((item) => samePath(item.path, e.setup.model));
			const firstEngineSetup = local && !engineSelected;
			const needsRestart = owned && (w.dirty || w.status?.pendingChanges || !ready && !starting);
			const endpoint = endpointFromConfig(e.config);
			const output = (w.status?.startupLines ?? []).join("\n");
			const engineTask = w.release?.install;
			const modelTask = w.download;
			const currentDownload = w.catalog.find((item) => item.id === modelTask.modelId);
			const downloadTasks = engineTask && engineTask.stage !== "idle" && engineTask.stage !== "complete" || modelTask.stage !== "idle" && modelTask.stage !== "complete";
			const installLabels = {
				checking: "progressChecking",
				downloading: "downloadRunning",
				verifying: "progressVerifying",
				extracting: "progressExtracting",
				finalizing: "progressFinalizing",
				error: "failedDownload",
				cancelled: "pausedStatus",
				complete: "downloadedStatus"
			};
			const primaryLabel = needsRestart ? "restartEngineAction" : !local ? w.dirty ? "saveConnect" : "testConnection" : !engineSelected ? "stepEngine" : !modelSelected ? "browseLibrary" : ready ? "readyStatus" : w.dirty ? "saveStart" : "startNow";
			const primaryAction = () => {
				if (needsRestart) {
					setConfirmation({ kind: "restart" });
					return;
				}
				if (!local) {
					w.launch();
					return;
				}
				if (!engineSelected) {
					setTab("engines");
					return;
				}
				if (!modelSelected) {
					setTab("models");
					return;
				}
				w.launch();
			};
			const attachPath = (kind) => kind === "main" ? e.setup.model : kind === "vision" ? e.setup.visionModel : kind === "mtp" ? e.setup.mtpModel : e.setup.embeddingModel;
			const tokenFields = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "m4a-field-grid",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
					label: t("contextWindow"),
					help: t("tokenUnitHint"),
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						inputMode: "decimal",
						value: e.context,
						placeholder: "160k",
						onChange: (event) => w.edit((previous) => ({
							...previous,
							context: event.target.value
						}))
					})
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
					label: t("maxTokens"),
					help: t("tokenUnitHint"),
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						inputMode: "decimal",
						value: e.maxTokens,
						placeholder: "100k",
						onChange: (event) => w.edit((previous) => ({
							...previous,
							maxTokens: event.target.value
						}))
					})
				})]
			});
			const runConfig = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "m4a-run-config",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-section-heading",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("selectedModelTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
							kind: "ghost",
							icon: Plus,
							onClick: () => setImportKind("main"),
							children: t("importModel")
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: `m4a-active-model ${!modelSelected ? "is-empty" : ""}`,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "m4a-active-symbol",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Layers, { size: 24 })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: modelSelected ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: currentModel?.family ?? fileName(e.setup.model) }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [currentModel?.quantization ?? "GGUF", currentModel && ` · ${formatBytes(currentModel.sizeBytes)}`] })] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("modelEmpty") }) }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								icon: ChevronRight,
								label: t("changeModel"),
								onClick: () => setTab("models")
							})
						]
					}),
					modelSelected && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
						className: "m4a-model-path",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("detailLabel") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: e.setup.model })]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "m4a-section",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", { children: t("essential") }),
							tokenFields,
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
								label: t("performance"),
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "m4a-preset",
									role: "group",
									"aria-label": t("performance"),
									children: ["conservative", "aggressive"].map((profile) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										"aria-pressed": e.setup.profile === profile,
										onClick: () => w.setup({ profile }),
										title: t(profile === "conservative" ? "balancedHelp" : "performanceHelp"),
										children: [
											profile === "conservative" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Cpu, { size: 16 }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Activity, { size: 16 }),
											t(profile === "conservative" ? "balancedLabel" : "performanceLabel"),
											e.setup.profile === profile && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Check, { size: 13 })
										]
									}, profile))
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "m4a-field-grid",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
									label: t("parallel"),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
										value: e.setup.parallel,
										onChange: (event) => w.setup({ parallel: Number(event.target.value) }),
										children: [.../* @__PURE__ */ new Set([
											1,
											2,
											4,
											8,
											e.setup.parallel
										])].sort((a, b) => a - b).map((value) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value,
											children: value
										}, value))
									})
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
									label: t("startupPolicy"),
									help: t("resourcesHelp"),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
										value: e.config.mode,
										onChange: (event) => w.config({ mode: event.target.value }),
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "prompt",
											children: t("askStart")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "auto",
											children: t("autoStart")
										})]
									})
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "m4a-section m4a-capabilities",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", { children: t("optionalFeatures") }),
							[
								"vision",
								"mtp",
								"embedding"
							].map((kind) => {
								const Icon = roleIcon[kind], path = attachPath(kind);
								const active = kind === "mtp" ? e.setup.mtp : !!path;
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "m4a-capability",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Icon, { size: 18 }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Toggle, {
											label: t(roleLabel[kind]),
											checked: active,
											onChange: (enabled) => {
												if (kind === "mtp" && path) w.setup({ mtp: enabled });
												else if (!enabled) w.selectModel("", kind);
												else {
													const available = w.library.models.find((item) => item.kind === kind && item.complete && (kind === "embedding" || item.family === currentModel?.family));
													if (available) w.selectModel(available.path, kind);
													else setImportKind(kind);
												}
											}
										}), path && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "m4a-text-link m4a-attachment-path",
											title: path,
											onClick: () => {
												setImportText(path);
												setImportKind(kind);
											},
											children: fileName(path)
										})] }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
											icon: FolderOpen,
											label: t("chooseAttachment"),
											onClick: () => {
												setImportText(path);
												setImportKind(kind);
											}
										})
									]
								}, kind);
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "m4a-cache-toggle",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Toggle, {
									label: t("cacheEnabled"),
									checked: e.setup.sessionCacheEnabled,
									onChange: (sessionCacheEnabled) => w.setup({ sessionCacheEnabled })
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "m4a-help",
									tabIndex: 0,
									"aria-label": t("sessionCacheHelp"),
									children: ["?", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										role: "tooltip",
										children: t("sessionCacheHelp")
									})]
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `m4a-advanced-trigger ${advanced ? "is-active" : ""}`,
						"aria-expanded": advanced,
						onClick: () => setAdvanced(!advanced),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Settings2, { size: 16 }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("advancedOptions") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChevronRight, { size: 16 })
						]
					}),
					advanced && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AdvancedOptions, {
						workspace: w,
						t
					})
				]
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "m4a-workspace",
				ref: root,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: "m4a-header",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "m4a-brand",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "m4a-brand-mark",
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Layers, { size: 23 })
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: "MoE4All" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "Local inference" })] })]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: `m4a-status-pill m4a-status-pill--${ready ? "ready" : starting ? "busy" : w.status?.phase === "error" ? "error" : "idle"}`,
							role: "status",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {}), t(phases[w.status?.phase ?? "checking"] ?? "stoppedStatus")]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-mode-switch",
						role: "group",
						"aria-label": t("mode"),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							"aria-pressed": local,
							disabled: w.disabled,
							onClick: () => {
								if (!local) w.config({
									mode: "prompt",
									endpoint: ""
								});
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Monitor, { size: 16 }), t("localRun")]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							"aria-pressed": !local,
							disabled: w.disabled,
							onClick: () => {
								if (local) w.config({ mode: "connect" });
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Link, { size: 16 }), t("existingService")]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("nav", {
						className: "m4a-tabs",
						"aria-label": "MoE4All",
						children: [
							{
								id: "run",
								label: "runTab",
								icon: Play
							},
							{
								id: "models",
								label: "modelsTab",
								icon: Layers
							},
							{
								id: "engines",
								label: "enginesTab",
								icon: Package
							},
							{
								id: "diagnostics",
								label: "diagnosticsTab",
								icon: Terminal
							}
						].map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							"aria-current": tab === item.id ? "page" : void 0,
							onClick: () => setTab(item.id),
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(item.icon, { size: 15 }),
								t(item.label),
								item.id === "engines" && w.release?.updateAvailable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", { className: "m4a-update-dot" })
							]
						}, item.id))
					}),
					w.error && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-message m4a-message--error",
						role: "alert",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(CircleAlert, { size: 17 }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: w.error }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								icon: X,
								label: t("cancel"),
								onClick: () => w.setError("")
							})
						]
					}),
					!w.error && w.notice && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-message",
						role: "status",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Check, { size: 16 }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: w.notice }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								icon: X,
								label: t("cancel"),
								onClick: () => w.setNotice("")
							})
						]
					}),
					w.status?.pendingChanges && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-message m4a-message--warning",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RotateCcw, { size: 16 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("pendingRestart") })]
					}),
					downloadTasks && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-transfer-list",
						children: [engineTask && !["idle", "complete"].includes(engineTask.stage) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Transfer, {
							label: `MoE4All Engine · ${t(installLabels[engineTask.stage])}`,
							percent: engineTask.percent,
							detail: `${formatBytes(engineTask.downloadedBytes)}${engineTask.totalBytes ? ` / ${formatBytes(engineTask.totalBytes)}` : ""}`,
							error: engineTask.error,
							actions: isInstalling(w.release) ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								icon: Square,
								label: t("stopTransfer"),
								onClick: () => void w.stopInstall()
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
									icon: RefreshCw,
									onClick: () => void w.install(),
									children: t("retryDownload")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
									className: "m4a-icon-btn",
									href: w.release?.latest?.pageUrl ?? "https://github.com/Headmaster218/MoE4All/releases/latest",
									target: "_blank",
									rel: "noreferrer",
									title: t("openReleasePage"),
									"aria-label": t("openReleasePage"),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ArrowDownToLine, { size: 15 })
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
									kind: "ghost",
									icon: FolderOpen,
									onClick: () => setTab("engines"),
									children: t("useLocalDownload")
								})
							] })
						}), !["idle", "complete"].includes(modelTask.stage) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Transfer, {
							label: currentDownload?.name ?? t("downloadRunning"),
							percent: modelTask.percent,
							detail: `${t(modelTask.stage === "downloading" ? "downloadRunning" : modelTask.stage === "error" ? "failedDownload" : "pausedStatus")} · ${modelTask.fileName ? `${modelTask.fileName} · ` : ""}${modelTask.fileIndex && modelTask.fileCount ? `${modelTask.fileIndex}/${modelTask.fileCount} · ` : ""}${formatBytes(modelTask.downloadedBytes)}${modelTask.totalBytes ? ` / ${formatBytes(modelTask.totalBytes)}` : ""}`,
							error: modelTask.error,
							actions: modelTask.stage === "downloading" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								icon: Square,
								label: t("stopTransfer"),
								onClick: () => void w.stopDownload()
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
								icon: RefreshCw,
								onClick: () => currentDownload && void w.downloadModel(currentDownload),
								children: t("continueDownload")
							}), currentDownload && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
								className: "m4a-icon-btn",
								href: currentDownload.sourceUrl,
								target: "_blank",
								rel: "noreferrer",
								title: t("openModelSource"),
								"aria-label": t("openModelSource"),
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ArrowDownToLine, { size: 15 })
							})] })
						})]
					}),
					tab === "run" && (firstEngineSetup ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "m4a-first-install",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "m4a-first-install-mark",
								children: isInstalling(w.release) ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RefreshCw, {
									size: 28,
									className: "m4a-spin"
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Package, { size: 28 })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t(isInstalling(w.release) ? "firstInstallRunning" : "firstInstallAttention") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t(isInstalling(w.release) ? "firstInstallRunningBody" : "firstInstallAttentionBody") })] }),
							!isInstalling(w.release) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "m4a-inline",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
									kind: "primary",
									icon: RefreshCw,
									onClick: () => void w.install(),
									children: t("retryDownload")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
									icon: FolderOpen,
									onClick: () => setTab("engines"),
									children: t("useLocalDownload")
								})]
							})
						]
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(ready || starting || w.status?.phase === "error" || w.status?.phase === "duplicate-process") && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "m4a-runtime",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "m4a-section-heading",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("h3", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Activity, { size: 16 }), t(phases[w.status?.phase ?? "checking"] ?? "stoppedStatus")] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "m4a-inline",
									children: [ready && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "m4a-badge",
										children: t(owned ? "pluginOwned" : "externalOwned")
									}), owned && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
										icon: Square,
										label: t("stopEngineAction"),
										onClick: () => setConfirmation({ kind: "stop" })
									})]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: w.status?.endpoint }),
							ready && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "m4a-runtime-models",
								children: w.status?.models.map((model) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Check, { size: 13 }), model.name] }, model.id))
							}),
							starting && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("progress", { "aria-label": t("startingStatus") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
								t("startupElapsed"),
								" ",
								Math.max(0, Math.floor((clock - Date.parse(w.status?.startupStartedAt ?? new Date(clock).toISOString())) / 1e3)),
								"s"
							] })] }),
							w.status?.phase === "duplicate-process" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("externalProcessHelp") }),
							(starting || w.status?.phase === "error") && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
								className: "m4a-log m4a-log--preview",
								children: output || w.status?.message || t("noOutput")
							})
						]
					}), local ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-run-layout",
						children: [runConfig, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("aside", {
							className: "m4a-run-library",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ModelLibraryView, {
								workspace: w,
								t,
								compact: true,
								onImport: () => setImportKind("main")
							})
						})]
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "m4a-connection-view",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "m4a-section-heading",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("connection") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Link, { size: 20 })]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
								label: t("currentEndpoint"),
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									value: e.config.endpoint || endpoint,
									onChange: (event) => w.config({ endpoint: event.target.value }),
									placeholder: "http://127.0.0.1:8080/v1"
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
								label: t("apiKeyEnv"),
								help: t("apiKeyHelp"),
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									value: e.config.apiKeyEnv ?? "",
									placeholder: "INFR_API_KEY",
									onChange: (event) => w.config({ apiKeyEnv: event.target.value })
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Toggle, {
								label: t("allowRemoteEndpoint"),
								checked: e.config.allowRemoteEndpoint ?? false,
								onChange: (allowRemoteEndpoint) => w.config({ allowRemoteEndpoint })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
								className: "m4a-section",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", { children: t("model") }),
									tokenFields,
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Toggle, {
										label: t("vision"),
										checked: e.config.vision ?? true,
										onChange: (vision) => w.config({ vision })
									})
								]
							})
						]
					})] })),
					tab === "models" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ModelLibraryView, {
						workspace: w,
						t,
						onImport: () => setImportKind("main"),
						onSelected: () => setTab("run")
					}),
					tab === "engines" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(EngineVersionsView, {
						workspace: w,
						t,
						onDelete: (version) => setConfirmation({
							kind: "delete",
							version
						})
					}),
					tab === "diagnostics" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "m4a-diagnostics",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "m4a-section-heading",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("runtimeOutput") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "m4a-inline",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
										icon: RefreshCw,
										label: t("refreshStatus"),
										onClick: () => void w.refresh()
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
										icon: copied ? Check : Copy,
										label: t(copied ? "copied" : "copyOutput"),
										disabled: !output,
										onClick: () => {
											navigator.clipboard.writeText(output).then(() => setCopied(true)).catch((error) => w.setError(String(error)));
										}
									})]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
								className: "m4a-diagnostic-facts",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("currentEndpoint") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: w.status?.endpoint || endpoint })] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("selectedEngine") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: w.status?.executable || e.config.executable || t("noEngine") })] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("returnedModels") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: w.status?.models.map((model) => model.name).join(", ") || "-" })] })
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
								className: "m4a-log",
								tabIndex: 0,
								children: output || t("noOutput")
							})
						]
					}),
					!firstEngineSetup && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
						className: `m4a-footer m4a-footer--${tab}`,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: `m4a-save-indicator ${w.dirty ? "is-dirty" : ""}` }),
							t(w.dirty ? "pendingEdits" : "saved"),
							local && selectedVersion && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: selectedVersion.name })
						] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "m4a-footer-actions",
							children: [
								w.dirty && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
									icon: RotateCcw,
									label: t("revert"),
									disabled: w.disabled,
									onClick: () => setConfirmation({ kind: "discard" })
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
									icon: Save,
									disabled: !w.dirty || w.disabled,
									busy: w.working === "save",
									onClick: () => void w.save(),
									children: t("save")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
									icon: !local ? Link : ready && !needsRestart ? Check : needsRestart ? RotateCcw : Play,
									kind: "primary",
									disabled: w.disabled || starting || local && ready && !needsRestart,
									busy: w.working === "start",
									onClick: primaryAction,
									children: t(primaryLabel)
								})
							]
						})]
					}),
					importKind && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Dialog, {
						title: t(roleLabel[importKind]),
						closeLabel: t("cancel"),
						onClose: () => {
							setImportKind(null);
							setImportText("");
						},
						actions: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
							onClick: () => setImportKind(null),
							children: t("cancel")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
							icon: Plus,
							kind: "primary",
							disabled: !importText.trim(),
							busy: w.working === "import",
							onClick: () => {
								w.importPath(importText, importKind).then((ok) => {
									if (!ok) return;
									setImportKind(null);
									setImportText("");
								});
							},
							children: t("addPath")
						})] }),
						children: [
							w.error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "m4a-field-error",
								role: "alert",
								children: w.error
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
								label: t("importPath"),
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									autoFocus: true,
									value: importText,
									onChange: (event) => setImportText(event.target.value),
									placeholder: "D:\\Models\\model.gguf"
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "m4a-dialog-choices",
								children: [
									w.nativePicker && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
										icon: FilePlus2,
										onClick: () => {
											w.pickFile(importKind);
											setImportKind(null);
										},
										children: t("chooseFile")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
										icon: FolderOpen,
										onClick: () => {
											props.pickDirectory().then((path) => {
												if (path) setImportText(path);
											}).catch((error) => w.setError(String(error)));
										},
										children: t("chooseDirectory")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
										icon: ArrowDownToLine,
										onClick: () => {
											setTab("models");
											setImportKind(null);
										},
										children: t("filterRecommended")
									})
								]
							}),
							w.library.models.filter((item) => item.kind === importKind && item.complete).map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "m4a-import-choice",
								onClick: () => {
									w.selectModel(item.path, importKind);
									setImportKind(null);
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Layers, { size: 16 }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: item.name }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ArrowRight, { size: 15 })
								]
							}, item.id))
						]
					}),
					confirmation && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Dialog, {
						title: t(confirmation.kind === "delete" ? "removeEngineTitle" : confirmation.kind === "stop" ? "stopEngineTitle" : confirmation.kind === "restart" ? "restartEngineTitle" : "discardTitle"),
						closeLabel: t("cancel"),
						onClose: () => setConfirmation(null),
						actions: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
							onClick: () => setConfirmation(null),
							children: t("cancel")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
							kind: confirmation.kind === "restart" ? "primary" : "danger",
							onClick: () => {
								if (confirmation.kind === "stop") w.stop();
								if (confirmation.kind === "restart") w.launch(false, true);
								if (confirmation.kind === "delete") w.removeVersion(confirmation.version);
								if (confirmation.kind === "discard") w.revert();
								setConfirmation(null);
							},
							children: t(confirmation.kind === "delete" ? "deleteEngine" : confirmation.kind === "stop" ? "stopEngineAction" : confirmation.kind === "restart" ? "restartEngineAction" : "discardAction")
						})] }),
						children: [confirmation.kind === "delete" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: confirmation.version.name }), confirmation.kind !== "discard" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t(confirmation.kind === "delete" ? "removeEngineBody" : confirmation.kind === "stop" ? "stopEngineBody" : "restartEngineBody") })]
					}),
					w.resourcePrompt && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(Dialog, {
						title: t("resourceWarningTitle"),
						closeLabel: t("cancel"),
						onClose: () => w.setResourcePrompt(false),
						actions: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
							onClick: () => w.setResourcePrompt(false),
							children: t("cancel")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Button, {
							kind: "danger",
							onClick: () => {
								w.setResourcePrompt(false);
								w.launch(true);
							},
							children: t("startAnyway")
						})] }),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("resourceWarningBody") }), w.status?.reasons?.map((reason) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: reason }, reason))]
					})
				]
			});
		}
		//#endregion
		//#region src/client/workspace-copy.ts
		const copy = {
			runTab: ["Run", "运行"],
			parallel: ["Concurrent slots", "并发会话数"],
			modelsTab: ["Model library", "模型库"],
			rescanModels: ["Rescan local models", "重新扫描本地模型"],
			openModelSource: ["Open model source", "打开模型来源"],
			advancedOverride: ["Manual values override the selected preset.", "手动填写的参数优先于自动策略。"],
			enginesTab: ["Engine versions", "引擎版本"],
			diagnosticsTab: ["Diagnostics", "诊断"],
			localRun: ["Run on this computer", "在本机运行"],
			existingService: ["Connect to a service", "连接已有服务"],
			notConfigured: ["Not configured", "尚未配置"],
			readyStatus: ["Ready", "已就绪"],
			startingStatus: ["Starting", "正在启动"],
			stoppedStatus: ["Stopped", "未运行"],
			failedStatus: ["Startup failed", "启动失败"],
			checkingStatus: ["Checking connection", "正在检查连接"],
			busyStatus: ["Confirmation needed", "等待确认"],
			duplicateStatus: ["Engine already running elsewhere", "检测到其他引擎进程"],
			pluginOwned: ["Started here", "由插件启动"],
			externalOwned: ["Existing service", "已有服务"],
			setupTitle: ["Get ready to run", "准备开始"],
			stepEngine: ["Install an engine", "准备引擎"],
			stepModel: ["Choose a model", "选择模型"],
			stepStart: ["Start chatting", "启动使用"],
			firstInstallRunning: ["Preparing the MoE4All engine", "正在准备 MoE4All 引擎"],
			firstInstallRunningBody: ["The official release is downloading and will be configured automatically. You can leave this page open.", "正在下载官方发行版，完成后会自动配置。保持此页面打开即可。"],
			firstInstallAttention: ["Engine setup needs attention", "引擎安装需要处理"],
			firstInstallAttentionBody: ["Retry the automatic download, or import a ZIP, folder, or infr.exe you already downloaded.", "可以重试自动下载，或导入已经下载的 ZIP、目录或 infr.exe。"],
			modelEmpty: ["No model selected", "尚未选择模型"],
			selectedModelTitle: ["Selected model", "当前模型"],
			browseLibrary: ["Choose a model", "选择模型"],
			importModel: ["Add local model", "添加本地模型"],
			useSelected: ["Use model", "使用此模型"],
			usingModel: ["Selected", "已选用"],
			changeModel: ["Change", "更换"],
			optionalFeatures: ["Optional capabilities", "可选能力"],
			essential: ["Common settings", "常用设置"],
			performance: ["Performance preset", "性能策略"],
			balancedLabel: ["Balanced", "稳健自动"],
			performanceLabel: ["Performance", "激进自动"],
			balancedHelp: ["Uses currently available memory with headroom.", "按当前空余内存与显存分配，保留余量。"],
			performanceHelp: ["Uses larger budgets based on total memory.", "按总内存与总显存规划更大的预算。"],
			automatic: ["Automatic", "自动"],
			startupPolicy: ["When DSH opens", "打开 DSH 时"],
			askStart: ["Ask before starting", "询问是否启动"],
			autoStart: ["Start automatically", "自动启动"],
			resourcesHelp: ["A second confirmation is required when resources fall below the threshold.", "资源低于警戒线时，启动仍需再次确认。"],
			advancedOptions: ["Advanced parameters", "高级参数"],
			memoryCompute: ["Memory & compute", "内存与计算"],
			deviceLabel: ["GPU device", "GPU 设备"],
			ramLabel: ["RAM budget", "RAM 预算"],
			vramLabel: ["VRAM budget", "VRAM 预算"],
			threadsLabel: ["CPU threads", "CPU 线程"],
			batchLabel: ["Prefill micro-batch", "Prefill Ubatch"],
			splitterLabel: ["Dispatch cap", "Dispatch 上限"],
			cacheSection: ["Conversation cache", "会话缓存"],
			cacheEnabled: ["Reuse conversations from SSD", "复用 SSD 会话缓存"],
			kvQuantization: ["KV cache precision", "KV Cache 量化"],
			kvQuantizationHelp: ["Lower precision saves VRAM. Engine automatic follows the selected resource profile.", "更低精度可节省显存；引擎自动会跟随所选资源策略。"],
			kvCustom: ["Custom K / V", "分别指定 K / V"],
			kvKeyType: ["K cache type", "K Cache 类型"],
			kvValueType: ["V cache type", "V Cache 类型"],
			sessionCacheKvHint: ["SSD conversation cache requires Q8_0 K and V, so Q8_0 is used while it is enabled.", "SSD 会话缓存要求 K、V 均为 Q8_0，启用期间会固定使用 Q8_0。"],
			networkSection: ["Network & connection", "网络与连接"],
			samplingSection: ["Generation defaults", "生成默认值"],
			temperatureLabel: ["Temperature", "温度"],
			customArguments: ["Additional engine arguments", "额外引擎参数"],
			launchPreview: ["Launch command", "启动命令预览"],
			modelDirectoryLabel: ["Model storage", "模型存放目录"],
			searchModels: ["Search models or quantization", "搜索模型或量化"],
			filterAll: ["All", "全部"],
			filterLocal: ["On this computer", "本地"],
			filterRecommended: ["Recommended", "推荐"],
			availableLocal: ["Local", "本地可用"],
			incompleteModel: ["Missing shards", "分片不完整"],
			noMatches: ["No matching models", "没有匹配的模型"],
			noLocalModels: ["No local models yet", "尚未添加本地模型"],
			importPath: ["File or folder path", "文件或目录路径"],
			addPath: ["Add", "添加"],
			modelRoleMain: ["Language model", "语言模型"],
			modelRoleVision: ["Vision", "视觉"],
			modelRoleMtp: ["MTP", "MTP"],
			modelRoleEmbedding: ["Embedding", "Embedding"],
			downloadAction: ["Download", "下载"],
			continueDownload: ["Continue download", "继续下载"],
			downloadedStatus: ["Downloaded", "已下载"],
			pausedStatus: ["Stopped", "已停止"],
			failedDownload: ["Download failed", "下载失败"],
			downloadRunning: ["Downloading", "正在下载"],
			transfersTitle: ["Transfers", "下载任务"],
			selectedEngine: ["Selected engine", "当前选用引擎"],
			noEngine: ["No engine selected", "尚未选择引擎"],
			useEngine: ["Use version", "使用此版本"],
			installEngineTitle: ["Install MoE4All", "安装 MoE4All 引擎"],
			localEngineTitle: ["Use an existing installation", "使用已有引擎"],
			localEnginePath: ["Executable, folder or release ZIP", "可执行文件、目录或发行版 ZIP"],
			adoptEngine: ["Import engine", "导入引擎"],
			installedVersions: ["Installed versions", "已安装版本"],
			upToDate: ["Latest version selected", "已选用最新版本"],
			newVersion: ["Update available", "有可用更新"],
			selectedVersionHint: ["Select another version before deleting this one.", "先选用其他版本，再删除此版本。"],
			removeEngineTitle: ["Delete engine version?", "删除此引擎版本？"],
			removeEngineBody: ["This removes the selected installation directory. Models outside it are kept.", "将删除该版本的安装目录。目录外的模型不受影响。"],
			stopEngineTitle: ["Stop the engine?", "停止引擎？"],
			stopEngineBody: ["Active requests will be interrupted and GPU memory released.", "当前请求将中断，并释放引擎占用的显存。"],
			restartEngineTitle: ["Apply settings and restart?", "应用设置并重启？"],
			restartEngineBody: ["The engine will reload the selected model. Active requests will be interrupted.", "引擎将按当前配置重新加载模型，当前请求会中断。"],
			stopEngineAction: ["Stop engine", "停止引擎"],
			restartEngineAction: ["Apply and restart", "应用并重启"],
			testConnection: ["Test connection", "测试连接"],
			saveConnect: ["Save and connect", "保存并连接"],
			saveStart: ["Save and start", "保存并启动"],
			savedNextStart: ["Saved for the next start", "已保存，下次启动生效"],
			pendingRestart: ["Saved settings are waiting for a restart.", "配置已保存，等待重启生效。"],
			pendingEdits: ["Unsaved changes", "有未保存的更改"],
			startNeeded: ["Select an engine and model to start.", "准备好引擎与模型后即可启动。"],
			connectionOk: ["Connection successful", "连接成功"],
			connectionFailed: ["No response from this endpoint", "此地址尚未响应"],
			controlUnavailable: ["The plugin service is unreachable. Reconnecting...", "暂时无法连接插件服务，正在重新连接…"],
			runtimeOutput: ["Engine output", "引擎输出"],
			noOutput: ["No engine output yet", "暂无引擎输出"],
			copyOutput: ["Copy output", "复制输出"],
			copied: ["Copied", "已复制"],
			refreshStatus: ["Refresh status", "刷新状态"],
			diagnosticSettings: ["Startup & diagnostics", "启动与诊断设置"],
			chooseAttachment: ["Choose file", "选择文件"],
			attachmentAuto: ["Detected alongside the model", "已探测到同家族文件"],
			modelSelectedNotice: ["Model selected. Save to apply.", "模型已选用，保存后生效。"],
			engineSelectedNotice: ["Engine selected. Save to apply.", "引擎已选用，保存后生效。"],
			selectDestination: ["Choose a model storage directory first.", "请先选择模型存放目录。"],
			missingModelError: ["Choose a language model first.", "请先选择语言模型。"],
			missingEngineError: ["Install or select an engine first.", "请先安装或选择引擎。"],
			invalidTokens: ["Enter a positive token count, such as 32768 or 32k.", "请输入有效的正数 Token 数量，例如 32768 或 32k。"],
			importError: ["No matching GGUF was found at this path.", "此路径下未找到对应类型的 GGUF。"],
			invalidExtra: ["Use a JSON array of strings. Set the model and common options in their fields, not here.", "请输入字符串 JSON 数组；模型路径与常用设置请在对应控件中填写，不要重复覆盖。"],
			discardTitle: ["Discard unsaved changes?", "放弃未保存的更改？"],
			discardAction: ["Discard changes", "放弃更改"],
			doneAction: ["Done", "完成"],
			detailLabel: ["Details", "详情"],
			blankAuto: ["Leave blank for automatic", "留空为自动"],
			apiKeyHelp: ["Name of the environment variable containing the API key.", "填写保存 API key 的环境变量名称。"],
			networkHelp: ["Local access uses 127.0.0.1. LAN endpoints need remote access enabled.", "本机访问使用 127.0.0.1；局域网地址需允许远程连接。"],
			moreSettings: ["More settings", "更多设置"],
			clearSelection: ["Clear selection", "取消选用"],
			currentEndpoint: ["Service endpoint", "服务地址"],
			returnedModels: ["Available in DSH", "DSH 可用模型"],
			startupElapsed: ["Elapsed", "已用时"],
			progressChecking: ["Checking release", "正在检查发行版"],
			progressVerifying: ["Verifying download", "正在校验下载"],
			progressExtracting: ["Extracting engine", "正在解压引擎"],
			progressFinalizing: ["Finishing installation", "正在完成安装"],
			stopTransfer: ["Stop download", "停止下载"],
			externalProcessHelp: ["Connect to its actual address, or stop it before starting another engine.", "请连接该进程的实际地址，或先将其停止。"]
		};
		const workspaceEn = Object.fromEntries(Object.entries(copy).map(([key, value]) => [key, value[0]]));
		const workspaceZh = Object.fromEntries(Object.entries(copy).map(([key, value]) => [key, value[1]]));
		//#endregion
		//#region src/client/locales.ts
		const en = {
			...workspaceEn,
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
			...workspaceZh,
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
.m4a-host-dialog { width:min(1200px,calc(100vw - 40px)) !important; max-width:1200px !important; }
.m4a-host-options { padding-bottom:0 !important; }
.m4a-host-overlay { margin:0; padding:0; border:0; width:auto; height:auto; overflow:visible; background:transparent; color:inherit; }
.m4a-workspace,.m4a-dialog {
 --m4a-text:var(--dsw-alias-label-primary,#202522); --m4a-muted:var(--dsw-alias-label-secondary,#68706b); --m4a-faint:var(--dsw-alias-label-tertiary,#757d77);
 --m4a-line:var(--dsw-alias-border-l2,#dde2de); --m4a-bg:var(--dsw-alias-bg-layer-1,#fff); --m4a-soft:var(--dsw-alias-bg-layer-2,#f5f7f5); --m4a-accent:#198265; --m4a-danger:#d04d51;
 color:var(--m4a-text); font-size:13px; line-height:1.5; letter-spacing:0;
}
.m4a-workspace { width:100%; min-width:0; container-type:inline-size; }
.m4a-workspace *,.m4a-dialog * { box-sizing:border-box; letter-spacing:0; }
.m4a-workspace :is(h2,h3,h4,p),.m4a-dialog :is(h3,p) { margin:0; }
.m4a-workspace h3 { font-size:15px; font-weight:650; }
.m4a-workspace h4 { font-size:12px; font-weight:650; }
.m4a-workspace :is(button,input,select,textarea),.m4a-dialog :is(button,input,select,textarea) { font:inherit; }
.m4a-workspace button,.m4a-dialog button { cursor:pointer; }
.m4a-workspace button:disabled,.m4a-dialog button:disabled { opacity:.46; cursor:default; }
.m4a-workspace :is(button,a,input,select,textarea,summary):focus-visible,.m4a-dialog :is(button,a,input,select,textarea):focus-visible { outline:2px solid var(--m4a-accent); outline-offset:3px; }
.m4a-workspace svg,.m4a-dialog svg { flex-shrink:0; }
.m4a-header { display:flex; align-items:center; justify-content:space-between; gap:14px; padding-bottom:22px; }
.m4a-brand { display:flex; align-items:center; gap:11px; min-width:0; }
.m4a-brand-mark { display:grid; place-items:center; width:44px; height:44px; border:1px solid color-mix(in srgb,var(--m4a-accent) 28%,var(--m4a-line)); border-radius:8px; background:color-mix(in srgb,var(--m4a-accent) 8%,transparent); color:var(--m4a-accent); }
.m4a-brand h2 { font-size:23px; font-weight:700; line-height:1.25; }
.m4a-brand span { color:var(--m4a-faint); font-size:11px; }
.m4a-status-pill { display:flex; align-items:center; gap:7px; font-size:12px; color:var(--m4a-muted); }
.m4a-status-pill i,.m4a-update-dot,.m4a-save-indicator { width:6px; height:6px; flex-shrink:0; border-radius:50%; background:var(--m4a-faint); }
.m4a-status-pill--ready { color:var(--m4a-accent); }
.m4a-status-pill--ready i { background:var(--m4a-accent); }
.m4a-status-pill--busy i,.m4a-update-dot { background:#397ecd; }
.m4a-status-pill--error i { background:var(--m4a-danger); }
.m4a-mode-switch { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:4px; padding:4px; border:1px solid var(--m4a-line); border-radius:7px; background:var(--m4a-soft); }
.m4a-mode-switch button { display:flex; justify-content:center; align-items:center; gap:8px; padding:9px 8px; border:1px solid transparent; border-radius:4px; background:transparent; color:var(--m4a-muted); font-weight:500; }
.m4a-mode-switch button[aria-pressed=true] { background:var(--m4a-bg); color:var(--m4a-text); border-color:var(--m4a-line); box-shadow:0 1px 2px #00000008; }
.m4a-tabs { display:flex; gap:24px; margin:12px 0 0; border-bottom:1px solid var(--m4a-line); }
.m4a-tabs button { display:flex; align-items:center; justify-content:center; gap:6px; padding:14px 0 13px; background:none; border:0; border-bottom:2px solid transparent; color:var(--m4a-muted); white-space:nowrap; }
.m4a-tabs button[aria-current=page] { color:var(--m4a-accent); border-bottom-color:var(--m4a-accent); font-weight:650; }
.m4a-inline { display:flex; gap:7px; align-items:center; flex-wrap:wrap; }
.m4a-btn,.m4a-icon-btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; min-height:34px; border:1px solid var(--m4a-line); border-radius:5px; background:var(--m4a-bg); color:var(--m4a-text); text-decoration:none; font-size:12px !important; line-height:1.3; font-weight:550 !important; transition:background .12s,border-color .12s; }
.m4a-btn { padding:7px 12px; }
.m4a-icon-btn { width:32px; min-width:32px; height:32px; min-height:32px; padding:0; flex-shrink:0; background:transparent; border-color:transparent; color:var(--m4a-muted); }
.m4a-btn:hover:not(:disabled),.m4a-icon-btn:hover:not(:disabled) { background:var(--m4a-soft); border-color:var(--m4a-line); }
.m4a-btn--primary { color:#fff; background:var(--m4a-accent); border-color:var(--m4a-accent); }
.m4a-btn--primary:hover:not(:disabled) { background:#146c54; border-color:#146c54; }
.m4a-btn--danger { background:var(--m4a-danger); color:#fff; border-color:var(--m4a-danger); }
.m4a-btn--danger:hover:not(:disabled) { background:#b83e43; border-color:#b83e43; }
.m4a-btn--ghost { background:none; border-color:transparent; color:var(--m4a-accent); }
.m4a-section-heading { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; }
.m4a-section-heading h3 { display:flex; align-items:center; gap:8px; }
.m4a-section { display:grid; gap:14px; padding:22px 0; border-top:1px solid var(--m4a-line); }
.m4a-section > h4 { color:var(--m4a-muted); }
.m4a-run-layout { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,.86fr); min-height:480px; }
.m4a-run-config { min-width:0; padding:22px 24px 24px 0; }
.m4a-run-library { min-width:0; padding:22px 0 24px 24px; border-left:1px solid var(--m4a-line); }
.m4a-active-model { display:grid; grid-template-columns:40px minmax(0,1fr) 28px; align-items:center; gap:10px; min-height:83px; padding:13px 0; }
.m4a-active-symbol { display:grid; place-items:center; height:40px; color:var(--m4a-accent); }
.m4a-active-model > div:nth-child(2) { display:grid; min-width:0; gap:3px; }
.m4a-active-model strong { font-size:15px; line-height:1.4; overflow-wrap:anywhere; }
.m4a-active-model span { color:var(--m4a-faint); font-size:11px; }
.m4a-active-model.is-empty strong { font-size:13px; font-weight:500; color:var(--m4a-faint); }
.m4a-model-path { margin:-6px 0 16px 50px; font-size:11px; color:var(--m4a-faint); }
.m4a-model-path summary { cursor:pointer; }
.m4a-model-path code { display:block; margin-top:5px; overflow-wrap:anywhere; }
.m4a-field { display:flex; flex-direction:column; min-width:0; gap:7px; }
.m4a-field-label { display:flex; align-items:center; gap:6px; color:var(--m4a-muted); font-size:12px; }
.m4a-field-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
.m4a-span-2 { grid-column:1/-1; }
.m4a-field :is(input:not([type=checkbox]):not([type=range]),select,textarea),.m4a-search input { min-width:0; width:100%; border:1px solid var(--m4a-line); border-radius:5px; background:var(--m4a-bg); color:var(--m4a-text); height:36px; padding:7px 10px; outline:0; }
.m4a-field textarea { height:auto; min-height:110px; resize:vertical; font-family:Consolas,monospace; font-size:12px; }
.m4a-field input::placeholder,.m4a-search input::placeholder { color:var(--m4a-faint); opacity:.7; }
.m4a-field :is(input,select,textarea):focus { border-color:var(--m4a-accent); }
.m4a-field [aria-invalid=true] { border-color:var(--m4a-danger) !important; }
.m4a-field-error { color:var(--m4a-danger); font-size:12px; }
.m4a-help { position:relative; display:inline-flex; align-items:center; justify-content:center; color:var(--m4a-faint); cursor:help; }
.m4a-help [role=tooltip] { position:absolute; z-index:20; display:none; left:-110px; bottom:24px; width:220px; padding:9px 12px; border:1px solid var(--m4a-line); border-radius:5px; background:var(--m4a-bg); color:var(--m4a-text); box-shadow:0 4px 20px #0002; font-size:11px; line-height:1.5; font-weight:400; }
.m4a-help:is(:hover,:focus) [role=tooltip] { display:block; }
.m4a-preset { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
.m4a-preset button { display:flex; align-items:center; justify-content:center; gap:6px; min-height:38px; padding:7px; background:transparent; color:var(--m4a-muted); border:1px solid var(--m4a-line); border-radius:5px; font-size:12px; }
.m4a-preset button[aria-pressed=true] { color:var(--m4a-accent); background:color-mix(in srgb,var(--m4a-accent) 6%,transparent); border-color:var(--m4a-accent); }
.m4a-capabilities { gap:0; }
.m4a-capabilities > h4 { margin-bottom:10px; }
.m4a-capability { display:grid; grid-template-columns:20px minmax(0,1fr) 26px; align-items:center; gap:10px; min-height:52px; padding:8px 0; }
.m4a-capability > svg { color:var(--m4a-faint); }
.m4a-capability > div { min-width:0; }
.m4a-toggle-row { position:relative; display:flex; align-items:center; justify-content:space-between; gap:12px; min-height:28px; cursor:pointer; }
.m4a-toggle-row > span:first-child { display:grid; gap:3px; }
.m4a-toggle-row small { color:var(--m4a-faint); font-size:11px; }
.m4a-toggle-row input { position:absolute; right:0; opacity:0; width:32px; height:20px; }
.m4a-switch { width:30px; height:18px; flex-shrink:0; border-radius:10px; background:color-mix(in srgb,var(--m4a-muted) 25%,var(--m4a-bg)); position:relative; transition:background .15s; }
.m4a-switch::after { content:''; position:absolute; width:12px; height:12px; border-radius:50%; top:3px; left:3px; background:#fff; box-shadow:0 1px 2px #0002; transition:transform .15s; }
.m4a-toggle-row input:checked + .m4a-switch { background:var(--m4a-accent); }
.m4a-toggle-row input:checked + .m4a-switch::after { transform:translateX(12px); }
.m4a-toggle-row input:focus-visible + .m4a-switch { outline:2px solid var(--m4a-accent); outline-offset:3px; }
.m4a-text-link { padding:0; border:0; background:none; color:var(--m4a-accent); font-size:11px !important; text-align:left; }
.m4a-attachment-path { display:block; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.m4a-cache-toggle { display:flex; gap:10px; align-items:center; padding-top:14px; margin-top:10px; border-top:1px solid var(--m4a-line); }
.m4a-cache-toggle .m4a-toggle-row { flex:1; }
.m4a-advanced-trigger { width:100%; display:flex; align-items:center; gap:9px; padding:13px 0; border:0; border-top:1px solid var(--m4a-line); background:none; color:var(--m4a-muted); }
.m4a-advanced-trigger span { flex:1; text-align:left; }
.m4a-advanced-trigger.is-active > svg:last-child { transform:rotate(90deg); }
.m4a-disclosure { border-bottom:1px solid var(--m4a-line); }
.m4a-disclosure > summary { display:flex; align-items:center; gap:9px; padding:13px 0; list-style:none; cursor:pointer; font-size:12px; font-weight:550; }
.m4a-disclosure > summary::-webkit-details-marker { display:none; }
.m4a-disclosure > summary > span { flex:1; }
.m4a-disclosure > summary > svg { color:var(--m4a-muted); }
.m4a-disclosure[open] > summary > svg:last-child { transform:rotate(180deg); }
.m4a-disclosure-body { display:grid; gap:14px; padding-bottom:18px; }
.m4a-range { display:flex; align-items:center; gap:10px; height:36px; }
.m4a-range input { min-width:0; width:100%; accent-color:var(--m4a-accent); }
.m4a-range output { font-size:12px; min-width:35px; text-align:right; }
.m4a-library { display:grid; gap:16px; padding:22px 0; min-width:0; }
.m4a-library--compact { padding:0; gap:12px; }
.m4a-library--compact .m4a-section-heading > .m4a-inline > .m4a-btn { display:none; }
.m4a-count { color:var(--m4a-faint); font-size:11px; font-weight:400; font-variant-numeric:tabular-nums; }
.m4a-library-storage { display:grid; grid-template-columns:minmax(0,1fr) 32px; align-items:end; gap:8px; }
.m4a-search { display:flex; align-items:center; position:relative; }
.m4a-search > svg { position:absolute; left:10px; color:var(--m4a-faint); }
.m4a-search input { padding-left:33px; background:var(--m4a-soft); }
.m4a-filters { display:flex; gap:18px; }
.m4a-filters button { padding:3px 0 6px; border:0; border-bottom:2px solid transparent; background:none; color:var(--m4a-faint); font-size:12px; }
.m4a-filters button[aria-pressed=true] { color:var(--m4a-text); border-bottom-color:var(--m4a-accent); }
.m4a-library-results { min-width:0; }
.m4a-library--compact .m4a-library-results { max-height:630px; overflow-y:auto; padding-right:5px; scrollbar-width:thin; }
.m4a-family { margin-bottom:23px; }
.m4a-family > h4 { padding:4px 0 8px; color:var(--m4a-muted); }
.m4a-model-row { display:grid; grid-template-columns:28px minmax(0,1fr); gap:8px; padding:13px 7px 13px 0; border-bottom:1px solid var(--m4a-line); }
.m4a-model-row.is-selected { background:color-mix(in srgb,var(--m4a-accent) 4%,transparent); }
.m4a-model-symbol { padding-top:3px; color:#468570; }
.m4a-model-symbol--vision { color:#397ecd; }
.m4a-model-symbol--mtp { color:#a98532; }
.m4a-model-symbol--embedding { color:#9570af; }
.m4a-model-info { display:grid; min-width:0; gap:6px; }
.m4a-model-info > strong { overflow-wrap:anywhere; font-size:12px; line-height:1.45; font-weight:550; }
.m4a-model-badges { display:flex; align-items:center; flex-wrap:wrap; gap:5px; color:var(--m4a-faint); font-size:10px; }
.m4a-badge { display:inline-flex; align-items:center; gap:3px; padding:1px 5px; border-radius:3px; background:var(--m4a-soft); color:var(--m4a-muted); font-size:10px; }
.m4a-badge--recommend { color:#5589c6; background:color-mix(in srgb,#397ecd 8%,transparent); }
.m4a-badge--local { color:var(--m4a-accent); background:color-mix(in srgb,var(--m4a-accent) 8%,transparent); }
.m4a-badge--warning { color:#bf8732; }
.m4a-model-meta { display:flex; flex-wrap:wrap; gap:10px; color:var(--m4a-faint); font-size:11px; font-variant-numeric:tabular-nums; }
.m4a-model-actions { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:2px; }
.m4a-model-actions .m4a-btn { min-height:28px; padding:5px 9px; font-size:11px !important; }
.m4a-model-download { display:grid; gap:5px; padding-top:3px; }
.m4a-model-download span { color:var(--m4a-faint); font-size:10px; font-variant-numeric:tabular-nums; }
.m4a-empty,.m4a-loading { display:grid; justify-items:center; gap:15px; color:var(--m4a-faint); padding:45px 15px; }
.m4a-empty strong { font-size:13px; font-weight:500; }
.m4a-engine-view,.m4a-diagnostics,.m4a-connection-view { display:grid; gap:22px; padding:24px 0; }
.m4a-connection-view { max-width:600px; min-height:430px; }
.m4a-engine-install { display:grid; grid-template-columns:46px minmax(0,1fr) auto; gap:14px; align-items:center; padding:20px 0; border-top:1px solid var(--m4a-line); border-bottom:1px solid var(--m4a-line); }
.m4a-engine-install h4 { font-size:16px; }
.m4a-engine-install p { color:var(--m4a-faint); font-size:12px; margin-top:4px; }
.m4a-engine-symbol { color:var(--m4a-accent); }
.m4a-version-row { display:grid; grid-template-columns:24px minmax(0,1fr) auto 32px; align-items:center; gap:12px; padding:14px 0; border-bottom:1px solid var(--m4a-line); }
.m4a-version-row > svg { color:var(--m4a-faint); }
.m4a-version-row > div { min-width:0; display:grid; gap:3px; }
.m4a-version-row code { font-size:10px; color:var(--m4a-faint); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.m4a-import-engine { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:10px; align-items:end; }
.m4a-source-link { display:inline-flex; gap:5px; align-items:center; color:var(--m4a-accent); text-decoration:none; font-size:12px; justify-self:start; }
.m4a-runtime { display:grid; gap:9px; padding:18px 0; border-bottom:1px solid var(--m4a-line); }
.m4a-runtime > code { color:var(--m4a-faint); font-size:12px; overflow-wrap:anywhere; }
.m4a-runtime > span { color:var(--m4a-muted); font-size:11px; }
.m4a-runtime-models { display:grid; gap:5px; color:var(--m4a-accent); font-size:11px; }
.m4a-runtime-models span { display:flex; gap:6px; align-items:center; overflow-wrap:anywhere; }
.m4a-log,.m4a-code { margin:0; background:var(--m4a-soft); color:var(--m4a-muted); border:1px solid var(--m4a-line); border-radius:5px; padding:12px; font:11px/1.65 Consolas,monospace; overflow:auto; max-height:380px; min-height:100px; white-space:pre-wrap; overflow-wrap:anywhere; scrollbar-width:thin; }
.m4a-log--preview { max-height:160px; }
.m4a-diagnostic-facts { display:grid; gap:12px; margin:0; }
.m4a-diagnostic-facts > div { display:grid; grid-template-columns:135px minmax(0,1fr); gap:10px; font-size:12px; }
.m4a-diagnostic-facts dt { color:var(--m4a-faint); }
.m4a-diagnostic-facts dd { margin:0; overflow-wrap:anywhere; }
.m4a-message { display:flex; align-items:center; gap:9px; margin:12px 0 0; padding:9px 12px; border-left:3px solid var(--m4a-accent); background:color-mix(in srgb,var(--m4a-accent) 6%,transparent); color:var(--m4a-muted); font-size:12px; }
.m4a-message > span { flex:1; overflow-wrap:anywhere; }
.m4a-message--error { border-color:var(--m4a-danger); background:color-mix(in srgb,var(--m4a-danger) 6%,transparent); }
.m4a-message--warning { border-color:#bf8732; background:color-mix(in srgb,#bf8732 6%,transparent); }
.m4a-first-install { min-height:410px; display:grid; align-content:center; justify-items:center; gap:18px; padding:45px 20px; text-align:center; }
.m4a-first-install-mark { display:grid; place-items:center; width:58px; height:58px; border:1px solid var(--m4a-line); border-radius:8px; color:var(--m4a-accent); background:var(--m4a-soft); }
.m4a-first-install > div:nth-child(2) { display:grid; gap:7px; max-width:480px; }
.m4a-first-install h3 { font-size:17px; }
.m4a-first-install p { color:var(--m4a-faint); font-size:12px; line-height:1.6; }
.m4a-transfer-list { display:grid; gap:12px; padding-top:14px; }
.m4a-transfer { display:grid; gap:6px; padding:10px 0; border-bottom:1px solid var(--m4a-line); }
.m4a-transfer-heading { display:flex; gap:12px; align-items:center; font-size:12px; }
.m4a-transfer-heading strong { flex:1; min-width:0; overflow-wrap:anywhere; font-weight:550; }
.m4a-transfer-heading > span { font-size:11px; color:var(--m4a-faint); font-variant-numeric:tabular-nums; }
.m4a-workspace progress,.m4a-dialog progress { width:100%; height:5px; border:0; border-radius:3px; accent-color:var(--m4a-accent); }
.m4a-workspace progress::-webkit-progress-bar,.m4a-dialog progress::-webkit-progress-bar { background:var(--m4a-line); border-radius:3px; }
.m4a-workspace progress::-webkit-progress-value,.m4a-dialog progress::-webkit-progress-value { background:var(--m4a-accent); border-radius:3px; }
.m4a-transfer small { font-size:11px; color:var(--m4a-faint); }
.m4a-transfer--error p { color:var(--m4a-danger); font-size:12px; overflow-wrap:anywhere; }
.m4a-footer { display:flex; position:sticky; bottom:-1px; z-index:5; justify-content:space-between; align-items:center; gap:12px; padding:15px 0; border-top:1px solid var(--m4a-line); background:var(--m4a-bg); }
.m4a-footer--models { position:static; }
.m4a-footer > div:first-child { display:flex; align-items:center; gap:7px; font-size:11px; color:var(--m4a-faint); flex-wrap:wrap; }
.m4a-footer small { font-size:10px; }
.m4a-save-indicator { background:var(--m4a-accent); width:5px; height:5px; }
.m4a-save-indicator.is-dirty { background:#bf8732; }
.m4a-footer-actions { display:flex; align-items:center; gap:8px; flex-shrink:0; }
.m4a-dialog { padding:0; border:1px solid var(--m4a-line); border-radius:8px; background:var(--m4a-bg); max-width:min(560px,calc(100vw - 32px)); width:560px; max-height:calc(100dvh - 50px); box-shadow:0 12px 65px #0003; }
.m4a-dialog::backdrop { background:#0006; }
.m4a-dialog-inner { padding:22px; }
.m4a-dialog header { display:flex; align-items:center; gap:10px; justify-content:space-between; margin-bottom:20px; }
.m4a-dialog h3 { font-size:17px; font-weight:650; }
.m4a-dialog-body { display:grid; gap:15px; }
.m4a-dialog-body p { color:var(--m4a-muted); font-size:13px; overflow-wrap:anywhere; }
.m4a-dialog footer { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:8px; margin-top:23px; }
.m4a-dialog-choices { display:flex; flex-wrap:wrap; gap:8px; }
.m4a-import-choice { display:flex; align-items:center; gap:10px; padding:10px 0; color:var(--m4a-text); border:0; border-bottom:1px solid var(--m4a-line); background:none; text-align:left; }
.m4a-import-choice span { flex:1; overflow-wrap:anywhere; }
.m4a-spin { animation:m4a-spin 1.4s linear infinite; }
body[data-ds-dark-theme] :is(.m4a-workspace,.m4a-dialog) { --m4a-accent:#5cbd9c; }
:is(.m4a-workspace,.m4a-dialog) .m4a-btn { background:var(--m4a-bg); color:var(--m4a-text); }
:is(.m4a-workspace,.m4a-dialog) .m4a-btn:hover:not(:disabled) { background:var(--m4a-soft); }
:is(.m4a-workspace,.m4a-dialog) .m4a-btn--primary { background:#198265; border-color:#198265; color:#fff; }
:is(.m4a-workspace,.m4a-dialog) .m4a-btn--primary:hover:not(:disabled) { background:#146c54; }
:is(.m4a-workspace,.m4a-dialog) .m4a-btn--danger { background:var(--m4a-danger); color:#fff; }
:is(.m4a-workspace,.m4a-dialog) .m4a-btn--danger:hover:not(:disabled) { background:#b83e43; }
:is(.m4a-workspace,.m4a-dialog) .m4a-btn--ghost { background:transparent; color:var(--m4a-accent); }
@keyframes m4a-spin { to { transform:rotate(360deg); } }
@media (prefers-reduced-motion:reduce) { .m4a-spin { animation:none; } }
@container (max-width:680px) {
 .m4a-run-layout { grid-template-columns:minmax(0,1fr); }
 .m4a-run-config { padding-right:0; }
 .m4a-run-library { padding-left:0; border-left:0; border-top:1px solid var(--m4a-line); }
 .m4a-library--compact .m4a-library-results { max-height:400px; }
}
@container (max-width:410px) {
 .m4a-brand h2 { font-size:20px; } .m4a-brand-mark { width:36px; height:36px; }
 .m4a-status-pill { font-size:10px; max-width:105px; }
 .m4a-tabs { gap:0; justify-content:space-between; } .m4a-tabs button { font-size:11px; gap:4px; } .m4a-tabs svg { width:13px; }
 .m4a-mode-switch button { font-size:12px; gap:5px; }
 .m4a-footer { align-items:stretch; flex-direction:column; gap:8px; padding:10px 0; } .m4a-footer-actions { justify-content:flex-end; }
 .m4a-engine-install { grid-template-columns:32px minmax(0,1fr); } .m4a-engine-install > .m4a-btn { grid-column:1/-1; }
 .m4a-version-row { grid-template-columns:20px minmax(0,1fr) 32px; gap:8px; } .m4a-version-row > .m4a-btn { grid-column:2; grid-row:2; justify-self:start; } .m4a-version-row > .m4a-icon-btn { grid-column:3; grid-row:1; }
 .m4a-import-engine { grid-template-columns:minmax(0,1fr); } .m4a-diagnostic-facts > div { grid-template-columns:minmax(0,1fr); gap:3px; }
}
@media (max-width:700px) {
 .m4a-host-dialog { width:100vw !important; max-width:100vw !important; height:100dvh !important; flex-direction:column; border-radius:0 !important; }
 .m4a-host-dialog > nav { width:100%; padding:12px 12px 0; gap:8px; }
 .m4a-host-dialog > nav > div:first-child { display:none; }
 .m4a-host-dialog > nav > div:last-child { flex-direction:row; gap:3px; overflow-x:auto; scrollbar-width:none; }
 .m4a-host-dialog > nav button { flex-shrink:0; height:34px; font-size:12px; padding:6px 9px; border-radius:5px; }
 .m4a-host-dialog > div { min-height:0; }
 .m4a-host-options { padding-left:16px !important; padding-right:16px !important; }
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
				id: "moe4all-setup-v2",
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