"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function OrderActions({orderId,status,canRequestReturn}:{orderId:string;status:string;canRequestReturn:boolean}) {
  const router=useRouter();const[error,setError]=useState("");const[busy,setBusy]=useState(false);
  async function cancel(){if(!window.confirm("Cancel this order? Any reserved stock will be released."))return;setBusy(true);const response=await fetch(`/api/account/orders/${orderId}/cancel`,{method:"POST"});const data=await response.json() as{error?:string};setError(response.ok?"Order cancelled.":data.error||"Unable to cancel order.");setBusy(false);if(response.ok)router.refresh();}
  async function requestReturn(){const reason=window.prompt("Why are you returning this order?");if(!reason)return;setBusy(true);const response=await fetch("/api/account/returns",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId,reason})});const data=await response.json() as{error?:string};setError(response.ok?"Return request submitted.":data.error||"Unable to request a return.");setBusy(false);if(response.ok)router.refresh();}
  return <div className="order-actions">{["pending","confirmed"].includes(status)&&<button onClick={()=>void cancel()} disabled={busy}>Cancel order</button>}{canRequestReturn&&<button onClick={()=>void requestReturn()} disabled={busy}>Request return</button>}{error&&<small>{error}</small>}</div>;
}
