import{U as i}from"./index.DiDytfxl.js";const c=e=>Array.isArray(e)?e[0]:e,g=(e,r={})=>{const t=c(e.courses);return{id:e.id,title:e.title,description:e.description,file_path:e.file_path,file_size:e.file_size,file_type:e.file_type,course_id:e.course_id,course_name:(t==null?void 0:t.name)||null,uploaded_by:e.uploaded_by,visibility:e.visibility,created_at:e.created_at,updated_at:e.updated_at,tags:(r[e.id]||[]).sort((n,o)=>n.localeCompare(o))}},h=e=>{const r=c(e.document_templates),t=c(e.student),n=c(t==null?void 0:t.profiles);return{id:e.id,title:(r==null?void 0:r.name)||"Document officiel",description:`Document généré depuis le modèle ${(r==null?void 0:r.name)||"inconnu"}`,template_name:(r==null?void 0:r.name)||"Modèle inconnu",template_type:(r==null?void 0:r.type)||"other",student_id:e.student_id,student_name:(n==null?void 0:n.full_name)||"Étudiant inconnu",student_number:(t==null?void 0:t.student_number)||"",file_path:e.file_path,status:e.status,created_at:e.created_at,updated_at:e.updated_at,approval_date:e.approval_date,file_type:"application/pdf"}},f=e=>e?/^https?:\/\//.test(e)?{type:"url",value:e}:{type:"storage",value:e.replace(/^documents\//,"")}:null,D=e=>e&&e.split("/").filter(Boolean).pop()||"",v=e=>{if(!e)return"file";if(e.includes("/")){const r=e.split("/").pop();return r==="pdf"?"pdf":r!=null&&r.includes("zip")?"zip":r||"file"}return e},w=e=>{const r=f(e);if(!r)return"";if(r.type==="url")return r.value;const{data:t}=i.storage.from("documents").getPublicUrl(r.value);return(t==null?void 0:t.publicUrl)||""},m=e=>({id:e.id,title:e.title,description:e.description||"",file_url:w(e.file_path),file_path:e.file_path,file_name:D(e.file_path),file_type:v(e.file_type),file_size:e.file_size||0,created_at:e.created_at,updated_at:e.updated_at,created_by:e.uploaded_by||null,uploaded_by:e.uploaded_by||null,course_id:e.course_id||null,group_id:e.group_id||null,type:e.type||"other",is_public:e.is_public===!0||e.visibility==="public",visibility:e.visibility||(e.is_public?"public":"course")}),q=async({isAdmin:e=!1,isStudent:r=!1,isProfessor:t=!1,studentId:n=null,professorId:o=null,profileId:a=null})=>{try{if(r&&!n&&!a)return{courses:[],error:null};if(t&&!o)return{courses:[],error:null};if(e){const{data:l,error:s}=await i.from("courses").select("id, name, code").order("name",{ascending:!0});return{courses:l||[],error:s}}if(r){const{data:l,error:s}=await i.from("student_courses").select("course_id, status, courses(id, name, code)").eq("student_id",a||n).in("status",["enrolled","completed"]);return s?{courses:[],error:s}:{courses:(l||[]).map(u=>c(u.courses)).filter(Boolean),error:null}}if(t){const{data:l,error:s}=await i.from("professor_courses").select("course_id, courses(id, name, code)").eq("professor_id",o);return s?{courses:[],error:s}:{courses:(l||[]).map(u=>c(u.courses)).filter(Boolean),error:null}}return{courses:[],error:null}}catch(l){return console.error("Erreur lors du chargement des cours pour les documents:",l),{courses:[],error:l}}},z=async()=>{try{const{data:e,error:r}=await i.from("documents").select(`
        id,
        title,
        description,
        file_path,
        file_size,
        file_type,
        course_id,
        uploaded_by,
        visibility,
        created_at,
        updated_at,
        courses(id, name, code)
      `).order("created_at",{ascending:!1});if(r)return{documents:[],error:r};const t=(e||[]).map(o=>o.id);let n={};if(t.length>0){const{data:o,error:a}=await i.from("document_tags").select("document_id, tag").in("document_id",t);if(a)return{documents:[],error:a};n=(o||[]).reduce((l,s)=>(l[s.document_id]=l[s.document_id]||[],l[s.document_id].push(s.tag),l),{})}return{documents:(e||[]).map(o=>g(o,n)),error:null}}catch(e){return console.error("Erreur lors du chargement des documents:",e),{documents:[],error:e}}},L=async({userId:e=null,type:r=null,courseId:t=null,groupId:n=null}={})=>{try{let o=i.from("documents").select(`
        id,
        title,
        description,
        file_path,
        file_size,
        file_type,
        course_id,
        uploaded_by,
        visibility,
        created_at,
        updated_at,
        type,
        is_public,
        group_id
      `).order("created_at",{ascending:!1});e&&(o=o.or(`is_public.eq.true,uploaded_by.eq.${e}`)),r&&(o=o.eq("type",r)),t&&(o=o.eq("course_id",t)),n&&(o=o.eq("group_id",n));const{data:a,error:l}=await o;return l?{documents:[],error:l}:{documents:(a||[]).map(m),error:null}}catch(o){return console.error("listLegacyDocuments:",o),{documents:[],error:o}}},E=async({canViewOfficialDocuments:e=!1,isStudent:r=!1,studentId:t=null}={})=>{try{if(!e)return{documents:[],error:null};let n=i.from("generated_documents").select(`
        id,
        template_id,
        student_id,
        file_path,
        status,
        generated_by,
        approved_by,
        approval_date,
        created_at,
        updated_at,
        document_templates!template_id(id, name, type),
        student:students!student_id(
          id,
          student_number,
          profile_id,
          profiles!profile_id(id, full_name, email)
        )
      `).order("created_at",{ascending:!1});r&&t&&(n=n.eq("student_id",t));const{data:o,error:a}=await n;return a?{documents:[],error:a}:{documents:(o||[]).map(h),error:null}}catch(n){return console.error("Erreur lors du chargement des documents officiels:",n),{documents:[],error:n}}},S=async e=>{try{const[r,t,n]=await Promise.all([q(e),z(),E(e)]),o=r.error||t.error||n.error;return o?{courses:[],documents:[],generatedDocuments:[],error:o}:{courses:(r.courses||[]).reduce((l,s)=>!s||l.some(u=>u.id===s.id)?l:[...l,s],[]),documents:t.documents||[],generatedDocuments:n.documents||[],error:null}}catch(r){return console.error("Erreur lors du chargement de la page documents:",r),{courses:[],documents:[],generatedDocuments:[],error:r}}},U=async e=>{try{const{data:r,error:t}=await i.from("document_templates").select("id, name, type").eq("type",e).limit(1).single();return{template:r,error:t||null}}catch(r){return console.error("getDocumentTemplateByType:",r),{template:null,error:r}}},R=async e=>{try{const{data:r,error:t}=await i.from("generated_documents").select(`
        id,
        file_path,
        status,
        created_at,
        approval_date,
        document_templates(id, name, type)
      `).eq("student_id",e).order("created_at",{ascending:!1});return t?{certificates:[],error:t}:{certificates:(r||[]).filter(o=>{const a=c(o.document_templates);return(a==null?void 0:a.type)==="certificate"}),error:null}}catch(r){return console.error("getStudentGeneratedCertificates:",r),{certificates:[],error:r}}},C=async e=>{try{const{data:r,error:t}=await i.from("generated_documents").insert({template_id:e.template_id,student_id:e.student_id,file_path:e.file_path,status:e.status||"pending",generated_by:e.generated_by||null,created_at:new Date().toISOString()}).select().single();return{document:r,error:t||null}}catch(r){return console.error("insertGeneratedDocument:",r),{document:null,error:r}}},B=async e=>{try{const{data:r,error:t}=await i.from("documents").insert({title:e.title,description:e.description||null,file_path:e.file_path||e.file_url,file_size:e.file_size||0,file_type:e.file_type||"file",course_id:e.course_id||null,uploaded_by:e.created_by||e.uploaded_by,visibility:e.is_public?"public":e.visibility||"course",type:e.type||"other",is_public:e.is_public===!0,group_id:e.group_id||null}).select(`
        id,
        title,
        description,
        file_path,
        file_size,
        file_type,
        course_id,
        uploaded_by,
        visibility,
        created_at,
        updated_at,
        type,
        is_public,
        group_id
      `).single();return{document:r?m(r):null,error:t||null}}catch(r){return console.error("createLegacyDocument:",r),{document:null,error:r}}},O=async(e,r)=>{try{const t={title:r.title,description:r.description,file_path:r.file_path||r.file_url,file_size:r.file_size,file_type:r.file_type,course_id:r.course_id||null,visibility:r.is_public?"public":r.visibility||void 0,type:r.type,is_public:typeof r.is_public=="boolean"?r.is_public:void 0,group_id:Object.prototype.hasOwnProperty.call(r,"group_id")?r.group_id||null:void 0,updated_at:new Date().toISOString()};Object.keys(t).forEach(a=>t[a]===void 0&&delete t[a]);const{data:n,error:o}=await i.from("documents").update(t).eq("id",e).select(`
        id,
        title,
        description,
        file_path,
        file_size,
        file_type,
        course_id,
        uploaded_by,
        visibility,
        created_at,
        updated_at,
        type,
        is_public,
        group_id
      `).single();return{document:n?m(n):null,error:o||null}}catch(t){return console.error("updateLegacyDocument:",t),{document:null,error:t}}},A=async e=>{try{const{error:r}=await i.from("documents").delete().eq("id",e);return{error:r||null}}catch(r){return console.error("deleteLegacyDocumentRecord:",r),{error:r}}},$=async(e,r,t)=>{try{const{error:n}=await i.from("generated_documents").update({status:r,approved_by:t||null,approval_date:new Date().toISOString()}).eq("id",e);return{error:n||null}}catch(n){return console.error("updateGeneratedDocumentStatus:",n),{error:n}}},F=async()=>{try{const{data:e,error:r}=await i.from("generated_documents").select(`
        *,
        students!student_id (
          id,
          student_number,
          profiles!profile_id (
            id,
            full_name
          )
        ),
        document_templates!template_id (
          id,
          name
        )
      `).order("created_at",{ascending:!1});return{documents:e||[],error:r||null}}catch(e){return console.error("getAllGeneratedDocuments:",e),{documents:[],error:e}}},P=async(e,r=60)=>{try{const t=f(e);if(!t)return{url:null,error:new Error("Chemin de fichier manquant")};if(t.type==="url")return{url:t.value,error:null};const{data:n,error:o}=await i.storage.from("documents").createSignedUrl(t.value,r);return{url:(n==null?void 0:n.signedUrl)||null,error:o}}catch(t){return console.error("Erreur lors de la génération de l'URL de téléchargement:",t),{url:null,error:t}}},j=async(e,r)=>{try{const t=f(r);if((t==null?void 0:t.type)==="storage"){const{error:o}=await i.storage.from("documents").remove([t.value]);if(o)return{success:!1,error:o}}const{error:n}=await i.from("documents").delete().eq("id",e);return n?{success:!1,error:n}:{success:!0,error:null}}catch(t){return console.error("Erreur lors de la suppression du document:",t),{success:!1,error:t}}},T=async({title:e,description:r,visibility:t="course",courseId:n=null,file:o,uploadedBy:a,tags:l=[]})=>{try{if(!(e!=null&&e.trim())||!o||!a)return{document:null,error:new Error("Le titre, le fichier et l'auteur sont obligatoires")};const s=`${a}/documents/${Date.now()}_${o.name}`,{error:u}=await i.storage.from("documents").upload(s,o,{cacheControl:"3600",upsert:!1});if(u)return{document:null,error:u};const{data:d,error:y}=await i.from("documents").insert({title:e.trim(),description:(r==null?void 0:r.trim())||null,file_path:s,file_type:o.type||"application/octet-stream",file_size:o.size,course_id:n?Number(n):null,uploaded_by:a,visibility:t}).select(`
        id,
        title,
        description,
        file_path,
        file_size,
        file_type,
        course_id,
        uploaded_by,
        visibility,
        created_at,
        updated_at,
        courses(id, name, code)
      `).single();if(y)return await i.storage.from("documents").remove([s]),{document:null,error:y};const p=Array.from(new Set(l.map(_=>_.trim()).filter(Boolean)));if(p.length>0){const{error:_}=await i.from("document_tags").insert(p.map(b=>({document_id:d.id,tag:b})));if(_)return await i.from("documents").delete().eq("id",d.id),await i.storage.from("documents").remove([s]),{document:null,error:_}}return{document:g(d,{[d.id]:p}),error:null}}catch(s){return console.error("Erreur lors de l'upload du document:",s),{document:null,error:s}}},N=async e=>{try{const{data:r,error:t}=await i.from("documents_generes").select(`
        id, reference, date_generation, type_document, fichier_url, verification_url,
        etudiant:students!etudiant_id(
          id, student_number, level, academic_year,
          filieres(id, name, code),
          profiles(first_name, last_name, full_name, email)
        )
      `).eq("reference",e).single();return{data:r,error:t||null}}catch(r){return console.error("getDocumentGenereByReference:",r),{data:null,error:r}}};export{F as a,S as b,P as c,j as d,T as e,B as f,N as g,O as h,C as i,A as j,R as k,L as l,U as m,$ as u};
