"use client";
import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function ScrollEffects({children}:{children:React.ReactNode}) {
  const reduceMotion=useReducedMotion();
  useEffect(()=>{
    if(reduceMotion)return;
    gsap.registerPlugin(ScrollTrigger);
    const context=gsap.context(()=>{
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element)=>{
        gsap.fromTo(element,{autoAlpha:0,y:18},{autoAlpha:1,y:0,duration:.65,ease:"power2.out",scrollTrigger:{trigger:element,start:"top 90%",once:true}});
      });
    });
    return()=>context.revert();
  },[reduceMotion]);
  return <>{children}</>;
}

export function MotionIntro({children}:{children:React.ReactNode}) {
  const reduceMotion=useReducedMotion();
  return <motion.div initial={reduceMotion?false:{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.55,ease:"easeOut"}}>{children}</motion.div>;
}
