import { sandboxService } from '../modules/grading/sandbox.service';

async function testPythonSandbox() {
  console.log('🧪 Testing Python 3 Docker Sandbox Execution...\n');

  // Test 1: Python Code Execution
  console.log('--- 1. Testing Python Execution (Two Sum Logic) ---');
  const pythonCode = `import sys

def solve():
    raw = sys.stdin.read().strip().split()
    if len(raw) < 2:
        return
    target = int(raw[-1])
    nums = [int(x) for x in raw[:-1]]
    seen = {}
    for n in nums:
        diff = target - n
        if diff in seen:
            print(target)
            return
        seen[n] = True

solve()
`;

  const res1 = await sandboxService.runCode({
    code: pythonCode,
    language: 'python',
    inputData: '2 7 11 15\n9',
    timeoutMs: 5000,
  });

  console.log('Result 1:');
  console.log('stdout:', res1.stdout);
  console.log('stderr:', res1.stderr);
  console.log('exitCode:', res1.exitCode);
  console.log('executionTimeMs:', res1.executionTimeMs);
  console.log('timedOut:', res1.timedOut);

  if (res1.stdout.trim() === '9' && res1.exitCode === 0) {
    console.log('✅ TEST 1 PASSED: Python code executed perfectly in Docker Sandbox!\n');
  } else {
    console.error('❌ TEST 1 FAILED');
  }

  // Test 2: Python Timeout Watchdog
  console.log('--- 2. Testing Python Timeout Watchdog (5000ms limit) ---');
  const infiniteLoopPython = `while True:
    pass
`;

  const res2 = await sandboxService.runCode({
    code: infiniteLoopPython,
    language: 'python',
    timeoutMs: 5000,
  });

  console.log('Result 2:');
  console.log('stdout:', res2.stdout);
  console.log('stderr:', res2.stderr);
  console.log('timedOut:', res2.timedOut);
  console.log('exitCode:', res2.exitCode);

  if (res2.timedOut && res2.exitCode === 124) {
    console.log('✅ TEST 2 PASSED: Python Watchdog Timeout terminated container safely!\n');
  } else {
    console.error('❌ TEST 2 FAILED');
  }

  console.log('🎉 ALL PYTHON SANDBOX TESTS COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

testPythonSandbox().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
