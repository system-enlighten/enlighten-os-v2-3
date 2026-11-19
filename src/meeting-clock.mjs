export function meetingClock(value){
 const text=String(value??'').trim();if(!text)return '';
 const m=text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap]m)?$/i);if(m){let h=Number(m[1]);if(Number(m[2])>59||h>(m[3]?12:23)||m[3]&&h<1)return '';if(m[3])h=h%12+(m[3].toLowerCase()==='pm'?12:0);return String(h).padStart(2,'0')+':'+m[2]}
 if(/^\d{4}-\d{2}-\d{2}T/.test(text)){if(/^18\d{2}|^1900/.test(text)&&/[+-]\d{2}:\d{2}$/.test(text))return meetingClock(text.slice(11,16));const stamp=Date.parse(text);if(Number.isFinite(stamp))return new Date(stamp).toLocaleTimeString('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hourCycle:'h23'})}
 return '';
}
export function displayMeetingClock(value){const clock=meetingClock(value);if(!clock)return '';const [h,m]=clock.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h<12?'am':'pm'}`;}
