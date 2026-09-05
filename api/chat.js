import OpenAI from 'openai';

const opportunities = [
  {id:1,title:'Manufacturing Process Advisor',org:'Kavach Components',location:'Pune',mode:'Hybrid',type:'Consultancy',hours:8,skills:['vendor management','operations','project management','engineering','process improvement']},
  {id:2,title:'Engineering Mentor',org:'ForgeWorks Accelerator',location:'Mumbai',mode:'Hybrid',type:'Mentoring',hours:4,skills:['engineering','mentoring','leadership','project management']},
  {id:3,title:'Technical Review Consultant',org:'InfraAxis Projects',location:'Mumbai',mode:'Hybrid',type:'Consultancy',hours:10,skills:['engineering','technical review','vendor management','project management']},
  {id:4,title:'Guest Faculty — Engineering Practice',org:'Western Institute of Technology',location:'Mumbai',mode:'On-site',type:'Teaching',hours:6,skills:['engineering','teaching','mentoring','leadership']},
  {id:5,title:'SME Credit Advisor',org:'Meridian Capital Services',location:'Mumbai',mode:'Hybrid',type:'Consultancy',hours:10,skills:['sme lending','credit','risk','banking','client advisory']},
  {id:6,title:'Founder Finance Mentor',org:'Launchbay Foundation',location:'Remote',mode:'Remote',type:'Mentoring',hours:4,skills:['finance','mentoring','banking','client advisory']},
  {id:7,title:'School Leadership Advisor',org:'Aaroh Learning Network',location:'Mumbai',mode:'Hybrid',type:'Consultancy',hours:8,skills:['school administration','teacher training','leadership','education','parent communication']},
  {id:8,title:'Teacher Mentor',org:'ShikshaBridge',location:'Remote',mode:'Remote',type:'Mentoring',hours:5,skills:['teaching','teacher training','mentoring','education']},
  {id:9,title:'Operations Advisor',org:'UrbanCart Labs',location:'Bengaluru',mode:'Remote',type:'Advisory',hours:6,skills:['operations','process improvement','leadership','vendor management']},
  {id:10,title:'People & Culture Advisor',org:'Nava People Systems',location:'Delhi NCR',mode:'Remote',type:'Consultancy',hours:6,skills:['hr','people management','leadership','training']},
  {id:11,title:'NGO Finance Volunteer',org:'SevaSetu Foundation',location:'Remote',mode:'Remote',type:'Volunteering',hours:4,skills:['finance','accounting','governance','mentoring']},
  {id:12,title:'Part-time Commerce Faculty',org:'VidyaPath College',location:'Pune',mode:'On-site',type:'Part-time',hours:12,skills:['finance','teaching','accounting']},
  {id:13,title:'Sales Excellence Mentor',org:'MarketSpring Collective',location:'Mumbai',mode:'Hybrid',type:'Mentoring',hours:5,skills:['sales','leadership','client management','mentoring']},
  {id:14,title:'Administration Advisor',org:'CareGrid Health',location:'Mumbai',mode:'Hybrid',type:'Part-time',hours:15,skills:['administration','operations','people management']},
  {id:15,title:'Community Programme Volunteer',org:'Sahyog Network',location:'Navi Mumbai',mode:'On-site',type:'Volunteering',hours:5,skills:['community','coordination','mentoring','teaching']}
];

const system = `You are NextIn, a conversational opportunity agent for experienced professionals entering or after retirement. Be warm, concise, respectful, and never patronising. Your job is to understand a person's past experience and what they want now, uncover transferable strengths, and help them find relevant ways to work, consult, mentor, teach, advise, freelance or volunteer.

Important behaviour:
- remember what the user already said and never repeat answered questions
- ask at most one useful follow-up question at a time
- if the user knows what they want, move quickly
- if unsure, use guided discovery rather than a questionnaire
- answer in the user's language: English, Hindi, Marathi, or natural Hinglish when they mix languages
- never invent employers, dates, qualifications, achievements, or opportunities
- distinguish explicit facts from inferred strengths; inferred strengths need confirmation
- if no good match exists, say so honestly
- when the user is interested in an opportunity, draft a 100–150 word professional introduction using only confirmed facts

You may recommend ONLY these opportunity IDs: ${JSON.stringify(opportunities)}

Return VALID JSON ONLY in this exact shape:
{"reply":"","profile":{"name":"","previous_role":"","years_experience":null,"domains":[],"explicit_skills":[],"inferred_skills_to_confirm":[],"achievements":[],"preferred_opportunity_types":[],"weekly_availability":null,"preferred_location":"","work_mode":"","languages":[],"notes":""},"recommended_opportunity_ids":[],"stage":"discover","needs_user_confirmation":false}`;

function parseJson(text){
  try{return JSON.parse(text)}catch{}
  const m=text.match(/\{[\s\S]*\}/);
  if(m){try{return JSON.parse(m[0])}catch{}}
  return null;
}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:'OPENAI_API_KEY is not configured'});
  try{
    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
    const {messages=[],profile={}}=req.body||{};
    const history=messages.slice(-24).map(m=>`${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const response=await client.responses.create({
      model:process.env.OPENAI_MODEL||'gpt-4.1-mini',
      instructions:system,
      input:`CURRENT PROFILE:\n${JSON.stringify(profile)}\n\nCONVERSATION:\n${history}\n\nReturn the required JSON only.`
    });
    const parsed=parseJson(response.output_text||'');
    if(!parsed) return res.status(500).json({error:'Unexpected AI response'});
    return res.status(200).json(parsed);
  }catch(err){
    console.error(err);
    return res.status(500).json({error:err?.message||'AI request failed'});
  }
}
