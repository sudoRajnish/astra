import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { AdminActivityLog, Coupon } from "@/models";
const schema=z.object({active:z.boolean()});
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){let actor;try{actor=await requireAdmin(["admin"]);}catch{return NextResponse.json({error:"You don’t have permission."},{status:403});}const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Invalid coupon change."},{status:400});try{await connectDb();const{id}=await params;const coupon=await Coupon.findByIdAndUpdate(id,{$set:parsed.data},{new:true});if(!coupon)return NextResponse.json({error:"Coupon not found."},{status:404});await AdminActivityLog.create({actor:actor.id,actorName:actor.name,action:"coupon.updated",entity:"Coupon",entityId:id,changes:parsed.data});return NextResponse.json({ok:true});}catch(error){console.error("Coupon update failed",error);return NextResponse.json({error:"Unable to update coupon."},{status:503});}}
