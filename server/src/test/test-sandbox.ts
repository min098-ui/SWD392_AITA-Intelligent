import { sandboxService } from '../modules/grading/sandbox.service';

async function testSandboxRunner() {
  console.log('====================================================');
  console.log('🧪 TESTING DOCKER SANDBOX RUNNER (THÀNH VIÊN 2 - BR-03)');
  console.log('====================================================\n');

  // Test 1: Node.js Basic Output
  console.log('▶ [Test 1] Node.js Basic Execution:');
  const res1 = await sandboxService.runCode({
    language: 'javascript',
    code: 'console.log("Hello from AITA Docker Sandbox! Node.js " + process.version);',
    timeoutMs: 10000,
  });
  console.log('   Result:', res1);
  console.log('   Pass:', res1.stdout.includes('Hello from AITA Docker Sandbox!') ? '✅ SUCCESS' : '❌ FAILED');
  console.log('----------------------------------------------------');

  // Test 2: Node.js Stdin & Algorithmic Test (Two Sum)
  console.log('\n▶ [Test 2] Node.js Stdin & Algorithmic Test (Two Sum):');
  const res2 = await sandboxService.runCode({
    language: 'javascript',
    code: `
const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
const a = parseInt(input[0], 10);
const b = parseInt(input[1], 10);
console.log("SUM = " + (a + b));
`,
    inputData: '125 75',
    timeoutMs: 10000,
  });
  console.log('   Result:', res2);
  console.log('   Pass:', res2.stdout.trim() === 'SUM = 200' ? '✅ SUCCESS' : '❌ FAILED');
  console.log('----------------------------------------------------');

  // Test 3: JavaScript Arithmetic Execution
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
    language: 'javascript',
    code: `
console.log("Loop started...");
while (true) {
  // Infinite spin triggers BR-03 Watchdog Timeout
}
`,
    timeoutMs: 2000,
  });
  console.log('   Result:', res4);
  console.log('   Pass:', res4.timedOut === true ? '✅ SUCCESS (Timeout caught cleanly)' : '❌ FAILED');
  console.log('----------------------------------------------------');

  // Test 5: Network Isolation Check (Preventing outbound socket requests)
  console.log('\n▶ [Test 5] Network Isolation Check (Preventing outbound requests):');
  const res5 = await sandboxService.runCode({
    language: 'javascript',
    code: `
const net = require('net');
const socket = net.createConnection({ host: '8.8.8.8', port: 53, timeout: 1000 });
socket.on('connect', () => {
  console.log('NETWORK_CONNECTED');
  socket.destroy();
});
socket.on('error', () => {
  console.log('NETWORK_ISOLATED');
});
socket.on('timeout', () => {
  console.log('NETWORK_ISOLATED');
  socket.destroy();
});
`,
    timeoutMs: 5000,
  });
  console.log('   Result:', res5);
  console.log('   Pass:', res5.stdout.includes('NETWORK_ISOLATED') ? '✅ SUCCESS (Network is disabled)' : '❌ FAILED');
  console.log('----------------------------------------------------');

  console.log('\n🏁 ALL DOCKER SANDBOX TESTS FINISHED!\n');
}

testSandboxRunner().catch(console.error);
