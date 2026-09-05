import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const upload = multer({ dest: path.join(os.tmpdir(), "nextin-audio") });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const MODEL = process.env.OPENAI_MODEL || "gpt-5";

const opportunities = [
{id:1,title:"Manufacturing Process Advisor",org:"Kavach Components",location:"Pune",mode:"Hybrid",type:"Consultancy",hours:8,duration:"3 months",skills:["vendor management","operations","project management","engineering","process improvement"],minExp:15},
{id:2,title:"Engineering Mentor",org:"ForgeWorks Accelerator",location:"Mumbai",mode:"Hybrid",type:"Mentoring",hours:4,duration:"6 months",skills:["engineering","mentoring","leadership","project management"],minExp:12},
{id:3,title:"Technical Review Consultant",org:"InfraAxis Projects",location:"Mumbai",mode:"Hybrid",type:"Consultancy",hours:10,duration:"4 months",skills:["engineering","technical review","vendor management","project management"],minExp:18},
{id:4,title:"Guest Faculty — Engineering Practice",org:"Western Institute of Technology",location:"Mumbai",mode:"On-site",type:"Teaching",hours:6,duration:"Semester",skills:["engineering","teaching","mentoring","leadership"],minExp:10},
{id:5,title:"SME Credit Advisor",org:"Meridian Capital Services",location:"Mumbai",mode:"Hybrid",type:"Consultancy",hours:10,duration:"4 months",skills:["sme lending","credit","risk","banking","client advisory"],minExp:15},
{id:6,title:"Founder Finance Mentor",org:"Launchbay Foundation",location:"Remote",mode:"Remote",type:"Mentoring",hours:4,duration:"Flexible",skills:["finance","mentoring","banking","client advisory"],minExp:10},
{id:7,title:"School Leadership Advisor",org:"Aaroh Learning Network",location:"Mumbai",mode:"Hybrid",type:"Consultancy",hours:8,duration:"5 months",skills:["school administration","teacher training","leadership","education","parent communication"],minExp:12},
{id:8,title:"Teacher Mentor",org:"ShikshaBridge",location:"Remote",mode:"Remote",type:"Mentoring",hours:5,duration:"6 months",skills:["teaching","teacher training","mentoring","education"],minExp:8},
{id:9,title:"Operations Advisor",org:"UrbanCart Labs",location:"Bengaluru",mode:"Remote",type:"Advisory",hours:6,duration:"3 months",skills:["operations","process improvement","leadership","vendor management"],minExp:12},
{id:10,title:"People & Culture Advisor",org:"Nava People Systems",location:"Delhi NCR",mode:"Remote",type:"Consultancy",hours:6,duration:"3 months",skills:["hr","people management","leadership","training"],minExp:12},
{id:11,title:"NGO Finance Volunteer",org:"SevaSetu Foundation",location:"Remote",mode:"Remote",type:"Volunteering",hours:4,duration:"Flexible",skills:["finance","accounting","governance","mentoring"],minExp:5},
{id:12,title:"Part-time Commerce Faculty",org:"VidyaPath College",location:"Pune",mode:"On-site",type:"Part-time",hours:12,duration:"Academic year",skills:["finance","teaching","accounting"],minExp:8},
{id:13,title:"Sales Excellence Mentor",org:"MarketSpring Collective",location:"Mumbai",mode:"Hybrid",type:"Mentoring",hours:5,duration:"4 months",skills:["sales","leadership","client management","mentoring"],minExp:10},
{id:14,title:"Administration Advisor",org:"CareGrid Health",location:"Mumbai",mode:"Hybrid",type:"Part-time",hours:15,duration:"6 months",skills:["administration","operations","people management"],minExp:10},
{id:15,title:"Community Programme Volunteer",org:"Sahyog Network",location:"Navi Mumbai",mode:"On-site",type:"Volunteering",hours:5,duration:"Flexible",skills:["community","coordination","mentoring","teaching"],minExp:0}
];

function safeJson(txt){
  try{return JSON.parse(txt)}catch{}
  const m=txt.match(/\{[\s\S]*\}/);
  if(m) try{return JSON.parse(m[0])}catch{}
  return null;
}

const systemPrompt = `
You are NextIn, an intelligent conversational opportunity agent for experienced professionals who are retiring, recently retired, or choosing a new way to contribute.

Your goal is not merely to list jobs. Help the user explain their experience, uncover useful expertise without exaggerating, clarify what they want now, find relevant paid or unpaid opportunities, understand why something fits, prepare a concise introduction, and move toward a real connection.

Behave like a high-quality context-aware AI assistant while staying focused on this domain.

Tone:
- respectful, warm, professional, concise
- never patronising
- never call the user "elderly" or "senior citizen" unless they use the term
- never imply they are bad with technology
- ask one useful question at a time
- never repeat a question already answered
- if the person knows exactly what they want, move quickly
- if they don't know, use guided discovery
- answer naturally in English, Hindi, or Marathi depending on the user's language
- use natural Indian Hindi/Marathi, not literal machine translation

Trust:
- distinguish explicit facts from inferred skills
- never invent employers, dates, qualifications, certifications, achievements, or work history
- inferred strengths must be suggested for confirmation
- surface conflicts instead of silently choosing
- if there is no strong opportunity, say so

Continuously maintain:
name, previous_role, years_experience, domains, explicit_skills, inferred_skills_to_confirm,
achievements, preferred_opportunity_types, weekly_availability, preferred_location, work_mode,
languages, notes.

Demo opportunities:
${JSON.stringify(opportunities)}

Recommend only IDs from this list. Explain why. If none is suitable, suggest broadening preferences or making expertise discoverable.

If the user wants to apply/connect, prepare a short 100–150 word introduction using only confirmed facts.

Return valid JSON only:
{
 "reply":"",
 "profile":{
   "name":"",
   "previous_role":"",
   "years_experience":null,
   "domains":[],
   "explicit_skills":[],
   "inferred_skills_to_confirm":[],
   "achievements":[],
   "preferred_opportunity_types":[],
   "weekly_availability":null,
   "preferred_location":"",
   "work_mode":"",
   "languages":[],
   "notes":""
 },
 "recommended_opportunity_ids":[],
 "stage":"discover",
 "needs_user_confirmation":false
}
`;

app.get("/api/health",(req,res)=>res.json({ok:true,ai:!!client,model:MODEL}));

app.post("/api/chat", async (req,res)=>{
  try{
    if(!client) return res.status(503).json({error:"OPENAI_API_KEY is not configured."});
    const {messages=[],profile={}}=req.body;
    const history=messages.slice(-20).map(m=>`${m.role.toUpperCase()}: ${m.content}`).join("\n");
    const input=`CURRENT PROFILE:\n${JSON.stringify(profile)}\n\nCONVERSATION:\n${history}\n\nReturn the required JSON only.`;
    const response=await client.responses.create({model:MODEL,instructions:systemPrompt,input});
    const parsed=safeJson(response.output_text);
    if(!parsed) return res.status(500).json({error:"Unexpected AI response.",raw:response.output_text});
    res.json(parsed);
  }catch(e){console.error(e);res.status(500).json({error:e?.message||"AI request failed"});}
});

app.post("/api/transcribe", upload.single("audio"), async (req,res)=>{
  try{
    if(!client) return res.status(503).json({error:"OPENAI_API_KEY is not configured."});
    if(!req.file) return res.status(400).json({error:"No audio received"});
    const lang=req.body.language||undefined;
    const result=await client.audio.transcriptions.create({
      file:fs.createReadStream(req.file.path),
      model:"gpt-4o-mini-transcribe",
      ...(lang?{language:lang}:{}),
      prompt:"Professional conversation in India about careers, retirement, consulting, teaching, mentoring, engineering, banking, finance, NGOs, employers, job titles, years and technical words. Preserve names and numbers accurately."
    });
    fs.unlink(req.file.path,()=>{});
    res.json({text:result.text});
  }catch(e){
    if(req.file) fs.unlink(req.file.path,()=>{});
    console.error(e);res.status(500).json({error:e?.message||"Transcription failed"});
  }
});

app.post("/api/speak", async (req,res)=>{
  try{
    if(!client) return res.status(503).json({error:"OPENAI_API_KEY is not configured."});
    const {text,language="en-IN"}=req.body;
    if(!text) return res.status(400).json({error:"No text"});
    const instructions=language.startsWith("hi")
      ?"Speak in natural, clear Indian Hindi at a comfortable pace. Professional and conversational."
      :language.startsWith("mr")
      ?"Speak in natural, clear Marathi as spoken in Maharashtra at a comfortable pace. Professional and conversational."
      :"Speak in clear natural Indian English at a comfortable pace. Professional, calm, and not exaggerated.";
    const audio=await client.audio.speech.create({
      model:"gpt-4o-mini-tts",voice:"marin",input:text.slice(0,3800),instructions
    });
    const buf=Buffer.from(await audio.arrayBuffer());
    res.setHeader("Content-Type","audio/mpeg");res.send(buf);
  }catch(e){console.error(e);res.status(500).json({error:e?.message||"Speech failed"});}
});

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(process.env.PORT||3000,()=>console.log(`NextIn running at http://localhost:${process.env.PORT||3000}`));
