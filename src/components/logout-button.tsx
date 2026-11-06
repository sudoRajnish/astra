"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
export function LogoutButton({admin=false}:{admin?:boolean}){const router=useRouter();async function logout(){await fetch("/api/auth/logout",{method:"POST"});router.replace(admin?"/admin/login":"/");router.refresh();}return <button type="button" aria-label="Sign out" onClick={()=>void logout()}><LogOut size={16}/></button>}
