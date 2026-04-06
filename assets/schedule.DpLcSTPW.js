import{U as i}from"./index.DiDytfxl.js";const f=async r=>{if(!r)return{professorEntityId:null,error:null};const{data:e,error:s}=await i.from("professors").select("id").eq("profile_id",r).maybeSingle();return s?{professorEntityId:null,error:s}:{professorEntityId:(e==null?void 0:e.id)??null,error:null}},p=async r=>{try{if(!r)return{courseIds:[],error:null};const{data:e,error:s}=await i.from("student_courses").select("course_id").eq("student_id",r);return s?{courseIds:[],error:s}:{courseIds:(e||[]).map(o=>o.course_id),error:null}}catch(e){return console.error("getStudentCourseIds:",e),{courseIds:[],error:e}}},m=async({courseIds:r,professorId:e,courseId:s,departmentId:o,levelCode:d}={})=>{try{let n=null;if(e){const{professorEntityId:a,error:u}=await f(e);if(u)return{sessions:[],error:u};if(!a)return{sessions:[],error:null};n=a}let t=i.from("course_sessions").select(`
        id, date, duration, room, status, course_id, professor_id, department_id, level_code,
        courses:course_id (id, name, code, semester),
        professors:professor_id (
          id,
          profile_id,
          profiles:profile_id (
            full_name
          )
        )
      `).order("date",{ascending:!0});r!=null&&r.length&&(t=t.in("course_id",r)),n&&(t=t.eq("professor_id",n)),s&&s!=="all"&&(t=t.eq("course_id",s)),o&&(t=t.eq("department_id",o)),d&&(t=t.eq("level_code",d));const{data:c,error:l}=await t;return l?{sessions:[],error:l}:{sessions:c||[],error:null}}catch(n){return console.error("getScheduleSessions:",n),{sessions:[],error:n}}},y=async(r={})=>{try{let e=i.from("events").select("id, title, description, location, start_date, end_date, type, department_id, level_code").order("start_date",{ascending:!0});r.departmentId&&(e=e.eq("department_id",r.departmentId)),r.levelCode&&(e=e.eq("level_code",r.levelCode));const{data:s,error:o}=await e;if(o)throw o;return{events:s||[],error:null}}catch(e){return console.error("getInstitutionalCalendar:",e),{events:[],error:e}}};export{m as a,y as b,p as g};
