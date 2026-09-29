import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Check, Copy, Eye, EyeOff, RefreshCw, Save } from 'lucide-react';
import { Button, Field, IconButton } from './workspace-ui.js';
export function ApiKeyField({ workspace: w, t }) {
    const [draft, setDraft] = useState('');
    const [visible, setVisible] = useState(false);
    const [copied, setCopied] = useState(false);
    useEffect(() => { setDraft(w.apiKey?.value ?? ''); }, [w.apiKey?.value]);
    const changed = draft.trim() !== (w.apiKey?.value ?? '');
    return (_jsxs(Field, { label: t('apiKeyLabel'), help: t(w.apiKey?.required ? 'apiKeyRemoteHelp' : 'apiKeyLocalHelp'), className: "m4a-span-2", children: [_jsxs("div", { className: "m4a-secret-field", children: [_jsx("input", { type: visible ? 'text' : 'password', value: draft, autoComplete: "off", spellCheck: false, onChange: (event) => setDraft(event.target.value) }), _jsx(IconButton, { icon: visible ? EyeOff : Eye, label: t(visible ? 'hideApiKey' : 'showApiKey'), onClick: () => setVisible((value) => !value) }), _jsx(IconButton, { icon: copied ? Check : Copy, label: t(copied ? 'copied' : 'copyApiKey'), disabled: !draft, onClick: () => {
                            void navigator.clipboard.writeText(draft).then(() => {
                                setCopied(true);
                                setTimeout(() => setCopied(false), 1500);
                            }).catch((error) => w.setError(String(error)));
                        } })] }), _jsxs("div", { className: "m4a-inline", children: [_jsx(Button, { icon: Save, disabled: !changed || !draft.trim(), busy: w.working === 'api-key', onClick: () => void w.saveApiKey(draft), children: t('saveApiKey') }), _jsx(Button, { kind: "ghost", icon: RefreshCw, busy: w.working === 'api-key', onClick: () => void w.regenerateApiKey(), children: t('generateApiKey') })] })] }));
}
//# sourceMappingURL=ApiKeyField.js.map