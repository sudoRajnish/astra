import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { AdminActivityLog, HomepageSection } from "@/models";
const keys=["featured","arrivals","brands","newsletter","trust"] as const;
export async function GET(){try{await requireAdmin(["admin"]);await connectDb();return NextResponse.json({sections:await HomepageSection.find().sort({order:1}).lean()});}catch(error){const forbidden=error instanceof Error&&error.message==="FORBIDDEN";return NextResponse.json({error:forbidden?"You don’t have permission.":"Homepage sections unavailable."},{status:forbidden?403:503});}}
const schema=z.object({sections:z.array(z.object({key:z.enum(keys),heading:z.string().max(100).optional(),description:z.string().max(300).optional(),visible:z.boolean(),order:z.number().int().min(0)})).max(10)});
export async function PUT(request:Request){let actor;try{actor=await requireAdmin(["admin"]);}catch{return NextResponse.json({error:"You don’t have permission to manage the homepage."},{status:403});}const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Invalid homepage sections."},{status:400});try{await connectDb();await Promise.all(parsed.data.sections.map(section=>HomepageSection.updateOne({key:section.key},{$set:section},{upsert:true})));await AdminActivityLog.create({actor:actor.id,actorName:actor.name,action:"homepage.sections_updated",entity:"HomepageSection",changes:parsed.data.sections});return NextResponse.json({ok:true});}catch(error){console.error("Homepage settings update failed",error);return NextResponse.json({error:"Unable to save homepage sections."},{status:503});}}
