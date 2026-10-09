import Docker from 'dockerode';
import tar from 'tar-stream';
import { Readable } from 'stream';
import path from 'path';
import fs from 'fs';

export interface SandboxExecutionOptions {
  code: string;
  language?: 'python' | 'javascript' | 'nodejs';
  inputData?: string;
  timeoutMs?: number;       // Default: 10,000ms, max 30,000ms (BR-03)
  cpuQuota?: number;        // Default: 0.5 core = 500,000,000 NanoCpus
  memoryLimitBytes?: number;// Default: 256MB = 256 * 1024 * 1024
}

export interface SandboxExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  timedOut: boolean;
  memoryExceeded: boolean;
  error?: string;
}

export class SandboxService {
  private docker: Docker;
  private isDockerAvailable: boolean = false;

  constructor() {
    if (process.platform === 'win32') {
      this.docker = new Docker({ socketPath: '//./pipe/docker_engine' });
    } else {
      this.docker = new Docker({ socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock' });
    }

    this.checkDockerAvailability();
  }

  public async checkDockerAvailability(): Promise<boolean> {
    try {
      await this.docker.ping();
      this.isDockerAvailable = true;
      return true;
    } catch (err: any) {
      console.warn('[SandboxService] Docker daemon not reachable:', err.message);
      this.isDockerAvailable = false;
      return false;
    }
  }

  public async ensureSandboxImage(language: 'python' | 'javascript' | 'nodejs' = 'python'): Promise<string> {
    const isPython = language === 'python';
    const imageName = isPython ? 'aita-sandbox-python:latest' : 'aita-sandbox-node:latest';
    const fallbackImage = isPython ? 'python:3.11-alpine' : 'node:20-alpine';

    try {
      const images = await this.docker.listImages({ filters: { reference: [imageName] } });
      if (images && images.length > 0) {
        return imageName;
      }

      const dockerfilePath = path.resolve(
        __dirname,
        `../../../sandbox-images/Dockerfile.${isPython ? 'python' : 'node'}`
      );

      if (fs.existsSync(dockerfilePath)) {
        console.log(`[SandboxService] Building sandbox image: ${imageName}...`);
        const pack = tar.pack();
        pack.entry({ name: 'Dockerfile' }, fs.readFileSync(dockerfilePath));
        pack.finalize();

        const stream = await this.docker.buildImage(pack as any, { t: imageName });
        await new Promise((resolve, reject) => {
          this.docker.modem.followProgress(stream, (err: any, res: any) => (err ? reject(err) : resolve(res)));
        });
        console.log(`[SandboxService] Sandbox image ${imageName} built successfully.`);
        return imageName;
      }
    } catch (error: any) {
      console.warn(`[SandboxService] Failed to build custom image ${imageName}, fallback to ${fallbackImage}:`, error.message);
    }

    try {
      const fallbackList = await this.docker.listImages({ filters: { reference: [fallbackImage] } });
      if (fallbackList.length === 0) {
        console.log(`[SandboxService] Pulling base image: ${fallbackImage}...`);
        const pullStream = await this.docker.pull(fallbackImage);
        await new Promise((resolve, reject) => {
          this.docker.modem.followProgress(pullStream, (err: any, res: any) => (err ? reject(err) : resolve(res)));
        });
      }
      return fallbackImage;
    } catch (err: any) {
      console.error(`[SandboxService] Error ensuring image ${fallbackImage}:`, err.message);
      return fallbackImage;
    }
  }

  private createTarArchive(filename: string, code: string, inputData?: string): Readable {
    const pack = tar.pack();
    pack.entry({ name: filename, mode: 0o755 }, code);

    if (inputData !== undefined && inputData !== null) {
      pack.entry({ name: 'input.txt', mode: 0o644 }, inputData);
    } else {
      pack.entry({ name: 'input.txt', mode: 0o644 }, '');
    }

    pack.finalize();
    return pack as any;
  }

  /**
   * Parse Docker multiplexed log buffer (8-byte header per frame)
   * Header format: [STREAM_TYPE (1 byte), 0, 0, 0, SIZE (4 bytes big-endian)]
   */
  private parseDockerLogBuffer(buffer: Buffer): { stdout: string; stderr: string } {
    let stdout = '';
    let stderr = '';
    let offset = 0;

    while (offset < buffer.length) {
      if (offset + 8 > buffer.length) {
        break;
      }
      const streamType = buffer.readUInt8(offset); // 1 = stdout, 2 = stderr
      const frameSize = buffer.readUInt32BE(offset + 4);
      offset += 8;

      if (offset + frameSize > buffer.length) {
        const chunk = buffer.subarray(offset).toString('utf-8');
        if (streamType === 2) {
          stderr += chunk;
        } else {
          stdout += chunk;
        }
        break;
      }

      const chunk = buffer.subarray(offset, offset + frameSize).toString('utf-8');
      if (streamType === 2) {
        stderr += chunk;
      } else {
        stdout += chunk;
      }

      offset += frameSize;
    }

    // Fallback if buffer does not contain standard Docker multiplex headers
    if (!stdout && !stderr && buffer.length > 0) {
      stdout = buffer.toString('utf-8');
    }

    return { stdout, stderr };
  }

  public async runCode(options: SandboxExecutionOptions): Promise<SandboxExecutionResult> {
    const {
      code,
      language = 'python',
      inputData,
      timeoutMs = 10000,
      cpuQuota = 500_000_000,
      memoryLimitBytes = 256 * 1024 * 1024,
    } = options;

    const startTime = Date.now();
    const isPython = language === 'python';
    const filename = isPython ? 'main.py' : 'main.js';

    // Command redirection: reads from /app/input.txt
    const runCommand = isPython
      ? ['sh', '-c', 'python main.py < /app/input.txt']
      : ['sh', '-c', 'node main.js < /app/input.txt'];

    const available = await this.checkDockerAvailability();
    if (!available) {
      return {
        stdout: '',
        stderr: 'Docker daemon is not reachable on host system.',
        exitCode: 1,
        executionTimeMs: 0,
        timedOut: false,
        memoryExceeded: false,
        error: 'Docker service unavailable',
      };
    }

    const imageName = await this.ensureSandboxImage(language);

    let container: Docker.Container | null = null;
    let timedOut = false;
    let timeoutTimer: NodeJS.Timeout | null = null;

    try {
      // 1. Create Isolated Container with Resource Constraints (BR-03)
      container = await this.docker.createContainer({
        Image: imageName,
        Cmd: runCommand,
        WorkingDir: '/app',
        User: 'runner',
        Tty: false,
        HostConfig: {
          Memory: memoryLimitBytes,
          MemorySwap: memoryLimitBytes,
          NanoCpus: cpuQuota,
          NetworkMode: 'none',
          CapDrop: ['ALL'],
          Ulimits: [
            { Name: 'nproc', Soft: 64, Hard: 64 },
            { Name: 'fsize', Soft: 10485760, Hard: 10485760 },
          ],
          AutoRemove: false,
        },
      });

      // 2. Put code and input file into container
      const tarStream = this.createTarArchive(filename, code, inputData);
      await container.putArchive(tarStream as any, { path: '/app' });

      // 3. Start Timeout Watchdog
      const timeoutPromise = new Promise<{ isTimeout: boolean; data?: any }>((resolve) => {
        timeoutTimer = setTimeout(async () => {
          timedOut = true;
          try {
            if (container) {
              await container.kill();
            }
          } catch (e) {
            // Container might already have exited
          }
          resolve({ isTimeout: true });
        }, timeoutMs);
      });

      // 4. Start Container
      await container.start();

      // 5. Wait for completion
      const waitPromise = container.wait().then((data: any) => ({ isTimeout: false, data }));
      const raceResult = await Promise.race([waitPromise, timeoutPromise]);

      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
      }

      const executionTimeMs = Date.now() - startTime;

      // 6. Collect Logs (stdout / stderr) from Container
      let stdout = '';
      let stderr = '';

      try {
        const logBuffer = (await container.logs({
          stdout: true,
          stderr: true,
        })) as unknown as Buffer;

        if (Buffer.isBuffer(logBuffer)) {
          const parsed = this.parseDockerLogBuffer(logBuffer);
          stdout = parsed.stdout;
          stderr = parsed.stderr;
        } else if (typeof logBuffer === 'string') {
          stdout = logBuffer;
        }
      } catch (logErr: any) {
        console.warn('[SandboxService] Error reading logs:', logErr.message);
      }

      if (raceResult.isTimeout || timedOut) {
        return {
          stdout: stdout.trim(),
          stderr: (stderr + '\nExecution timed out (Time Limit Exceeded). Container terminated.').trim(),
          exitCode: 124,
          executionTimeMs,
          timedOut: true,
          memoryExceeded: false,
          error: 'TIME_LIMIT_EXCEEDED',
        };
      }

      const inspectData = await container.inspect();
      const exitCode = inspectData.State?.ExitCode ?? raceResult.data?.StatusCode ?? 0;
      const oomKilled = inspectData.State?.OOMKilled || false;

      return {
        stdout: stdout.trim(),
        stderr: (stderr + (oomKilled ? '\nProcess killed: Out of Memory (Memory Limit: 256MB Exceeded)' : '')).trim(),
        exitCode,
        executionTimeMs,
        timedOut: false,
        memoryExceeded: oomKilled,
        error: exitCode !== 0 ? (oomKilled ? 'MEMORY_LIMIT_EXCEEDED' : 'RUNTIME_ERROR') : undefined,
      };
    } catch (err: any) {
      const executionTimeMs = Date.now() - startTime;
      return {
        stdout: '',
        stderr: `Sandbox execution error: ${err.message}`,
        exitCode: 1,
        executionTimeMs,
        timedOut,
        memoryExceeded: false,
        error: err.message,
      };
    } finally {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
      }
      if (container) {
        try {
          await container.remove({ force: true });
        } catch (removeErr) {
          // Ignore
        }
      }
    }
  }
}

export const sandboxService = new SandboxService();
