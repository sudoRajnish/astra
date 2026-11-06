import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { AdminActivityLog, User } from "@/models";
const schema=z.object({active:z.boolean()});
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){let actor;try{actor=await requireAdmin(["customer_support","admin"],"customers:manage");}catch{return NextResponse.json({error:"You don’t have permission."},{status:403});}const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Invalid account change."},{status:400});try{await connectDb();const{id}=await params;const user=await User.findOneAndUpdate({_id:id,role:"customer"},{$set:{active:parsed.data.active}},{new:true}).select("name email active");if(!user)return NextResponse.json({error:"Customer not found."},{status:404});await AdminActivityLog.create({actor:actor.id,actorName:actor.name,action:"customer.account_updated",entity:"User",entityId:id,changes:{active:user.active}});return NextResponse.json({ok:true});}catch(error){console.error("Customer update failed",error);return NextResponse.json({error:"Unable to update customer."},{status:503});}}
