const copy = {
    port: { summary: 'diagnosticPort', suggestions: ['diagnosticPortStep'] },
    executable: { summary: 'diagnosticExecutable', suggestions: ['diagnosticExecutableStep1', 'diagnosticExecutableStep2'] },
    model: { summary: 'diagnosticModel', suggestions: ['diagnosticModelStep1', 'diagnosticModelStep2'] },
    attachment: { summary: 'diagnosticAttachment', suggestions: ['diagnosticAttachmentStep1', 'diagnosticAttachmentStep2'] },
    compatibility: { summary: 'diagnosticCompatibility', suggestions: ['diagnosticCompatibilityStep1', 'diagnosticCompatibilityStep2'] },
    configuration: { summary: 'diagnosticConfiguration', suggestions: ['diagnosticConfigurationStep1', 'diagnosticConfigurationStep2'] },
    context: { summary: 'diagnosticContext', suggestions: ['diagnosticContextStep1', 'diagnosticContextStep2'] },
    ubatch: { summary: 'diagnosticUbatch', suggestions: ['diagnosticUbatchStep1', 'diagnosticUbatchStep2'] },
    vram: { summary: 'diagnosticVram', suggestions: ['diagnosticOneSlot', 'diagnosticVramStep1', 'diagnosticVramStep2'] },
    ram: { summary: 'diagnosticRam', suggestions: ['diagnosticOneSlot', 'diagnosticRamStep1', 'diagnosticRamStep2'] },
    storage: { summary: 'diagnosticStorage', suggestions: ['diagnosticStorageStep1', 'diagnosticStorageStep2'] },
    vulkan: { summary: 'diagnosticVulkan', suggestions: ['diagnosticVulkanStep1', 'diagnosticVulkanStep2'] },
    timeout: { summary: 'diagnosticTimeout', suggestions: ['diagnosticTimeoutStep1', 'diagnosticTimeoutStep2'] },
    unknown: { summary: 'diagnosticUnknown', suggestions: ['diagnosticUnknownStep1', 'diagnosticUnknownStep2'] },
};
export function localizeStartupDiagnostic(diagnostic, t) {
    const entry = copy[diagnostic.code];
    return { summary: t(entry.summary), suggestions: entry.suggestions.map(t) };
}
//# sourceMappingURL=startup-diagnostic.js.map