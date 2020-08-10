const _ = require('underscore');
const { execSync } = require('child_process');

for (const name in _) {
  const command = 'cd test; grep ' + name + '.' ;  
  const result = execSync(command).toString();
}

