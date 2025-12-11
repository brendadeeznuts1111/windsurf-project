// Run the enhanced test suite
const runner = new EnhancedTestRunner();
runner.runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});