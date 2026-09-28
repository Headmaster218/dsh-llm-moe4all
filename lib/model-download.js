import { constants as fsConstants } from 'node:fs';
import { access, mkdir, open, rename, stat, statfs } from 'node:fs/promises';
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path';
const FLASH_NAME = 'Qwen3.8-Flash-Next-AD-4.27bpw-Q4_K_M-M64';
const FLASH_SIZES = [
    693_380_288, 38_400_184_512, 1_999_024_832, 1_787_651_072, 1_654_830_080,
    1_993_256_608, 1_725_815_808, 1_830_961_056, 1_915_366_048, 1_711_956_000,
    1_844_820_928, 1_923_724_224, 1_703_597_888, 1_844_820_928, 1_909_864_352,
    1_717_457_728, 1_853_179_072, 1_901_506_240, 1_725_815_872, 1_830_961_088,
    1_915_366_080, 1_711_956_000, 1_844_820_928, 1_923_724_224, 1_703_597_888,
    1_844_820_928, 1_909_864_352, 1_646_472_000, 1_725_375_264, 1_738_770_080,
    1_646_472_000, 1_725_375_264, 1_220_605_344,
];
function hfUrl(repository, path) {
    const encoded = path.split('/').map(encodeURIComponent).join('/');
    return `https://huggingface.co/${repository}/resolve/main/${encoded}?download=true`;
}
function file(repository, path, size) {
    return { name: basename(path), size, url: hfUrl(repository, path) };
}
const flashFiles = FLASH_SIZES.map((size, index) => {
    const shard = String(index + 1).padStart(5, '0');
    const name = `${FLASH_NAME}-${shard}-of-00033.gguf`;
    return file('AtomicChat/Qwen3.8-Flash-Next-GGUF', `${FLASH_NAME}/${name}`, size);
});
function model(value) {
    return {
        ...value,
        totalBytes: value.files.reduce((sum, item) => sum + item.size, 0),
    };
}
export const RECOMMENDED_MODELS = [
    model({
        id: 'qwen38-flash-ad-q4km',
        kind: 'main',
        name: 'Qwen3.8-Flash-Next AD-4.27bpw Q4_K_M M64',
        architecture: 'Qwen3.8 Flash Next MoE',
        quantization: 'AD-4.27bpw Q4_K_M M64',
        folderName: FLASH_NAME,
        files: flashFiles,
        primaryFile: flashFiles[0].name,
        sourceUrl: `https://huggingface.co/AtomicChat/Qwen3.8-Flash-Next-GGUF/tree/main/${FLASH_NAME}`,
        supportsMtp: true,
        supportsVision: true,
    }),
    model({
        id: 'qwen36-35b-apex-i-balanced',
        kind: 'main',
        name: 'Qwen3.6-35B-A3B APEX-I-Balanced',
        architecture: 'Qwen3.6 35B-A3B MoE',
        quantization: 'APEX-I-Balanced',
        folderName: 'Qwen3.6-35B-A3B-APEX-I-Balanced',
        files: [file('mudler/Qwen3.6-35B-A3B-APEX-GGUF', 'Qwen3.6-35B-A3B-APEX-I-Balanced.gguf', 25_624_957_632)],
        primaryFile: 'Qwen3.6-35B-A3B-APEX-I-Balanced.gguf',
        sourceUrl: 'https://huggingface.co/mudler/Qwen3.6-35B-A3B-APEX-GGUF',
        supportsMtp: false,
        supportsVision: false,
    }),
    model({
        id: 'qwen38-flash-vision-f16',
        kind: 'vision',
        name: 'Qwen3.8 Flash Next vision projector F16',
        architecture: 'Qwen3.8 Flash Next vision projector',
        quantization: 'F16',
        folderName: FLASH_NAME,
        files: [file('AtomicChat/Qwen3.8-Flash-Next-GGUF', 'mmproj-Qwen3.8-Flash-Next-F16.gguf', 904_003_840)],
        primaryFile: 'mmproj-Qwen3.8-Flash-Next-F16.gguf',
        sourceUrl: 'https://huggingface.co/AtomicChat/Qwen3.8-Flash-Next-GGUF',
        supportsMtp: false,
        supportsVision: true,
    }),
    model({
        id: 'qwen3-embedding-06b-q8',
        kind: 'embedding',
        name: 'Qwen3 Embedding 0.6B Q8_0',
        architecture: 'Qwen3 Embedding 0.6B',
        quantization: 'Q8_0',
        folderName: 'Qwen3-Embedding-0.6B-GGUF',
        files: [file('Qwen/Qwen3-Embedding-0.6B-GGUF', 'Qwen3-Embedding-0.6B-Q8_0.gguf', 639_150_592)],
        primaryFile: 'Qwen3-Embedding-0.6B-Q8_0.gguf',
        sourceUrl: 'https://huggingface.co/Qwen/Qwen3-Embedding-0.6B-GGUF',
        supportsMtp: false,
        supportsVision: false,
    }),
    model({
        id: 'qwen38-flash-mtp-shared-q4km',
        kind: 'mtp',
        name: 'Qwen3.8 Flash Next shared MTP head Q4_K_M',
        architecture: 'Qwen3.8 Flash Next MTP head',
        quantization: 'shared Q4_K_M',
        folderName: FLASH_NAME,
        files: [file('unsloth/Qwen3.8-Flash-Next-GGUF', 'MTP/mtp-Qwen3.8-Flash-Next-shared-Q4_K_M.gguf', 1_907_151_936)],
        primaryFile: 'mtp-Qwen3.8-Flash-Next-shared-Q4_K_M.gguf',
        sourceUrl: 'https://huggingface.co/unsloth/Qwen3.8-Flash-Next-GGUF/tree/main/MTP',
        supportsMtp: true,
        supportsVision: false,
    }),
];
function progress(stage, downloadedBytes, totalBytes) {
    const percent = totalBytes === undefined || totalBytes <= 0
        ? undefined
        : Math.min(100, Math.round(downloadedBytes * 1000 / totalBytes) / 10);
    return {
        stage,
        downloadedBytes,
        ...(totalBytes === undefined ? {} : { totalBytes }),
        ...(percent === undefined ? {} : { percent }),
    };
}
function assertDownloadRoot(path) {
    const value = path.trim();
    if (value === '' || !isAbsolute(value))
        throw new Error('Choose an absolute model directory before downloading.');
    return resolve(value);
}
function assertInside(root, path) {
    const delta = relative(resolve(root), resolve(path));
    if (delta === '..' || delta.startsWith(`..${sep}`) || isAbsolute(delta)) {
        throw new Error(`Unsafe model download path: ${path}`);
    }
}
async function fileSize(path) {
    try {
        return (await stat(path)).size;
    }
    catch {
        return undefined;
    }
}
async function exists(path) {
    try {
        await access(path, fsConstants.F_OK);
        return true;
    }
    catch {
        return false;
    }
}
const DEFAULT_DEPENDENCIES = {
    fetch: (input, init) => fetch(input, init),
};
export class ModelDownloadManager {
    dependencies;
    models;
    current = progress('idle', 0);
    active;
    constructor(dependencies = {}, models = RECOMMENDED_MODELS) {
        this.dependencies = { ...DEFAULT_DEPENDENCIES, ...dependencies };
        this.models = structuredClone(models);
    }
    catalog() {
        return structuredClone(this.models);
    }
    status() {
        return structuredClone(this.current);
    }
    start(modelId, directory) {
        if (this.active !== undefined) {
            if (this.current.modelId === modelId)
                return this.status();
            throw new Error('Another recommended model download is already running.');
        }
        const selected = this.models.find(item => item.id === modelId);
        if (selected === undefined)
            throw new Error(`Unknown recommended model: ${modelId}`);
        const root = assertDownloadRoot(directory);
        const outputDirectory = join(root, selected.folderName);
        assertInside(root, outputDirectory);
        this.current = {
            ...progress('downloading', 0, selected.totalBytes),
            modelId: selected.id,
            directory: root,
            outputDirectory,
            fileCount: selected.files.length,
        };
        const run = this.download(selected, root, outputDirectory).catch((error) => {
            this.current = {
                ...this.current,
                stage: 'error',
                error: error instanceof Error ? error.message : String(error),
            };
        }).finally(() => {
            if (this.active === run)
                this.active = undefined;
        });
        this.active = run;
        return this.status();
    }
    async download(selected, root, outputDirectory) {
        await mkdir(outputDirectory, { recursive: true });
        let reusableBytes = 0;
        for (const item of selected.files) {
            const targetSize = await fileSize(join(outputDirectory, item.name));
            if (targetSize === item.size)
                reusableBytes += item.size;
            else
                reusableBytes += Math.min(await fileSize(join(outputDirectory, `${item.name}.part`)) ?? 0, item.size);
        }
        const volume = await statfs(outputDirectory);
        const freeBytes = Number(volume.bavail) * Number(volume.bsize);
        const remainingBytes = selected.totalBytes - reusableBytes;
        if (Number.isFinite(freeBytes) && freeBytes < remainingBytes) {
            throw new Error(`The selected model directory has ${Math.floor(freeBytes / 1024 ** 3)} GiB free, but this download still needs ${Math.ceil(remainingBytes / 1024 ** 3)} GiB.`);
        }
        let completedBytes = 0;
        for (let index = 0; index < selected.files.length; index += 1) {
            const item = selected.files[index];
            const target = join(outputDirectory, item.name);
            const partial = `${target}.part`;
            assertInside(root, target);
            if (await fileSize(target) === item.size) {
                completedBytes += item.size;
                this.updateFile(selected, outputDirectory, item, index, completedBytes);
                continue;
            }
            if (await exists(target))
                throw new Error(`${item.name} already exists but has the wrong size.`);
            let offset = Math.min(await fileSize(partial) ?? 0, item.size);
            const headers = offset > 0 ? { range: `bytes=${offset}-` } : undefined;
            let response = await this.dependencies.fetch(item.url, {
                headers: { 'user-agent': 'dsh-llm-moe4all', ...headers },
                redirect: 'follow',
                signal: AbortSignal.timeout(24 * 60 * 60_000),
            });
            if (offset > 0 && response.status !== 206) {
                offset = 0;
                response = await this.dependencies.fetch(item.url, {
                    headers: { 'user-agent': 'dsh-llm-moe4all' },
                    redirect: 'follow',
                    signal: AbortSignal.timeout(24 * 60 * 60_000),
                });
            }
            if (!response.ok || response.body === null) {
                throw new Error(`${item.name} returned HTTP ${response.status}.`);
            }
            this.updateFile(selected, outputDirectory, item, index, completedBytes + offset);
            const output = await open(partial, offset > 0 ? 'a' : 'w');
            let downloaded = offset;
            try {
                const reader = response.body.getReader();
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    await output.write(value);
                    downloaded += value.byteLength;
                    this.updateFile(selected, outputDirectory, item, index, completedBytes + downloaded);
                }
            }
            finally {
                await output.close();
            }
            if (downloaded !== item.size) {
                throw new Error(`${item.name} has the wrong size (${downloaded} of ${item.size} bytes). Retry to resume.`);
            }
            await rename(partial, target);
            completedBytes += item.size;
            this.updateFile(selected, outputDirectory, item, index, completedBytes);
        }
        this.current = {
            ...progress('complete', selected.totalBytes, selected.totalBytes),
            modelId: selected.id,
            directory: root,
            outputDirectory,
            selectedFile: join(outputDirectory, selected.primaryFile),
            fileCount: selected.files.length,
            fileIndex: selected.files.length,
        };
    }
    updateFile(selected, outputDirectory, item, index, downloadedBytes) {
        this.current = {
            ...progress('downloading', downloadedBytes, selected.totalBytes),
            modelId: selected.id,
            ...(this.current.directory === undefined ? {} : { directory: this.current.directory }),
            outputDirectory,
            fileName: item.name,
            fileIndex: index + 1,
            fileCount: selected.files.length,
        };
    }
}
//# sourceMappingURL=model-download.js.map