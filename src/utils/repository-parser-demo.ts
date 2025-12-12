#!/usr/bin/env bun

/**
 * 🏗️ Repository.toml Enhanced Parser - Demo & Testing
 *
 * Demonstrates the enhanced Repository.toml parsing capabilities
 * with PR metadata, domain scoping, and comprehensive tagging.
 */

import { RepositoryParser } from './repository-parser';

// Create a demo parser with sample enhanced data
function createDemoData() {
  return {
    'http.server.bun-serve-advanced': {
      '#COMMENT': 'Enterprise HTTP/2 server with TLS termination',
      '#REVIEWED-BY': '@bun-team-lead @security-team',
      '#COMMIT': 'a1b2c3d4e5f6',
      'TYPE': {
        specification: 'EX021',
        validation: '@HTTP_SERVER',
        implementation: 'enterprise-grade',
        '#TAGS': 'performance, security, websocket-support'
      },
      'META': {
        'PROPERTY': {
          tls: { version: '1.3', cipher_suites: ['TLS_AES_128_GCM_SHA256'] },
          '#COMMENT': 'Using modern cipher suites only',
          '#STATUS': 'pr-merged #1234',
          '#TAGS': 'security, compliance'
        }
      }
    },
    'build.bundler.bun-build-pipeline': {
      '#COMMENT': 'Complete bundler pipeline with plugin system',
      '#STATUS': 'pr-approved #1241',
      '#TAGS': 'build-system, v1.3.5, plugin-api',
      'TYPE': {
        specification: 'EX022',
        implementation: 'production',
        '#TAGS': 'bundler, plugin, performance'
      }
    },
    'security.cryptography.bun-crypto-suite': {
      '#COMMENT': 'NIST/FIPS 140-2 compliant crypto operations',
      '#AUDIT': 'PASSED - @security-audit-team 2024-12-11',
      '#STATUS': 'pr-merged #1249',
      '#TAGS': 'security-critical, audited, v1.3.4',
      'TYPE': {
        specification: 'EX027',
        implementation: 'fips-compliant',
        '#TAGS': 'security, compliance, fips'
      }
    }
  };
}

async function demoEnhancedParser() {
  console.log('🏗️ Enhanced Repository.toml Parser Demo\n');
  console.log('=' .repeat(50) + '\n');

  // Create parser with demo data
  const parser = new RepositoryParser();
  // Manually inject demo data for demonstration
  (parser as any).data = createDemoData();
  (parser as any).parseSpecifications();

  console.log('📊 Enhanced Parser Capabilities:');
  console.log('=================================\n');

  // Show all specifications
  const allSpecs = parser.getAll();
  console.log(`📋 Total Specifications: ${allSpecs.length}\n`);

  allSpecs.forEach((spec, index) => {
    console.log(`${index + 1}. ${spec.spec.specification} - ${spec.domain}.${spec.scope}`);
    console.log(`   Status: ${spec.status}`);
    console.log(`   Tags: ${spec.tags.join(', ') || 'none'}`);
    if (spec.prNumber) console.log(`   PR: #${spec.prNumber}`);
    if (spec.commit) console.log(`   Commit: ${spec.commit}`);
    console.log('');
  });

  // Demonstrate querying capabilities
  console.log('🔍 Query Demonstrations:');
  console.log('========================\n');

  // Query by domain
  const httpSpecs = parser.getByDomain('http');
  console.log(`🌐 HTTP Domain Specs: ${httpSpecs.length}`);
  httpSpecs.forEach(spec => {
    console.log(`   • ${spec.spec.specification} (${spec.status})`);
  });

  // Query by tags
  const securitySpecs = parser.getByTags(['security']);
  console.log(`\n🔒 Security Tagged Specs: ${securitySpecs.length}`);
  securitySpecs.forEach(spec => {
    console.log(`   • ${spec.spec.specification} (${spec.tags.join(', ')})`);
  });

  // Query production ready
  const prodSpecs = parser.getProductionReady();
  console.log(`\n🏭 Production Ready Specs: ${prodSpecs.length}`);

  // Generate report
  const report = parser.generateReport();
  console.log(`\n📈 Report Summary:`);
  console.log(`   Total: ${report.total}`);
  console.log(`   Production Ready: ${report.productionReady}`);
  console.log(`   Security Critical: ${report.securityCritical}`);
  console.log(`   Experimental: ${report.experimental}`);

  console.log(`\n📂 Domain Distribution:`);
  Object.entries(report.byDomain).forEach(([domain, count]) => {
    console.log(`   ${domain}: ${count}`);
  });

  console.log(`\n🏷️ Tag Distribution:`);
  Object.entries(report.byTags)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .forEach(([tag, count]) => {
      console.log(`   ${tag}: ${count}`);
  });

  console.log('\n🎯 Key Features Demonstrated:');
  console.log('==============================');
  console.log('✅ PR Metadata Tracking (#1234, #1241, #1249)');
  console.log('✅ Domain Scoping (http.server, build.bundler, security.cryptography)');
  console.log('✅ Comprehensive Tagging (security-critical, audited, plugin-api)');
  console.log('✅ Status Tracking (pr-merged, pr-approved)');
  console.log('✅ Commit Hash Tracking (a1b2c3d4e5f6)');
  console.log('✅ Advanced Querying (by domain, tags, status)');
  console.log('✅ Report Generation (statistics and analytics)');
  console.log('✅ Cross-cutting Concerns (security, performance, production-ready)');

  console.log('\n🚀 Benefits of Enhanced Format:');
  console.log('===============================');
  console.log('• 🔍 **Advanced Discovery**: Find specs by tags, domains, PR status');
  console.log('• 📊 **Analytics**: Track implementation progress and coverage');
  console.log('• 🔒 **Compliance**: Security audit trails and FedRAMP compliance');
  console.log('• 👥 **Collaboration**: PR tracking and reviewer attribution');
  console.log('• 📈 **Metrics**: Performance and implementation statistics');
  console.log('• 🎯 **Filtering**: Production-ready vs experimental features');
  console.log('• 🔄 **CI/CD**: Automated validation and deployment gates');

  console.log('\n💡 Usage Examples:');
  console.log('==================');

  console.log('\n// Get all production-ready security specs');
  console.log('const secureProdSpecs = parser.query({');
  console.log('  tags: ["production-ready", "security"],');
  console.log('  excludeTags: ["experimental"]');
  console.log('});');

  console.log('\n// Get specs by PR status');
  console.log('const mergedSpecs = parser.getByPRStatus("merged");');

  console.log('\n// Get domain statistics');
  console.log('const domainStats = parser.getDomainStats();');

  console.log('\n// Generate implementation report');
  console.log('const report = parser.generateReport();');

  console.log('\n🎉 Enhanced Repository.toml Parser Demo Complete!');
  console.log('================================================');
}

// Run the demo
demoEnhancedParser().catch(console.error);