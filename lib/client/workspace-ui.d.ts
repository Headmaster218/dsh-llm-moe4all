import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { Moe4AllLocaleKey } from './locales.js';
export type Translate = (key: Moe4AllLocaleKey) => string;
export declare function Button({ icon: Icon, children, kind, busy, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
    icon?: LucideIcon | undefined;
    kind?: 'default' | 'primary' | 'danger' | 'ghost';
    busy?: boolean;
}): import("react").JSX.Element;
export declare function IconButton({ icon: Icon, label, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: LucideIcon;
    label: string;
}): import("react").JSX.Element;
export declare function Field({ label, help, children, className, }: {
    label: string;
    help?: string;
    children: ReactNode;
    className?: string;
}): import("react").JSX.Element;
export declare function Toggle({ label, checked, onChange, disabled, detail, }: {
    label: string;
    checked: boolean;
    onChange(value: boolean): void;
    disabled?: boolean;
    detail?: string;
}): import("react").JSX.Element;
export declare function Disclosure({ title, children, icon: Icon, open, }: {
    title: string;
    children: ReactNode;
    icon?: LucideIcon;
    open?: boolean;
}): import("react").JSX.Element;
export declare function Dialog({ title, children, onClose, actions, closeLabel, }: {
    title: string;
    children: ReactNode;
    onClose(): void;
    actions?: ReactNode;
    closeLabel: string;
}): import("react").JSX.Element;
export declare function Transfer({ label, detail, percent, error, actions, }: {
    label: string;
    detail?: string | undefined;
    percent?: number | undefined;
    error?: string | undefined;
    actions?: ReactNode;
}): import("react").JSX.Element;
//# sourceMappingURL=workspace-ui.d.ts.map