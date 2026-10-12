import { sandboxService } from '../modules/grading/sandbox.service';

async function testSandboxRunner() {
  console.log('====================================================');
  console.log('🧪 TESTING DOCKER SANDBOX RUNNER (THÀNH VIÊN 2 - BR-03)');
  console.log('====================================================\n');

  // Test 1: Python Basic Output
  console.log('▶ [Test 1] Python Basic Execution:');
  const res1 = await sandboxService.runCode({
    language: 'python',
    code: 'print("Hello from AITA Docker Sandbox! Python 3.11")',
    timeoutMs: 10000,
  });
  console.log('   Result:', res1);
  console.log('   Pass:', res1.stdout.includes('Hello from AITA Docker Sandbox!') ? '✅ SUCCESS' : '❌ FAILED');
  console.log('----------------------------------------------------');

  // Test 2: Python Stdin & Test Case Matching
  console.log('\n▶ [Test 2] Python Stdin & Algorithmic Test (Two Sum):');
  const res2 = await sandboxService.runCode({
    language: 'python',
    code: `
a, b = map(int, input().split())
print(f"SUM = {a + b}")
`,
    inputData: '125 75',
    timeoutMs: 10000,
  });
  console.log('   Result:', res2);
  console.log('   Pass:', res2.stdout.trim() === 'SUM = 200' ? '✅ SUCCESS' : '❌ FAILED');
  console.log('----------------------------------------------------');

  // Test 3: JavaScript / Node.js Execution
  console.log('\n▶ [Test 3] JavaScript / Node.js Execution:');
  const res3 = await sandboxService.runCode({
    language: 'javascript',
    code: 'console.log("Node.js sandbox is working smoothly:", 10 * 42);',
    timeoutMs: 10000,
  });
  console.log('   Result:', res3);
  console.log('   Pass:', res3.stdout.includes('420') ? '✅ SUCCESS' : '❌ FAILED');
  console.log('----------------------------------------------------');

  // Test 4: Infinite Loop & Timeout Enforcement (BR-03 Safeguard)
  console.log('\n▶ [Test 4] Timeout Enforcement on Infinite Loop (2 seconds limit):');
  const res4 = await sandboxService.runCode({
    language: 'python',
    code: `
import time
print("Loop started...")
while True:
    time.sleep(0.1)
`,
    timeoutMs: 2000,
  });
  console.log('   Result:', res4);
  console.log('   Pass:', res4.timedOut === true ? '✅ SUCCESS (Timeout caught cleanly)' : '❌ FAILED');
  console.log('----------------------------------------------------');

  // Test 5: Network Isolation Check (Preventing outbound socket requests)
  console.log('\n▶ [Test 5] Network Isolation Check (Preventing outbound requests):');
  const res5 = await sandboxService.runCode({
    language: 'python',
    code: `
import socket
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(1)
    s.connect(("8.8.8.8", 53))
    print("NETWORK_CONNECTED")
except Exception as e:
    print("NETWORK_ISOLATED")
`,
    timeoutMs: 5000,
  });
  console.log('   Result:', res5);
  console.log('   Pass:', res5.stdout.includes('NETWORK_ISOLATED') ? '✅ SUCCESS (Network is disabled)' : '❌ FAILED');
  console.log('----------------------------------------------------');

  console.log('\n🏁 ALL DOCKER SANDBOX TESTS FINISHED!\n');
}

testSandboxRunner().catch(console.error);
