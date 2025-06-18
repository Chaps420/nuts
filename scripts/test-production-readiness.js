/**
 * Production Readiness Test Script for $NUTS Sports Pick'em
 * Tests all critical systems before production deployment
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class ProductionReadinessTest {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'pass': '✅',
      'fail': '❌',
      'warn': '⚠️',
      'info': 'ℹ️'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    this.results.tests.push({
      timestamp,
      message,
      type
    });
    
    if (type === 'pass') this.results.passed++;
    if (type === 'fail') this.results.failed++;
    if (type === 'warn') this.results.warnings++;
  }

  async testFileStructure() {
    this.log('Testing file structure...', 'info');
    
    const requiredFiles = [
      'index.html',
      'daily-contest.html',
      'nft-contest.html',
      'package.json',
      'config/config.js',
      'src/css/styles.css',
      'src/js/main.js',
      'src/js/wallet.js',
      'src/js/contests.js'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        this.log(`Required file exists: ${file}`, 'pass');
      } else {
        this.log(`Missing required file: ${file}`, 'fail');
      }
    }
  }

  async testEnvironmentConfig() {
    this.log('Testing environment configuration...', 'info');
    
    const envPath = path.join(process.cwd(), '.env');
    const envExamplePath = path.join(process.cwd(), '.env.example');
    
    if (fs.existsSync(envExamplePath)) {
      this.log('Environment template (.env.example) exists', 'pass');
    } else {
      this.log('Missing .env.example template', 'fail');
    }
    
    if (fs.existsSync(envPath)) {
      this.log('Environment file (.env) exists', 'pass');
      
      // Check for placeholder values
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('your_api_key') || envContent.includes('your_project_id')) {
        this.log('Environment file contains placeholder values - needs production config', 'warn');
      } else {
        this.log('Environment file appears configured', 'pass');
      }
    } else {
      this.log('No .env file found - needs configuration', 'warn');
    }
  }

  async testDependencies() {
    this.log('Testing dependencies...', 'info');
    
    const packagePath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const deps = Object.keys(packageJson.dependencies || {});
      
      this.log(`Found ${deps.length} dependencies: ${deps.join(', ')}`, 'pass');
      
      // Check for critical dependencies
      const criticalDeps = ['xrpl', 'firebase'];
      for (const dep of criticalDeps) {
        if (deps.includes(dep)) {
          this.log(`Critical dependency found: ${dep}`, 'pass');
        } else {
          this.log(`Missing critical dependency: ${dep}`, 'fail');
        }
      }
    } else {
      this.log('package.json not found', 'fail');
    }
  }

  async testConfigurationFile() {
    this.log('Testing configuration file...', 'info');
    
    const configPath = path.join(process.cwd(), 'config', 'config.js');
    if (fs.existsSync(configPath)) {
      this.log('Configuration file exists', 'pass');
      
      const configContent = fs.readFileSync(configPath, 'utf8');
      
      // Check for key configuration sections
      const sections = ['xrpl', 'contest', 'firebase', 'oddsAPI'];
      for (const section of sections) {
        if (configContent.includes(section)) {
          this.log(`Configuration section found: ${section}`, 'pass');
        } else {
          this.log(`Missing configuration section: ${section}`, 'warn');
        }
      }
    } else {
      this.log('Configuration file missing', 'fail');
    }
  }

  async testHTMLPages() {
    this.log('Testing HTML pages...', 'info');
    
    const pages = [
      'index.html',
      'daily-contest.html', 
      'nft-contest.html',
      'leaderboard.html',
      'how-it-works.html',
      'buy-nuts.html'
    ];

    for (const page of pages) {
      const pagePath = path.join(process.cwd(), page);
      if (fs.existsSync(pagePath)) {
        const content = fs.readFileSync(pagePath, 'utf8');
        
        // Check for basic HTML structure
        if (content.includes('<!DOCTYPE html>') && content.includes('<html')) {
          this.log(`Valid HTML structure: ${page}`, 'pass');
        } else {
          this.log(`Invalid HTML structure: ${page}`, 'fail');
        }
        
        // Check for script includes
        if (content.includes('src/js/')) {
          this.log(`JavaScript includes found: ${page}`, 'pass');
        } else {
          this.log(`No JavaScript includes: ${page}`, 'warn');
        }
      } else {
        this.log(`Page missing: ${page}`, 'fail');
      }
    }
  }

  async testJavaScriptModules() {
    this.log('Testing JavaScript modules...', 'info');
    
    const modules = [
      'main.js',
      'wallet.js',
      'contests.js',
      'odds-api.js',
      'firebase.js'
    ];

    for (const module of modules) {
      const modulePath = path.join(process.cwd(), 'src', 'js', module);
      if (fs.existsSync(modulePath)) {
        const content = fs.readFileSync(modulePath, 'utf8');
        
        // Check for class or function definitions
        if (content.includes('class ') || content.includes('function ') || content.includes('export')) {
          this.log(`Valid JavaScript module: ${module}`, 'pass');
        } else {
          this.log(`Questionable JavaScript module: ${module}`, 'warn');
        }
      } else {
        this.log(`JavaScript module missing: ${module}`, 'fail');
      }
    }
  }

  async testCSSFiles() {
    this.log('Testing CSS files...', 'info');
    
    const cssPath = path.join(process.cwd(), 'src', 'css', 'styles.css');
    if (fs.existsSync(cssPath)) {
      const content = fs.readFileSync(cssPath, 'utf8');
      const lines = content.split('\n').length;
      
      this.log(`CSS file exists with ${lines} lines`, 'pass');
      
      // Check for responsive design
      if (content.includes('@media') || content.includes('responsive')) {
        this.log('Responsive design CSS found', 'pass');
      } else {
        this.log('No responsive design detected', 'warn');
      }
      
      // Check for dark theme
      if (content.includes('dark') || content.includes('#1A1A1A') || content.includes('#0A0A0A')) {
        this.log('Dark theme styling found', 'pass');
      } else {
        this.log('No dark theme detected', 'warn');
      }
    } else {
      this.log('Main CSS file missing', 'fail');
    }
  }

  async testDocumentation() {
    this.log('Testing documentation...', 'info');
    
    const docs = [
      'README.md',
      'docs/deployment-guide.md',
      'docs/firebase-schema.md'
    ];

    for (const doc of docs) {
      const docPath = path.join(process.cwd(), doc);
      if (fs.existsSync(docPath)) {
        const content = fs.readFileSync(docPath, 'utf8');
        const wordCount = content.split(/\s+/).length;
        
        this.log(`Documentation exists: ${doc} (${wordCount} words)`, 'pass');
      } else {
        this.log(`Documentation missing: ${doc}`, 'warn');
      }
    }
  }

  async testExternalConnectivity() {
    this.log('Testing external service connectivity...', 'info');
    
    const services = [
      { name: 'The Odds API', url: 'https://api.the-odds-api.com' },
      { name: 'XRP Cafe', url: 'https://xrp.cafe' },
      { name: 'XRPL Testnet', url: 'https://s.altnet.rippletest.net' }
    ];

    for (const service of services) {
      try {
        await this.testURL(service.url);
        this.log(`${service.name} is accessible`, 'pass');
      } catch (error) {
        this.log(`${service.name} connectivity issue: ${error.message}`, 'warn');
      }
    }
  }

  testURL(url) {
    return new Promise((resolve, reject) => {
      const request = https.get(url, { timeout: 5000 }, (response) => {
        if (response.statusCode >= 200 && response.statusCode < 400) {
          resolve(response.statusCode);
        } else {
          reject(new Error(`HTTP ${response.statusCode}`));
        }
      });
      
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Timeout'));
      });
      
      request.on('error', reject);
    });
  }

  async generateReport() {
    const reportPath = path.join(process.cwd(), 'production-readiness-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.tests.length,
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        readinessScore: Math.round((this.results.passed / this.results.tests.length) * 100)
      },
      details: this.results.tests,
      recommendations: this.generateRecommendations()
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`Report saved to: ${reportPath}`, 'info');
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.failed > 0) {
      recommendations.push('❌ Fix all failed tests before production deployment');
    }
    
    if (this.results.warnings > 3) {
      recommendations.push('⚠️ Address warning items for optimal production performance');
    }
    
    if (this.results.passed > this.results.failed + this.results.warnings) {
      recommendations.push('✅ Platform shows good readiness for production deployment');
    }
    
    recommendations.push('🚀 Next steps: Configure production environment variables');
    recommendations.push('🔧 Test with real API keys on staging environment');
    recommendations.push('📊 Set up monitoring and analytics before launch');
    
    return recommendations;
  }

  async runAllTests() {
    this.log('🚀 Starting Production Readiness Tests for $NUTS Sports Pick\'em', 'info');
    
    await this.testFileStructure();
    await this.testEnvironmentConfig();
    await this.testDependencies();
    await this.testConfigurationFile();
    await this.testHTMLPages();
    await this.testJavaScriptModules();
    await this.testCSSFiles();
    await this.testDocumentation();
    await this.testExternalConnectivity();
    
    const report = await this.generateReport();
    
    this.log('📊 Production Readiness Test Complete', 'info');
    this.log(`Readiness Score: ${report.summary.readinessScore}%`, 'info');
    
    if (report.summary.readinessScore >= 80) {
      this.log('🎉 Platform is ready for production deployment!', 'pass');
    } else if (report.summary.readinessScore >= 60) {
      this.log('⚠️ Platform needs some improvements before production', 'warn');
    } else {
      this.log('❌ Platform requires significant work before production', 'fail');
    }
    
    return report;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new ProductionReadinessTest();
  tester.runAllTests().then((report) => {
    console.log('\n📋 Recommendations:');
    report.recommendations.forEach(rec => console.log(`  ${rec}`));
    
    process.exit(report.summary.failed > 0 ? 1 : 0);
  }).catch((error) => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = ProductionReadinessTest;
