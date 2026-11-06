import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { NewsletterSubscriber } from "@/models";
import { rateLimit } from "@/lib/rate-limit";
const input=z.object({email:z.email().max(254)});
export async function POST(request:Request){try{if(!(await rateLimit(request,"newsletter",4,60*60*1000)))return NextResponse.json({error:"Please try again later."},{status:429});const contentType=request.headers.get("content-type")||"";let raw:unknown;if(contentType.includes("application/json"))raw=await request.json();else{const form=await request.formData();raw={email:form.get("email")};}const parsed=input.safeParse(raw);if(!parsed.success)return NextResponse.json({error:"Enter a valid email address."},{status:400});await connectDb();await NewsletterSubscriber.updateOne({email:parsed.data.email.toLowerCase()},{$set:{active:true}},{upsert:true});if(!contentType.includes("application/json"))return NextResponse.redirect(new URL("/?subscribed=1#newsletter",request.url),303);return NextResponse.json({ok:true});}catch(error){console.error("Newsletter signup failed",error);return NextResponse.json({error:"Signup is temporarily unavailable."},{status:503});}}
