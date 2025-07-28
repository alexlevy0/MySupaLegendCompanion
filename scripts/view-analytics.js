// scripts/view-analytics.js
// Script pour ouvrir le dernier rapport analytics généré

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function viewLatestAnalytics() {
  console.log('👀 Opening latest MyCompanion analytics report...');
  
  try {
    const exportsDir = path.join(process.cwd(), 'exports');
    
    if (!fs.existsSync(exportsDir)) {
      console.log('❌ No exports directory found. Run "npm run analytics:export" first.');
      return;
    }
    
    // Trouver le fichier HTML le plus récent
    const files = fs.readdirSync(exportsDir)
      .filter(file => file.startsWith('mycompanion-report-') && file.endsWith('.html'))
      .map(file => ({
        name: file,
        path: path.join(exportsDir, file),
        time: fs.statSync(path.join(exportsDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    if (files.length === 0) {
      console.log('❌ No HTML reports found. Run "npm run analytics:export" first.');
      return;
    }
    
    const latestReport = files[0];
    console.log(`📊 Opening: ${latestReport.name}`);
    
    // Ouvrir le fichier dans le navigateur par défaut
    const command = process.platform === 'win32' ? 'start' : 
                   process.platform === 'darwin' ? 'open' : 'xdg-open';
    
    exec(`${command} "${latestReport.path}"`, (error) => {
      if (error) {
        console.log('❌ Could not open browser automatically.');
        console.log(`🔗 Manual link: file://${latestReport.path}`);
      } else {
        console.log('✅ Report opened in your default browser!');
      }
    });
    
  } catch (error) {
    console.error('❌ Error opening analytics report:', error);
  }
}

if (require.main === module) {
  viewLatestAnalytics();
}

module.exports = { viewLatestAnalytics };