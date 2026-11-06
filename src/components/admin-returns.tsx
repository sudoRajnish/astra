"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
type ReturnRow={_id:string;reason:string;details?:string;status:string;createdAt:string;adminNote?:string;user?:{name?:string;email?:string};order?:{orderNumber?:string;status?:string;total?:number}};

export function AdminReturns({requests}:{requests:ReturnRow[]}) {
  const router=useRouter();
  const [error,setError]=useState("");
  const [busy,setBusy]=useState("");
  async function update(ret:ReturnRow,status:string) {
    let note="";
    if(status==="rejected") {
      const answer=window.prompt("Reason for rejection");
      if(answer===null)return;
      note=answer.trim();
      if(!note){setError("Add a reason before rejecting the return.");return;}
    }
    setBusy(ret._id);setError("");
    try {
      const response=await fetch("/api/admin/returns",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({returnId:ret._id,status,adminNote:note})});
      const result=await response.json() as{error?:string};
      if(!response.ok)setError(result.error||"Unable to update return.");
      else router.refresh();
    } catch { setError("Unable to reach the server. Try again."); }
    finally { setBusy(""); }
  }
  return <>{error&&<p className="form-error">{error}</p>}<div className="return-list">{requests.map(ret=><article className="admin-table-card return-card" key={ret._id}><div className="return-card-head"><div><b>{ret.order?.orderNumber||"Order unavailable"}</b><small>{ret.user?.name} · {ret.user?.email}</small></div><span className={`status status-${ret.status}`}>{ret.status}</span></div><p><b>Reason:</b> {ret.reason}</p>{ret.details&&<p>{ret.details}</p>}{ret.adminNote&&<p><b>Admin note:</b> {ret.adminNote}</p>}<small>Requested {new Date(ret.createdAt).toLocaleDateString("en-IN")}</small><div className="row-actions">{ret.status==="requested"&&<><button disabled={busy===ret._id} onClick={()=>void update(ret,"approved")}>Approve return</button><button disabled={busy===ret._id} onClick={()=>void update(ret,"rejected")}>Reject</button></>}{ret.status==="approved"&&<button disabled={busy===ret._id} onClick={()=>void update(ret,"received")}>{busy===ret._id?"Updating…":"Mark received & restock"}</button>}</div></article>)}{!requests.length&&<div className="admin-empty">No return requests to review.</div>}</div></>;
}
