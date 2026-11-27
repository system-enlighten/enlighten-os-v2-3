import {pollDrawingMailbox} from '../server/mailbox-poller.js';
import {db} from '../server/supabase-db.js';

try {
  const [command,pageToken,...rest]=process.argv.slice(2);
  if (command!=='--once'||rest.length||pageToken&&pageToken.length>2048) {
    throw new Error('Usage: node scripts/poll-drawing-mailbox.mjs --once [page-token]');
  }
  const result=await pollDrawingMailbox({pageToken});
  console.log(JSON.stringify(result));
  if (result.failed||result.uncertain) process.exitCode=1;
} catch(error) {
  console.error(error.statusCode?error.message:'Mailbox poll failed. Check Preview configuration and worker access.');
  process.exitCode=1;
} finally {
  await db.close();
}
