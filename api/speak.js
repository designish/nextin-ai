import OpenAI from 'openai';

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:'OPENAI_API_KEY is not configured'});
  const {text,language='en-IN'}=req.body||{};
  if(!text) return res.status(400).json({error:'No text provided'});
  try{
    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
    const instructions=String(language).startsWith('hi')
      ? 'Speak in natural, clear Indian Hindi. Keep the vocabulary simple and conversational. Use a calm professional tone and a slightly slower pace.'
      : String(language).startsWith('mr')
      ? 'Speak in natural conversational Marathi as spoken in Maharashtra. Keep it clear, warm, professional and slightly slower than normal speech.'
      : 'Speak in clear, neutral Indian English. Calm professional voice, slightly slower conversational pace, and natural pronunciation of Indian names, cities and job titles. Avoid exaggerated American or British pronunciation.';

    const audio=await client.audio.speech.create({
      model:'gpt-4o-mini-tts',
      voice:'marin',
      input:String(text).slice(0,3500),
      instructions
    });
    const buffer=Buffer.from(await audio.arrayBuffer());
    res.setHeader('Content-Type','audio/mpeg');
    res.setHeader('Cache-Control','no-store');
    return res.status(200).send(buffer);
  }catch(e){
    console.error(e);
    return res.status(500).json({error:e?.message||'Speech generation failed'});
  }
}
