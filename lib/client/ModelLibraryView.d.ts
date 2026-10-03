import type { Workspace } from './use-workspace.js';
import { type Translate } from './workspace-ui.js';
export declare const roleIcon: {
    main: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
    vision: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
    mtp: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
    embedding: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
};
export declare const roleLabel: {
    readonly main: "modelRoleMain";
    readonly vision: "modelRoleVision";
    readonly mtp: "modelRoleMtp";
    readonly embedding: "modelRoleEmbedding";
};
export declare function ModelLibraryView({ workspace: w, t, onImport, }: {
    workspace: Workspace;
    t: Translate;
    onImport(): void;
}): import("react").JSX.Element;
//# sourceMappingURL=ModelLibraryView.d.ts.map