import{j as t,aC as q,r as o,aD as Xe,aE as B,aF as et,U as se,V as ze,e as ge,f as Qe,aG as tt,B as v,T as E,R as rt,C as Le}from"./index.DiDytfxl.js";import{n as $e,w as de,A as he,H as st,I as nt,J as Me,K as ot}from"./exams.CcuECJPA.js";import{Q as it}from"./QuestionRenderer.DvN3EIkr.js";import{c as at,P as fe}from"./ButtonBase.B8FoZldZ.js";import{S as U}from"./Stack.92On7Xvj.js";import{L as qe}from"./LinearProgress.FT6IXqPm.js";import{B as Q}from"./Button.B0ybS2gh.js";import{P as ct,N as lt}from"./NavigateNext.DVwZiJp9.js";import{C as ut}from"./CheckCircle.CccjgJF4.js";import{A as dt}from"./AppBar.zsj3MDdS.js";import{T as mt}from"./Toolbar.0s-4DnGp.js";import{C as Ae}from"./Container.B2QmYXxX.js";import{P as pt}from"./Person.CcMAd1-9.js";import{T as We}from"./Timer.DiGIeN9f.js";import{A as ft}from"./Alert.DVQox-aO.js";import{W as xt}from"./Warning.CeNZEsOp.js";import{D as Ne,a as Te}from"./DialogContent.DEZsDC4z.js";import{D as De}from"./DialogTitle.CJExBcNh.js";import{D as ke}from"./DialogContentText.3rjawDTO.js";import{D as Oe}from"./DialogActions.DZyNUZGC.js";import"./Chip.DjKttowP.js";import"./Tooltip.DPZlfJca.js";import"./useTheme.uWf1kBY1.js";import"./ownerDocument.DW-IO8s5.js";import"./Portal.DHcQyvzL.js";import"./useSlotProps.DVBHgHF6.js";import"./isHostComponent.DVu5iVWx.js";import"./useControlled.SG-Kn-yT.js";import"./useId.x3YXI90R.js";import"./Grow.DGm4Dv6X.js";import"./IconButton.CRi7JcEC.js";import"./RadioGroup.D1IxIDCx.js";import"./SwitchBase.CoJGtZcJ.js";import"./Select.DG3-gnfR.js";import"./List.BGC71djy.js";import"./react-is.production.min.DUDD-a5e.js";import"./Menu.Dq_VBt_U.js";import"./Modal.CKM_Qft1.js";import"./ownerWindow.C0DXrk6N.js";import"./createChainedFunction.BO_9K8Jh.js";import"./debounce.Be36O1Ab.js";import"./FormGroup.cwLKvP4p.js";import"./FormControlLabel.g3ZSjxOK.js";import"./Checkbox.Vq2d_U-1.js";import"./TextField.Vv37zQfd.js";import"./InputLabel.DhdKBgLG.js";import"./ArrowUpward.DhNVFDR8.js";import"./styled.DzrlX6Dv.js";const ht=at(t.jsx("path",{d:"M12 2 4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm3.5 12.09-1.41 1.41L12 13.42 9.91 15.5 8.5 14.09 10.59 12 8.5 9.91 9.91 8.5 12 10.59l2.09-2.09 1.41 1.41L13.42 12l2.08 2.09z"}),"GppBad");var gt=e=>typeof e=="function",xe=(e,r)=>gt(e)?e(r):e,bt=(()=>{let e=0;return()=>(++e).toString()})(),He=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let r=matchMedia("(prefers-reduced-motion: reduce)");e=!r||r.matches}return e}})(),yt=20,Ve=(e,r)=>{switch(r.type){case 0:return{...e,toasts:[r.toast,...e.toasts].slice(0,yt)};case 1:return{...e,toasts:e.toasts.map(i=>i.id===r.toast.id?{...i,...r.toast}:i)};case 2:let{toast:s}=r;return Ve(e,{type:e.toasts.find(i=>i.id===s.id)?1:0,toast:s});case 3:let{toastId:n}=r;return{...e,toasts:e.toasts.map(i=>i.id===n||n===void 0?{...i,dismissed:!0,visible:!1}:i)};case 4:return r.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(i=>i.id!==r.toastId)};case 5:return{...e,pausedAt:r.time};case 6:let a=r.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(i=>({...i,pauseDuration:i.pauseDuration+a}))}}},pe=[],F={toasts:[],pausedAt:void 0},J=e=>{F=Ve(F,e),pe.forEach(r=>{r(F)})},vt={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},Et=(e={})=>{let[r,s]=o.useState(F),n=o.useRef(F);o.useEffect(()=>(n.current!==F&&s(F),pe.push(s),()=>{let i=pe.indexOf(s);i>-1&&pe.splice(i,1)}),[]);let a=r.toasts.map(i=>{var c,l,f;return{...e,...e[i.type],...i,removeDelay:i.removeDelay||((c=e[i.type])==null?void 0:c.removeDelay)||(e==null?void 0:e.removeDelay),duration:i.duration||((l=e[i.type])==null?void 0:l.duration)||(e==null?void 0:e.duration)||vt[i.type],style:{...e.style,...(f=e[i.type])==null?void 0:f.style,...i.style}}});return{...r,toasts:a}},wt=(e,r="blank",s)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:r,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...s,id:(s==null?void 0:s.id)||bt()}),le=e=>(r,s)=>{let n=wt(r,e,s);return J({type:2,toast:n}),n.id},w=(e,r)=>le("blank")(e,r);w.error=le("error");w.success=le("success");w.loading=le("loading");w.custom=le("custom");w.dismiss=e=>{J({type:3,toastId:e})};w.remove=e=>J({type:4,toastId:e});w.promise=(e,r,s)=>{let n=w.loading(r.loading,{...s,...s==null?void 0:s.loading});return typeof e=="function"&&(e=e()),e.then(a=>{let i=r.success?xe(r.success,a):void 0;return i?w.success(i,{id:n,...s,...s==null?void 0:s.success}):w.dismiss(n),a}).catch(a=>{let i=r.error?xe(r.error,a):void 0;i?w.error(i,{id:n,...s,...s==null?void 0:s.error}):w.dismiss(n)}),e};var jt=(e,r)=>{J({type:1,toast:{id:e,height:r}})},St=()=>{J({type:5,time:Date.now()})},ce=new Map,Ct=1e3,It=(e,r=Ct)=>{if(ce.has(e))return;let s=setTimeout(()=>{ce.delete(e),J({type:4,toastId:e})},r);ce.set(e,s)},_t=e=>{let{toasts:r,pausedAt:s}=Et(e);o.useEffect(()=>{if(s)return;let i=Date.now(),c=r.map(l=>{if(l.duration===1/0)return;let f=(l.duration||0)+l.pauseDuration-(i-l.createdAt);if(f<0){l.visible&&w.dismiss(l.id);return}return setTimeout(()=>w.dismiss(l.id),f)});return()=>{c.forEach(l=>l&&clearTimeout(l))}},[r,s]);let n=o.useCallback(()=>{s&&J({type:6,time:Date.now()})},[s]),a=o.useCallback((i,c)=>{let{reverseOrder:l=!1,gutter:f=8,defaultPosition:p}=c||{},u=r.filter(x=>(x.position||p)===(i.position||p)&&x.height),T=u.findIndex(x=>x.id===i.id),S=u.filter((x,g)=>g<T&&x.visible).length;return u.filter(x=>x.visible).slice(...l?[S+1]:[0,S]).reduce((x,g)=>x+(g.height||0)+f,0)},[r]);return o.useEffect(()=>{r.forEach(i=>{if(i.dismissed)It(i.id,i.removeDelay);else{let c=ce.get(i.id);c&&(clearTimeout(c),ce.delete(i.id))}})},[r]),{toasts:r,handlers:{updateHeight:jt,startPause:St,endPause:n,calculateOffset:a}}},Rt=q`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,At=q`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,Nt=q`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,Tt=B("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Rt} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${At} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${Nt} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,Dt=q`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,kt=B("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${Dt} 1s linear infinite;
`,Ot=q`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,Pt=q`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,zt=B("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Ot} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${Pt} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,Qt=B("div")`
  position: absolute;
`,Lt=B("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,$t=q`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,Mt=B("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${$t} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,qt=({toast:e})=>{let{icon:r,type:s,iconTheme:n}=e;return r!==void 0?typeof r=="string"?o.createElement(Mt,null,r):r:s==="blank"?null:o.createElement(Lt,null,o.createElement(kt,{...n}),s!=="loading"&&o.createElement(Qt,null,s==="error"?o.createElement(Tt,{...n}):o.createElement(zt,{...n})))},Wt=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,Ht=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,Vt="0%{opacity:0;} 100%{opacity:1;}",Bt="0%{opacity:1;} 100%{opacity:0;}",Gt=B("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,Ut=B("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,Ft=(e,r)=>{let s=e.includes("top")?1:-1,[n,a]=He()?[Vt,Bt]:[Wt(s),Ht(s)];return{animation:r?`${q(n)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${q(a)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},Jt=o.memo(({toast:e,position:r,style:s,children:n})=>{let a=e.height?Ft(e.position||r||"top-center",e.visible):{opacity:0},i=o.createElement(qt,{toast:e}),c=o.createElement(Ut,{...e.ariaProps},xe(e.message,e));return o.createElement(Gt,{className:e.className,style:{...a,...s,...e.style}},typeof n=="function"?n({icon:i,message:c}):o.createElement(o.Fragment,null,i,c))});et(o.createElement);var Kt=({id:e,className:r,style:s,onHeightUpdate:n,children:a})=>{let i=o.useCallback(c=>{if(c){let l=()=>{let f=c.getBoundingClientRect().height;n(e,f)};l(),new MutationObserver(l).observe(c,{subtree:!0,childList:!0,characterData:!0})}},[e,n]);return o.createElement("div",{ref:i,className:r,style:s},a)},Yt=(e,r)=>{let s=e.includes("top"),n=s?{top:0}:{bottom:0},a=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:He()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${r*(s?1:-1)}px)`,...n,...a}},Zt=Xe`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,me=16,Xt=({reverseOrder:e,position:r="top-center",toastOptions:s,gutter:n,children:a,containerStyle:i,containerClassName:c})=>{let{toasts:l,handlers:f}=_t(s);return o.createElement("div",{id:"_rht_toaster",style:{position:"fixed",zIndex:9999,top:me,left:me,right:me,bottom:me,pointerEvents:"none",...i},className:c,onMouseEnter:f.startPause,onMouseLeave:f.endPause},l.map(p=>{let u=p.position||r,T=f.calculateOffset(p,{reverseOrder:e,gutter:n,defaultPosition:r}),S=Yt(u,T);return o.createElement(Kt,{id:p.id,key:p.id,onHeightUpdate:f.updateHeight,className:p.visible?Zt:"",style:S},p.type==="custom"?xe(p.message,p):a?a(p):o.createElement(Jt,{toast:p,position:u}))}))};const er=async e=>{try{const{data:r,error:s}=await se.from("exam_questions").select(`
        id,
        exam_id,
        question_number,
        question_text,
        question_type,
        points,
        options,
        correct_answer,
        rubric
      `).eq("exam_id",e).order("question_number");if(s)return console.error(`Erreur lors de la récupération des questions de l'examen ${e}:`,s),{data:[],questions:[],error:s};const n=(r||[]).map(a=>$e(a));return{data:n,questions:n,error:null}}catch(r){return console.error(`Exception lors de la récupération des questions de l'examen ${e}:`,r),{data:[],questions:[],error:r}}},tr=async e=>{try{const{error:r}=await se.from("cheating_attempts").insert(e);return r?(console.error("Erreur lors de l'enregistrement de la tentative de triche:",r),{success:!1,error:r}):{success:!0,error:null}}catch(r){return console.error("Exception lors de l'enregistrement de la tentative de triche:",r),{success:!1,error:r}}},rr=async e=>{try{const{data:r,error:s}=await se.from("active_students").select("id").eq("student_id",e.student_id).eq("exam_id",e.exam_id).maybeSingle();if(s)return console.error("Erreur lors de la vérification de l'étudiant actif:",s),{success:!1,error:s};if(r){const{error:n}=await se.from("active_students").update({last_ping:new Date().toISOString(),is_completed:!1,updated_at:new Date().toISOString()}).eq("id",r.id);if(n)return console.error("Erreur lors de la mise à jour de l'étudiant actif:",n),{success:!1,error:n}}else{const{error:n}=await se.from("active_students").insert({...e,is_completed:!1});if(n)return console.error("Erreur lors de l'insertion de l'étudiant actif:",n),{success:!1,error:n}}return{success:!0,error:null}}catch(r){return console.error("Exception lors de l'enregistrement de l'étudiant actif:",r),{success:!1,error:r}}},Pe=async(e,r,s)=>{try{const{error:n}=await se.from("active_students").update({is_completed:!s,last_ping:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("student_id",e).eq("exam_id",r);return n?(console.error("Erreur lors de la mise à jour du statut de l'étudiant actif:",n),{success:!1,error:n}):{success:!0,error:null}}catch(n){return console.error("Exception lors de la mise à jour du statut de l'étudiant actif:",n),{success:!1,error:n}}},sr=e=>{switch(e.question_type){case"qcm_multiple":return[];case"matching":case"fill_blank":return{};case"ordering":return(e.items||[]).map((r,s)=>({id:s,text:r}));default:return""}},nr=()=>{var ye,ve,Ee,we,je,Se,Ce;const{id:e}=ze(),r=ge(),{authState:s}=Qe(),n=Number(e),[a,i]=o.useState("NOT_STARTED"),[c,l]=o.useState([]),[f,p]=o.useState(0),[u,T]=o.useState({}),[S,x]=o.useState({minutes:0,seconds:0}),[g,K]=o.useState(null),[O,Y]=o.useState(null),[Z,j]=o.useState(!0),[W,z]=o.useState(null),[X,C]=o.useState(0),[L,ee]=o.useState(null),I=o.useRef(null),D=o.useRef(null),R=o.useRef(null),m=o.useRef(null),b=o.useRef(0),A=o.useRef({}),H=o.useRef([]),_=o.useRef({minutes:0,seconds:0}),ne=o.useRef(null),oe=o.useRef(null),te=o.useCallback(()=>{I.current&&(clearInterval(I.current),I.current=null),D.current&&(clearInterval(D.current),D.current=null),R.current&&(clearInterval(R.current),R.current=null)},[]),Ge=o.useCallback(()=>c.reduce((d,h)=>de(h)?d+Number(he(h,u[h.id])||0):d,0),[u,c]),Ue=o.useCallback(()=>c.reduce((d,h)=>de(h)?d+(Number(he(h,u[h.id])||0)>=Number(h.points||0)?1:0):d,0),[u,c]);o.useEffect(()=>{A.current=u},[u]),o.useEffect(()=>{H.current=c},[c]),o.useEffect(()=>{_.current=S},[S]),o.useEffect(()=>{ne.current=g},[g]),o.useEffect(()=>{oe.current=O},[O]);const V=o.useCallback(async()=>{var ie,ae;if(!ne.current||!oe.current||!((ie=s.profile)!=null&&ie.id)||!((ae=s.student)!=null&&ae.id))return;te(),localStorage.removeItem(`exam_backup_${n}`);const d=H.current,h=A.current,$=_.current,y=ne.current,N=d.reduce((k,P)=>de(P)?k+Number(he(P,h[P.id])||0):k,0),re=d.some(k=>!de(k)),G=d.reduce((k,P)=>k+Number(P.points||0),0),ue=G>0?Math.round(N/G*100):0;try{const k=y.duration*60-($.minutes*60+$.seconds),{error:P}=await st({studentExamId:oe.current,examId:n,profileId:s.profile.id,answers:h,score:N,totalQuestions:d.length,completionTime:k,cheatingAttempts:b.current,hasManualQuestions:re,passingGrade:y.passing_grade});if(P)throw P;await Pe(s.profile.id,n,!1),ee({score:N,maxScore:G,percentage:ue,passed:re?null:N>=Number(y.passing_grade||0),hasManualQuestions:re}),i("COMPLETED"),w.success("Examen soumis avec succès.")}catch(k){console.error("Erreur lors de la soumission de l'examen:",k),w.error("Erreur lors de la soumission de l'examen.")}},[(ye=s.profile)==null?void 0:ye.id,(ve=s.student)==null?void 0:ve.id,te,n]);o.useEffect(()=>((async()=>{var h,$;j(!0),z(null);try{if(!s.isStudent||!((h=s.student)!=null&&h.id)||!(($=s.profile)!=null&&$.id))throw new Error("Accès non autorisé");const{exam:y,studentExam:N,error:re}=await Me({examId:n,profileId:s.user.id});if(re)throw re;if(!["published","in_progress"].includes(y.status))throw new Error("Cet examen n'est pas disponible.");if(N.attempt_status==="submitted")throw new Error("Cet examen a déjà été soumis.");const{questions:G,error:ue}=await er(n);if(ue)throw ue;if(!G||G.length===0)throw new Error("Aucune question n'est disponible pour cet examen.");const ie=G.map(M=>$e(M)),ae=localStorage.getItem(`exam_backup_${n}`),k=ae?JSON.parse(ae):typeof N.answers=="string"?JSON.parse(N.answers||"{}"):N.answers||{},P={};ie.forEach(M=>{P[M.id]=k[M.id]??sr(M)}),K(y),Y(N.id),l(ie),T(P),C(0),b.current=0,p(0);const Ie=new Date,_e=N.arrival_time?new Date(N.arrival_time):null;if(N.attempt_status==="in_progress"&&_e){const M=new Date(_e.getTime()+Number(y.duration||0)*6e4);if(m.current=M,M<=Ie)x({minutes:0,seconds:0}),i("IN_PROGRESS"),setTimeout(()=>V(),0);else{const Re=M.getTime()-Ie.getTime();x({minutes:Math.floor(Re/6e4),seconds:Math.floor(Re%6e4/1e3)}),i("IN_PROGRESS")}}else x({minutes:Number(y.duration||0),seconds:0}),i("NOT_STARTED")}catch(y){console.error("Erreur lors du chargement de l'examen:",y),z(y.message||"Impossible de charger l'examen."),w.error(y.message||"Impossible de charger l'examen."),setTimeout(()=>{r("/student/exams")},2e3)}finally{j(!1)}})(),()=>{te()}),[s.isStudent,(Ee=s.profile)==null?void 0:Ee.id,(we=s.student)==null?void 0:we.id,te,n,r,V]),o.useEffect(()=>{var h;if(a!=="IN_PROGRESS"||!g||!((h=s.profile)!=null&&h.id))return;const d=()=>{const $=new Date,y=m.current?m.current.getTime()-$.getTime():0;if(y<=0){x({minutes:0,seconds:0}),V();return}x({minutes:Math.floor(y/6e4),seconds:Math.floor(y%6e4/1e3)})};return d(),I.current=setInterval(d,1e3),D.current=setInterval(()=>{Pe(s.profile.id,n,!0)},3e4),R.current=setInterval(()=>{oe.current&&Object.keys(A.current).length>0&&nt({studentExamId:oe.current,answers:A.current})},6e4),()=>{te()}},[(je=s.profile)==null?void 0:je.id,te,g,n,a,O,V]);const Fe=o.useCallback(async()=>{var h;if(a!=="NOT_STARTED"||!g||!((h=s.profile)!=null&&h.id))return;const d=new Date;m.current=new Date(d.getTime()+Number(g.duration||0)*6e4),i("IN_PROGRESS"),await rr({student_id:s.profile.id,exam_id:n,start_time:d.toISOString(),last_ping:d.toISOString(),created_at:d.toISOString(),updated_at:d.toISOString()}),w.success("L'examen a commencé. Bonne chance.")},[(Se=s.profile)==null?void 0:Se.id,g,n,a]),Je=o.useCallback(()=>{p(d=>Math.min(d+1,c.length-1))},[c.length]),Ke=o.useCallback(()=>{p(d=>Math.max(d-1,0))},[]),Ye=o.useCallback(d=>{d>=0&&d<c.length&&p(d)},[c.length]),be=o.useCallback((d,h)=>{T($=>{const y={...$,[d]:h};return localStorage.setItem(`exam_backup_${n}`,JSON.stringify(y)),y})},[n]),Ze=o.useCallback(async()=>{var d;a!=="IN_PROGRESS"||!((d=s.profile)!=null&&d.id)||(b.current+=1,C(b.current),await tr({student_id:s.profile.id,exam_id:n,student_exam_id:O,details:"Sortie d'onglet ou perte de focus detectee",attempt_count:b.current,detected_at:new Date().toISOString()}),b.current>=3&&(w.error("Trop de tentatives de triche detectees. Soumission automatique."),V()))},[(Ce=s.profile)==null?void 0:Ce.id,n,a,O,V]);return{quizStatus:a,questions:c,currentQuestionIndex:f,answers:u,userAnswers:u,timer:S,examData:g,loading:Z,error:W,cheatingAttempts:X,scoreSummary:L,startQuiz:Fe,goToNextQuestion:Je,goToPreviousQuestion:Ke,goToQuestion:Ye,saveAnswer:be,answerQuestion:be,submitQuiz:V,endQuiz:V,reportCheatingAttempt:Ze,calculateScore:Ge,countCorrectAnswers:Ue}},Be=()=>{var r,s,n,a;const e=tt();return{appState:{currentUser:{id:(r=e.authState.user)==null?void 0:r.id,email:(s=e.authState.user)==null?void 0:s.email,name:((n=e.authState.profile)==null?void 0:n.full_name)||((a=e.authState.user)==null?void 0:a.email),role:e.authState.isAdmin?"admin":e.authState.isProfessor?"professor":"student"},isAuthenticated:e.authState.isAuthenticated,isAdmin:e.authState.isAdmin,isProfessor:e.authState.isProfessor,isStudent:e.authState.isStudent},authState:e.authState,signIn:e.signIn,signOut:e.signOut}},or=({question:e,answer:r,onAnswerChange:s,questionNumber:n,totalQuestions:a})=>t.jsx(it,{question:e,answer:r,onAnswerChange:s,questionNumber:n,totalQuestions:a}),ir=({questions:e,currentQuestionIndex:r,userAnswers:s,goToNextQuestion:n,goToPreviousQuestion:a,endQuiz:i})=>{const c=r===0,l=r===e.length-1,f=Object.values(s).filter(u=>Array.isArray(u)?u.length>0:u!=null&&u!=="").length,p=e.length>0?f/e.length*100:0;return t.jsxs(fe,{elevation:0,variant:"outlined",sx:{p:3,bgcolor:"white",borderRadius:2},children:[t.jsxs(v,{sx:{mb:3},children:[t.jsxs(U,{direction:"row",justifyContent:"space-between",alignItems:"center",sx:{mb:1},children:[t.jsxs(E,{variant:"body2",color:"text.secondary",fontWeight:"medium",children:["Réponses saisies : ",f," / ",e.length]}),t.jsxs(E,{variant:"body2",color:"primary",fontWeight:"bold",children:[Math.round(p),"% complété"]})]}),t.jsx(qe,{variant:"determinate",value:p,sx:{height:8,borderRadius:4,bgcolor:"grey.200"}})]}),t.jsxs(U,{direction:"row",justifyContent:"space-between",children:[t.jsx(Q,{variant:"outlined",startIcon:t.jsx(ct,{}),onClick:a,disabled:c,sx:{minWidth:120},children:"Précédent"}),l?t.jsx(Q,{variant:"contained",color:"success",endIcon:t.jsx(ut,{}),onClick:()=>{window.confirm("Êtes-vous sûr de vouloir soumettre votre copie ? Cette action est définitive.")&&i()},sx:{minWidth:150,fontWeight:"bold"},children:"Soumettre ma copie"}):t.jsx(Q,{variant:"contained",color:"primary",endIcon:t.jsx(lt,{}),onClick:n,sx:{minWidth:120},children:"Suivant"})]})]})},ar=({questions:e,userAnswers:r,calculateScore:s,cheatingAttempts:n,scoreSummary:a,correctAnswersCount:i})=>{var S;const c=ge(),{appState:l}=Be(),f=(a==null?void 0:a.score)??s(),p=(a==null?void 0:a.maxScore)??e.reduce((x,g)=>x+Number(g.points||0),0),u=p>0?f/p*100:0,T=()=>u>=80?"text-green-600":u>=60?"text-yellow-600":"text-red-600";return t.jsx("div",{className:"min-h-screen bg-gray-50 py-8 px-4",children:t.jsx("div",{className:"max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden",children:t.jsxs("div",{className:"p-8",children:[t.jsx("h1",{className:"text-2xl font-bold text-gray-800 mb-6",children:"Résultats du Quiz"}),t.jsxs("div",{className:"mb-8",children:[t.jsxs("div",{className:"flex justify-between items-center mb-4",children:[t.jsx("p",{className:"text-gray-700",children:"Étudiant:"}),t.jsx("p",{className:"font-medium",children:(S=l.currentUser)==null?void 0:S.name})]}),t.jsxs("div",{className:"flex justify-between items-center mb-4",children:[t.jsx("p",{className:"text-gray-700",children:"Note finale:"}),t.jsxs("p",{className:`text-2xl font-bold ${T()}`,children:[f.toFixed(1),"/",p||0]})]}),t.jsxs("div",{className:"flex justify-between items-center mb-4",children:[t.jsx("p",{className:"text-gray-700",children:"Réponses correctes:"}),t.jsxs("p",{className:"font-medium",children:[i," sur ",e.length]})]}),n>0&&t.jsxs("div",{className:"flex justify-between items-center mb-4 p-3 bg-red-50 border border-red-200 rounded-md",children:[t.jsx("p",{className:"text-red-700",children:"Tentatives de triche détectées:"}),t.jsx("p",{className:"font-medium text-red-700",children:n})]}),(a==null?void 0:a.hasManualQuestions)&&t.jsx("div",{className:"mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800",children:"Une partie de cet examen comporte des questions a correction manuelle. Le score final pourra etre ajuste apres notation du professeur."})]}),t.jsx("div",{className:"w-full bg-gray-200 rounded-full h-4 mb-6",children:t.jsx("div",{className:`h-4 rounded-full ${u>=80?"bg-green-500":u>=60?"bg-yellow-500":"bg-red-500"}`,style:{width:`${u}%`}})}),t.jsx("div",{className:"text-center mt-8",children:t.jsx("button",{onClick:()=>c("/student/exams"),className:"px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200",children:"Retour aux examens"})})]})})})},cr=()=>{var I,D;const{appState:e}=Be(),{questions:r,currentQuestionIndex:s,userAnswers:n,quizStatus:a,timer:i,examData:c,loading:l,error:f,startQuiz:p,reportCheatingAttempt:u,answerQuestion:T,goToNextQuestion:S,goToPreviousQuestion:x,endQuiz:g,calculateScore:K,cheatingAttempts:O,scoreSummary:Y,countCorrectAnswers:Z}=nr(),j=o.useRef(null),W=o.useRef(!1),z=rt.useRef(null);z.current||(z.current=new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));const X=R=>{j.current&&document.body.contains(j.current)&&(document.body.removeChild(j.current),j.current=null);const m=document.createElement("div");m.style.position="fixed",m.style.top="0",m.style.left="0",m.style.width="100%",m.style.height="100%",m.style.backgroundColor="rgba(211, 47, 47, 0.95)",m.style.color="white",m.style.display="flex",m.style.flexDirection="column",m.style.justifyContent="center",m.style.alignItems="center",m.style.zIndex="99999",m.style.fontWeight="bold",m.style.fontFamily="Roboto, Helvetica, Arial, sans-serif",m.style.textAlign="center",m.style.padding="40px";const b=document.createElement("div");b.innerHTML='<svg style="width:100px;height:100px" viewBox="0 0 24 24"><path fill="currentColor" d="M13,13H11V7H13M13,17H11V15H13M12,2L1,21H23L12,2Z" /></svg>',b.style.marginBottom="20px";const A=document.createElement("div");A.textContent="TRICHE DÉTECTÉE",A.style.fontSize="48px",A.style.marginBottom="20px";const H=document.createElement("div");H.innerHTML=R.replace(`🚨 TRICHE DÉTECTÉE 🚨

`,"").replace(/\n/g,"<br>"),H.style.marginBottom="40px",H.style.fontSize="24px",H.style.maxWidth="800px";const _=document.createElement("button");_.textContent="JE COMPRENDS ET JE REVIENS À L'ÉPREUVE",_.style.padding="16px 32px",_.style.backgroundColor="white",_.style.color="#d32f47",_.style.border="none",_.style.borderRadius="4px",_.style.fontWeight="bold",_.style.fontSize="18px",_.style.cursor="pointer",_.style.boxShadow="0 4px 6px rgba(0, 0, 0, 0.3)",_.onclick=()=>{j.current&&document.body.contains(j.current)&&(document.body.removeChild(j.current),j.current=null)},m.appendChild(b),m.appendChild(A),m.appendChild(H),m.appendChild(_),document.body.appendChild(m),j.current=m,z.current&&z.current.play().catch(ne=>console.error("Erreur lors de la lecture du son:",ne))},C=o.useRef(()=>{});if(C.current=()=>{a==="IN_PROGRESS"&&(W.current||(W.current=!0,X(`🚨 TRICHE DÉTECTÉE 🚨

Vous avez quitté l'onglet ou changé de fenêtre pendant l'examen.

Cet incident a été enregistré et transmis au surveillant. Au bout de 3 tentatives, votre copie sera automatiquement soumise.`),u(),setTimeout(()=>{W.current=!1},5e3)))},o.useEffect(()=>{const R=()=>{document.visibilityState==="hidden"&&a==="IN_PROGRESS"&&C.current()},m=()=>{a==="IN_PROGRESS"&&C.current()},b=A=>{a==="IN_PROGRESS"&&A.preventDefault()};return document.addEventListener("visibilitychange",R),window.addEventListener("blur",m),document.addEventListener("contextmenu",b),document.addEventListener("copy",b),document.addEventListener("cut",b),document.addEventListener("paste",b),()=>{document.removeEventListener("visibilitychange",R),window.removeEventListener("blur",m),document.removeEventListener("contextmenu",b),document.removeEventListener("copy",b),document.removeEventListener("cut",b),document.removeEventListener("paste",b),j.current&&document.body.contains(j.current)&&(document.body.removeChild(j.current),j.current=null)}},[a,u]),o.useEffect(()=>{a==="NOT_STARTED"&&p()},[a,p]),a==="COMPLETED")return t.jsx(ar,{questions:r,userAnswers:n,calculateScore:K,cheatingAttempts:O,scoreSummary:Y,correctAnswersCount:Z()});if(f)return t.jsx(v,{sx:{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",bgcolor:"grey.50",px:2},children:t.jsxs(fe,{elevation:3,sx:{maxWidth:500,p:4,textAlign:"center"},children:[t.jsx(E,{variant:"h5",color:"error",gutterBottom:!0,fontWeight:"bold",children:"Examen indisponible"}),t.jsx(E,{variant:"body1",color:"text.secondary",children:f})]})});if(l||r.length===0)return t.jsx(v,{sx:{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",bgcolor:"grey.50"},children:t.jsxs(U,{alignItems:"center",spacing:2,children:[t.jsx(Le,{size:60}),t.jsx(E,{color:"text.secondary",children:"Chargement de l'épreuve..."})]})});const L=r[s],ee=(s+1)/r.length*100;return t.jsxs(v,{sx:{minHeight:"100vh",bgcolor:"grey.100",display:"flex",flexDirection:"column"},children:[t.jsx(Xt,{position:"top-center"}),t.jsxs(dt,{position:"sticky",color:"default",elevation:2,sx:{bgcolor:"white"},children:[t.jsx(mt,{children:t.jsx(Ae,{maxWidth:"lg",children:t.jsxs(U,{direction:"row",justifyContent:"space-between",alignItems:"center",width:"100%",children:[t.jsxs(v,{children:[t.jsx(E,{variant:"h6",fontWeight:"bold",noWrap:!0,sx:{maxWidth:{xs:200,sm:"100%"}},children:c==null?void 0:c.title}),t.jsxs(U,{direction:"row",spacing:1,alignItems:"center",children:[t.jsx(pt,{fontSize:"small",color:"action"}),t.jsx(E,{variant:"caption",color:"text.secondary",children:((I=e.currentUser)==null?void 0:I.name)||((D=e.profile)==null?void 0:D.full_name)})]})]}),t.jsxs(U,{direction:"row",spacing:3,alignItems:"center",children:[O>0&&t.jsx(Chip,{icon:t.jsx(ht,{}),label:`${O} alertes`,color:"error",variant:"outlined",size:"small"}),t.jsx(fe,{variant:"outlined",sx:{px:2,py:.5,bgcolor:i.minutes<5?"error.light":"grey.50",borderColor:i.minutes<5?"error.main":"divider"},children:t.jsxs(U,{direction:"row",spacing:1,alignItems:"center",children:[t.jsx(We,{color:i.minutes<5?"error":"action"}),t.jsxs(E,{variant:"h6",sx:{fontVariantNumeric:"tabular-nums",fontWeight:"bold",color:i.minutes<5?"error.main":"text.primary"},children:[String(i.minutes).padStart(2,"0"),":",String(i.seconds).padStart(2,"0")]})]})})]})]})})}),t.jsx(qe,{variant:"determinate",value:ee,sx:{height:4}})]}),t.jsxs(Ae,{maxWidth:"md",sx:{py:4,flexGrow:1},children:[t.jsxs(v,{sx:{mb:2,display:"flex",justifyContent:"space-between",alignItems:"center"},children:[t.jsxs(E,{variant:"subtitle2",color:"text.secondary",children:["Question ",s+1," sur ",r.length]}),t.jsxs(E,{variant:"subtitle2",color:"primary",fontWeight:"bold",children:[L.points," points"]})]}),t.jsx(or,{question:L,answer:n[L.id],onAnswerChange:R=>T(L.id,R),questionNumber:s+1,totalQuestions:r.length}),t.jsx(v,{sx:{mt:4},children:t.jsx(ir,{questions:r,currentQuestionIndex:s,userAnswers:n,goToNextQuestion:S,goToPreviousQuestion:x,endQuiz:g})})]}),t.jsx(v,{component:"footer",sx:{py:2,textAlign:"center",bgcolor:"grey.200",mt:"auto"},children:t.jsx(E,{variant:"caption",color:"text.secondary",children:"ESGIS Campus - Session d'examen sécurisée. Vos réponses sont sauvegardées automatiquement."})})]})},ss=()=>{const{id:e}=ze(),r=ge(),{authState:s}=Qe(),[n,a]=o.useState(!0),[i,c]=o.useState(null),[l,f]=o.useState(null),[p,u]=o.useState(!1),[T,S]=o.useState(!1),[x,g]=o.useState(!1),[K,O]=o.useState(""),[Y,Z]=o.useState(!1);o.useEffect(()=>{(async()=>{var L,ee;try{if(a(!0),!s.isStudent||!((L=s.student)!=null&&L.id)||!((ee=s.profile)!=null&&ee.id))throw new Error("Accès non autorisé");const{exam:I,studentExam:D,error:R}=await Me({examId:e,profileId:s.user.id});if(R)throw R;const m=new Date(I.date),b=new Date;if(!["published","in_progress"].includes(I.status))throw new Error("Cet examen n'est pas encore disponible");if(m>b)throw new Error("Cet examen n'est pas encore disponible");if(D.attempt_status==="submitted")throw new Error("Vous avez déjà soumis cet examen");const A={...I,course_name:I.course_name||"Cours inconnu",professor_name:I.professor_name||"Professeur inconnu",student_exam_id:D.id,attempt_status:D.attempt_status};f(A),D.attempt_status==="in_progress"&&S(!0)}catch(I){console.error("Erreur lors de la récupération de l'examen:",I),c(I.message)}finally{a(!1)}})()},[e,s]);const j=async()=>{try{const{error:C}=await ot({studentExamId:l.student_exam_id,examId:Number(e)});if(C)throw C;S(!0),u(!1),g(!1)}catch(C){console.error("Erreur lors du démarrage de l'examen:",C),c("Impossible de démarrer l'examen. Veuillez réessayer.")}},W=()=>{K.toLowerCase()==="esgis2026"?(Z(!1),u(!0)):Z(!0)},z=()=>{u(!1)},X=()=>{r("/student/exams")};return T?t.jsx(v,{sx:{height:"100vh",overflow:"hidden"},children:t.jsx(cr,{})}):t.jsxs(v,{sx:{p:3},children:[n?t.jsx(v,{sx:{display:"flex",justifyContent:"center",my:4},children:t.jsx(Le,{})}):i?t.jsxs(v,{sx:{my:4},children:[t.jsx(ft,{severity:"error",sx:{mb:2},children:i}),t.jsx(Q,{variant:"contained",onClick:X,children:"Retour à la liste des examens"})]}):t.jsxs(fe,{elevation:3,sx:{p:4},children:[t.jsx(E,{variant:"h4",gutterBottom:!0,children:l.title}),t.jsxs(v,{sx:{mb:4},children:[t.jsxs(E,{variant:"subtitle1",color:"text.secondary",children:[l.course_name," (",l.course_code||"N/A",")"]}),t.jsxs(E,{variant:"body2",color:"text.secondary",children:["Professeur: ",l.professor_name]})]}),t.jsxs(v,{sx:{mb:4,display:"flex",alignItems:"center",gap:2},children:[t.jsx(We,{color:"warning"}),t.jsxs(E,{variant:"h6",children:["Durée: ",l.duration," minutes"]})]}),l.description&&t.jsxs(v,{sx:{mb:4},children:[t.jsx(E,{variant:"h6",gutterBottom:!0,children:"Instructions"}),t.jsx(E,{variant:"body1",children:l.description})]}),t.jsxs(v,{sx:{mb:4,p:2,bgcolor:"warning.light",borderRadius:1},children:[t.jsxs(v,{sx:{display:"flex",alignItems:"center",gap:1,mb:1},children:[t.jsx(xt,{color:"warning"}),t.jsx(E,{variant:"h6",children:"Attention"})]}),t.jsx(E,{variant:"body2",children:"Une fois que vous aurez commencé l'examen, vous ne pourrez pas le quitter avant de l'avoir terminé. Toute tentative de quitter la page ou de changer d'onglet sera considérée comme une tentative de triche."})]}),t.jsxs(v,{sx:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[t.jsx(Q,{variant:"outlined",onClick:X,children:"Annuler"}),t.jsx(v,{sx:{display:"flex",gap:2,alignItems:"center"},children:t.jsx(Q,{variant:"contained",color:"primary",onClick:()=>g(!0),children:"Commencer l'examen"})})]})]}),t.jsxs(Ne,{open:x,onClose:()=>g(!1),children:[t.jsx(De,{children:"Code d'accès requis"}),t.jsxs(Te,{children:[t.jsx(ke,{sx:{mb:2},children:"Veuillez saisir le code confidentiel (OTP) fourni par le surveillant pour déverrouiller l'épreuve."}),t.jsx(TextField,{autoFocus:!0,margin:"dense",label:"Code OTP",type:"text",fullWidth:!0,variant:"outlined",value:K,onChange:C=>O(C.target.value),error:Y,helperText:Y?"Code incorrect. Veuillez réessayer.":"Indice: ESGIS2026",onKeyPress:C=>C.key==="Enter"&&W()})]}),t.jsxs(Oe,{children:[t.jsx(Q,{onClick:()=>g(!1),children:"Annuler"}),t.jsx(Q,{onClick:W,variant:"contained",color:"primary",children:"Valider le code"})]})]}),t.jsxs(Ne,{open:p,onClose:z,children:[t.jsx(De,{children:"Confirmer le démarrage de l'examen"}),t.jsx(Te,{children:t.jsx(ke,{children:"Êtes-vous sûr de vouloir commencer l'examen maintenant ? Une fois commencé, vous ne pourrez pas l'interrompre et le chronomètre démarrera."})}),t.jsxs(Oe,{children:[t.jsx(Q,{onClick:z,children:"Annuler"}),t.jsx(Q,{onClick:j,variant:"contained",color:"primary",children:"Commencer"})]})]})]})};export{ss as default};
