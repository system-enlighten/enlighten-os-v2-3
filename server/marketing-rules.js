import {actor,failure,now} from './project-write-storage.js';

const MARKETING_FIELDS = {
  'Case study': ['title','projectId','mockupUrl','brief','decision','outcome','stage','owner','approval','portfolioUrl'],
  Relationship: ['title','contactId','organisation','role','owner','nextDate','notes'],
  Enquiry: ['title','relationshipId','caseStudyId','channel','stage','owner','nextDate','visitDate','proposalUrl','projectId','notes','contact','phone','email','area','houseNumber','projectType','siteStage','surveyUrl','latitude','longitude','designScope','designFee','milestones','architectContactId','architecturePractice','salesHistory']
};
export function buildMarketingDetails(payload) {
  const fields = MARKETING_FIELDS[payload.kind];
  if (!Object.prototype.hasOwnProperty.call(MARKETING_FIELDS,payload.kind)) throw failure('Choose a record type.');
  const details = Object.fromEntries(fields.map(key => [key,String(payload[key] || '').trim().slice(0,4000)]));
  if (!details.title) throw failure('Enter a name or title.');
  if (payload.kind === 'Case study' && !details.projectId) throw failure('Choose the source Studio project.');
  if (payload.kind === 'Case study' && ['Ready to publish','Published'].includes(details.stage) && details.approval !== 'Approved to share')
    throw failure('Confirm sharing permission before marking a case study ready or published.');
  if (payload.kind === 'Enquiry' && details.stage === 'Won' && !details.projectId)
    throw failure('Link the resulting Studio project before marking the enquiry won.');
  for (const key of ['mockupUrl','portfolioUrl','proposalUrl','surveyUrl']){
    if (details[key] && !/^https:\/\/[^\s]+$/i.test(details[key])) throw failure('Enter an HTTPS link.');
  }
  for (const key of ['visitDate','nextDate']){
    if (details[key] && !/^\d{4}-\d{2}-\d{2}$/.test(details[key])) throw failure('Choose a valid date.');
  }
  return {fields,details};
}

export function updateEnquiry(payload,details,old,user,sales) {
    if(payload.kind==='Enquiry'){
      const prior=old?old.details:{};
      const salesFields=['contact','phone','email','area','houseNumber','projectType','siteStage','surveyUrl','latitude','longitude','designScope','designFee','milestones','architectContactId','architecturePractice','salesHistory'];
      for(const key of salesFields) details[key]=prior[key]||'';
      if(sales){
        for(const key of salesFields.filter(key=>key!=='salesHistory')) details[key]=String(payload[key]||'').trim().slice(0,4000);
        if(details.designFee&&(!isFinite(Number(details.designFee))||Number(details.designFee)<0)) throw failure('Enter a valid design fee.');
      }
      const history=JSON.parse(prior.salesHistory||'[]');
      if(!old||prior.stage!==details.stage||sales&&payload.activity){
        history.push({at:now(),stage:details.stage,note:String(payload.activity||(!old?'Lead captured':'Stage updated')).slice(0,2000),by:actor(user)});
      }
      details.salesHistory=JSON.stringify(history);
    }
}
