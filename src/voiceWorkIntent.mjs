export function voiceWorkIntent(words){
 const s=String(words||'').trim();
 for(const command of ['stop','pause','resume']){
  if(new RegExp('\\b'+command+'(?:\\s+(?:my|the|this))?\\s+(?:logging|timer|work|tracking)\\b','i').test(s))return {command,title:''};
 }
 const match=s.match(/\b(?:work(?:ing)? on|start logging(?: time)? (?:for|on)|start (?:the )?timer for|log (?:time )?(?:for|on))\s+(.+)/i);
 if(!match)return null;
 const title=match[1].replace(/\s+(?:right now|now)[.!?]*$/i,'').replace(/[.!?]+$/,'').trim();
 return {command:'start',title:/^(?:the )?system$/i.test(title)?'Work on enLIGHTen OS':title};
}
