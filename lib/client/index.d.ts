import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
export declare const inject: string[];
export declare function apply(ctx: ClientContext): void;
declare const plugin: {
    inject: string[];
    apply: typeof apply;
};
export default plugin;
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface SlotMap {
        'shell.overlay': {
            kind: 'list';
            scope: 'root';
        };
    }
}
//# sourceMappingURL=index.d.ts.map