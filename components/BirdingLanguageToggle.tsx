"use client";
import { useEffect, useState } from "react";
type BirdLanguage = "en" | "ko";
export function BirdingLanguageToggle() {
  const [language,setLanguage]=useState<BirdLanguage>("en");
  useEffect(()=>{ const stored=window.localStorage.getItem("birding-language") as BirdLanguage|null; const initial=stored==="ko"?"ko":"en"; document.documentElement.dataset.birdLanguage=initial; setLanguage(initial); },[]);
  function choose(next:BirdLanguage){ setLanguage(next); document.documentElement.dataset.birdLanguage=next; window.localStorage.setItem("birding-language",next); }
  return <div className="bird-language-toggle" role="group" aria-label="Bird name language"><button type="button" className={language==="en"?"active":""} aria-pressed={language==="en"} onClick={()=>choose("en")}>English</button><span aria-hidden="true">/</span><button type="button" className={language==="ko"?"active ko-font":"ko-font"} aria-pressed={language==="ko"} onClick={()=>choose("ko")}>한국어</button></div>;
}
