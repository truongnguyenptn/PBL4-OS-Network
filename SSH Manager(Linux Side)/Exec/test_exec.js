const { exec } = require('child_process');

const username = 'user02';
const newPassword = 'user02';

exec(`echo '${newPassword}\n${newPassword}' | passwd ${username}`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
});