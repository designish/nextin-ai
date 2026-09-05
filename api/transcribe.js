import OpenAI from 'openai';
import { formidable } from 'formidable';
import fs from 'fs';

export const config={api:{bodyParser:false}};

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:'OPENAI_API_KEY is not configured'});

  const form=formidable({maxFileSize:12*1024*1024,keepExtensions:true});
  form.parse(req,async(err,fields,files)=>{
    if(err) return res.status(400).json({error:'Could not read audio upload'});
    const audio=Array.isArray(files.audio)?files.audio[0]:files.audio;
    if(!audio) return res.status(400).json({error:'No audio received'});
    const languageRaw=Array.isArray(fields.language)?fields.language[0]:fields.language;
    try{
      const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
      const result=await client.audio.transcriptions.create({
        file:fs.createReadStream(audio.filepath),
        model:'gpt-4o-mini-transcribe',
        ...(languageRaw?{language:String(languageRaw)}:{}),
        prompt:'Professional conversation in India about retirement, careers, consulting, mentoring, engineering, manufacturing, banking, education, NGOs, government/public-sector work, Indian employers, job titles, years, numbers and technical terms. Preserve names, numbers and Indian place names accurately.'
      });
      return res.status(200).json({text:result.text||''});
    }catch(e){
      console.error(e);
      return res.status(500).json({error:e?.message||'Transcription failed'});
    }finally{
      fs.unlink(audio.filepath,()=>{});
    }
  });
}
