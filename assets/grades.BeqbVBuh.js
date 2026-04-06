import{U as o}from"./index.DiDytfxl.js";const h=20,v=(e="")=>{const r=String(e||"").trim();if(!r)return{first_name:"",last_name:""};const t=r.split(/\s+/);return t.length===1?{first_name:t[0],last_name:""}:{first_name:t.slice(0,-1).join(" "),last_name:t.slice(-1).join(" ")}},b=e=>{const r=(e==null?void 0:e.profiles)||{},{first_name:t,last_name:s}=v(r.full_name);return{id:(e==null?void 0:e.id)??null,first_name:t,last_name:s,full_name:r.full_name||`${t} ${s}`.trim(),profile_picture:r.avatar_url||null,user_id:(e==null?void 0:e.profile_id)||null,profile_id:(e==null?void 0:e.profile_id)||null,student_number:(e==null?void 0:e.student_number)||null,level:(e==null?void 0:e.level)||null}},P=e=>{const r=(e==null?void 0:e.profiles)||{},{first_name:t,last_name:s}=v(r.full_name);return{id:(e==null?void 0:e.id)??null,first_name:t,last_name:s,full_name:r.full_name||`${t} ${s}`.trim(),profile_id:(e==null?void 0:e.profile_id)||null}},N=e=>{const r=(e==null?void 0:e.courses)||{},t=(r==null?void 0:r.departments)||null;return{id:r.id,code:r.code,name:r.name,credits:r.credits,semester:r.semester,academic_year:(e==null?void 0:e.academic_year)||null,niveaux:{id:r.level||null,code:r.level||"",name:r.level||"",filieres:t?{id:t.id,code:t.code,name:t.name}:null}}},m=async e=>{if(!e)return{data:null,error:new Error("Professeur non identifié")};const{data:r,error:t}=await o.from("professors").select("id, profile_id").eq("profile_id",e).maybeSingle();return t?{data:null,error:t}:r?{data:r,error:null}:{data:null,error:new Error("Entité professeur introuvable")}},C=async(e,r=new Map)=>{if(typeof e=="number")return e;if(!e)throw new Error("Professeur non identifié");if(r.has(e))return r.get(e);const{data:t,error:s}=await m(e);if(s)throw s;return r.set(e,t.id),t.id},_=e=>{const r=b(e==null?void 0:e.students),t=P(e==null?void 0:e.professors),s=(e==null?void 0:e.courses)||null;return{id:e.id,student_id:e.student_id,course_id:e.course_id,professor_id:e.professor_id,note:Number(e.value??0),value:Number(e.value??0),max_value:Number(e.max_value??h),coefficient:Number(e.coefficient??1),type_evaluation:e.evaluation_type,commentaire:e.comment||"",comment:e.comment||"",date_evaluation:e.evaluation_date,is_published:!!e.is_published,published_at:e.published_at||null,created_at:e.created_at,updated_at:e.updated_at,etudiant:r,professeur:t,cours:s?{id:s.id,name:s.name,code:s.code,semester:s.semester??null}:null}},y=async e=>{if(!Array.isArray(e)||e.length===0)return;const{error:r}=await o.from("notifications").insert(e);r&&console.error("Erreur lors de la création des notifications:",r)},G=async(e,r=new Map)=>{const t=await C(e.professor_id??e.professeur_id,r);return{id:e.id||void 0,student_id:Number(e.student_id??e.etudiant_id),course_id:Number(e.course_id??e.cours_id),professor_id:t,evaluation_type:String(e.evaluation_type??e.type_evaluation),coefficient:Number(e.coefficient??1),value:Number(e.value??e.note),max_value:Number(e.max_value??h),comment:e.comment??e.commentaire??null,evaluation_date:e.evaluation_date??e.date_evaluation??new Date().toISOString().split("T")[0],is_published:!!e.is_published,published_at:e.published_at||null}},q=async e=>{try{if(!e)return{data:null,error:new Error("Professeur non identifié")};const{data:r,error:t}=await o.from("professor_courses").select(`
        academic_year,
        is_principal,
        courses(
          id,
          code,
          name,
          credits,
          level,
          semester,
          departments(id, code, name)
        )
      `).eq("professor_id",e).order("academic_year",{ascending:!1});if(t)throw t;const s=[],n=new Set;return(r||[]).forEach(i=>{const a=N(i);!a.id||n.has(a.id)||(n.add(a.id),s.push(a))}),s.sort((i,a)=>i.name.localeCompare(a.name,"fr")),{data:s,error:null}}catch(r){return console.error("Erreur getProfessorCourses:",r),{data:null,error:r}}},x=async e=>{try{const{data:r,error:t}=await o.from("student_courses").select(`
        id,
        academic_year,
        profiles(
          id,
          full_name,
          avatar_url,
          email,
          students(
            id,
            student_number,
            level
          )
        )
      `).eq("course_id",Number(e)).order("student_id",{ascending:!0});if(t)throw t;return{data:(r||[]).map(n=>{const i=n.profiles||{},a=i.students||{},l={id:a.id||null,profile_id:i.id||null,student_number:a.student_number||null,level:a.level||null,profiles:i};return{id:n.id,academic_year:n.academic_year||null,etudiant:b(l)}}),error:null}}catch(r){return console.error("Erreur getStudentsByCourse:",r),{data:null,error:r}}},$=async(e,r)=>{try{let t=o.from("grades").select(`
        id,
        student_id,
        course_id,
        professor_id,
        evaluation_type,
        coefficient,
        value,
        max_value,
        comment,
        evaluation_date,
        is_published,
        published_at,
        created_at,
        updated_at,
        students(
          id,
          profile_id,
          student_number,
          level,
          profiles(id, full_name, avatar_url, email)
        ),
        professors(
          id,
          profile_id,
          profiles(id, full_name)
        ),
        courses(
          id,
          name,
          code,
          semester
        )
      `).eq("course_id",Number(e)).order("evaluation_date",{ascending:!1}).order("created_at",{ascending:!1});const{data:s,error:n}=await t;if(n)throw n;return{data:(s||[]).map(_),error:null}}catch(t){return console.error("Erreur getGradesByCourse:",t),{data:null,error:t}}},B=async e=>{try{const r=Number(e);if(isNaN(r))return{data:[],error:null};const{data:t,error:s}=await o.from("grades").select(`
        id,
        student_id,
        course_id,
        professor_id,
        evaluation_type,
        coefficient,
        value,
        max_value,
        comment,
        evaluation_date,
        is_published,
        published_at,
        created_at,
        updated_at,
        students(
          id,
          profile_id,
          student_number,
          level,
          profiles(id, full_name, avatar_url, email)
        ),
        professors(
          id,
          profile_id,
          profiles(id, full_name)
        ),
        courses(
          id,
          name,
          code,
          semester
        )
      `).eq("student_id",r).eq("is_published",!0).order("evaluation_date",{ascending:!1}).order("created_at",{ascending:!1});if(s)throw s;return{data:(t||[]).map(_),error:null}}catch(r){return console.error("Erreur getStudentPublishedGrades:",r),{data:null,error:r}}},I=async e=>{try{const r=new Map,t=await Promise.all((e||[]).map(i=>G(i,r)));if(t.length===0)return{data:[],error:null};const{data:s,error:n}=await o.from("grades").upsert(t,{onConflict:"student_id,course_id,evaluation_type,professor_id"}).select();if(n)throw n;return{data:s,error:null}}catch(r){return console.error("Erreur batchUpsertGrades:",r),{data:null,error:r}}},j=async(e,r,t)=>{var s,n;try{const{data:i,error:a}=await m(t);if(a)throw a;const l=Array.isArray(r)?r.filter(Boolean):[r].filter(Boolean);let d=o.from("grades").update({is_published:!0,published_at:new Date().toISOString()}).eq("course_id",Number(e)).eq("professor_id",i.id).select(`
        id,
        value,
        evaluation_type,
        student_id,
        students(id, profile_id),
        courses(id, name, code)
      `);l.length===1?d=d.eq("evaluation_type",l[0]):l.length>1&&(d=d.in("evaluation_type",l));const{data:u,error:f}=await d;if(f)throw f;const g=((n=(s=u==null?void 0:u[0])==null?void 0:s.courses)==null?void 0:n.name)||"votre cours",E=(u||[]).filter(c=>{var p;return(p=c==null?void 0:c.students)==null?void 0:p.profile_id}).map(c=>({recipient_id:c.students.profile_id,recipient_role:"student",sender_id:t,title:"Nouvelle note publiée",content:`Votre note "${c.evaluation_type}" pour ${g} est maintenant disponible.`,priority:"medium"}));return await y(E),{data:u,error:null}}catch(i){return console.error("Erreur publishGrades:",i),{data:null,error:i}}},A=async e=>{try{const{data:r,error:t}=await m(e);if(t)throw t;const{data:s,error:n}=await o.from("grades").select(`
        id,
        student_id,
        course_id,
        professor_id,
        evaluation_type,
        coefficient,
        value,
        max_value,
        comment,
        evaluation_date,
        is_published,
        published_at,
        created_at,
        updated_at,
        students(
          id,
          profile_id,
          student_number,
          level,
          profiles(id, full_name, avatar_url, email)
        ),
        courses(
          id,
          name,
          code,
          semester
        )
      `).eq("professor_id",r.id).eq("is_published",!0).order("evaluation_date",{ascending:!1});if(n)throw n;return{data:(s||[]).map(i=>{var l,d,u;const a=_(i);return{...a,label:`${((l=a.cours)==null?void 0:l.code)||"COURS"} • ${((d=a.etudiant)==null?void 0:d.last_name)||""} ${((u=a.etudiant)==null?void 0:u.first_name)||""} • ${a.type_evaluation} • ${a.note}/${a.max_value}`.replace(/\s+/g," ").trim()}}),error:null}}catch(r){return console.error("Erreur getProfessorPublishedGrades:",r),{data:null,error:r}}},U=async e=>{try{if(!e.noteId)throw new Error("Sélectionnez une note publiée à corriger.");const{data:r,error:t}=await o.from("demandes_correction_notes").insert({note_id:e.noteId,professeur_id:e.professorId,ancienne_note:e.oldGrade,nouvelle_note:e.newGrade,justification:e.justification,statut:"en_attente"}).select();if(t)throw t;return await y([{recipient_role:"admin",sender_id:e.professorId,title:"Demande de correction de note",content:"Un professeur a soumis une demande de correction de note.",priority:"medium"}]),{data:r,error:null}}catch(r){return console.error("Erreur submitGradeCorrection:",r),{data:null,error:r}}},O=async e=>{try{const{data:r,error:t}=await o.from("demandes_correction_notes").select(`
        id,
        note_id,
        professeur_id,
        ancienne_note,
        nouvelle_note,
        justification,
        statut,
        commentaire_admin,
        validee_par,
        validated_at,
        created_at,
        updated_at
      `).eq("professeur_id",e).order("created_at",{ascending:!1});if(t)throw t;const s=[...new Set((r||[]).map(a=>a.note_id).filter(Boolean))];let n={};if(s.length>0){const{data:a,error:l}=await o.from("grades").select(`
          id,
          student_id,
          course_id,
          professor_id,
          evaluation_type,
          coefficient,
          value,
          max_value,
          comment,
          evaluation_date,
          is_published,
          published_at,
          created_at,
          updated_at,
          students(
            id,
            profile_id,
            student_number,
            level,
            profiles(id, full_name, avatar_url, email)
          ),
          professors(
            id,
            profile_id,
            profiles(id, full_name)
          ),
          courses(
            id,
            name,
            code,
            semester
          )
        `).in("id",s);if(l)throw l;n=Object.fromEntries((a||[]).map(d=>[d.id,_(d)]))}return{data:(r||[]).map(a=>({...a,note:n[a.note_id]||null})),error:null}}catch(r){return console.error("Erreur getProfessorCorrections:",r),{data:null,error:r}}},F=async e=>{try{const{data:r,error:t}=await o.from("courses").select(`
        *,
        grades(
          id,
          score,
          is_published,
          lecture_notes,
          participation,
          attendance,
          comments,
          created_at
        )
      `).eq("semester",e).order("name");if(t)throw t;return{data:r||[],error:null}}catch(r){return console.error("getCoursesBySemesterWithGrades:",r),{data:null,error:r}}};export{x as a,$ as b,I as c,O as d,A as e,B as f,q as g,F as h,j as p,U as s};
